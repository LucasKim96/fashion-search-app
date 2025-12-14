import sys
sys.path.append('./configs')

import torch
import torch.nn as nn
import torch.optim as optim
import torchvision.transforms as transforms
import torchvision.datasets as datasets
from config_colab import configurations
from backbone.model_resnet import ResNet_50, ResNet_101, ResNet_152
from backbone.model_irse import IR_50, IR_101, IR_152, IR_SE_50, IR_SE_101, IR_SE_152
from backbone.vit_backbone import ViT_EvoLVe
from head.metrics import ArcFace, CosFace, SphereFace, Am_softmax, Softmax
from loss.focal import FocalLoss
# import importlib
# import util.utils
# importlib.reload(util.utils)
from util.utils import (
    make_balanced_weights_advanced,
    # get_val_data,
    separate_irse_bn_paras,
    separate_resnet_bn_paras,
    warm_up_lr,
    schedule_lr,
    perform_val,
    get_time,
    buffer_val,
    AverageMeter,
    accuracy
)

from tensorboardX import SummaryWriter
from tqdm import tqdm
from tqdm import trange
import os
import numpy as np
import re
import csv
import pandas as pd
from sklearn.metrics import f1_score
from sklearn.metrics.pairwise import cosine_similarity
import faiss
import time
import json
import subprocess
import faiss

def get_gpu_usage(gpu_id=0):
    """
    Trả về dict {'mem_used': ..., 'mem_total': ..., 'util': ...} cho GPU_ID
    """
    if not torch.cuda.is_available() or gpu_id is None or (isinstance(gpu_id, (list, tuple)) and not gpu_id):
        return {'mem_used': 0, 'mem_total': 0, 'util': 0}

    # Đảm bảo gpu_id là int
    if isinstance(gpu_id, (list, tuple)):
        if not gpu_id: return {'mem_used': 0, 'mem_total': 0, 'util': 0}
        gpu_id = gpu_id[0]

    try:
        result = subprocess.check_output(
            f"nvidia-smi --id={gpu_id} --query-gpu=memory.used,memory.total,utilization.gpu --format=csv,nounits,noheader",
            shell=True
        )
        mem_used, mem_total, util = [int(x) for x in result.decode("utf-8").strip().split(",")]
        return {'mem_used': mem_used, 'mem_total': mem_total, 'util': util}
    except Exception as e:
        print("Error getting GPU usage:", e)
        return {'mem_used': 0, 'mem_total': 0, 'util': 0}

def find_last_epoch(model_root):
    """
    Tìm epoch cuối cùng đã lưu checkpoint.
    Trả về số epoch (int), 0 nếu chưa có checkpoint.
    """
    pattern = re.compile(r"checkpoint_epoch_(\d+)\.pth")
    epochs = []
    for f in os.listdir(model_root):
        m = pattern.match(f)
        if m:
            epochs.append(int(m.group(1)))
    return max(epochs) if epochs else 0

