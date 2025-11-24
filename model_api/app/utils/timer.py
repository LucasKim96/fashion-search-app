import time
from functools import wraps
from app.utils.logger import logger 
class Timer:
    """
    Class để đo thời gian chạy một đoạn code
    """

    def __init__(self, name="Timer"):
        self.name = name
        self.start_time = None

    def __enter__(self):
        self.start_time = time.time()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        elapsed = time.time() - self.start_time
        logger.info(f"[{self.name}] took: {elapsed:.4f}s")
        print(f"[{self.name}] Elapsed time: {elapsed:.4f} seconds")


def timing(func):
    """
    Decorator đo thời gian chạy function
    """
    @wraps(func)
    def wrapper(*args, **kwargs):
        start = time.time()
        result = func(*args, **kwargs)
        elapsed = time.time() - start
        logger.info(f"[Function: {func.__name__}] took: {elapsed:.4f}s")
        print(f"[Timing] Function '{func.__name__}' took {elapsed:.4f} seconds")
        return result
    return wrapper
