import cv2
import numpy as np
from app.config import YOLO_CLASS_GROUPS, INPUT_SIZE, YOLO_CONF_THRESHOLD

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

def get_center_crop(img_np, crop_ratio=0.6):
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
    2. [MỚI] Nếu target là full_body mà không thấy -> Tìm Upper + Lower -> Merge.
    3. Nếu không thấy -> Hạ conf xuống 0.15 tìm lại (Lặp lại logic trên).
    4. Nếu vẫn không thấy -> Cắt 80% trung tâm (Center Crop).
    
    Trả về: (cropped_img_np, method_used)
    """
    if target_group not in YOLO_CLASS_GROUPS:
        # Nếu group không hợp lệ hoặc là 'none', dùng ảnh gốc resize (hoặc center crop tùy ý)
        # Ở đây trả về ảnh gốc để giữ nguyên context nếu user chọn None
        return img_np, "original"

    # === PHA 1: Thử với Confidence chuẩn (YOLO_CONF_THRESHOLD) ===
    # 1.1 Tìm chính xác group (VD: full_body -> tìm dress, jumpsuit)
    best_box = _find_best_box(yolo_model, img_np, target_group, conf=YOLO_CONF_THRESHOLD)
    if best_box is not None:
        return _crop_by_box(img_np, best_box), f"yolo_high_conf_{target_group}"

    # 1.2 [LOGIC MỚI] Nếu là full_body mà không thấy dress/jumpsuit -> Thử Merge Upper + Lower
    if target_group == "full_body":
        upper_box = _find_best_box(yolo_model, img_np, "upper_body", conf=YOLO_CONF_THRESHOLD)
        lower_box = _find_best_box(yolo_model, img_np, "lower_body", conf=YOLO_CONF_THRESHOLD)
        
        if upper_box is not None and lower_box is not None:
            merged_coords = _merge_boxes(upper_box, lower_box)
            return _crop_by_coords(img_np, merged_coords), "yolo_high_conf_merged_full"

    # === PHA 2: Thử với Confidence thấp (Retry - 0.15) ===
    LOW_CONF = 0.15
    
    # 2.1 Tìm chính xác group
    best_box_retry = _find_best_box(yolo_model, img_np, target_group, conf=LOW_CONF)
    if best_box_retry is not None:
        return _crop_by_box(img_np, best_box_retry), f"yolo_low_conf_{target_group}"

    # 2.2 [LOGIC MỚI] Retry Merge cho full_body
    if target_group == "full_body":
        upper_box = _find_best_box(yolo_model, img_np, "upper_body", conf=LOW_CONF)
        lower_box = _find_best_box(yolo_model, img_np, "lower_body", conf=LOW_CONF)
        
        if upper_box is not None and lower_box is not None:
            merged_coords = _merge_boxes(upper_box, lower_box)
            return _crop_by_coords(img_np, merged_coords), "yolo_low_conf_merged_full"

    # === PHA 3: Đường cùng -> Center Crop 80% ===
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

def _merge_boxes(box1, box2):
    """
    Gộp 2 YOLO box object thành 1 toạ độ [x1, y1, x2, y2] bao trùm cả hai.
    """
    b1 = list(map(int, box1.xyxy[0].tolist()))
    b2 = list(map(int, box2.xyxy[0].tolist()))
    
    x1 = min(b1[0], b2[0])
    y1 = min(b1[1], b2[1])
    x2 = max(b1[2], b2[2])
    y2 = max(b1[3], b2[3])
    
    return [x1, y1, x2, y2]

def _crop_by_coords(img, coords):
    """Cắt ảnh theo toạ độ list [x1, y1, x2, y2]"""
    x1, y1, x2, y2 = coords
    h, w = img.shape[:2]
    # Kẹp tọa độ trong khung hình
    x1, y1 = max(0, x1), max(0, y1)
    x2, y2 = min(w, x2), min(h, y2)
    return img[y1:y2, x1:x2]

def _crop_by_box(img, box):
    """Hàm phụ trợ cắt ảnh theo box YOLO object"""
    coords = list(map(int, box.xyxy[0].tolist()))
    return _crop_by_coords(img, coords)

# --- 3. LOGIC CHO KHÁCH HÀNG (BUYER - SEARCH) ---
def detect_candidates_for_buyer(yolo_model, img_np):
    """
    Logic cho Client chọn vùng tìm kiếm:
    1. Detect tất cả box.
    2. Lọc: Mỗi nhóm (Upper, Lower, Full) chỉ giữ lại 1 box có CONFIDENCE CAO NHẤT.
    3. Logic Merge: Nếu có Upper + Lower (đã lọc) nhưng thiếu Full -> Tạo thêm box FullBody ảo.
    
    Trả về: List các box candidates để Frontend vẽ.
    Format: [{'label': 'upper', 'box': [x1,y1,x2,y2]}, ...]
    """
    results = yolo_model(img_np, conf=0.25, verbose=False) # Conf vừa phải cho khách
    
    candidates = []
    
    # Lưu tạm box tốt nhất tìm được cho mỗi loại
    best_matches = {
        "upper_body": {"score": -1, "box": None},
        "lower_body": {"score": -1, "box": None},
        "full_body":  {"score": -1, "box": None}
    }
    
    for r in results:
        for box in r.boxes:
            cls_id = int(box.cls[0].item())
            conf = float(box.conf[0].item())
            coords = list(map(int, box.xyxy[0].tolist())) # [x1, y1, x2, y2]
            
            # Check thuộc nhóm nào
            label = None
            if cls_id in YOLO_CLASS_GROUPS["upper_body"]:
                label = "upper_body"
            elif cls_id in YOLO_CLASS_GROUPS["lower_body"]:
                label = "lower_body"
            elif cls_id in YOLO_CLASS_GROUPS["full_body"]:
                label = "full_body"
            
            # Cập nhật nếu tìm thấy box tốt hơn trong nhóm
            if label and conf > best_matches[label]["score"]:
                best_matches[label]["score"] = conf
                best_matches[label]["box"] = coords

    # Đưa các box detected vào list kết quả
    for label, data in best_matches.items():
        if data["box"]:
            candidates.append({
                "label": label,
                "box": data["box"],
                "type": "detected"
            })

    # --- Logic Merge: Nếu có Upper + Lower nhưng thiếu Full -> Merge lại ---
    has_upper = best_matches["upper_body"]["box"]
    has_lower = best_matches["lower_body"]["box"]
    has_full = best_matches["full_body"]["box"]

    # Chỉ merge nếu chưa tìm thấy full body nào xịn từ YOLO mà lại có đủ upper và lower
    if not has_full and has_upper and has_lower:
        # Tạo box bao trùm cả 2
        merged_box = [
            min(has_upper[0], has_lower[0]), # min x1
            min(has_upper[1], has_lower[1]), # min y1
            max(has_upper[2], has_lower[2]), # max x2
            max(has_upper[3], has_lower[3])  # max y2
        ]
        
        candidates.append({
            "label": "full_body",
            "box": merged_box,
            "type": "merged" # Đánh dấu là box do thuật toán ghép
        })
        
    return candidates


# def _crop_by_box(img, box):
#     """Hàm phụ trợ cắt ảnh theo box YOLO"""
#     x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
#     h, w = img.shape[:2]
#     # Kẹp tọa độ trong khung hình
#     x1, y1 = max(0, x1), max(0, y1)
#     x2, y2 = min(w, x2), min(h, y2)
#     return img[y1:y2, x1:x2]

# def detect_candidates_for_buyer(yolo_model, img_np):
#     """
#     Logic cho Client chọn vùng tìm kiếm:
#     1. Detect tất cả box.
#     2. Lọc: Mỗi nhóm (Upper, Lower, Full) chỉ giữ lại 1 box có CONFIDENCE CAO NHẤT.
#     3. Logic Merge: Nếu có Upper + Lower (đã lọc) nhưng thiếu Full -> Tạo thêm box FullBody ảo.
    