def perform_retrieval_val(backbone, data_loader, device, k_values=[1, 5, 10], desc_prefix="Retrieval"):
    backbone.eval()
    all_embeddings = []
    all_labels = []

    # Lấy Embeddings
    # Check data loader rỗng
    if len(data_loader) == 0:
        return {f"{m}@{k}": 0.0 for k in k_values for m in ['P', 'R']}

    for inputs, labels in tqdm(data_loader, desc=f"{desc_prefix} Embeddings"):
        inputs = inputs.to(device)
        with torch.no_grad():
            features = backbone(inputs).cpu().numpy()
            all_embeddings.append(features)
            all_labels.extend(labels.cpu().numpy())

    if not all_embeddings:
        return {f"{m}@{k}": 0.0 for k in k_values for m in ['P', 'R']}

    all_embeddings = np.concatenate(all_embeddings)
    all_labels = np.array(all_labels).astype(np.int64)
    num_samples, dim = all_embeddings.shape
    max_k = max(k_values)

    if num_samples < 2:
        print(f"[{desc_prefix} WARNING] Not enough samples for retrieval.")
        return {f"{m}@{k}": 0.0 for k in k_values for m in ['P', 'R']}

    # Chuẩn hóa L2
    faiss.normalize_L2(all_embeddings)

    # Faiss Search
    index = faiss.IndexFlatIP(dim)
    if device.type == 'cuda' and faiss.get_num_gpus() > 0:
        try:
            res = faiss.StandardGpuResources()
            index = faiss.index_cpu_to_gpu(res, 0, index)
        except Exception:
            pass # Fallback to CPU

    index.add(all_embeddings)

    # Search k+1 để loại bỏ chính nó
    # D: Scores, I: Indices
    D, I = index.search(all_embeddings, max_k + 1)

    # Tính toán Metrics bằng Ma trận (Vectorization)
    print(f"[{desc_prefix}] Calculating metrics (Vectorized)...")

    # Loại bỏ cột đầu tiên (chính nó) -> [N, max_k]
    retrieved_indices = I[:, 1:]

    # Lấy nhãn của các kết quả tìm được -> [N, max_k]
    retrieved_labels = all_labels[retrieved_indices]

    # Reshape query_labels thành cột dọc [N, 1] để so sánh broadcast
    query_labels = all_labels.reshape(-1, 1)

    # Tạo ma trận True/False: Vị trí nào dự đoán đúng nhãn -> [N, max_k]
    matches = (retrieved_labels == query_labels)

    # Tính tổng số lượng ảnh cùng nhãn trong toàn bộ dataset (trừ chính nó)
    # Cách nhanh: dùng bincount rồi map lại
    label_counts = np.bincount(all_labels)
    # Số lượng relevant cho mỗi query = tổng số lượng của label đó - 1 (chính nó)
    total_relevant_per_query = label_counts[all_labels] - 1

    # Những mẫu này sẽ có Precision = 0, Recall = 0 
    safe_total_relevant = np.maximum(total_relevant_per_query, 1)

    # Tính Cumsum theo chiều ngang để biết tại k=1, k=2... có bao nhiêu đúng
    # matches: [[T, F, T], ...] -> cumsum: [[1, 1, 2], ...]
    matches_cumsum = np.cumsum(matches, axis=1)

    avg_metrics = {}

    for k in k_values:
        # Lấy cột thứ k-1 (vì index bắt đầu từ 0)
        # correct_at_k là số lượng đúng trong top K
        correct_at_k = matches_cumsum[:, k-1]

        # Precision@K = (Số đúng trong top K) / K
        p_at_k = correct_at_k / k

        # Recall@K = (Số đúng trong top K) / (Tổng số ảnh cùng loại trong dữ liệu)
        r_at_k = correct_at_k / safe_total_relevant

        # Xử lý riêng cho trường hợp total_relevant == 0 (Class chỉ có 1 ảnh)
        # Gán Recall = 0 cho những trường hợp này
        r_at_k[total_relevant_per_query == 0] = 0.0

        # Tính trung bình toàn bộ tập dữ liệu
        avg_metrics[f"P@{k}"] = np.mean(p_at_k) * 100
        avg_metrics[f"R@{k}"] = np.mean(r_at_k) * 100

    return avg_metrics

def separate_vit_paras(modules):
    """
    Tách tham số cho ViT:
    - paras_wo_bn: Weights của Linear, Conv2d -> Có Weight Decay
    - paras_only_bn: Bias tất cả layers + Weights của LayerNorm -> Không Weight Decay
    """
    paras_only_bn = []
    paras_wo_bn = []
    for name, param in modules.named_parameters():
        if 'bias' in name or 'norm' in name or 'cls_token' in name or 'pos_embed' in name:
            paras_only_bn.append(param)
        else:
            paras_wo_bn.append(param)
    return paras_only_bn, paras_wo_bn

