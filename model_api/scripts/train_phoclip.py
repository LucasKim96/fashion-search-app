import os
import csv
import random
import argparse
from datetime import datetime

import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import Dataset, DataLoader
from transformers import AutoTokenizer, AutoModel
from torchvision import models, transforms
from PIL import Image
from sklearn.model_selection import train_test_split
import pandas as pd
from tqdm import tqdm
import torchvision.transforms.functional as TF


# -------------------- CONFIG --------------------
parser = argparse.ArgumentParser()
parser.add_argument("--root_dir", default=r"D:\\model_clip\\LUAN_VAN_python\\Fashion_vi_txt2img")
parser.add_argument("--input_file", default=r"D:\\model_clip\\v6_split.csv")
parser.add_argument("--model_name", default="vinai/phobert-base")
parser.add_argument("--epochs", type=int, default=20)
parser.add_argument("--batch_size", type=int, default=64)
parser.add_argument("--lr", type=float, default=1e-4)
parser.add_argument("--embed_dim", type=int, default=256)
parser.add_argument("--max_len", type=int, default=64)
parser.add_argument("--unfreeze_last_n", type=int, default=2)
parser.add_argument("--seed", type=int, default=42)
args = parser.parse_args()

ROOT_DIR = args.root_dir
VERSION = "v6_SupervisedContrastive"
INPUT_FILE = args.input_file
MODEL_NAME = args.model_name
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
EPOCHS = args.epochs
LR = args.lr
PATIENCE = 10
SPLIT_BY_UNIQUE_ID = True
UNFREEZE_LAST_N = args.unfreeze_last_n
SEED = args.seed
BATCH_SIZE = args.batch_size
MAX_LEN = args.max_len
EMBED_DIM = args.embed_dim

# -------------------- PATHS & DEVICE --------------------
VERSION_DIR = os.path.join(ROOT_DIR, VERSION)
MODEL_DIR = os.path.join(VERSION_DIR, "models")
LOG_DIR = os.path.join(VERSION_DIR, "logs")
EMB_DIR = os.path.join(VERSION_DIR, "embeddings")
os.makedirs(MODEL_DIR, exist_ok=True)
os.makedirs(LOG_DIR, exist_ok=True)
os.makedirs(EMB_DIR, exist_ok=True)

print(f"🖥️ Device: {DEVICE}")

# -------------------- UTILITIES --------------------

def show_vram():
    if torch.cuda.is_available():
        alloc = torch.cuda.memory_allocated() / 1024**2
        reserv = torch.cuda.memory_reserved() / 1024**2
        print(f"🧠 VRAM Allocated: {alloc:.1f} MB | Reserved: {reserv:.1f} MB")

log_file = os.path.join(LOG_DIR, f"{VERSION}_train_log.csv")
if not os.path.exists(log_file):
    with open(log_file, "w", newline="") as f:
        csv.writer(f).writerow([
            "timestamp", "epoch", "phase", "step",
            "loss", "temperature", "lr", "R@1", "R@5", "R@10", "MRR"
        ])
    print(f"🆕 Created log file: {log_file}")


def write_log(phase, epoch, step, loss, temperature, lr, r1="-", r5="-", r10="-", mrr="-"):
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with open(log_file, "a", newline="") as f:
        csv.writer(f).writerow([
            now, epoch, phase, step,
            f"{loss:.4f}", f"{temperature:.4f}", f"{lr:.2e}",
            r1, r5, r10, mrr
        ])


# -------------------- MODEL COMPONENTS --------------------
print(f"🔄 Loading tokenizer/model: {MODEL_NAME} (may take a bit...)")
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME, use_fast=False)
phobert_model = AutoModel.from_pretrained(MODEL_NAME)

class PhoBERTEncoder(nn.Module):
    def __init__(self, phobert, embed_dim=256):
        super().__init__()
        self.phobert = phobert
        self.projection = nn.Linear(self.phobert.config.hidden_size, embed_dim)
    
    def forward(self, input_ids, attention_mask):
        """
        Forward pass of PhoBERT Encoder.
        """
        out = self.phobert(input_ids=input_ids, attention_mask=attention_mask)
        return self.projection(out.last_hidden_state[:, 0, :])

class ImageEncoder(nn.Module):
    def __init__(self, embed_dim=256, base_model="vit_b_16"):
        super().__init__()
        self.backbone = getattr(models, base_model)(weights=models.ViT_B_16_Weights.DEFAULT)
        self.in_features = next((layer.in_features for layer in self.backbone.modules() if hasattr(layer, 'in_features')), None)
        self.projection = nn.Linear(self.in_features, embed_dim)
    def forward(self, x):
        feats = self.backbone(x)
        return self.projection(feats)


# Supervised Contrastive Loss Function
# logits: [N, N], mask: boolean [N, N], temperature: scalar