#     Trả về: List các box candidates để Frontend vẽ.
#     """
#     results = yolo_model(img_np, conf=0.25, verbose=False)
    
#     # 1. Dictionary lưu box tốt nhất cho mỗi nhóm
#     best_matches = {
#         "upper_body": {"score": -1, "box": None},
#         "lower_body": {"score": -1, "box": None},
#         "full_body":  {"score": -1, "box": None}
#     }

#     # 2. Duyệt qua tất cả các box để tìm Best Match cho từng nhóm
#     for r in results:
#         for box in r.boxes:
#             cls_id = int(box.cls[0].item())
#             conf = float(box.conf[0].item())
#             coords = list(map(int, box.xyxy[0].tolist())) # [x1, y1, x2, y2]
            
#             # Xác định nhóm
#             label = None
#             if cls_id in YOLO_CLASS_GROUPS["upper_body"]:
#                 label = "upper_body"
#             elif cls_id in YOLO_CLASS_GROUPS["lower_body"]:
#                 label = "lower_body"
#             elif cls_id in YOLO_CLASS_GROUPS["full_body"]:
#                 label = "full_body"
            
#             # Nếu thuộc nhóm quan tâm -> So sánh Score
#             if label:
#                 if conf > best_matches[label]["score"]:
#                     best_matches[label]["score"] = conf
#                     best_matches[label]["box"] = coords

#     # 3. Đưa các box tốt nhất vào danh sách candidates & chuẩn bị cho Merge logic
#     candidates = []
    
#     # Biến cờ để hỗ trợ logic Merge bên dưới
#     has_upper = best_matches["upper_body"]["box"]
#     has_lower = best_matches["lower_body"]["box"]
#     has_full  = best_matches["full_body"]["box"]

#     # Add vào candidates
#     for label, data in best_matches.items():
#         if data["box"]:
#             candidates.append({
#                 "label": label,
#                 "box": data["box"],
#                 "type": "detected"
#             })

#     # --- Logic Merge: Nếu có Upper + Lower nhưng thiếu Full -> Merge lại ---
#     # Lúc này has_upper và has_lower chính là box xịn nhất đã lọc ở trên
#     if not has_full and has_upper and has_lower:
#         u_box = has_upper
#         l_box = has_lower
        
#         # Tạo box bao trùm cả 2
#         merged_box = [
#             min(u_box[0], l_box[0]), # min x1
#             min(u_box[1], l_box[1]), # min y1
#             max(u_box[2], l_box[2]), # max x2
#             max(u_box[3], l_box[3])  # max y2
#         ]
        
#         candidates.append({
#             "label": "full_body",
#             "box": merged_box,
#             "type": "merged"
#         })
        
#     return candidates
