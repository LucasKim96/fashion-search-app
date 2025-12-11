# E:\LuanVanTotghiep\fashion-search-app\model_api\app\routes\health.py

from fastapi import APIRouter, Request, HTTPException

# --- Đã xóa import từ app.dependencies, điều này đúng ---

router = APIRouter(prefix="/health", tags=["System Health"])

@router.get("/", summary="Kiểm tra trạng thái hệ thống")
def health_check(request: Request): # <-- Bước 1: Thêm 'request: Request' vào đây
    """
    Kiểm tra trạng thái của các model và service đã được load.
    Trả về status 'ok' nếu mọi thứ đã sẵn sàng.
    """
    try:
        # --- Bước 2: Lấy các service từ app.state ---
        img2img_service = request.app.state.img2img_service
        index_service = request.app.state.index_service
        
        # --- Bước 3: Thực hiện kiểm tra trên các service đã lấy được ---
        yolo_loaded = img2img_service.yolo_model is not None
        backbone_loaded = img2img_service.backbone is not None
        index_loaded = index_service.index is not None

        services_status = {
            "img2img_service": {
                "yolo_model": "loaded" if yolo_loaded else "NOT_LOADED",
                "backbone_model": "loaded" if backbone_loaded else "NOT_LOADED"
            },
            "index_service": {
                "faiss_index": "loaded" if index_loaded else "NOT_LOADED",
                "indexed_items": index_service.index.ntotal if index_loaded else 0
            }
        }

        # Kiểm tra tổng thể
        is_healthy = all([yolo_loaded, backbone_loaded, index_loaded])

        if is_healthy:
            return {
                "status": "ok",
                "services": services_status
            }
        else:
            # Nếu có dịch vụ nào đó chưa sẵn sàng, trả về lỗi 503 Service Unavailable
            raise HTTPException(
                status_code=503,
                detail={
                    "status": "unhealthy",
                    "services": services_status
                }
            )

    except AttributeError:
        # Bắt lỗi nếu app.state chưa được khởi tạo (ví dụ: lỗi xảy ra trong lifespan)
        raise HTTPException(
            status_code=503,
            detail="Services are not available. Initialization might have failed."
        )
    except Exception as e:
        # Bắt các lỗi không mong muốn khác
        raise HTTPException(
            status_code=500,
            detail=f"An unexpected error occurred during health check: {str(e)}"
        )


# from fastapi import APIRouter
# # from app.dependencies import img2img_service #, txt2img_service

# router = APIRouter(prefix="/health", tags=["System Health"])

# @router.get("/", summary="Kiểm tra trạng thái hệ thống")
# def health_check(request: Request):
#     # Kiểm tra xem model của bạn đã load chưa
#     yolo_status = "loaded" if img2img_service.yolo_model else "not_loaded"
#     backbone_status = "loaded" if img2img_service.backbone else "not_loaded"
    
#     return {
#         "status": "ok",
#         "services": {
#             "img2img": {
#                 "yolo": yolo_status,
#                 "arcface": backbone_status
#             },
#             # "txt2img": "active" 
#         }
#     }