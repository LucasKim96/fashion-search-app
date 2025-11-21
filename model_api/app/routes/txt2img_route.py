from fastapi import APIRouter
from app.dependencies import txt2img_service, txt2img_index
from app.services.preprocess import preprocess_text
from app.schemas.txt2img_request import Txt2ImgRequest

router = APIRouter(prefix="/txt2img", tags=["txt2img"])

@router.post("/search")
async def search_txt2img(request: Txt2ImgRequest):
    text_tensor = preprocess_text(request.text)
    text_emb = txt2img_service.encode_text(text_tensor)
    results = txt2img_index.search(text_emb)
    return {"results": results}
