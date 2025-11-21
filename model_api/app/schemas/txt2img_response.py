# txt2img_response.py
from pydantic import BaseModel
from typing import List, Dict

class Txt2ImgResponse(BaseModel):
    results: List[Dict]
