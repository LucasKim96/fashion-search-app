from pydantic import BaseModel
from typing import List, Optional

# 1. Cấu trúc của MỘT kết quả tìm kiếm
class SearchResultItem(BaseModel):
    id: str          # ID sản phẩm (MongoDB ID)
    score: float     # Độ giống (VD: 0.85). Càng cao càng giống.
    image: str       # Đường dẫn bức ảnh khớp nhất của sản phẩm đó

# 2. Cấu trúc phản hồi cho API Search
class TextSearchResponse(BaseModel):
    success: bool
    message: Optional[str] = None
    total_found: int             # Số lượng kết quả tìm thấy
    data: List[SearchResultItem] # Danh sách đã sort theo score giảm dần

# 3. Cấu trúc phản hồi chung (cho Index/Delete)
class BaseResponse(BaseModel):
    success: bool
    message: str