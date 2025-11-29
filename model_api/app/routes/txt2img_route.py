# model_api/app/routes/txt2img_route.py
from fastapi import APIRouter, HTTPException, Form, File, UploadFile
from app.schemas.txt2img_request import (
    TextSearchRequest, 
    # TextIndexRequest, 
    TextDeleteRequest, 
    TextBatchDeleteRequest
)
from app.schemas.txt2img_response import TextSearchResponse, BaseResponse

# Import 2 Service
from app.services.txt2img_service import txt2img_service
from app.services.txt_index_service import text_index_service

from app.utils.logger import logger

router = APIRouter()

# 1. API SEARCH
@router.post("/search", response_model=TextSearchResponse)
async def search_by_text(payload: TextSearchRequest):
    try:
        # B1: Service Model -> Chuyển text thành vector
        vector = txt2img_service.embed_text(payload.query)
        
        # B2: Service Index -> Tìm kiếm trong DB
        results = text_index_service.search(vector, k=payload.limit)
        
        return {
            "success": True, 
            "data": results, 
            "total_found": len(results),
            "message": "Search completed"
        }
    except Exception as e:
        logger.error(f"[TextSearch] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# 2. API INDEX (ADD/UPDATE)
@router.post("/index", response_model=BaseResponse)
async def index_product(
    product_id: str = Form(...),
    image_path: str = Form(...),
    image: UploadFile = File(...) # Đây là cách FastAPI nhận file
):
    try:
        # B1: Service Model -> Đọc nội dung file ảnh VÀ chuyển thành vector
        #     Chúng ta sẽ truyền trực tiếp nội dung file, không phải đường dẫn
        vector = txt2img_service.embed_image(image.file) # Truyền image.file (một file-like object)
        
        if vector is None:
            # Thông báo lỗi rõ hơn
            raise HTTPException(status_code=400, detail=f"Could not process the uploaded image for {image_path}")

        # B2: Service Index -> Lưu Vector + ID + Path vào FAISS & Map
        #     Hàm này vẫn nhận 3 tham số như cũ
        text_index_service.add_product(vector, product_id, image_path)
        
        return {
            "success": True, 
            "message": f"Product {product_id} with image {image_path} indexed successfully"
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"[TextIndex] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
# 3. API BATCH DELETE (Xóa nhiều ảnh cụ thể)
@router.post("/delete-batch", response_model=BaseResponse)
async def delete_batch(payload: TextBatchDeleteRequest):
    try:
        count = text_index_service.remove_list_images(payload.product_id, payload.image_paths)
        return {"success": True, "message": f"Deleted {count} images"}
    except Exception as e:
        logger.error(f"[TextBatchDelete] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# 4. API DELETE PRODUCT (Xóa toàn bộ SP)
@router.post("/delete", response_model=BaseResponse)
async def delete_product(payload: TextDeleteRequest):
    try:
        count = text_index_service.remove_product(payload.product_id)
        return {"success": True, "message": f"Deleted {count} vectors"}
    except Exception as e:
        logger.error(f"[TextDelete] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
@router.post("/clear", response_model=BaseResponse)
async def clear_index():
    """Xóa toàn bộ Index để chạy lại từ đầu"""
    try:
        success = text_index_service.reset_index()
        if success:
            return {"success": True, "message": "Index cleared successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to clear index")
    except Exception as e:
        logger.error(f"[TextClear] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))