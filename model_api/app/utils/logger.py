import logging
import sys

def setup_logger(name: str = "model_api", level: int = logging.INFO) -> logging.Logger:
    """
    Tạo logger chuẩn cho project
    """
    logger = logging.getLogger(name)
    logger.setLevel(level)

    # Nếu logger đã có handler rồi thì không thêm nữa
    if not logger.handlers:
        # console handler
        ch = logging.StreamHandler(sys.stdout)
        ch.setLevel(level)

        # formatter
        formatter = logging.Formatter(
            "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
        )
        ch.setFormatter(formatter)

        logger.addHandler(ch)
        logger.propagate = False

    return logger

# tạo logger mặc định
logger = setup_logger()
