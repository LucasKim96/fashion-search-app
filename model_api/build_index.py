import faiss
import numpy as np
import os
from app.services.txt2img_service import Txt2ImgService
from app.services.img2img_service import Img2ImgService
from app.utils.io_utils import list_files, ensure_dir
from app.config import *

# dummy dataset folders
TXT2IMG_DATASET = "dataset/txt2img_images"
IMG2IMG_DATASET = "dataset/img2img_images"

# tạo services
txt2img_service = Txt2ImgService(TEXT2IMG_MODEL_PATH)
img2img_service = Img2ImgService(IMG2IMG_MODEL_PATH)

def build_index(service, dataset_folder, save_path):
    files = list_files(dataset_folder, exts=[".jpg", ".png"])
    print(f"Found {len(files)} files in {dataset_folder}")

    # encode tất cả ảnh thành embedding
    embeddings = []
    for f in files:
        with open(f, "rb") as img_file:
            img_bytes = img_file.read()
        emb = service.encode_image_or_text(img_bytes)
        embeddings.append(emb[0])

    embeddings = np.array(embeddings).astype("float32")
    d = embeddings.shape[1]

    # tạo FAISS index
    index = faiss.IndexFlatL2(d)
    index.add(embeddings)
    ensure_dir(os.path.dirname(save_path))
    faiss.write_index(index, save_path)
    print(f"Saved index to {save_path}")

# phương thức encode chung
def encode_image_or_text(self, input_data):
    # detect nếu là text hay image
    try:
        # nếu bytes → image
        return self.encode_image(input_data)
    except:
        return self.encode_text(input_data)

# patch method tạm thời cho 2 service
Txt2ImgService.encode_image_or_text = encode_image_or_text
Img2ImgService.encode_image_or_text = encode_image_or_text

# build 2 index
build_index(txt2img_service, TXT2IMG_DATASET, TEXT2IMG_INDEX_PATH)
build_index(img2img_service, IMG2IMG_DATASET, IMG2IMG_INDEX_PATH)
