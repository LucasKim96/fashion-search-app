# /model_api/app/services/yolo_service.py

from ultralytics import YOLO
# Giả sử bạn đã định nghĩa đường dẫn này trong file config
from app.config import YOLO_WEIGHT_PATH
from app.utils.logger import logger
from app.utils.timer import Timer

class YoloService:
    """
    Một Service Singleton chuyên để load và giữ model YOLO.
    Mục đích: Đảm bảo model YOLO chỉ được load vào RAM một lần duy nhất.
    """
    def __init__(self):
        self.model = None
        self.load_model()

    def load_model(self):
        with Timer("Load YOLO Model"):
            try:
                logger.info(f"--- LOADING YOLO MODEL from {YOLO_WEIGHT_PATH} ---")
                # Khởi tạo model YOLO từ file trọng số
                self.model = YOLO(YOLO_WEIGHT_PATH)
                logger.info("✅ YOLO model loaded successfully and is ready to use.")
            except Exception as e:
                logger.error(f"❌ FATAL: Failed to load YOLO model: {e}", exc_info=True)
                # Nếu YOLO không load được, ứng dụng không thể hoạt động đúng
                raise RuntimeError("YOLO model load failed")

# --- ĐIỀU QUAN TRỌNG NHẤT ---
# Tạo một instance duy nhất (singleton) ngay khi ứng dụng khởi chạy.
# Tất cả các service khác sẽ `import` và sử dụng chính `yolo_service` này.
try:
    yolo_service = YoloService()
except Exception as e:
    yolo_service = None # Xử lý lỗi nếu không khởi tạo được