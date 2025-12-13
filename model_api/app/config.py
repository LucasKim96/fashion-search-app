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
# ARCFACE_WEIGHT_PATH = os.getenv("ARCFACE_WEIGHT_PATH", str(BASE_DIR / "weights/checkpoint_epoch_200.pth"))
RESNET_WEIGHT_PATH = os.getenv("RESNET_WEIGHT_PATH", str(BASE_DIR / "weights/resnet50_checkpoint_epoch_200.pth"))
RESNET101_WEIGHT_PATH = os.getenv("RESNET101_WEIGHT_PATH", str(BASE_DIR / "weights/resnet101_checkpoint_epoch_200.pth"))
VIT_WEIGHT_PATH = os.getenv("VIT_WEIGHT_PATH", str(BASE_DIR / "weights/vit_arcface_checkpoint_epoch_200.pth"))

# Index Paths
TEXT2IMG_INDEX_PATH = os.getenv("TEXT2IMG_INDEX_PATH", str(BASE_DIR / "index/txt2img_index.faiss"))
# IMG2IMG_INDEX_PATH = os.getenv("IMG2IMG_INDEX_PATH", str(BASE_DIR / "index/img2img_fashion.faiss"))
# IMG2IMG_MAP_PATH = os.getenv("IMG2IMG_MAP_PATH", str(BASE_DIR / "index/img2img_fashion_paths.json"))

# Đường dẫn cho ResNet_50
RESNET50_INDEX_PATH = os.getenv("RESNET50_INDEX_PATH", str(BASE_DIR / "index/img2img_fashion.faiss"))
RESNET50_MAP_PATH = os.getenv("RESNET50_MAP_PATH", str(BASE_DIR / "index/img2img_fashion_paths.json"))

# Đường dẫn cho ViT
VIT_INDEX_PATH = os.getenv("VIT_INDEX_PATH", str(BASE_DIR / "index/vit_fashion.faiss"))
VIT_MAP_PATH = os.getenv("VIT_MAP_PATH", str(BASE_DIR / "index/vit_fashion_paths.json"))

# (Tùy chọn) Đường dẫn cho ResNet_101
RESNET101_INDEX_PATH = os.getenv("RESNET101_INDEX_PATH", str(BASE_DIR / "index/resnet101_fashion.faiss"))
RESNET101_MAP_PATH = os.getenv("RESNET101_MAP_PATH", str(BASE_DIR / "index/resnet101_fashion_paths.json"))

# ----------------------------------------------------------------
# Đặt biến môi trường USE_ALTERNATIVE_PHOCLIP=True (hoặc 1) để bật model thay thế
USE_ALTERNATIVE_PHOCLIP = os.getenv("USE_ALTERNATIVE_PHOCLIP", "False").lower() in ('true', '1')

# 1. Định nghĩa hai đường dẫn model có thể có
TEXT2IMG_DEFAULT_MODEL_PATH = os.getenv("TEXT2IMG_DEFAULT_MODEL_PATH", str(BASE_DIR / "models/phoclip_deploy.pt"))
TEXT2IMG_ALT_MODEL_PATH = os.getenv("TEXT2IMG_ALT_MODEL_PATH", str(BASE_DIR / "models/_phoclip.pt")) # Đặt tên model thay thế ở đây

# 2. Dùng flag để chọn đường dẫn cuối cùng sẽ được sử dụng trong toàn bộ ứng dụng
if USE_ALTERNATIVE_PHOCLIP:
    TEXT2IMG_MODEL_PATH = TEXT2IMG_ALT_MODEL_PATH
    print("🚀 [CONFIG] Flag 'USE_ALTERNATIVE_PHOCLIP' is ON. Using ALTERNATIVE PhoCLIP model.")
else:
    TEXT2IMG_MODEL_PATH = TEXT2IMG_DEFAULT_MODEL_PATH
    print("🚀 [CONFIG] Flag 'USE_ALTERNATIVE_PHOCLIP' is OFF. Using DEFAULT PhoCLIP model.")

print(f"   -> Model Path: {TEXT2IMG_MODEL_PATH}")
# ----------------------------------------------------------------

# Text-to-Image Model Configurations (Giữ nguyên các config còn lại)
TEXT2IMG_BASE_ARCH = "vinai/phobert-base"
TEXT2IMG_INDEX_PATH = os.getenv("TEXT2IMG_INDEX_PATH", str(BASE_DIR / "index/txt2img_index.faiss"))
TEXT2IMG_EMBEDDING_DIM  = 256


# Device
DEVICE = os.getenv("DEVICE", "cuda" if torch.cuda.is_available() else "cpu")

# --- PREPROCESSING CONFIG ---
# --- ADDED: Lựa chọn backbone cho Image-to-Image Search ---
# Hỗ trợ: 'ResNet_50', 'ResNet_101', 'ViT'
IMG2IMG_BACKBONE = os.getenv("IMG2IMG_BACKBONE", "ResNet_50")
INPUT_SIZE = [224, 224]
RGB_MEAN = [0.5, 0.5, 0.5]
RGB_STD = [0.5, 0.5, 0.5]
EMBEDDING_SIZE = 512
YOLO_CONF_THRESHOLD = 0.5

YOLO_CLASS_NAMES = [
    "shirt, blouse", "top, t-shirt, sweatshirt", "sweater", "cardigan",
    "jacket", "vest", "pants", "shorts", "skirt", "coat", "dress", "jumpsuit"
]

YOLO_CLASS_GROUPS = {
    "upper_body": [
        YOLO_CLASS_NAMES.index(cls) for cls in
        ["shirt, blouse", "top, t-shirt, sweatshirt", "sweater", "cardigan", "jacket", "vest", "coat", "dress"]
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

ENABLE_PERFORMANCE_LOGGING = True
# --- CONFIG CHO DEBUGGING ---
SAVE_CROPPED_IMAGES = True 
CROPPED_IMAGE_SAVE_PATH = "image_crop_product"
