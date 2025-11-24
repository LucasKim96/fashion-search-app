import cv2
import numpy as np
from app.config import YOLO_CLASS_GROUPS, INPUT_SIZE, YOLO_CONF_THRESHOLD

# def preprocess_text(text: str):
#     # replace bằng tokenizer / embedding code thật
#     return torch.tensor([1,2,3])  # dummy

# --- 1. CÁC HÀM CƠ BẢN (Resize, Center Crop) ---

def resize_with_padding(img_np, target_size=None, color=(255, 255, 255)):
    """
    Resize ảnh giữ nguyên tỉ lệ và thêm padding trắng.
    Chuẩn hóa đầu vào cho ResNet ArcFace.
    """
    if target_size is None:
        target_size = INPUT_SIZE

    h, w = img_np.shape[:2]
    if h == 0 or w == 0: return None

    scale = min(target_size[0]/h, target_size[1]/w)
    nh, nw = int(h*scale), int(w*scale)
    
    # Tránh lỗi kích thước = 0
    nh, nw = max(1, nh), max(1, nw)
    
    try:
        img_resized = cv2.resize(img_np, (nw, nh))
    except Exception as e:
        return None
    
    top = (target_size[0] - nh) // 2
    bottom = target_size[0] - nh - top
    left = (target_size[1] - nw) // 2
    right = target_size[1] - nw - left
    
    img_padded = cv2.copyMakeBorder(
        img_resized, top, bottom, left, right,
        borderType=cv2.BORDER_CONSTANT, value=color
    )
    return img_padded

def get_center_crop(img_np, crop_ratio=0.8):
    """
    Cắt lấy vùng trung tâm ảnh (Fallback khi YOLO thất bại).
    crop_ratio=0.8 nghĩa là lấy 80% ảnh ở giữa.
    """
    h, w = img_np.shape[:2]
    if h == 0 or w == 0: return img_np

    new_h = int(h * crop_ratio)
    new_w = int(w * crop_ratio)
    
    y1 = (h - new_h) // 2
    x1 = (w - new_w) // 2
    
    # Cắt ảnh
    return img_np[y1 : y1+new_h, x1 : x1+new_w]

# --- 2. LOGIC CHO NGƯỜI BÁN (SHOP - INDEXING) ---

def auto_crop_for_seller(yolo_model, img_np, target_group: str):
    """
    Logic thông minh cho người bán:
    1. Tìm box tốt nhất theo target_group (conf chuẩn).
    2. Nếu không thấy -> Hạ conf xuống 0.2 tìm lại.
    3. Nếu vẫn không thấy -> Cắt 80% trung tâm (Center Crop).
    
    Trả về: (cropped_img_np, method_used)
    """
    if target_group not in YOLO_CLASS_GROUPS:
        # Nếu group không hợp lệ hoặc là 'none', dùng ảnh gốc resize
        return img_np, "original"

    # --- Bước 1: Thử với Confidence chuẩn (Ví dụ 0.4 - 0.5) ---
    best_box = _find_best_box(yolo_model, img_np, target_group, conf=YOLO_CONF_THRESHOLD)
    
    if best_box is not None:
        return _crop_by_box(img_np, best_box), "yolo_high_conf"

    # --- Bước 2: Thử với Confidence thấp (Retry - 0.15) ---
    # Giúp bắt được các ảnh mờ, chụp xa
    best_box_retry = _find_best_box(yolo_model, img_np, target_group, conf=0.15)
    
    if best_box_retry is not None:
        return _crop_by_box(img_np, best_box_retry), "yolo_low_conf"

    # --- Bước 3: Đường cùng -> Center Crop 80% ---
    return get_center_crop(img_np, crop_ratio=0.8), "center_crop_fallback"


def _find_best_box(model, img, group, conf):
    """Hàm phụ trợ tìm box có conf cao nhất trong group"""
    class_indices = YOLO_CLASS_GROUPS[group]
    results = model(img, conf=conf, verbose=False)
    
    best_conf = -1
    best_box = None
    
    for r in results:
        for box in r.boxes:
            cls_id = int(box.cls[0].item())
            conf_score = float(box.conf[0].item())
            
            if cls_id in class_indices and conf_score > best_conf:
                best_conf = conf_score
                best_box = box
    return best_box

def _crop_by_box(img, box):
    """Hàm phụ trợ cắt ảnh theo box YOLO"""
    x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
    h, w = img.shape[:2]
    # Kẹp tọa độ trong khung hình
    x1, y1 = max(0, x1), max(0, y1)
    x2, y2 = min(w, x2), min(h, y2)
    return img[y1:y2, x1:x2]

# --- 3. LOGIC CHO KHÁCH HÀNG (BUYER - SEARCH) ---

def detect_candidates_for_buyer(yolo_model, img_np):
    """
    Logic cho Client chọn vùng tìm kiếm:
    1. Detect tất cả box (Upper, Lower, Full, etc).
    2. Logic Merge: Nếu có Upper + Lower gần nhau -> Tạo thêm box FullBody ảo.
    
    Trả về: List các box candidates để Frontend vẽ.
    Format: [{'label': 'upper', 'box': [x1,y1,x2,y2]}, ...]
    """
    results = yolo_model(img_np, conf=0.25, verbose=False) # Conf vừa phải cho khách
    
    candidates = []
    
    # Phân loại box tìm được
    found_upper = []
    found_lower = []
    found_full = []
    
    for r in results:
        for box in r.boxes:
            cls_id = int(box.cls[0].item())
            coords = list(map(int, box.xyxy[0].tolist())) # [x1, y1, x2, y2]
            
            # Check thuộc nhóm nào
            label = None
            if cls_id in YOLO_CLASS_GROUPS["upper_body"]:
                label = "upper_body"
                found_upper.append(coords)
            elif cls_id in YOLO_CLASS_GROUPS["lower_body"]:
                label = "lower_body"
                found_lower.append(coords)
            elif cls_id in YOLO_CLASS_GROUPS["full_body"]:
                label = "full_body"
                found_full.append(coords)
            
            if label:
                candidates.append({
                    "label": label,
                    "box": coords,
                    "type": "detected"
                })

    # --- Logic Merge: Nếu có Upper + Lower nhưng thiếu Full -> Merge lại ---
    # Chỉ merge nếu chưa tìm thấy full body nào xịn từ YOLO
    if not found_full and found_upper and found_lower:
        # Lấy upper to nhất và lower to nhất để merge (đơn giản hóa)
        u_box = found_upper[0] 
        l_box = found_lower[0]
        
        # Tạo box bao trùm cả 2
        merged_box = [
            min(u_box[0], l_box[0]), # min x1
            min(u_box[1], l_box[1]), # min y1
            max(u_box[2], l_box[2]), # max x2
            max(u_box[3], l_box[3])  # max y2
        ]
        
        candidates.append({
            "label": "full_body",
            "box": merged_box,
            "type": "merged" # Đánh dấu là box do thuật toán ghép
        })
        
    return candidates