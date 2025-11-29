import os
from pathlib import Path
import torch

PORT = int(os.getenv("PORT", 8000))
HOST = os.getenv("HOST", "0.0.0.0")

# --- PATHS ---
BASE_DIR = Path(__file__).resolve().parent.parent
UPLOAD_ROOT_DIR = BASE_DIR.parent / "server" 

# Model Paths
YOLO_WEIGHT_PATH = os.getenv("YOLO_WEIGHT_PATH", str(BASE_DIR / "weights/best.pt"))
ARCFACE_WEIGHT_PATH = os.getenv("ARCFACE_WEIGHT_PATH", str(BASE_DIR / "weights/checkpoint_epoch_200.pth"))

# Index Paths
IMG2IMG_INDEX_PATH = os.getenv("IMG2IMG_INDEX_PATH", str(BASE_DIR / "index/img2img_fashion.faiss"))
IMG2IMG_MAP_PATH = os.getenv("IMG2IMG_MAP_PATH", str(BASE_DIR / "index/img2img_fashion_paths.json"))

# Text-to-Image Model Configurations
TEXT2IMG_MODEL_PATH = os.getenv("TEXT2IMG_MODEL_PATH", str(BASE_DIR / "models/phoclip_deploy.pt"))
TEXT2IMG_BASE_ARCH = "vinai/phobert-base"
TEXT2IMG_INDEX_PATH = os.getenv("TEXT2IMG_INDEX_PATH", str(BASE_DIR / "index/txt2img_index.faiss"))
TEXT2IMG_EMBEDDING_DIM  = 256

# Device
DEVICE = os.getenv("DEVICE", "cuda" if torch.cuda.is_available() else "cpu")

# --- PREPROCESSING CONFIG ---
INPUT_SIZE = [224, 224]
RGB_MEAN = [0.5, 0.5, 0.5]
RGB_STD = [0.5, 0.5, 0.5]
EMBEDDING_SIZE = 512
YOLO_CONF_THRESHOLD = 0.5

YOLO_CLASS_NAMES = [
    "shirt, blouse", "top, t-shirt, sweatshirt", "sweater", "cardigan",
    "jacket", "vest", "pants", "shorts", "skirt", "coat", "dress",
    "jumpsuit", "cape", "glasses", "hat", "headband", "tie", "glove",
    "watch", "belt", "leg warmer", "tights, stockings", "sock", "shoe",
    "bag, wallet", "scarf", "umbrella"
]

YOLO_CLASS_GROUPS = {
    "upper_body": [
        YOLO_CLASS_NAMES.index(cls) for cls in
        ["shirt, blouse", "top, t-shirt, sweatshirt", "sweater", "cardigan", "jacket", "vest", "coat"]
    ],
    "lower_body": [
        YOLO_CLASS_NAMES.index(cls) for cls in
        ["pants", "shorts", "skirt"]
    ],
    "full_body": [
        YOLO_CLASS_NAMES.index(cls) for cls in
        ["dress", "jumpsuit"]
    ]
}