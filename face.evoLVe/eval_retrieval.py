import numpy as np
import re
import torch
from tqdm import tqdm, trange
import faiss
import torchvision
import torchvision.transforms as transforms
import torchvision.datasets as datasets
import matplotlib.pyplot as plt
from pathlib import Path
from collections import OrderedDict
import torch.nn as nn
import json

def _strip_module_prefix(state_dict):
    # Xử lý checkpoint có tiền tố "module." (DataParallel) hoặc "model."
    new_sd = OrderedDict()
    for k, v in state_dict.items():
        if k.startswith("module."):
            new_sd[k[len("module."):]] = v
        elif k.startswith("model."):
            new_sd[k[len("model."):]] = v
        else:
            new_sd[k] = v
    return new_sd

def load_checkpoint_flex(model, ckpt_path, device):
    ckpt = torch.load(ckpt_path, map_location=device)

    # 1) Nếu ckpt là mapping tham số luôn (key -> tensor)
    if isinstance(ckpt, dict) and all(isinstance(v, torch.Tensor) for v in ckpt.values()):
        sd = _strip_module_prefix(ckpt)
        missing, unexpected = model.load_state_dict(sd, strict=False)
        return missing, unexpected

    # 2) Nếu ckpt là dict lớn (phổ biến)
    candidate_keys = [
        "model_state_dict",  # PyTorch tutorial style
        "state_dict",        # PyTorch Lightning / custom
        "model",             # custom
        "net", "weights", "params", "ema_state_dict"
    ]
    for k in candidate_keys:
        if isinstance(ckpt, dict) and k in ckpt and isinstance(ckpt[k], dict):
            sd = ckpt[k]
            # Lightning thường có prefix "model." trong state_dict
            sd = _strip_module_prefix(sd)
            missing, unexpected = model.load_state_dict(sd, strict=False)
            return missing, unexpected

    # 3) Nếu lưu cả nn.Module (ít gặp, nhưng có)
    if hasattr(ckpt, "state_dict") and callable(getattr(ckpt, "state_dict")):
        sd = _strip_module_prefix(ckpt.state_dict())
        missing, unexpected = model.load_state_dict(sd, strict=False)
        return missing, unexpected

    # 4) Không khớp định dạng -> in gợi ý
    print(">> Checkpoint keys:", list(ckpt.keys()) if isinstance(ckpt, dict) else type(ckpt))
    raise KeyError("Không tìm thấy state_dict. Hãy kiểm tra các key ở trên hoặc cách bạn đã torch.save() trước đó.")

def strip_prefix(sd):
    new = OrderedDict()
    for k,v in sd.items():
        if k.startswith("module."): k = k[7:]
        if k.startswith("model."):  k = k[6:]
        new[k] = v
    return new

def load_backbone_only(model, ckpt_path, device, drop_fc=True):
    ckpt = torch.load(ckpt_path, map_location=device)
    # tìm state_dict bên trong
    if isinstance(ckpt, dict):
        for key in ["model_state_dict","state_dict","model","net","weights","params","ema_state_dict"]:
            if key in ckpt and isinstance(ckpt[key], dict):
                ckpt = ckpt[key]; break
    if not isinstance(ckpt, dict):
        ckpt = ckpt.state_dict()  # trường hợp lưu nguyên nn.Module

    sd = strip_prefix(ckpt)

    if drop_fc:
        sd = {k:v for k,v in sd.items() if not k.startswith("fc.")}

    missing, unexpected = model.load_state_dict(sd, strict=False)
    return missing, unexpected


