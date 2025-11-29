import os
import torch
import numpy as np
import cv2
from PIL import Image
from collections import OrderedDict
import torchvision.transforms as transforms
from ultralytics import YOLO

# Import Config và Utils
from app.config import (
    YOLO_WEIGHT_PATH, ARCFACE_WEIGHT_PATH, DEVICE,
    INPUT_SIZE, RGB_MEAN, RGB_STD
)
from app.backbones.model_resnet import ResNet_50
# Import các hàm logic xử lý ảnh mới
from app.services.preprocess import (
    resize_with_padding, 
    auto_crop_for_seller, 
    detect_candidates_for_buyer
)
from app.utils.logger import logger
from app.utils.timer import Timer

class Img2ImgService:
    def __init__(self, device=DEVICE):
        self.device = device
        self.yolo_model = None
        self.backbone = None
        
        # Transform chuẩn cho ArcFace
        self.transform = transforms.Compose([
            transforms.ToTensor(),
            transforms.Normalize(mean=RGB_MEAN, std=RGB_STD),
        ])
        
        self.load_models()

    def load_models(self):
        with Timer("Load Models"):
            logger.info("--- LOADING IMG2IMG MODELS ---")
            
            # 1. Load YOLO
            if os.path.exists(YOLO_WEIGHT_PATH):
                try:
                    self.yolo_model = YOLO(str(YOLO_WEIGHT_PATH))
                    logger.info(f"YOLO Loaded from {YOLO_WEIGHT_PATH}")
                except Exception as e:
                    logger.error(f"Failed to load YOLO: {e}")
            else:
                logger.error(f"YOLO weights not found at {YOLO_WEIGHT_PATH}")

            # 2. Load ArcFace (ResNet50)
            if os.path.exists(ARCFACE_WEIGHT_PATH):
                try:
                    self.backbone = ResNet_50(INPUT_SIZE)
                    ckpt = torch.load(ARCFACE_WEIGHT_PATH, map_location=self.device, weights_only=False)
                    
                    if 'backbone_state_dict' in ckpt:
                        sd = ckpt['backbone_state_dict']
                    else:
                        sd = ckpt 
                    
                    new_sd = OrderedDict()
                    for k, v in sd.items():
                        if k.startswith("module."): k = k[7:]
                        new_sd[k] = v
                    
                    self.backbone.load_state_dict(new_sd, strict=False)
                    self.backbone.to(self.device).eval()
                    logger.info(f"ArcFace ResNet Loaded from {ARCFACE_WEIGHT_PATH}")
                except Exception as e:
                    logger.error(f"Failed to load ArcFace: {e}")
            else:
                logger.error(f"ArcFace weights not found at {ARCFACE_WEIGHT_PATH}")

    def _decode_image(self, image_bytes):
        """Helper: Decode bytes to Numpy"""
        nparr = np.frombuffer(image_bytes, np.uint8)
        img_np = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img_np is None:
            raise ValueError("Cannot decode image bytes")
        return img_np

    def extract_feature(self, img_pil):
        """Trích xuất feature vector (đã bao gồm timer)"""
        if self.backbone is None:
            raise RuntimeError("ArcFace model is not loaded!")

        # Chuyển sang Tensor
        img_tensor = self.transform(img_pil).unsqueeze(0).to(self.device)
        
        with torch.no_grad():
            feature = self.backbone(img_tensor).squeeze()
            feature = feature.cpu().numpy()
            
            # L2 Normalize
            norm = np.linalg.norm(feature)
            if norm > 0:
                feature = feature / norm
                
        return feature.astype(np.float32)

    # --- LOGIC CHO SHOP (TẠO SẢN PHẨM) ---
    def process_image_for_indexing(self, image_bytes, target_group):
        """
        Quy trình: Decode -> Auto Crop (High->Low->Center) -> Resize -> Embed
        """
        logger.info(f"Processing indexing for group: {target_group}")
        
        # 1. Decode
        img_np = self._decode_image(image_bytes)

        # 2. Auto Crop
        with Timer("Shop Auto Crop"):
            final_img_np, method_used = auto_crop_for_seller(
                self.yolo_model, img_np, target_group
            )
        
        # 3. Resize Padding
        with Timer("Resize Padding"):
            img_padded = resize_with_padding(final_img_np, target_size=INPUT_SIZE)
            if img_padded is None:
                raise ValueError("Resize failed (Image too small or invalid)")

        # 4. Extract Feature
        with Timer("ArcFace Extraction"):
            img_pil = Image.fromarray(cv2.cvtColor(img_padded, cv2.COLOR_BGR2RGB))
            vector = self.extract_feature(img_pil)
        
        logger.info(f"Indexing Done. Method: {method_used}")
        return vector, method_used

    # --- LOGIC CHO KHÁCH HÀNG (DETECT) ---
    def detect_search_candidates(self, image_bytes):
        """
        Quy trình: Decode -> YOLO Detect All -> Merge Boxes -> Trả về Coordinates
        (Chưa Crop, Chưa Embed)
        """
        img_np = self._decode_image(image_bytes)
        
        with Timer("Buyer Detection & Merge"):
            candidates = detect_candidates_for_buyer(self.yolo_model, img_np)
            
        return candidates

    # --- LOGIC CHO KHÁCH HÀNG (SEARCH - SAU KHI CHỌN BOX) ---
    def process_image_for_search(self, image_bytes):
        """
        Quy trình: Nhận ảnh đã được FE crop (hoặc ảnh gốc user chọn full) -> Resize -> Embed
        """
        img_np = self._decode_image(image_bytes)
        
        # Resize và Embed
        with Timer("Search Resize"):
            img_padded = resize_with_padding(img_np, target_size=INPUT_SIZE)
            
        with Timer("Search Embedding"):
            img_pil = Image.fromarray(cv2.cvtColor(img_padded, cv2.COLOR_BGR2RGB))
            vector = self.extract_feature(img_pil)
            
        return vector