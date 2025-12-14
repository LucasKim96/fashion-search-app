from fastapi import HTTPException
from functools import wraps

# Import các service singleton của bạn
from app.services.txt2img_service import txt2img_service
from app.services.txt_index_service import text_index_service
from app.utils.logger import logger

def ensure_services_are_ready(check_model=True, check_index=True):
    """
    Một decorator để kiểm tra các service AI đã sẵn sàng trước khi chạy endpoint.
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Kiểm tra Text2Img Service (Model)
            if check_model and (not txt2img_service or not txt2img_service.model):
                logger.error("Attempted to use Text2Img service, but it is not available.")
                raise HTTPException(
                    status_code=503, # 503 Service Unavailable
                    detail="Text-to-Image AI service is currently unavailable or failed to load."
                )
            
            # Kiểm tra TextIndex Service (FAISS Index)
            if check_index and (not text_index_service or not text_index_service.index):
                logger.error("Attempted to use TextIndex service, but it is not available.")
                raise HTTPException(
                    status_code=503,
                    detail="Text Indexing service is currently unavailable or failed to load."
                )

            # Nếu tất cả đều ổn, chạy hàm endpoint gốc
            return await func(*args, **kwargs)
        return wrapper
    return decorator