def supervised_contrastive_loss(logits, mask, temperature):
    if logits is None or mask is None:
        raise ValueError("logits and mask cannot be None")

    # Remove diagonal
    logits_mask = torch.ones_like(mask, dtype=torch.bool)
    logits_mask.fill_diagonal_(False)
    mask = mask & logits_mask

    # log_prob = softmaxed logits
    log_prob = F.log_softmax(logits, dim=1)

    # mean log prob over positive pairs
    mean_log_prob_pos = (log_prob * mask.float()).sum(1) / (mask.float().sum(1) + 1e-8)
    if torch.isnan(mean_log_prob_pos).any():
        raise ValueError("mean_log_prob_pos contains NaN values")

    loss = -mean_log_prob_pos.mean()
    return loss

class PhoCLIPTrain(nn.Module):
    def __init__(self, text_encoder, image_encoder, temperature=0.07):
        super().__init__()
        self.text_encoder = text_encoder
        self.image_encoder = image_encoder
        self.temperature = nn.Parameter(torch.tensor(temperature))

    def forward(self, input_ids, attention_mask, images, ids):
        txt = F.normalize(self.text_encoder(input_ids, attention_mask), p=2, dim=-1)
        img = F.normalize(self.image_encoder(images), p=2, dim=-1)

        positive_mask = (ids.unsqueeze(1) == ids.unsqueeze(0)).to(txt.device)

        # Compute logits for text and image (txt -> img and img -> txt)
        logits_txt_img = (txt @ img.T) / self.temperature
        logits_img_txt = (img @ txt.T) / self.temperature

        # Compute loss for text and image (txt -> img and img -> txt)
        loss_txt_img = supervised_contrastive_loss(logits_txt_img, positive_mask, self.temperature)
        loss_img_txt = supervised_contrastive_loss(logits_img_txt, positive_mask, self.temperature)

        # Compute total loss
        loss = (loss_txt_img + loss_img_txt) / 2.0

        return loss


# -------------------- DATASET --------------------
class TextImageDataset(Dataset):
    def __init__(self, df, tokenizer, max_len=64, transform=None):
        self.df = df.reset_index(drop=True)
        self.tokenizer = tokenizer
        self.max_len = max_len
        self.transform = transform

    def __len__(self):
        return len(self.df)

    def _read_image(self, img_path):
        try:
            image = Image.open(img_path).convert("RGB")
        except Exception:
            print(f" Missing image: {img_path}, using placeholder.")
            image = Image.new("RGB", (224,224), (128,128,128))
        return image

    def __getitem__(self, idx):
        row = self.df.iloc[idx]
        img_path = row["image_path"]
        image = self._read_image(img_path)

        tokens = self.tokenizer(
            row["title"],
            padding="max_length",
            truncation=True,
            max_length=self.max_len,
            return_tensors="pt"
        )
        id_numeric = row.get("id_numeric", None)
        if id_numeric is None:
            id_numeric = row.get("id", idx)

        return {
            "input_ids": tokens["input_ids"].squeeze(0),
            "attention_mask": tokens["attention_mask"].squeeze(0),
            "image": self.transform(image),
            "id": torch.tensor(int(id_numeric), dtype=torch.long)
        }


# -------------------- TRANSFORMS --------------------
transform_train = transforms.Compose([
    transforms.Resize((256,256)),
    transforms.RandomCrop((224,224)),
    transforms.RandomHorizontalFlip(),
    transforms.RandomRotation(30),
    transforms.Lambda(lambda img: TF.adjust_sharpness(img, sharpness_factor=random.uniform(0.5,2.0))),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.5]*3, std=[0.5]*3)
])
transform_val = transforms.Compose([
    transforms.Resize((224,224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.5]*3, std=[0.5]*3)
])

# ===================== SAVE/LOAD CHECKPOINT =====================

def save_checkpoint(
    path: str, model: nn.Module, optimizer: torch.optim.Optimizer,
    epoch: int, best_mrr: float, temperature: float, lr: float,
    patience_counter: int
):
    """Save a checkpoint of the model and optimizer."""
    checkpoint = {
        "epoch": epoch,
        "model_state": model.state_dict(),
        "optimizer_state": optimizer.state_dict(),
        "temperature": temperature,
        "lr": lr,
        "best_mrr": best_mrr,
        "patience_counter": patience_counter
    }
    torch.save(checkpoint, path)


