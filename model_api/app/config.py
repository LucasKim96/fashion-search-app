import os

# model paths
TEXT2IMG_MODEL_PATH = os.getenv("TEXT2IMG_MODEL_PATH", "models/text2img_best_epoch100.pt")
IMG2IMG_MODEL_PATH = os.getenv("IMG2IMG_MODEL_PATH", "models/image2img_best_epoch.pt")

# index paths
TEXT2IMG_INDEX_PATH = os.getenv("TEXT2IMG_INDEX_PATH", "index/txt2img_index.faiss")
IMG2IMG_INDEX_PATH = os.getenv("IMG2IMG_INDEX_PATH", "index/img2img_index.faiss")

# device
DEVICE = os.getenv("DEVICE", "cuda")
