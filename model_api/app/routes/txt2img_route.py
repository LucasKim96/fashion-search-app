# model_api/app/routes/txt2img_route.py

from fastapi import APIRouter, HTTPException, Form, File, UploadFile
from app.schemas.txt2img_request import (
    TextSearchRequest,
    TextDeleteRequest, 
    TextBatchDeleteRequest
)
from app.schemas.txt2img_response import TextSearchResponse, BaseResponse

# Import các service
from app.services.txt2img_service import txt2img_service
from app.services.txt_index_service import text_index_service

# Import decorator mới của chúng ta
from app.utils.dependencies import ensure_services_are_ready 
from app.utils.logger import logger

router = APIRouter()

# 1. API SEARCH
# Áp dụng decorator: Endpoint này cần cả model và index
@router.post("/search", response_model=TextSearchResponse)
@ensure_services_are_ready(check_model=True, check_index=True)
async def search_by_text(payload: TextSearchRequest):
    try:
        vector = txt2img_service.embed_text(payload.query)
        if vector is None:
            raise HTTPException(status_code=500, detail="Failed to create text embedding.")
            
        results = text_index_service.search(vector, k=payload.limit)
        
        return {
            "success": True, 
            "data": results, 
            "total_found": len(results),
            "message": "Search completed"
        }
    except Exception as e:
        logger.error(f"[TextSearch] Unhandled error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An internal server error occurred during search.")

# 2. API INDEX (ADD/UPDATE)
# Áp dụng decorator: Endpoint này cần cả model và index
@router.post("/index", response_model=BaseResponse)
@ensure_services_are_ready(check_model=True, check_index=True)
async def index_product(
    product_id: str = Form(...),
    image_path: str = Form(...),
    image: UploadFile = File(...)
):
    try:
        vector = txt2img_service.embed_image(image.file)
        if vector is None:
            raise HTTPException(status_code=400, detail=f"Could not process image '{image.filename}'.")

        success = text_index_service.add_product(vector, product_id, image_path)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to add vector to index.")
        
        return {
            "success": True, 
            "message": f"Image '{image_path}' for product '{product_id}' indexed successfully."
        }
    except HTTPException as he:
        # Ghi log và re-throw lỗi HTTP đã biết
        logger.warning(f"[TextIndex] Client error for image '{image.filename}': {he.detail}")
        raise he
    except Exception as e:
        logger.error(f"[TextIndex] Unhandled error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An internal server error occurred during indexing.")
    
# # 3. API BATCH DELETE
# # Áp dụng decorator: Endpoint này chỉ cần index
# @router.post("/delete-batch", response_model=BaseResponse)
# @ensure_services_are_ready(check_model=False, check_index=True)
# async def delete_batch(payload: TextBatchDeleteRequest):
#     try:
#         count = text_index_service.remove_list_images(payload.product_id, payload.image_paths)
#         return {"success": True, "message": f"Processed request. Deleted {count} image entries."}
#     except Exception as e:
#         logger.error(f"[TextBatchDelete] Unhandled error: {e}", exc_info=True)
#         raise HTTPException(status_code=500, detail="An internal server error occurred.")

# # 4. API DELETE PRODUCT
# # Áp dụng decorator: Endpoint này chỉ cần index
# @router.post("/delete", response_model=BaseResponse)
# @ensure_services_are_ready(check_model=False, check_index=True)
# async def delete_product(payload: TextDeleteRequest):
#     try:
#         # Giả sử bạn có hàm remove_product trong service
#         count = text_index_service.remove_product(payload.product_id)
#         return {"success": True, "message": f"Processed request. Deleted {count} entries for product."}
#     except Exception as e:
#         logger.error(f"[TextDelete] Unhandled error: {e}", exc_info=True)
#         raise HTTPException(status_code=500, detail="An internal server error occurred.")
    
@router.post("/delete", response_model=BaseResponse)
async def delete_entries(payload: TextBatchDeleteRequest): # Dùng lại schema của batch delete
    """
    Xóa các entry khỏi index.
    - Nếu `image_paths` được cung cấp và không rỗng: chỉ xóa các ảnh đó.
    - Nếu `image_paths` không được cung cấp hoặc là mảng rỗng: xóa TOÀN BỘ sản phẩm.
    """
    try:
        count = 0
        if payload.image_paths and len(payload.image_paths) > 0:
            # Kịch bản 1: Xóa các ảnh cụ thể
            count = text_index_service.remove_list_images(payload.product_id, payload.image_paths)
            message = f"Removed {count} specific image entries for product '{payload.product_id}'."
        else:
            # Kịch bản 2: Xóa toàn bộ sản phẩm
            count = text_index_service.remove_product(payload.product_id)
            message = f"Removed all {count} entries for product '{payload.product_id}'."
            
        return {"success": True, "message": message}
    except Exception as e:
        logger.error(f"[TextDelete] Error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An internal error occurred during deletion.")
    
# 5. API CLEAR INDEX
# Áp dụng decorator: Endpoint này chỉ cần index
@router.post("/clear", response_model=BaseResponse)
@ensure_services_are_ready(check_model=False, check_index=True)
async def clear_index():
    try:
        success = text_index_service.reset_index()
        if not success:
            raise HTTPException(status_code=500, detail="Failed to clear index.")
        return {"success": True, "message": "Index cleared successfully."}
    except Exception as e:
        logger.error(f"[TextClear] Unhandled error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An internal server error occurred.")