@torch.no_grad()
def perform_retrieval_val(
    backbone,
    data_loader,
    device,
    k_values=(1,5,10,15),
    desc_prefix="Retrieval",
    exclude_singletons_for_atk=True,  # chỉ tính @K trên query có ≥1 ảnh cùng lớp
):
    import numpy as np, torch, faiss
    from tqdm import tqdm, trange

    backbone.eval()
    embs, labels = [], []
    for x, y in tqdm(data_loader, desc=f"{desc_prefix} Embeddings"):
        x = x.to(device, non_blocking=True)
        with torch.no_grad():
            f = backbone(x)
        embs.append(f.detach().float().cpu().numpy())
        labels.extend(y.detach().cpu().numpy())

    if not embs:
        base = {f"{m}@{k}": np.nan for k in k_values for m in ("P","R","Hit")}
        base.update({f"mAP@{k}": np.nan for k in k_values})
        base["PR@K_curve"] = {"K": [], "precision": [], "recall": []}
        base["mAP"] = np.nan
        base["num_queries_for_mAP"] = 0
        base["atk_coverage(%)"] = 0.0
        return base

    X = np.ascontiguousarray(np.concatenate(embs, 0))
    y = np.asarray(labels, np.int64)
    n, d = X.shape
    if n < 2:
        base = {f"{m}@{k}": np.nan for k in k_values for m in ("P","R","Hit")}
        base.update({f"mAP@{k}": np.nan for k in k_values})
        base["PR@K_curve"] = {"K": [], "precision": [], "recall": []}
        base["mAP"] = np.nan
        base["num_queries_for_mAP"] = 0
        base["atk_coverage(%)"] = 0.0
        return base

    # Normalize for cosine
    faiss.normalize_L2(X)

    # FAISS index
    index = faiss.IndexFlatIP(d)
    try:
        if device.type == "cuda" and faiss.get_num_gpus() > 0:
            res = faiss.StandardGpuResources()
            index = faiss.index_cpu_to_gpu(res, 0, index)
    except Exception:
        pass
    index.add(X)

    # Safe K
    max_k_req = max(k_values)
    max_k_safe = min(max_k_req, n-1)
    if max_k_safe <= 0:
        out = {f"{m}@{k}": 0.0 for k in k_values for m in ("P","R","Hit")}
        out.update({f"mAP@{k}": 0.0 for k in k_values})
        out["PR@K_curve"] = {"K": [], "precision": [], "recall": []}
        out["mAP"] = 0.0
        out["num_queries_for_mAP"] = 0
        out["atk_coverage(%)"] = 0.0
        return out

    # Search
    D, I = index.search(X, max_k_safe + 1)

    # Remove self
    I_nos, D_nos = [], []
    for i in range(n):
        mask = (I[i] != i)
        I_nos.append(I[i][mask][:max_k_safe])
        D_nos.append(D[i][mask][:max_k_safe])
    I_nos = np.stack(I_nos, 0)  # (n, max_k_safe)
    D_nos = np.stack(D_nos, 0)

    # Eligibility mask (queries with ≥1 relevant in gallery)
    total_rel_vec = (y[:, None] == y[None, :]).sum(1) - 1
    has_rel_mask = total_rel_vec > 0
    coverage = float(has_rel_mask.mean() * 100.0)

    use_idx = np.where(has_rel_mask)[0] if exclude_singletons_for_atk else np.arange(n)

    # --- mAP (full on top=max_k_safe for eligible queries) ---
    aps_full = []
    # --- AP@K buckets ---
    apk_lists = {k: [] for k in k_values}

    # @K metrics + PR@K curve
    results_per_k = {k: {"P": [], "R": [], "Hit": []} for k in k_values}
    prec_curve = np.zeros(max_k_safe, dtype=np.float64)
    recall_curve = np.zeros(max_k_safe, dtype=np.float64)
    valid_q = 0

    for i in trange(n, desc=f"{desc_prefix} Metrics"):
        qlab = y[i]
        rel_flags = (y[I_nos[i]] == qlab).astype(np.int32)  # (max_k_safe,)
        tr = int(total_rel_vec[i])

        # mAP full: chỉ tính khi tr>0 (eligible)
        if tr > 0:
            if rel_flags.any():
                cum = rel_flags.cumsum()
                ranks = np.arange(1, len(rel_flags)+1)
                ap_full = float(((cum / ranks) * rel_flags).sum() / tr)
            else:
                ap_full = 0.0
            aps_full.append(ap_full)

        # Nếu query này nằm trong use_idx -> dùng cho @K & PR@K & AP@K
        if i in use_idx:
            if tr > 0:
                cum = rel_flags.cumsum()
                ranks = np.arange(1, len(rel_flags)+1)
                k_curve = min(max_k_safe, len(rel_flags))
                prec_curve[:k_curve] += cum[:k_curve] / ranks[:k_curve]
                recall_curve[:k_curve] += cum[:k_curve] / tr
                valid_q += 1

            for k in k_values:
                kk = min(k, max_k_safe)
                topk = rel_flags[:kk]
                correct = int(topk.sum())
                # P/R/Hit@K
                p_at_k = correct / kk
                r_at_k = (correct / tr) if tr > 0 else 0.0
                hit_at_k = 1.0 if correct > 0 else 0.0
                results_per_k[k]["P"].append(p_at_k)
                results_per_k[k]["R"].append(r_at_k)
                results_per_k[k]["Hit"].append(hit_at_k)

                # AP@K cho query này
                if tr > 0:
                    if topk.any():
                        cum_top = np.cumsum(topk)
                        ranks_top = np.arange(1, kk+1)
                        ap_k = float(((cum_top / ranks_top) * topk).sum() / tr)
                    else:
                        ap_k = 0.0
                    apk_lists[k].append(ap_k)

    # Aggregate
    out = {}
    for k, dct in results_per_k.items():
        out[f"P@{k}"]   = float(np.mean(dct["P"]) * 100.0) if dct["P"] else 0.0
        out[f"R@{k}"]   = float(np.mean(dct["R"]) * 100.0) if dct["R"] else 0.0
        out[f"Hit@{k}"] = float(np.mean(dct["Hit"]) * 100.0) if dct["Hit"] else 0.0

    # mAP@K (mean AP@K trên eligible queries dùng cho @K)
    for k in k_values:
        out[f"mAP@{k}"] = float(np.mean(apk_lists[k]) * 100.0) if apk_lists[k] else 0.0

    if valid_q > 0:
        prec_curve /= valid_q
        recall_curve /= valid_q
        out["PR@K_curve"] = {
            "K": list(range(1, max_k_safe+1)),
            "precision": prec_curve.tolist(),
            "recall": recall_curve.tolist(),
        }
    else:
        out["PR@K_curve"] = {"K": [], "precision": [], "recall": []}

    # mAP full (trên tất cả eligible queries)
    out["mAP"] = float(np.mean(aps_full) * 100.0) if aps_full else 0.0
    out["num_queries_for_mAP"] = int(len(aps_full))
    out["atk_coverage(%)"] = coverage

    return out



