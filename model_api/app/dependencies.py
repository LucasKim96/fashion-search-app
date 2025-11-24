from app.config import *
# from app.services.txt2img_service import Txt2ImgService
from app.services.img2img_service import Img2ImgService
from app.services.index_service import IndexService


# services
# txt2img_service = Txt2ImgService(TEXT2IMG_MODEL_PATH, DEVICE)
img2img_service = Img2ImgService(device=DEVICE)

# indices
# txt2img_index = IndexService(TEXT2IMG_INDEX_PATH)
img2img_index = IndexService(
    index_path=IMG2IMG_INDEX_PATH, 
    mapping_path=IMG2IMG_MAP_PATH,
    dim=EMBEDDING_SIZE
)
