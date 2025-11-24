from enum import Enum
from pydantic import BaseModel

# Enum để ép người dùng chỉ chọn 1 trong 3 nhóm này
class TargetGroupEnum(str, Enum):
    upper = "upper_body"
    lower = "lower_body"
    full = "full_body"
    none = "none" # Trường hợp không muốn dùng YOLO (tìm ảnh gốc)