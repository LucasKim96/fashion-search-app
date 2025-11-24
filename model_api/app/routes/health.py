from fastapi import APIRouter
from app.dependencies import img2img_service #, txt2img_service

router = APIRouter(prefix="/health", tags=["System Health"])

@router.get("/", summary="Kiểm tra trạng thái hệ thống")
def health_check():
    # Kiểm tra xem model của bạn đã load chưa
    yolo_status = "loaded" if img2img_service.yolo_model else "not_loaded"
    backbone_status = "loaded" if img2img_service.backbone else "not_loaded"
    
    return {
        "status": "ok",
        "services": {
            "img2img": {
                "yolo": yolo_status,
                "arcface": backbone_status
            },
            # "txt2img": "active" 
        }
    }