from pydantic import BaseModel
from typing import List

class TextSearchRequest(BaseModel):
    query: str
    limit: int = 20

class TextIndexRequest(BaseModel):
    product_id: str  # ID từ MongoDB (String)
    image_path: str  # Đường dẫn ảnh trên ổ cứng server

class TextDeleteRequest(BaseModel):
    product_id: str

class TextBatchDeleteRequest(BaseModel):
    product_id: str
    image_paths: List[str]