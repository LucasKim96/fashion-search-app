# /model_api/app/services/txt2img_service.py

import os
import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np
from PIL import Image
from transformers import AutoTokenizer, AutoModel
from torchvision import models, transforms
from typing import Union, IO
from pyvi import ViTokenizer

from app.config import (
    TEXT2IMG_MODEL_PATH, TEXT2IMG_BASE_ARCH, TEXT2IMG_EMBEDDING_DIM, DEVICE,
    RGB_MEAN, RGB_STD, INPUT_SIZE
)
from app.utils.logger import logger
from app.utils.timer import Timer

# =================================================================
#    ĐỊNH NGHĨA LẠI KIẾN TRÚC MODEL CHO GIỐNG VỚI FILE TRAINING
# =================================================================
# NOTE: Đoạn code này phải khớp 100% với các class model trong file training.

class PhoBERTEncoder(nn.Module):
    def __init__(self, phobert, embed_dim=256, dropout_rate=0.1):
        super().__init__()
        self.phobert = phobert
        self.projection = nn.Sequential(
            nn.Linear(phobert.config.hidden_size, embed_dim),
            nn.Dropout(dropout_rate) 
        )
    def forward(self, input_ids, attention_mask):
        out = self.phobert(input_ids=input_ids, attention_mask=attention_mask)
        return self.projection(out.last_hidden_state[:, 0, :])

class ImageEncoder(nn.Module):
    def __init__(self, embed_dim=256, base_model="vit_b_16", dropout_rate=0.1):
        super().__init__()
        vit = getattr(models, base_model)(weights=models.ViT_B_16_Weights.DEFAULT)
        in_features = vit.heads.head.in_features
        vit.heads = nn.Identity()
        self.backbone = vit
        self.projection = nn.Sequential(
            nn.Linear(in_features, embed_dim),
            nn.Dropout(dropout_rate)
        )
    def forward(self, x):
        feats = self.backbone(x)
        return self.projection(feats)

class PhoCLIP(nn.Module):
    def __init__(self, text_encoder, image_encoder, temperature=0.07):
        super().__init__()
        self.text_encoder = text_encoder
        self.image_encoder = image_encoder
        self.temperature = nn.Parameter(torch.tensor(temperature))
    
    # Thêm các hàm encoder vào đây để dễ truy cập
    def get_text_encoder(self):
        return self.text_encoder

    def get_image_encoder(self):
        return self.image_encoder

# =================================================================
#    SERVICE CLASS
# =================================================================

