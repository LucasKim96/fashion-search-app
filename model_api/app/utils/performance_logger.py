import csv
import json
import os
from datetime import datetime
from threading import Lock

from app.config import ENABLE_PERFORMANCE_LOGGING

# --- CẤU HÌNH ---
LOG_DIR = "logs"
PERFORMANCE_LOG_FILENAME = "performance_log.csv"

if not os.path.exists(LOG_DIR):
    os.makedirs(LOG_DIR)

log_filepath = os.path.join(LOG_DIR, PERFORMANCE_LOG_FILENAME)

class PerformanceLogger:
    _instance = None
    _lock = Lock()

    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(PerformanceLogger, cls).__new__(cls)
                # Chỉ khởi tạo file nếu logging được bật
                if ENABLE_PERFORMANCE_LOGGING:
                    cls._instance._initialize()
        return cls._instance

    def _initialize(self):
        self.log_file_path = log_filepath
        self._write_header_if_needed()
        print("✅ Performance logging is ENABLED. Log file: logs/performance_log.csv")

    def _write_header_if_needed(self):
        try:
            file_exists = os.path.isfile(self.log_file_path) and os.path.getsize(self.log_file_path) > 0
            if not file_exists:
                with open(self.log_file_path, 'w', newline='', encoding='utf-8') as f:
                    writer = csv.writer(f)
                    writer.writerow(["timestamp", "task_name", "duration_ms", "metadata"])
        except IOError as e:
            print(f"Error initializing performance log file: {e}")

    def log(self, task_name: str, duration_s: float, metadata: dict = None):
        # === KIỂM TRA CỜ TRƯỚC KHI GHI LOG ===
        # Nếu cờ bị tắt, hàm sẽ không làm gì cả và thoát ngay lập tức.
        if not ENABLE_PERFORMANCE_LOGGING:
            return

        timestamp = datetime.now().isoformat()
        duration_ms = duration_s * 1000
        metadata_str = json.dumps(metadata) if metadata else ""

        with self._lock:
            try:
                with open(self.log_file_path, 'a', newline='', encoding='utf-8') as f:
                    writer = csv.writer(f)
                    writer.writerow([timestamp, task_name, f"{duration_ms:.2f}", metadata_str])
            except IOError as e:
                print(f"Error writing to performance log file: {e}")

# Tạo instance duy nhất
performance_logger = PerformanceLogger()

# In thông báo trạng thái khi ứng dụng khởi động (chỉ một lần)
if not ENABLE_PERFORMANCE_LOGGING:
    print("ℹ️ Performance logging is DISABLED.")