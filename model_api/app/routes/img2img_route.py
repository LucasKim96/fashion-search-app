from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Request
from typing import List
import json

# Import Schemas
from app.schemas.img2img_request import TargetGroupEnum
from app.schemas.img2img_response import SearchResponse, SearchResultItem, DetectResponse

# Import Services & Utils
# from app.dependencies import img2img_service, img2img_index
from app.utils.logger import logger

router = APIRouter(prefix="/img2img", tags=["Image Search"])

# ==============================================================================
# 1. API CHO NGƯỜI BÁN (SHOP) - TẠO SẢN PHẨM & QUẢN LÝ
# ==============================================================================

@router.post("/index", summary="Thêm ảnh sản phẩm (Auto Crop & Index)")
async def index_product(
    request: Request,
    file: UploadFile = File(...),
    product_id: str = Form(..., description="ID sản phẩm (DB)"),
    image_id: str = Form(..., description="Tên file ảnh unique (VD: img_01.jpg)"),
    group: TargetGroupEnum = Form(..., description="Nhóm để crop (upper/lower/full)")
):
    """
    Dùng cho Shop: Tự động tìm đối tượng trong ảnh theo Group, Crop, Resize và Lưu Vector.
    """
    try:
        img2img_service = request.app.state.img2img_service
        img2img_index = request.app.state.index_service

        content = await file.read()
        
        # 1. Gọi Service xử lý (Auto Crop High->Low->Center)
        vector, method_used = img2img_service.process_image_for_indexing(content, group.value, product_id=product_id, image_id=image_id)
        
        # 2. Lưu vào Index
        img2img_index.add_item(vector, product_id, image_id) 
        img2img_index.save() # Lưu ngay để an toàn dữ liệu

        return {
            "status": "success", 
            "message": f"Added {image_id} for {product_id}",
            "crop_method": method_used
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Index error: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.post("/delete-batch", summary="Xóa nhiều ảnh cùng lúc")
async def delete_batch_images(
    request: Request, 
    product_id: str = Form(...),
    image_ids: str = Form(..., description="JSON string danh sách ID ảnh: ['img1.jpg', 'img2.jpg']")
):
    try:
        img2img_index = request.app.state.index_service

        ids_list = json.loads(image_ids)
        count = img2img_index.remove_list_images(product_id, ids_list)
        if count > 0:
            img2img_index.save()
        
        return {"status": "success", "message": f"Deleted {count} images"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/delete-product", summary="Xóa toàn bộ sản phẩm")
async def delete_product(request: Request,product_id: str = Form(...)):
    try:
        img2img_index = request.app.state.index_service

        count = img2img_index.remove_product(product_id)
        if count > 0:
            img2img_index.save()
            return {"status": "success", "message": f"Deleted {count} vectors for {product_id}"}
        else:

            return {"status": "success", "message": "Product not found or already deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==============================================================================
# 2. API CHO KHÁCH HÀNG (BUYER) - TÌM KIẾM
# ==============================================================================

@router.post("/detect", response_model=DetectResponse, summary="Bước 1: Detect các vùng tìm kiếm")
async def detect_objects(request: Request, file: UploadFile = File(...)):
    """
    Khách upload ảnh -> Trả về danh sách tọa độ các box (Upper, Lower, Full, Merged)
    để Frontend vẽ khung cho khách chọn.
    """
    try:
        img2img_service = request.app.state.img2img_service

        content = await file.read()
        candidates = img2img_service.detect_search_candidates(content)
        return DetectResponse(status="success", candidates=candidates)
    except Exception as e:
        logger.error(f"Detect error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/search", response_model=SearchResponse, summary="Bước 2: Tìm kiếm theo ảnh đã crop")
async def search_product(
    request: Request,
    file: UploadFile = File(..., description="Ảnh đã được FE crop theo box người dùng chọn"),
    k: int = Form(10)
):
    """
    Nhận ảnh đã crop -> Resize -> Embed -> Search FAISS (Cosine Similarity).
    """
    try:
        img2img_service = request.app.state.img2img_service
        img2img_index = request.app.state.index_service
        
        content = await file.read()
        
        # Trích xuất vector
        vector = img2img_service.process_image_for_search(content)
        
        # Tìm kiếm
        raw_results = img2img_index.search(vector, k=k)
        
        # Format kết quả & Lọc rác (Cosine Score)
        formatted_results = []
        for rank, item in enumerate(raw_results):
            score = float(item['score'])
            
            # Cosine Similarity (IndexFlatIP): Score càng cao càng tốt
            # Lọc bỏ các kết quả quá thấp (ví dụ < 0.5)
            if score < 0.2: 
                continue

            formatted_results.append(SearchResultItem(
                rank=item['rank'], # Rank đã tính trong index_service
                product_id=item['product_id'],
                image_id=item['image_id'], # Trả về ID ảnh đại diện
                similarity=score
            ))

        return SearchResponse(
            status="success",
            total_results=len(formatted_results),
            results=formatted_results,
            message="Tìm kiếm thành công"
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Search error: {e}")
        raise HTTPException(status_code=500, detail=str(e))