class Text2ImgService:
    def __init__(self):
        self.device = DEVICE
        self.model = None
        self.tokenizer = None

        # --- ĐỒNG BỘ HÓA TRANSFORM ---
        # Transform này giống hệt `transform_val` trong file training.
        # Nó xử lý đúng màu RGB và resize không bị lỗi.
        self.transform = transforms.Compose([
            transforms.Resize((INPUT_SIZE[0], INPUT_SIZE[1])),
            transforms.ToTensor(),
            transforms.Normalize(mean=RGB_MEAN, std=RGB_STD)
        ])
        
        self.load_model()

    def load_model(self):
        task_metadata = {"service": "txt2img", "action": "load_model"}
        with Timer("Txt2Img_LoadModel", metadata=task_metadata):
            logger.info("--- LOADING TEXT2IMG MODEL (PhoCLIP Architecture) ---")
            try:
                # 1. Tải tokenizer và PhoBERT gốc (chỉ để xây dựng kiến trúc)
                self.tokenizer = AutoTokenizer.from_pretrained(TEXT2IMG_BASE_ARCH, use_fast=False)
                phobert_base = AutoModel.from_pretrained(TEXT2IMG_BASE_ARCH)
                
                # 2. Xây dựng lại kiến trúc model rỗng (giống hệt file training)
                text_encoder = PhoBERTEncoder(phobert_base, embed_dim=TEXT2IMG_EMBEDDING_DIM)
                image_encoder = ImageEncoder(embed_dim=TEXT2IMG_EMBEDDING_DIM)
                model_instance = PhoCLIP(text_encoder, image_encoder).to(self.device)

                if not os.path.exists(TEXT2IMG_MODEL_PATH):
                    logger.error(f"❌ Checkpoint not found at {TEXT2IMG_MODEL_PATH}! Service disabled.")
                    return

                # 3. Tải checkpoint đã được "dọn dẹp"
                logger.info(f"Loading weights from {TEXT2IMG_MODEL_PATH}")
                checkpoint = torch.load(TEXT2IMG_MODEL_PATH, map_location=self.device)
                
                # File checkpoint đã convert chỉ chứa `model_state` và `temperature`
                model_instance.load_state_dict(checkpoint["model_state"])
                
                if "temperature" in checkpoint:
                    model_instance.temperature.data = torch.tensor(checkpoint["temperature"]).to(self.device)

                model_instance.eval()
                self.model = model_instance
                logger.info(f"✅ PhoCLIP loaded successfully. Dim: {TEXT2IMG_EMBEDDING_DIM}")

            except Exception as e:
                logger.error(f"❌ Failed to load PhoCLIP: {e}. Service will be disabled.", exc_info=True)
                self.model = None
                self.tokenizer = None

    def embed_text(self, text: str) -> np.ndarray | None:
        """Chuyển Text -> Vector. LUÔN LUÔN tách từ."""
        if not self.model or not self.tokenizer:
            logger.warning("PhoCLIP model not available. Skipping text embedding.")
            return None
        task_metadata = {
            "service": "txt2img",
            "action": "embed_text",
            "text_length": len(text)
        }
        with Timer("Txt2Img_TextEmbedding", metadata=task_metadata):
            try:
                # --- ĐỒNG BỘ HÓA LOGIC TEXT ---
                # Luôn luôn gọi ViTokenizer, không cần cờ nữa
                processed_text = ViTokenizer.tokenize(text)
                logger.info(f"Original: '{text}' -> Segmented: '{processed_text}'")

                tokens = self.tokenizer(
                    processed_text, padding="max_length", truncation=True, 
                    max_length=64, return_tensors="pt"
                ).to(self.device)
                
                with torch.no_grad():
                    features = self.model.get_text_encoder()(tokens["input_ids"], tokens["attention_mask"])
                    normalized_features = F.normalize(features, p=2, dim=-1)
                
                return normalized_features.cpu().numpy().astype('float32')

            except Exception as e:
                logger.error(f"Text embed error: {e}", exc_info=True)
                return None

    def embed_image(self, image_data: Union[str, IO]) -> np.ndarray | None:
        """Chuyển Ảnh -> Vector, sử dụng transform giống hệt training."""
        if not self.model:
            logger.warning("PhoCLIP model not available. Skipping image embedding.")
            return None
        task_metadata = {
            "service": "txt2img",
            "action": "embed_image"
        }
        with Timer("Txt2Img_ImageEmbedding", metadata=task_metadata):
            try:
                # --- ĐỒNG BỘ HÓA LOGIC ẢNH ---
                # Toàn bộ quá trình xử lý ảnh chỉ dùng PIL và Torchvision, đảm bảo đúng màu RGB.
                image_pil = Image.open(image_data).convert("RGB")
                
                # Áp dụng transform giống hệt `transform_val`
                image_tensor = self.transform(image_pil).unsqueeze(0).to(self.device)
                
                with torch.no_grad():
                    features = self.model.get_image_encoder()(image_tensor)
                    normalized_features = F.normalize(features, p=2, dim=-1)
                
                return normalized_features.cpu().numpy().astype('float32')
                
            except Exception as e:
                logger.error(f"Error embedding image: {e}", exc_info=True)
                return None

# --- Singleton Instance ---
try:
    txt2img_service = Text2ImgService()
except Exception as e:
    logger.error(f"Failed to initialize Text2ImgService: {e}", exc_info=True)
    txt2img_service = None