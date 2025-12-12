from .index_service import IndexService
from app.config import (
    IMG2IMG_BACKBONE, EMBEDDING_SIZE,
    RESNET50_INDEX_PATH, RESNET50_MAP_PATH,
    RESNET101_INDEX_PATH, RESNET101_MAP_PATH,
    VIT_INDEX_PATH, VIT_MAP_PATH
)
from app.utils.logger import logger

def get_index_service_instance() -> IndexService:
    """
    Hàm Factory: Đọc config và trả về một instance của IndexService
    đã được cấu hình đúng với backbone đang hoạt động.
    """
    logger.info(f"Initializing IndexService for backbone: {IMG2IMG_BACKBONE}")
    
    if IMG2IMG_BACKBONE == 'ResNet_50':
        index_path = RESNET50_INDEX_PATH
        map_path = RESNET50_MAP_PATH
    elif IMG2IMG_BACKBONE == 'ViT':
        index_path = VIT_INDEX_PATH
        map_path = VIT_MAP_PATH
    elif IMG2IMG_BACKBONE == 'ResNet_101':
        index_path = RESNET101_INDEX_PATH
        map_path = RESNET101_MAP_PATH
    else:
        raise ValueError(f"Không có cấu hình index cho backbone: {IMG2IMG_BACKBONE}")
        
    return IndexService(
        index_path=index_path,
        mapping_path=map_path,
        dim=EMBEDDING_SIZE
    )