BATCH_SIZE = 64

transform_val = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.PILToTensor(),
    transforms.ConvertImageDtype(torch.float),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])
valset = datasets.ImageFolder(root='/media/khainq/Data/DeepFashion52K/val', transform=transform_val)

# Đếm số ảnh mỗi lớp
targets = np.array(valset.targets, dtype=np.int64)   # torchvision >=0.12 có .targets
num_classes = max(targets) + 1
cls_counts = np.bincount(targets, minlength=num_classes)


# Chỉ giữ các mẫu thuộc lớp có >= 2 ảnh (eligible query)
eligible_idx = [i for i in range(len(targets)) if cls_counts[targets[i]] >= 2]
print(f"Eligible queries: {len(eligible_idx)}/{len(valset)} "
      f"({100*len(eligible_idx)/len(valset):.2f}%)")
valset = torch.utils.data.Subset(valset, eligible_idx)

valloader = torch.utils.data.DataLoader(valset, batch_size=BATCH_SIZE, shuffle=False, num_workers=4)


# --- Setup model làm extractor ---
model = torchvision.models.resnet50(weights=torchvision.models.ResNet50_Weights.DEFAULT)
model.fc = nn.Identity()               # dùng làm feature extractor 2048-d
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

missing, unexpected = load_backbone_only(model, "weights/resnet50_e60.pth", device, drop_fc=True)
print("Missing keys:", missing)        # thường sẽ liệt kê 'fc.weight', 'fc.bias' (đã drop)
print("Unexpected keys:", unexpected)  # nên rỗng nếu cùng kiến trúc

model = model.to(device).eval()


# num_ftrs = model.fc.in_features
# model.fc = nn.Linear(num_ftrs, 7991)
# missing, unexpected = load_checkpoint_flex(model, 'weights/resnet50_epoch_50_basic.pth', device)



metrics = perform_retrieval_val(model, valloader, device, k_values=(1, 5, 10, 15), desc_prefix="Validation")
print("Evaluation Results:")



# ========= Setup thư mục =========
out_dir = Path("plots_r50_e60")
out_dir.mkdir(parents=True, exist_ok=True)

curve = metrics.get("PR@K_curve", {"K": [], "precision": [], "recall": []})
Ks = curve.get("K", [])
prec = curve.get("precision", [])
rec  = curve.get("recall", [])

def get_seq_at_k(metrics: dict, prefix: str):
    """
    Lấy (Ks, values) cho các key đúng định dạng '{prefix}@<int>'.
    Ví dụ: prefix='P' -> lấy P@1, P@5, ...
            prefix='mAP' -> lấy mAP@1, mAP@5, ...
    """
    Ks, vals = [], []
    pat = re.compile(rf"^{re.escape(prefix)}@(\d+)$")
    for k, v in metrics.items():
        m = pat.match(k)
        if m:
            Ks.append(int(m.group(1)))
            vals.append(v)
    # sort theo K
    order = np.argsort(Ks) if Ks else []
    Ks = [Ks[i] for i in order] if Ks else []
    vals = [vals[i] for i in order] if vals else []
    return Ks, vals

