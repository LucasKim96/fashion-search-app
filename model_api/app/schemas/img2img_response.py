from pydantic import BaseModel
from typing import List, Optional, Any

class SearchResultItem(BaseModel):
    rank: int
    product_id: str
    image_id: str
    similarity: float
    image_url: Optional[str] = None

class SearchResponse(BaseModel):
    status: str
    total_results: int
    results: List[SearchResultItem]
    message: Optional[str] = None

# Schema cho API Detect
class DetectResponse(BaseModel):
    status: str
    candidates: List[Any] # List các box upper/lower/full