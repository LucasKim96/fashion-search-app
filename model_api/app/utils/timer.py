# import time
# from functools import wraps
# from app.utils.logger import logger 
# class Timer:
#     """
#     Class để đo thời gian chạy một đoạn code
#     """

#     def __init__(self, name="Timer"):
#         self.name = name
#         self.start_time = None

#     def __enter__(self):
#         self.start_time = time.time()
#         return self

#     def __exit__(self, exc_type, exc_val, exc_tb):
#         elapsed = time.time() - self.start_time
#         logger.info(f"[{self.name}] took: {elapsed:.4f}s")
#         print(f"[{self.name}] Elapsed time: {elapsed:.4f} seconds")


# def timing(func):
#     """
#     Decorator đo thời gian chạy function
#     """
#     @wraps(func)
#     def wrapper(*args, **kwargs):
#         start = time.time()
#         result = func(*args, **kwargs)
#         elapsed = time.time() - start
#         logger.info(f"[Function: {func.__name__}] took: {elapsed:.4f}s")
#         print(f"[Timing] Function '{func.__name__}' took {elapsed:.4f} seconds")
#         return result
#     return wrapper

import time
from functools import wraps
from app.utils.logger import logger
# === IMPORT MỚI ===
from app.utils.performance_logger import performance_logger

class Timer:
    """
    Class để đo thời gian chạy một đoạn code.
    - Ghi log ra console.
    - Ghi log có cấu trúc ra performance log file.
    """
    def __init__(self, task_name="Task", metadata: dict = None):
        self.task_name = task_name
        self.metadata = metadata if metadata is not None else {}
        self.start_time = None

    def __enter__(self):
        self.start_time = time.time()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        elapsed = time.time() - self.start_time
        
        # 1. Ghi log ra console qua logger chính
        logger.info(f"[{self.task_name}] took: {elapsed:.4f}s")
        
        # 2. XÓA HOẶC SỬA LẠI DÒNG PRINT GÂY LỖI
        # Vì logger đã in ra console, dòng print này là thừa. Tốt nhất là xóa nó đi.
        # Hoặc nếu muốn giữ, hãy sửa lại thành:
        # print(f"[{self.task_name}] Elapsed time: {elapsed:.4f} seconds")

        # 3. Ghi ra performance log file
        performance_logger.log(
            task_name=self.task_name,
            duration_s=elapsed,
            metadata=self.metadata
        )



def timing(metadata: dict = None):
    """
    Decorator đo thời gian chạy function.
    Có thể nhận metadata để ghi log chi tiết.
    Cách dùng:
    @timing(metadata={"service": "my_service"})
    def my_function():
        ...
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            start = time.time()
            result = func(*args, **kwargs)
            elapsed = time.time() - start
            
            task_name = f"Function: {func.__name__}"
            
            # 1. Log ra console (như cũ)
            logger.info(f"[{task_name}] took: {elapsed:.4f}s")
            # print(f"[Timing] Function '{func.__name__}' took {elapsed:.4f} seconds")

            # 2. Ghi ra performance log file
            performance_logger.log(
                task_name=task_name,
                duration_s=elapsed,
                metadata=metadata
            )
            
            return result
        return wrapper
    return decorator