def load_checkpoint(model, optimizer, device, checkpoint_file):
    """
    Load model, optimizer, and training state from a checkpoint file.

    Args:
        model (nn.Module): The model to be loaded.
        optimizer (torch.optim.Optimizer): The optimizer to be loaded.
        device (torch.device): The device to load the checkpoint to.
        checkpoint_file (str): The path to the checkpoint file.

    Returns:
        start_epoch (int): The epoch to start training from.
        best_mrr (float): The best MRR obtained so far.
        patience_counter (int): The patience counter for early stopping.
    """
    if not os.path.exists(checkpoint_file):
        print(f"No checkpoint found at {checkpoint_file}, start from scratch")
        return 0, 0.0, 0

    checkpoint = torch.load(checkpoint_file, map_location=device)

    model.load_state_dict(checkpoint["model_state"])
    optimizer.load_state_dict(checkpoint["optimizer_state"])

    start_epoch = checkpoint.get("epoch", 0)
    best_mrr = checkpoint.get("best_mrr", 0.0)
    patience_counter = checkpoint.get("patience_counter", 0)

    return start_epoch, best_mrr, patience_counter

print("config done.")

# =================== TRAIN/VALIDATION ===================
random.seed(SEED)
df = pd.read_csv(INPUT_FILE)

if SPLIT_BY_UNIQUE_ID and "id_numeric" in df.columns:
    unique_ids = df["id_numeric"].unique().tolist()
    train_ids, temp_ids = train_test_split(unique_ids, test_size=0.3, random_state=SEED)
    val_ids, test_ids = train_test_split(temp_ids, test_size=2/3, random_state=SEED)
    train_df = df[df["id_numeric"].isin(train_ids)].reset_index(drop=True)
    val_df   = df[df["id_numeric"].isin(val_ids)].reset_index(drop=True)
    test_df  = df[df["id_numeric"].isin(test_ids)].reset_index(drop=True)
else:
    train_df, temp_df = train_test_split(df, test_size=0.3, random_state=SEED)
    val_df, test_df = train_test_split(temp_df, test_size=2/3, random_state=SEED)
    train_df = train_df.reset_index(drop=True)
    val_df   = val_df.reset_index(drop=True)
    test_df  = test_df.reset_index(drop=True)

print(f"📊 Dataset sizes: total={len(df)}, train={len(train_df)}, val={len(val_df)}, test={len(test_df)}")

train_loader = DataLoader(
    TextImageDataset(train_df, tokenizer, MAX_LEN, transform_train),
    batch_size=BATCH_SIZE, shuffle=True, drop_last=True, num_workers=0, pin_memory=True
)
val_loader = DataLoader(
    TextImageDataset(val_df, tokenizer, MAX_LEN, transform_val),
    batch_size=BATCH_SIZE, shuffle=False, num_workers=0, pin_memory=True
)
test_loader = DataLoader(
    TextImageDataset(test_df, tokenizer,MAX_LEN, transform_val),
    batch_size=BATCH_SIZE, shuffle=False, num_workers=0, pin_memory=True
)

# -------------------- INIT MODEL / OPTIMIZER --------------------
text_encoder = PhoBERTEncoder(phobert_model, EMBED_DIM)
image_encoder = ImageEncoder(EMBED_DIM)
model = PhoCLIPTrain(text_encoder, image_encoder).to(DEVICE)


def unfreeze_last_n_layers(model, n=0):
    total_layers = len(model.text_encoder.phobert.encoder.layer)
    n = min(n, total_layers)
    for p in model.text_encoder.phobert.parameters():
        p.requires_grad = False
    for i in range(total_layers - n, total_layers):
        for p in model.text_encoder.phobert.encoder.layer[i].parameters():
            p.requires_grad = True
    print(f"🧊 PhoBERT partially frozen → unfreeze last {n} layers ({list(range(total_layers-n, total_layers))})")

unfreeze_last_n_layers(model, UNFREEZE_LAST_N)

trainable_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
total_params = sum(p.numel() for p in model.parameters())
print(f"📊 Trainable params: {trainable_params:,}/{total_params:,} ({100*trainable_params/total_params:.2f}%)")

optimizer = torch.optim.AdamW(model.parameters(), lr=LR)
scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode='max', factor=0.1, patience=2)

resume_path = os.path.join(MODEL_DIR, "last_checkpoint.pt")
best_mrr = 0.0
start_epoch = 0
patience_counter = 0
if os.path.exists(resume_path):
    start_epoch, best_mrr, patience_counter = load_checkpoint(resume_path, model, optimizer, DEVICE)