# ----- Lưu metrics -----
with open(out_dir / "metrics.json", "w") as f:
    json.dump(metrics, f, indent=2)

with open(out_dir / "metrics_summary.txt", "w") as f:
    Ks = get_seq_at_k(metrics, "P")[0]
    for k in Ks:
        f.write(
            f"P@{k}: {metrics.get(f'P@{k}', float('nan')):.2f}% | "
            f"R@{k}: {metrics.get(f'R@{k}', float('nan')):.2f}% | "
            f"Hit@{k}: {metrics.get(f'Hit@{k}', float('nan')):.2f}%\n"
        )
    if "mAP" in metrics:
        f.write(f"mAP (full): {metrics['mAP']:.2f}%\n")
    Ks_mapk, mAPKs = get_seq_at_k(metrics, "mAP")
    if Ks_mapk:
        f.write("mAP@K: " + ", ".join([f"{k}:{metrics[f'mAP@{k}']:.2f}%" for k in Ks_mapk]) + "\n")
    if "atk_coverage(%)" in metrics:
        f.write(f"ATK coverage: {metrics['atk_coverage(%)']:.2f}%\n")
    if "num_queries_for_mAP" in metrics:
        f.write(f"num_queries_for_mAP: {metrics['num_queries_for_mAP']}\n")

# ----- PR@K curve -----
curve = metrics.get("PR@K_curve", {"K": [], "precision": [], "recall": []})
if curve.get("K") and curve.get("precision") and curve.get("recall"):
    plt.figure(figsize=(6.5, 5))
    plt.plot(curve["recall"], curve["precision"], marker="o")
    plt.xlabel("Recall@K")
    plt.ylabel("Precision@K")
    plt.title("PR@K (macro-avg)")
    plt.grid(True, linestyle="--", alpha=0.6)
    plt.tight_layout()
    plt.savefig(out_dir / "pr_at_k_curve.png", dpi=300)
    plt.savefig(out_dir / "pr_at_k_curve.pdf")
    plt.close()

# ----- P/R/Hit @ K – line plot -----
Ks, P = get_seq_at_k(metrics, "P")
_, R = get_seq_at_k(metrics, "R")
_, H = get_seq_at_k(metrics, "Hit")
if Ks:
    plt.figure(figsize=(7, 4.8))
    plt.plot(Ks, P, marker="o", label="P@K")
    plt.plot(Ks, R, marker="s", label="R@K")
    plt.plot(Ks, H, marker="^", label="Hit@K")
    plt.xlabel("K")
    plt.ylabel("Percentage (%)")
    plt.title("P / R / Hit @ K")
    plt.legend()
    plt.grid(True, linestyle="--", alpha=0.6)
    plt.tight_layout()
    plt.savefig(out_dir / "pr_hit_at_k_lines.png", dpi=300)
    plt.savefig(out_dir / "pr_hit_at_k_lines.pdf")
    plt.close()

# ----- P/R/Hit @ K – bar chart -----
if Ks:
    x = np.arange(len(Ks))
    w = 0.26
    plt.figure(figsize=(7.2, 4.8))
    plt.bar(x - w, P, width=w, label="P@K")
    plt.bar(x,     R, width=w, label="R@K")
    plt.bar(x + w, H, width=w, label="Hit@K")
    plt.xticks(x, [str(k) for k in Ks])
    plt.ylabel("Percentage (%)")
    plt.title("P / R / Hit @ K (Bars)")
    plt.legend()
    plt.grid(True, axis="y", linestyle="--", alpha=0.6)
    plt.tight_layout()
    plt.savefig(out_dir / "pr_hit_at_k_bars.png", dpi=300)
    plt.savefig(out_dir / "pr_hit_at_k_bars.pdf")
    plt.close()

# ----- mAP@K vs K -----
Ks_mapk, mAPKs = get_seq_at_k(metrics, "mAP")
if Ks_mapk:
    plt.figure(figsize=(6.5, 4.8))
    plt.plot(Ks_mapk, mAPKs, marker="o")
    plt.xlabel("K")
    plt.ylabel("mAP@K (%)")
    plt.title("mAP@K vs K")
    plt.grid(True, linestyle="--", alpha=0.6)
    plt.tight_layout()
    plt.savefig(out_dir / "map_at_k_curve.png", dpi=300)
    plt.savefig(out_dir / "map_at_k_curve.pdf")
    plt.close()

print(f"✅ Saved all plots to: {out_dir.resolve()}")
