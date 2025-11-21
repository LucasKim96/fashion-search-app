from fastapi import APIRouter, UploadFile, File
from app.dependencies import img2img_service, img2img_index
from app.services.preprocess import preprocess_image

router = APIRouter(prefix="/img2img", tags=["img2img"])

@router.post("/search")
async def search_img2img(image: UploadFile = File(...)):
    image_tensor = preprocess_image(await image.read())
    img_emb = img2img_service.encode_image(image_tensor)
    results = img2img_index.search(img_emb)
    return {"results": results}