# -------------------- TRAIN + VALIDATION LOOP --------------------
for epoch in range(start_epoch, EPOCHS):
    model.train()
    total_train_loss = 0.0
    num_steps = len(train_loader)
    log_steps = [int(num_steps * i / 5) for i in range(1, 6)]
    if not log_steps: log_steps = [num_steps]

    for step, batch in enumerate(train_loader, 1):
        input_ids = batch["input_ids"].to(DEVICE)
        attention_mask = batch["attention_mask"].to(DEVICE)
        images = batch["image"].to(DEVICE)
        ids = batch["id"].to(DEVICE)

        optimizer.zero_grad()
        loss = model(input_ids, attention_mask, images, ids)
        loss.backward()
        optimizer.step()

        total_train_loss += loss.item()

        if step in log_steps:
            prev_step = 0 if log_steps.index(step) == 0 else log_steps[log_steps.index(step)-1]
            avg_steps = (step - prev_step) if (step - prev_step) > 0 else 1
            avg_loss = total_train_loss / avg_steps
            total_train_loss = 0.0
            lr_now = optimizer.param_groups[0]["lr"]
            print(f"[Epoch {epoch+1}] Step {step}/{num_steps} | Loss={avg_loss:.4f} | Temp={model.temperature.item():.4f} | LR={lr_now:.6f}", flush=True)
            write_log("train", epoch+1, step, avg_loss, model.temperature.item(), lr_now)

    # -------------------- VALIDATION --------------------
    model.eval()
    val_loss = 0.0
    txt_embs, img_embs, id_list = [], [], []

    with torch.no_grad():
        for batch in tqdm(val_loader, desc="🔍 Validating & Extracting embeddings"):
            input_ids = batch["input_ids"].to(DEVICE)
            attention_mask = batch["attention_mask"].to(DEVICE)
            images = batch["image"].to(DEVICE)
            ids = batch["id"].to(DEVICE)

            loss = model(input_ids, attention_mask, images, ids)
            val_loss += loss.item()

            txt = F.normalize(model.text_encoder(input_ids, attention_mask), p=2, dim=-1)
            img = F.normalize(model.image_encoder(images), p=2, dim=-1)

            txt_embs.append(txt)
            img_embs.append(img)
            id_list.extend(ids.cpu().tolist())

    val_loss = val_loss / max(1, len(val_loader))
    txt_embs = torch.cat(txt_embs)
    img_embs = torch.cat(img_embs)

    all_ids = torch.tensor(id_list, device=DEVICE)

    sims = txt_embs @ img_embs.T
    ranks = torch.argsort(sims, dim=1, descending=True)

    N = sims.size(0)
    matching_ids = (all_ids.unsqueeze(1) == all_ids.unsqueeze(0)).to(DEVICE)

    # Recall@K
    def recall_at_k(k, ranks, matches):
        topk_ranks = ranks[:, :k]
        hits = torch.gather(matches, 1, topk_ranks).any(dim=1)
        return hits.float().mean().item() * 100

    recall_1 = recall_at_k(1, ranks, matching_ids)
    recall_5 = recall_at_k(5, ranks, matching_ids)
    recall_10 = recall_at_k(10, ranks, matching_ids)

    # MRR (vectorized)
    ranked_matches = torch.gather(matching_ids, 1, ranks)  # [N, N]
    any_match = ranked_matches.any(dim=1)
    first_indices = ranked_matches.float().argmax(dim=1)  # index of 1st True or 0
    first_indices[~any_match] = -1
    mrr_tensor = torch.where(first_indices >= 0, 1.0 / (first_indices.float() + 1.0), torch.tensor(0.0, device=DEVICE))
    mrr = mrr_tensor.mean().item() if N > 0 else 0

    lr_now = optimizer.param_groups[0]["lr"]
    print(f"📉 Epoch {epoch+1} | ValLoss={val_loss:.4f} | R@1={recall_1:.2f} | R@5={recall_5:.2f} | R@10={recall_10:.2f} | MRR={mrr:.4f} | LR={lr_now:.1e}", flush=True)
    show_vram()

    scheduler.step(mrr)
    write_log("val", epoch+1, "-", val_loss, model.temperature.item(), lr_now,
            f"{recall_1:.2f}", f"{recall_5:.2f}", f"{recall_10:.2f}", f"{mrr:.4f}")

    # ===================== CHECKPOINTING =====================
    best_ckpt_path = os.path.join(MODEL_DIR, f"best_model.pt") 
    last_ckpt_path = os.path.join(MODEL_DIR, "last_checkpoint.pt")

    if mrr > best_mrr:
        print(f"✅ New best MRR: {mrr:.4f} (previously {best_mrr:.6f}). Saving model...")
        best_mrr = mrr
        patience_counter = 0
        save_checkpoint(best_ckpt_path, model, optimizer, epoch + 1, best_mrr, model.temperature.item(), lr_now, patience_counter=0)
    else:
        patience_counter += 1
        print(f"⚠️ No MRR improvement. Patience: {patience_counter}/{PATIENCE}")

    save_checkpoint(last_ckpt_path, model, optimizer, epoch + 1, best_mrr, model.temperature.item(), lr_now, patience_counter)

    if patience_counter >= PATIENCE:
        print(f"🛑 Early stopping triggered after {PATIENCE} epochs with no MRR improvement.")
        break

print("✅ Training finished! Logs saved to:", log_file)
