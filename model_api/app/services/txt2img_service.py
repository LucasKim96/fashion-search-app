# model_api/app/services/txt2img_service.py
import os
import torch
import numpy as np
from PIL import Image
from transformers import AutoTokenizer
from torchvision import transforms
from typing import Union, IO

# Import Config
from app.config import (
    TEXT2IMG_MODEL_PATH, 
    TEXT2IMG_BASE_ARCH, 
    TEXT2IMG_EMBEDDING_DIM, 
    DEVICE,
    RGB_MEAN, RGB_STD, INPUT_SIZE
)
from app.utils.logger import logger
from app.utils.timer import Timer
from app.backbones.phoclip_arch import PhoCLIP 

class Text2ImgService:
    def __init__(self):
        self.device = DEVICE
        self.model = None
        self.tokenizer = None
        # 🔽 THÊM DÒNG NÀY: Cờ trạng thái để kiểm tra model đã sẵn sàng chưa 🔽
        self.is_ready = False 

        self.transform = transforms.Compose([
            transforms.Resize((INPUT_SIZE[0], INPUT_SIZE[1])),
            transforms.ToTensor(),
            transforms.Normalize(mean=RGB_MEAN, std=RGB_STD)
        ])
        
        self.load_model()

    def load_model(self):
        with Timer("Load PhoCLIP Model"):
            logger.info("--- LOADING TEXT2IMG MODEL (Custom PhoCLIP) ---")
            try:
                # 🔽 THAY ĐỔI: Kiểm tra file tồn tại trước 🔽
                if not os.path.exists(TEXT2IMG_MODEL_PATH):
                    # Ném lỗi cụ thể để khối except bên dưới có thể bắt
                    raise FileNotFoundError(f"Checkpoint not found at {TEXT2IMG_MODEL_PATH}")

                # Các dòng dưới chỉ chạy nếu file tồn tại
                self.tokenizer = AutoTokenizer.from_pretrained(TEXT2IMG_BASE_ARCH, use_fast=False)
                self.model = PhoCLIP(embed_dim=TEXT2IMG_EMBEDDING_DIM).to(self.device)
                
                logger.info(f"Loading weights from {TEXT2IMG_MODEL_PATH}")
                checkpoint = torch.load(TEXT2IMG_MODEL_PATH, map_location=self.device)
                state_dict = checkpoint.get("model_state", checkpoint)
                self.model.load_state_dict(state_dict, strict=False)
                
                if "temperature" in checkpoint:
                    self.model.temperature.data = torch.tensor(checkpoint["temperature"]).to(self.device)

                self.model.eval()
                
                # 🔽 THÊM DÒNG NÀY: Đặt cờ thành True khi load thành công 🔽
                self.is_ready = True 
                logger.info(f"✅ PhoCLIP loaded successfully. Dim: {TEXT2IMG_EMBEDDING_DIM}")

            # 🔽 THAY ĐỔI: Xóa `raise RuntimeError` và thay bằng khối `except` chi tiết 🔽
            except FileNotFoundError as e:
                # Nếu không tìm thấy file, ghi cảnh báo và tiếp tục chạy (KHÔNG CRASH)
                logger.warning("--- ⚠️  TEXT2IMG MODEL NOT FOUND ---")
                logger.warning(str(e))
                logger.warning("Text-to-Image search feature will be DISABLED.")
# Đảm bảo is_ready là False
                self.is_ready = False
            
            except Exception as e:
                # Bắt các lỗi khác có thể xảy ra khi load model (ví dụ file hỏng)
                logger.error(f"--- ❌ FAILED TO LOAD TEXT2IMG MODEL ---")
                logger.error(f"An unexpected error occurred: {e}")
                logger.error("Text-to-Image search feature will be DISABLED.")
                # Đảm bảo is_ready là False
                self.is_ready = False


    def embed_text(self, text: str):
        """Chuyển Text -> Vector"""
        # 🔽 THÊM KHỐI NÀY: Kiểm tra xem model đã sẵn sàng chưa 🔽
        if not self.is_ready:
            logger.error("Text2Img model is not available. Cannot embed text.")
            raise RuntimeError("Text2Img service is unavailable.")
        
        try:
            tokens = self.tokenizer(text, padding="max_length", truncation=True, max_length=64, return_tensors="pt").to(self.device)
            with torch.no_grad():
                features = self.model.text_encoder(tokens["input_ids"], tokens["attention_mask"])
            vector = features.cpu().numpy().astype('float32')
            norm = np.linalg.norm(vector)
            if norm > 0: vector = vector / norm
            return vector
        except Exception as e:
            logger.error(f"Text embed error: {e}")
            raise e

    def embed_image(self, image_data: Union[str, IO]):
        """Chuyển Ảnh -> Vector."""
        # 🔽 THÊM KHỐI NÀY: Kiểm tra xem model đã sẵn sàng chưa 🔽
        if not self.is_ready:
            logger.error("Text2Img model is not available. Cannot embed image.")
            return None # Trả về None để báo hiệu cho router
        
        try:
            image = Image.open(image_data).convert("RGB")
            image_tensor = self.transform(image).unsqueeze(0).to(self.device)
            with torch.no_grad():
                features = self.model.image_encoder(image_tensor)
            vector = features.cpu().numpy().astype('float32')
            norm = np.linalg.norm(vector)
            if norm > 0: vector = vector / norm
            return vector
        except Exception as e:
            logger.error(f"Error embedding image: {e}")
            return None

# Singleton Instance
txt2img_service = Text2ImgService()
