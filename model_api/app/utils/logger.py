# /model_api/app/utils/logger.py

import logging
import sys
import os
from logging.handlers import RotatingFileHandler

def setup_logger(
    name: str = "model_api", 
    level: int = logging.INFO, 
    log_to_file: bool = True
) -> logging.Logger:
    """
    Tạo logger chuẩn cho project.
    - Log ra console.
    - (Tùy chọn) Log ra file với tính năng xoay vòng.
    """
    logger = logging.getLogger(name)
    logger.setLevel(level)
    logger.propagate = False

    # Chỉ thêm handler nếu logger chưa có, để tránh lặp lại khi reload
    if not logger.handlers:
        # --- HANDLER 1: Console Handler (Giữ nguyên) ---
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(level)

        formatter = logging.Formatter(
            "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
        )
        console_handler.setFormatter(formatter)
        logger.addHandler(console_handler)

        # --- HANDLER 2: File Handler (Bổ sung) ---
        if log_to_file:
            try:
                # Cấu hình đường dẫn file log
                log_dir = "logs"
                log_filename = "model_api.log"
                if not os.path.exists(log_dir):
                    os.makedirs(log_dir)
                log_filepath = os.path.join(log_dir, log_filename)
                
                # Tạo file handler với xoay vòng
                file_handler = RotatingFileHandler(
                    log_filepath, 
                    maxBytes=10 * 1024 * 1024, # 10MB
                    backupCount=5,
                    encoding='utf-8'
                )
                file_handler.setLevel(level)
                file_handler.setFormatter(formatter)
                
                # Thêm file handler vào logger
                logger.addHandler(file_handler)

                logger.info("Logger initialized. Logging to console and file.")
            
            except Exception as e:
                logger.error(f"Failed to set up file logging: {e}", exc_info=True)

    return logger

# Tạo logger mặc định
# Bây giờ, nó sẽ tự động cấu hình cả console và file log.
logger = setup_logger()