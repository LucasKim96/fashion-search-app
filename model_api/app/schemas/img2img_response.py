# img2img_response.py
from pydantic import BaseModel
from typing import List, Dict

class Img2ImgResponse(BaseModel):
    results: List[Dict]
