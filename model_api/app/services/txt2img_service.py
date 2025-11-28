import os
import torch
import numpy as np
from PIL import Image
from transformers import AutoTokenizer # Dùng Tokenizer thay vì Processor
from torchvision import transforms

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

# Import kiến trúc model vừa tạo
from app.backbones.phoclip_arch import PhoCLIP 

class Text2ImgService:
    def __init__(self):
        self.device = DEVICE
        self.model = None
        self.tokenizer = None
        
        # Transform (Giữ nguyên)
        self.transform = transforms.Compose([
            transforms.Resize((INPUT_SIZE[0], INPUT_SIZE[1])),
            transforms.ToTensor(),
            transforms.Normalize(mean=RGB_MEAN, std=RGB_STD)
        ])
        
        self.load_model()

    def load_model(self):
        with Timer("Load PhoCLIP Model"):
            logger.info(f"--- LOADING TEXT2IMG MODEL (Custom PhoCLIP) ---")
            try:
                # 1. Load Tokenizer (Vẫn dùng của HuggingFace cho text)
                self.tokenizer = AutoTokenizer.from_pretrained(TEXT2IMG_BASE_ARCH, use_fast=False)

                # 2. Khởi tạo Model từ Class Custom (Đảm bảo cấu trúc y hệt lúc train)
                self.model = PhoCLIP(embed_dim=TEXT2IMG_EMBEDDING_DIM).to(self.device)

                # 3. Load Weights
                if os.path.exists(TEXT2IMG_MODEL_PATH):
                    logger.info(f"Loading weights from {TEXT2IMG_MODEL_PATH}")
                    checkpoint = torch.load(TEXT2IMG_MODEL_PATH, map_location=self.device)
                    
                    # Lấy state_dict
                    state_dict = checkpoint.get("model_state", checkpoint)
                    
                    # Load vào model (Bây giờ cấu trúc khớp 100% nên strict=True cũng được)
                    self.model.load_state_dict(state_dict, strict=False)
                    
                    # Load temperature nếu có
                    if "temperature" in checkpoint:
                        self.model.temperature.data = torch.tensor(checkpoint["temperature"]).to(self.device)
                else:
                    logger.error(f"❌ Checkpoint not found at {TEXT2IMG_MODEL_PATH}!")
                    raise FileNotFoundError("Model file missing")

                self.model.eval()
                
                # --- KIỂM TRA LẠI ---
                logger.info(f"✅ PhoCLIP loaded successfully. Dim: {TEXT2IMG_EMBEDDING_DIM}")

            except Exception as e:
                logger.error(f"Failed to load PhoCLIP: {e}")
                raise RuntimeError("PhoCLIP load failed")

    def embed_text(self, text: str):
        """Chuyển Text -> Vector"""
        try:
            # Tokenize
            tokens = self.tokenizer(
                text, 
                padding="max_length", 
                truncation=True, 
                max_length=64, # Khớp với MAX_LEN lúc train
                return_tensors="pt"
            ).to(self.device)
            
            with torch.no_grad():
                # Gọi text_encoder của PhoCLIP
                features = self.model.text_encoder(tokens["input_ids"], tokens["attention_mask"])
            
            vector = features.cpu().numpy().astype('float32')
            # Normalize (Code train có F.normalize ở forward, nên ở đây mình cũng phải normalize)
            norm = np.linalg.norm(vector)
            if norm > 0: vector = vector / norm
                
            return vector
        except Exception as e:
            logger.error(f"Text embed error: {e}")
            raise e

    def embed_image(self, image_path: str):
        """Chuyển Ảnh -> Vector"""
        try:
            image = Image.open(image_path).convert("RGB")
            image_tensor = self.transform(image).unsqueeze(0).to(self.device)
            
            with torch.no_grad():
                # Gọi image_encoder của PhoCLIP
                features = self.model.image_encoder(image_tensor)
            
            vector = features.cpu().numpy().astype('float32')
            # Normalize
            norm = np.linalg.norm(vector)
            if norm > 0: vector = vector / norm
                
            return vector
        except Exception as e:
            logger.error(f"Error embedding image {image_path}: {e}")
            return None

# Singleton Instance
txt2img_service = Text2ImgService()