if __name__ == "__main__":

    #======= Load Config =======#
    cfg = configurations[1]
    SEED = cfg['SEED']
    torch.manual_seed(SEED)

    DATA_ROOT = cfg['DATA_ROOT']
    MODEL_ROOT = cfg['MODEL_ROOT']
    LOG_ROOT = cfg['LOG_ROOT']
    BACKBONE_RESUME_ROOT = cfg['BACKBONE_RESUME_ROOT']
    HEAD_RESUME_ROOT = cfg['HEAD_RESUME_ROOT']

    BACKBONE_NAME = cfg['BACKBONE_NAME']
    HEAD_NAME = cfg['HEAD_NAME']
    LOSS_NAME = cfg['LOSS_NAME']

    INPUT_SIZE = cfg['INPUT_SIZE']
    RGB_MEAN = cfg['RGB_MEAN']
    RGB_STD = cfg['RGB_STD']
    EMBEDDING_SIZE = cfg['EMBEDDING_SIZE']
    BATCH_SIZE = cfg['BATCH_SIZE']
    DROP_LAST = cfg['DROP_LAST']
    LR = cfg['LR']
    NUM_EPOCH = cfg['NUM_EPOCH']
    WEIGHT_DECAY = cfg['WEIGHT_DECAY']
    MOMENTUM = cfg['MOMENTUM']
    STAGES = cfg['STAGES']
    DEVICE = cfg['DEVICE']
    MULTI_GPU = cfg['MULTI_GPU']
    GPU_ID = cfg['GPU_ID']
    GPU = GPU_ID[0] if isinstance(GPU_ID, (list, tuple)) and GPU_ID else None
    torch.backends.cudnn.benchmark = True
    PIN_MEMORY = cfg['PIN_MEMORY']
    NUM_WORKERS = cfg['NUM_WORKERS']
    # Retrieval evaluation frequency
    RETRIEVAL_FREQ = 5

    os.makedirs(MODEL_ROOT, exist_ok=True)
    os.makedirs(LOG_ROOT, exist_ok=True)

    print("=" * 60)
    print("Loaded Configuration:")
    for k, v in cfg.items():
        print(f"{k}: {v}")
    print("=" * 60)

    #======= Data =======#
    # train_transform = transforms.Compose([
    #         transforms.Resize([int(256 * INPUT_SIZE[0] / 224), int(256 * INPUT_SIZE[0] / 224)]), # smaller side resized
    #         transforms.RandomCrop([INPUT_SIZE[0], INPUT_SIZE[1]], padding=4, fill=255),
    #         transforms.RandomHorizontalFlip(),
    #         transforms.RandomAffine(degrees=30, translate=(0.02, 0.02), scale=(0.8, 1.15), fill=255),
    #         transforms.RandomPerspective(distortion_scale=0.3, p=0.3, interpolation=transforms.InterpolationMode.BILINEAR, fill=255),
    #         transforms.RandomApply([
    #             transforms.GaussianBlur(kernel_size=(3, 7), sigma=(0.1, 2.0))
    #         ], p=0.5),
    #         transforms.ColorJitter(brightness=0.4, contrast=0.4, saturation=0.4, hue=0.5),
    #         transforms.RandomGrayscale(p=0.4),

    #         transforms.ToTensor(),
    #         transforms.Normalize(mean=RGB_MEAN, std=RGB_STD),
    # ])

    train_transform = transforms.Compose([
        transforms.Resize([int(256 * INPUT_SIZE[0] / 224), int(256 * INPUT_SIZE[0] / 224)]), # smaller side resized
        transforms.RandomCrop([INPUT_SIZE[0], INPUT_SIZE[1]]),
        transforms.ColorJitter(brightness=(0.7,1.3), contrast=(0.7,1.5), saturation=(0.7, 1.5), hue=(-0.03, 0.05)),
        transforms.RandomHorizontalFlip(),
        transforms.RandomAffine(degrees=30, translate=(0.02, 0.02), scale=(0.8, 1.4)),
        transforms.RandomAdjustSharpness(sharpness_factor=2, p=0.5),
        transforms.RandomPerspective(distortion_scale=0.3, p=0.5, interpolation=transforms.InterpolationMode.BILINEAR),
        transforms.GaussianBlur(kernel_size=3, sigma=(0.1, 2.0)),
        transforms.RandomGrayscale(p=0.05),
        transforms.ToTensor(),
        transforms.Normalize(mean=RGB_MEAN, std=RGB_STD),
    ])

    val_transform = transforms.Compose([
            transforms.Resize([INPUT_SIZE[0], INPUT_SIZE[1]]),
            transforms.ToTensor(),
            transforms.Normalize(mean=RGB_MEAN, std=RGB_STD),
    ])

    dataset_train = datasets.ImageFolder(os.path.join(DATA_ROOT, cfg['TRAIN_DIR']), train_transform)
    dataset_val = datasets.ImageFolder(os.path.join(DATA_ROOT, cfg['VAL_DIR']), val_transform)
    NUM_CLASS = len(dataset_train.classes)

    # ======= MAPPING LABELS LIÊN TỤC 0..NUM_CLASS-1 ======= #
    # Lấy tên class theo thứ tự alphabet
    class_names = sorted(dataset_train.classes)
    class_to_idx = {name: i for i, name in enumerate(class_names)}

    # Hàm lấy tên folder từ path ảnh
    def get_class_name_from_path(path):
        return os.path.basename(os.path.dirname(path))

    # Map lại targets
    dataset_train.targets = [class_to_idx[get_class_name_from_path(p)] for p, _ in dataset_train.imgs]
    dataset_val.targets = [class_to_idx[get_class_name_from_path(p)] for p, _ in dataset_val.imgs]

    # Đồng bộ imgs với labels
    dataset_train.imgs = [(p, class_to_idx[get_class_name_from_path(p)]) for p, _ in dataset_train.imgs]
    dataset_val.imgs = [(p, class_to_idx[get_class_name_from_path(p)]) for p, _ in dataset_val.imgs]
    # đảm bảo val dùng cùng mapping
    dataset_val.class_to_idx = dataset_train.class_to_idx
    # save mapping
    with open(os.path.join(MODEL_ROOT, "class_to_idx.json"), "w") as f:
        json.dump(dataset_train.class_to_idx, f, indent=2)

    train_loader = torch.utils.data.DataLoader(
        dataset_train, batch_size=BATCH_SIZE, shuffle=True, # Tắt sampler, bật shuffle khi dùng focal
        num_workers=NUM_WORKERS, pin_memory=PIN_MEMORY, drop_last=DROP_LAST
    )


    #======= Model =======#
    BACKBONE_DICT = {
        'ResNet_50': ResNet_50(INPUT_SIZE),
        'ResNet_101': ResNet_101(INPUT_SIZE),
        'ResNet_152': ResNet_152(INPUT_SIZE),
        'IR_50': IR_50(INPUT_SIZE),
        'IR_101': IR_101(INPUT_SIZE),
        'IR_152': IR_152(INPUT_SIZE),
        'IR_SE_50': IR_SE_50(INPUT_SIZE),
        'IR_SE_101': IR_SE_101(INPUT_SIZE),
        'IR_SE_152': IR_SE_152(INPUT_SIZE)
    }
    if BACKBONE_NAME == 'ViT_Base':
        if 'ViT_EvoLVe' not in globals():
                raise ImportError("Cannot import ViT_EvoLVe. Please check vit_backbone.py file.")
        BACKBONE_DICT['ViT_Base'] = ViT_EvoLVe(embedding_size=EMBEDDING_SIZE, pretrained=True)


    BACKBONE = BACKBONE_DICT[BACKBONE_NAME]

    for param in BACKBONE.parameters():
        param.requires_grad = True

    # Định nghĩa device_id cho HEAD: chỉ truyền GPU_ID khi là CUDA, nếu không là None
    head_device_id = GPU_ID if DEVICE.type == 'cuda' else None
    HEAD_DICT = {
        'ArcFace': ArcFace(in_features=EMBEDDING_SIZE, out_features=NUM_CLASS, s=65, m=0.4, device_id=head_device_id),
        'CosFace': CosFace(in_features=EMBEDDING_SIZE, out_features=NUM_CLASS, device_id=head_device_id),
        'SphereFace': SphereFace(in_features=EMBEDDING_SIZE, out_features=NUM_CLASS, device_id=head_device_id),
        'Am_softmax': Am_softmax(in_features=EMBEDDING_SIZE, out_features=NUM_CLASS, device_id=head_device_id),
        'Softmax': Softmax(in_features=EMBEDDING_SIZE, out_features=NUM_CLASS, device_id=head_device_id),
    }


    HEAD = HEAD_DICT[HEAD_NAME]

    LOSS_DICT = {
        'Focal': FocalLoss(),
        'Softmax': nn.CrossEntropyLoss(),
    }
    LOSS = LOSS_DICT[LOSS_NAME]

    # Optimizer
    if "IR" in BACKBONE_NAME:
        backbone_paras_only_bn, backbone_paras_wo_bn = separate_irse_bn_paras(BACKBONE)
        _, head_paras_wo_bn = separate_irse_bn_paras(HEAD)
    elif "ViT" in BACKBONE_NAME:
        backbone_paras_only_bn, backbone_paras_wo_bn = separate_vit_paras(BACKBONE)
        _, head_paras_wo_bn = separate_resnet_bn_paras(HEAD)
    else:
        backbone_paras_only_bn, backbone_paras_wo_bn = separate_resnet_bn_paras(BACKBONE)
        _, head_paras_wo_bn = separate_resnet_bn_paras(HEAD)

    OPTIMIZER = optim.SGD([
        {'params': backbone_paras_wo_bn, 'lr': LR*0.1, 'weight_decay': WEIGHT_DECAY},
        {'params': backbone_paras_only_bn, 'lr': LR*0.1, 'weight_decay': 0}, # BN layers: weight_decay=0
        {'params': head_paras_wo_bn, 'lr': LR, 'weight_decay': WEIGHT_DECAY}
    ], momentum=MOMENTUM)


    # Move to GPU
    if MULTI_GPU:
        BACKBONE = nn.DataParallel(BACKBONE, device_ids=GPU_ID)
    BACKBONE = BACKBONE.to(DEVICE)
    HEAD = HEAD.to(DEVICE)

    # ===== Kiểm tra label mapping =====
    train_labels = [label for _, label in dataset_train.imgs]
    val_labels = [label for _, label in dataset_val.imgs]

    # Nếu labels không liên tục từ 0 tới NUM_CLASS-1, tạo mapping
    if not (min(train_labels) == 0 and max(train_labels) == NUM_CLASS-1):
        print("Train labels không liên tục, tạo class_to_idx mapping mới...")
        class_to_idx = {cls_name: i for i, cls_name in enumerate(dataset_train.classes)}
        dataset_train.targets = [class_to_idx[cls_name] for _, cls_name in dataset_train.imgs]
        dataset_val.targets = [class_to_idx[cls_name] for _, cls_name in dataset_val.imgs]

    else:
        print("Labels train và val đã liên tục từ 0 tới NUM_CLASS-1")

    #======= Define constants =======#
    warmup_epochs = 8
    total_epochs = NUM_EPOCH

    #======= Resume full checkpoint ========#
    last_epoch_found = find_last_epoch(MODEL_ROOT)
    checkpoint_path = os.path.join(MODEL_ROOT, f"checkpoint_epoch_{last_epoch_found}.pth")
    if os.path.exists(checkpoint_path):
        checkpoint = torch.load(checkpoint_path, map_location=DEVICE, weights_only=False)
        BACKBONE.load_state_dict(checkpoint['backbone_state_dict'])
        HEAD.load_state_dict(checkpoint['head_state_dict'])
        OPTIMIZER.load_state_dict(checkpoint['optimizer_state_dict'])
        last_epoch = checkpoint['epoch']
        base_lr = checkpoint.get('base_lr', LR)
        print(f"Resuming from epoch {last_epoch}, base LR={base_lr}")
    else:
        last_epoch = 0
        base_lr = LR
        print(f"Starting new training with base LR={base_lr}")

    #======= Log CSV ========#
    csv_path = os.path.join(LOG_ROOT, f"{BACKBONE_NAME}_{HEAD_NAME}_train_log.csv")
    log_data = []

    # Thêm các cột retrieval cho TRAIN
    train_retrieval_cols = ["train_p@1", "train_r@1", "train_p@5", "train_r@5", "train_p@10", "train_r@10"]
    val_retrieval_cols = ["val_p@1", "val_r@1", "val_p@5", "val_r@5", "val_p@10", "val_r@10"]
    base_cols = ["epoch", "train_loss", "train_acc_top1", "train_acc_top5",
                 "val_loss", "val_acc_top1", "val_acc_top5", "loss_ratio",
                 "val_f1", "grad_norm", "lr_head", "time_sec",
                 "gpu_mem_used", "gpu_mem_total", "gpu_util"]

    all_cols = base_cols + val_retrieval_cols + train_retrieval_cols
    # Nếu file log cũ tồn tại, đọc để resume
    if os.path.exists(csv_path):
        existing_log = pd.read_csv(csv_path)
        # Thêm cột bị thiếu nếu có
        for col in all_cols:
            if col not in existing_log.columns:
                existing_log[col] = np.nan
        log_data = existing_log.to_dict("records")
    else:
        # Tạo file CSV mới với header đầy đủ
        pd.DataFrame(log_data, columns=all_cols).to_csv(csv_path, index=False)

    # TensorBoard writer
    tb_writer = SummaryWriter(LOG_ROOT)
    val_loader = torch.utils.data.DataLoader(
        dataset_val, batch_size=BATCH_SIZE, shuffle=False,
        num_workers=NUM_WORKERS, pin_memory=PIN_MEMORY
    )

    print("="*60)
    #======= Training =======#
    print("Start Training...")
    for epoch in range(last_epoch, NUM_EPOCH):
        epoch_start_time = time.time()

        # Warm-up + cosine annealing
        if epoch < warmup_epochs:
            scale = (epoch + 1) / warmup_epochs
        else:
            t_cur = epoch - warmup_epochs
            t_total = total_epochs - warmup_epochs
            scale = 0.5 * (1 + np.cos(np.pi * t_cur / t_total))

        # Gán LR cho Backbone (i=0) và Head (i=1)
        for i, param_group in enumerate(OPTIMIZER.param_groups):
          # Nhóm 0 (Backbone non-BN) và Nhóm 1 (Backbone BN) dùng LR thấp
            lr = base_lr * 0.1 if i < 2 else base_lr
            param_group['lr'] = lr * scale

        # Lấy LR hiện tại cho từng nhóm để log
        lr_backbone_non_bn = OPTIMIZER.param_groups[0]['lr']
        lr_backbone_bn = OPTIMIZER.param_groups[1]['lr']
        lr_head = OPTIMIZER.param_groups[2]['lr']

        print("="*60)
        print(f"[LR Scheduler] Epoch {epoch+1}/{NUM_EPOCH}:")
        print(f"  Head LR:         {lr_head:.8f}")
        print(f"  Backbone non-BN: {lr_backbone_non_bn:.8f}")
        print(f"  Backbone BN:     {lr_backbone_bn:.8f}")
        print("="*60)

        current_lr_for_log = lr_head
        BACKBONE.train()
        HEAD.train()
        losses = AverageMeter()
        top1 = AverageMeter()
        top5 = AverageMeter()
        grad_norm_sum = 0.0
        num_batches = 0
        for batch_idx, (inputs, labels) in enumerate(tqdm(train_loader, desc=f"Epoch {epoch+1}/{NUM_EPOCH}")):
            inputs, labels = inputs.to(DEVICE), labels.to(DEVICE).long()
            features = BACKBONE(inputs)
            outputs = HEAD(features)
            # labels = labels.long()
            # if outputs.device != labels.device:
            #     labels = labels.to(outputs.device)
            loss = LOSS(outputs, labels)
            # print("loss:", loss.item())

            # debug NaN check
            if torch.isnan(outputs).any() or torch.isinf(outputs).any():
                 print("NaN/Inf in outputs detected at epoch", epoch, "batch", batch_idx)
            if torch.isnan(loss) or torch.isinf(loss):
                print("NaN/Inf in loss detected at epoch", epoch, "batch", batch_idx)
            if batch_idx < 3 and epoch == 0:   # (mình khuyên dùng epoch == 0 để debug ban đầu)
                print(f"[DEBUG] epoch {epoch+1} batch {batch_idx} loss:", loss.item())


            prec1, prec5 = accuracy(outputs.data, labels, topk=(1, 5))
            # optional detailed train print
            if batch_idx % 100 == 0:
                print(f"[Train] epoch {epoch+1} batch {batch_idx} loss={loss.item():.4f} top1={prec1.item():.2f} top5={prec5.item():.2f}")

            losses.update(loss.item(), inputs.size(0))
            top1.update(prec1.item(), inputs.size(0))
            top5.update(prec5.item(), inputs.size(0))

            OPTIMIZER.zero_grad()
            loss.backward()

            # gradient norm
            max_grad_norm = 5.0
            total_norm = torch.nn.utils.clip_grad_norm_(
                list(BACKBONE.parameters()) + list(HEAD.parameters()), max_norm=max_grad_norm
            )
            clipped_norm = min(float(total_norm), max_grad_norm)
            grad_norm_sum += clipped_norm
            num_batches += 1

            OPTIMIZER.step()

        avg_grad_norm = grad_norm_sum / max(1, num_batches)
        # Validation
        BACKBONE.eval()
        HEAD.eval()
        val_losses = AverageMeter()
        val_top1 = AverageMeter()
        val_top5 = AverageMeter()
        all_labels, all_preds = [], []

        with torch.no_grad():
            # for inputs, labels in tqdm(val_loader, desc="Validation"):
            for v_batch_idx, (inputs, labels) in enumerate(tqdm(val_loader, desc="Validation")):
                inputs, labels = inputs.to(DEVICE), labels.to(DEVICE)
                features = BACKBONE(inputs)
                outputs = HEAD(features)

                labels = labels.long()
                if outputs.device != labels.device:
                    labels = labels.to(outputs.device)

                loss = LOSS(outputs, labels)
                # Update loss trung bình
                val_losses.update(loss.item(), inputs.size(0))

                # Tính top-1 và top-5
                prec1, prec5 = accuracy(outputs.data, labels, topk=(1, 5))
                val_top1.update(prec1.item(), inputs.size(0))
                val_top5.update(prec5.item(), inputs.size(0))

                # Lưu nhãn & dự đoán để tính F1
                _, predicted = torch.max(outputs.data, 1)
                all_labels.extend(labels.cpu().numpy())
                all_preds.extend(predicted.cpu().numpy())

        # Kết quả cuối cùng
        val_f1 = f1_score(all_labels, all_preds, average="macro")
        gpu_stats = get_gpu_usage(GPU if isinstance(GPU, int) else GPU[0])
        print(f"GPU memory used: {gpu_stats['mem_used']} / {gpu_stats['mem_total']} MB | Utilization: {gpu_stats['util']}%")

        print("\n--- Starting Retrieval Evaluation ---")
        # 1. VAL RETRIEVAL (Luôn tính)
        val_retrieval_metrics_raw = perform_retrieval_val(
            BACKBONE.module if MULTI_GPU else BACKBONE,
            val_loader,
            DEVICE,
            k_values=[1, 5, 10],
            desc_prefix="Val Retrieval"
        )
        print(f"Val Retrieval: P@1={val_retrieval_metrics_raw['P@1']:.2f}%, R@1={val_retrieval_metrics_raw['R@1']:.2f}% | P@5={val_retrieval_metrics_raw['P@5']:.2f}%, R@5={val_retrieval_metrics_raw['R@5']:.2f}%")

        # 2. TRAIN RETRIEVAL (Tính mỗi RETRIEVAL_FREQ epoch)
        train_retrieval_metrics = {}
        if (epoch + 1) % RETRIEVAL_FREQ == 0:
            print(f"\n--- Starting TRAIN Retrieval Evaluation (Epoch {epoch+1}) ---")
            train_retrieval_metrics_raw = perform_retrieval_val(
                BACKBONE.module if MULTI_GPU else BACKBONE,
                train_loader,
                DEVICE,
                k_values=[1, 5, 10],
                desc_prefix="Train Retrieval"
            )
            print(f"Train Retrieval: P@1={train_retrieval_metrics_raw['P@1']:.2f}%, R@1={train_retrieval_metrics_raw['R@1']:.2f}% | P@5={train_retrieval_metrics_raw['P@5']:.2f}%, R@5={train_retrieval_metrics_raw['R@5']:.2f}%")

            # Cập nhật dict log
            for k in [1, 5, 10]:
                train_retrieval_metrics[f"train_p@{k}"] = round(train_retrieval_metrics_raw[f"P@{k}"], 4)
                train_retrieval_metrics[f"train_r@{k}"] = round(train_retrieval_metrics_raw[f"R@{k}"], 4)
        else:
             # Nếu không tính, gán NaN cho các cột train retrieval
             for k in [1, 5, 10]:
                train_retrieval_metrics[f"train_p@{k}"] = np.nan
                train_retrieval_metrics[f"train_r@{k}"] = np.nan

        # Append vào log_data và lưu CSV
        loss_ratio = val_losses.avg / losses.avg if losses.avg != 0 else float("inf")  # train_loss trung bình
        log_entry = {
            "epoch": epoch + 1,
            "train_loss": round(losses.avg, 6),
            "train_acc_top1": round(top1.avg, 4),
            "train_acc_top5": round(top5.avg, 4),
            "val_loss": round(val_losses.avg, 6),
            "val_acc_top1": round(val_top1.avg, 4),
            "val_acc_top5": round(val_top5.avg, 4),
            "loss_ratio": round(loss_ratio, 4),
            "val_f1": round(val_f1, 4),
            "grad_norm": round(avg_grad_norm.item() if torch.is_tensor(avg_grad_norm) else avg_grad_norm, 4),
            "lr_head": round(current_lr_for_log, 8),
            "time_sec": round(time.time() - epoch_start_time, 2),
            "gpu_mem_used": gpu_stats['mem_used'],
            "gpu_mem_total": gpu_stats['mem_total'],
            "gpu_util": gpu_stats['util'],
            # metrics Retrieval
            "val_p@1": round(val_retrieval_metrics_raw['P@1'], 4),
            "val_r@1": round(val_retrieval_metrics_raw['R@1'], 4),
            "val_p@5": round(val_retrieval_metrics_raw['P@5'], 4),
            "val_r@5": round(val_retrieval_metrics_raw['R@5'], 4),
            "val_p@10": round(val_retrieval_metrics_raw['P@10'], 4),
            "val_r@10": round(val_retrieval_metrics_raw['R@10'], 4),
            # metrics Train Retrieval (sẽ là 0 hoặc giá trị thực)
            **train_retrieval_metrics,

        }

        # Đảm bảo tất cả các cột đều có giá trị (NaN nếu chưa tính)
        final_entry = {}
        for col in all_cols:
            final_entry[col] = log_entry.get(col, np.nan)

        log_data.append(final_entry)

        pd.DataFrame(log_data).to_csv(csv_path, index=False)

        # Tensorboard
        tb_writer.add_scalar("Train/Loss", losses.avg, epoch + 1)
        tb_writer.add_scalar("Train/Acc", top1.avg, epoch + 1)
        tb_writer.add_scalar("Val/Loss", val_losses.avg, epoch + 1)
        tb_writer.add_scalar("Val/Acc", val_top1.avg, epoch + 1)
        tb_writer.add_scalar("LR", current_lr_for_log, epoch + 1)
        # Log Val Retrieval metrics
        tb_writer.add_scalar("Val/P@1", val_retrieval_metrics_raw['P@1'], epoch + 1)
        tb_writer.add_scalar("Val/R@1", val_retrieval_metrics_raw['R@1'], epoch + 1)
        tb_writer.add_scalar("Val/P@5", val_retrieval_metrics_raw['P@5'], epoch + 1)
        tb_writer.add_scalar("Val/R@5", val_retrieval_metrics_raw['R@5'], epoch + 1)
        # Log Train Retrieval metrics
        if (epoch + 1) % RETRIEVAL_FREQ == 0:
            tb_writer.add_scalar("Train_Retrieval/P@1", train_retrieval_metrics_raw['P@1'], epoch + 1)
            tb_writer.add_scalar("Train_Retrieval/R@1", train_retrieval_metrics_raw['R@1'], epoch + 1)
            tb_writer.add_scalar("Train_Retrieval/P@5", train_retrieval_metrics_raw['P@5'], epoch + 1)
            tb_writer.add_scalar("Train_Retrieval/R@5", train_retrieval_metrics_raw['R@5'], epoch + 1)

        # Save full checkpoint (model + optimizer + epoch)
        torch.save({
            'epoch': epoch + 1,
            'backbone_state_dict': BACKBONE.state_dict(),
            'head_state_dict': HEAD.state_dict(),
            'optimizer_state_dict': OPTIMIZER.state_dict(),
            'base_lr': base_lr,   # lưu LR gốc tại thời điểm config ban đầu
        }, os.path.join(MODEL_ROOT, f"checkpoint_epoch_{epoch+1}.pth"))

        # In kết quả cuối cùng
        train_ret_display = ""
        if (epoch + 1) % RETRIEVAL_FREQ == 0:
             train_ret_display = f" | TrainP@1={train_retrieval_metrics_raw['P@1']:.2f}% | TrainR@1={train_retrieval_metrics_raw['R@1']:.2f}%"

        print(f"Epoch [{epoch+1}/{NUM_EPOCH}] done | "
              f"TrainLoss={losses.avg:.4f} | ValAcc={val_top1.avg:.2f}% | "
              f"ValP@1={val_retrieval_metrics_raw['P@1']:.2f}% | ValR@1={val_retrieval_metrics_raw['R@1']:.2f}%{train_ret_display}")

    tb_writer.close()
    print("Training completed. Logs saved to", csv_path)
