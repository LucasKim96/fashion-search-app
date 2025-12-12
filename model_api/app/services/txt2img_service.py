# # model_api/app/services/txt2img_service.py
# import os
# import torch
# import numpy as np
# from PIL import Image
# from transformers import AutoTokenizer # Dùng Tokenizer thay vì Processor
# from torchvision import transforms
# from typing import Union, IO

# # Import Config
# from app.config import (
#     TEXT2IMG_MODEL_PATH, 
#     TEXT2IMG_BASE_ARCH, 
#     TEXT2IMG_EMBEDDING_DIM, 
#     DEVICE,
#     RGB_MEAN, RGB_STD, INPUT_SIZE, UPLOAD_ROOT_DIR
# )
# from app.utils.logger import logger
# from app.utils.timer import Timer

# # Import kiến trúc model vừa tạo
# from app.backbones.phoclip_arch import PhoCLIP 

# import cv2 # Thêm thư viện OpenCV để xử lý ảnh NumPy

# # THÊM CÁC IMPORT CẦN THIẾT
# from app.services.yolo_service import yolo_service
# from app.services.preprocess import auto_crop_for_seller, resize_with_padding

# class Text2ImgService:
#     def __init__(self):
#         self.device = DEVICE
#         self.model = None
#         self.tokenizer = None
        
#         # Transform (Giữ nguyên)
#         self.transform = transforms.Compose([
#             transforms.Resize((INPUT_SIZE[0], INPUT_SIZE[1])),
#             transforms.ToTensor(),
#             transforms.Normalize(mean=RGB_MEAN, std=RGB_STD)
#         ])
        
#         self.load_model()

#     def load_model(self):
#         with Timer("Load PhoCLIP Model"):
#             logger.info(f"--- LOADING TEXT2IMG MODEL (Custom PhoCLIP) ---")
#             try:
#                 # 1. Load Tokenizer (Vẫn dùng của HuggingFace cho text)
#                 self.tokenizer = AutoTokenizer.from_pretrained(TEXT2IMG_BASE_ARCH, use_fast=False)

#                 # 2. Khởi tạo Model từ Class Custom (Đảm bảo cấu trúc y hệt lúc train)
#                 self.model = PhoCLIP(embed_dim=TEXT2IMG_EMBEDDING_DIM).to(self.device)

#                 # 3. Load Weights
#                 if os.path.exists(TEXT2IMG_MODEL_PATH):
#                     logger.info(f"Loading weights from {TEXT2IMG_MODEL_PATH}")
#                     checkpoint = torch.load(TEXT2IMG_MODEL_PATH, map_location=self.device)
                    
#                     # Lấy state_dict
#                     state_dict = checkpoint.get("model_state", checkpoint)
                    
#                     # Load vào model (Bây giờ cấu trúc khớp 100% nên strict=True cũng được)
#                     self.model.load_state_dict(state_dict, strict=False)
                    
#                     # Load temperature nếu có
#                     if "temperature" in checkpoint:
#                         self.model.temperature.data = torch.tensor(checkpoint["temperature"]).to(self.device)
#                 else:
#                     logger.error(f"❌ Checkpoint not found at {TEXT2IMG_MODEL_PATH}!")
#                     raise FileNotFoundError("Model file missing")

#                 self.model.eval()
                
#                 # --- KIỂM TRA LẠI ---
#                 logger.info(f"✅ PhoCLIP loaded successfully. Dim: {TEXT2IMG_EMBEDDING_DIM}")

#             except Exception as e:
#                 logger.error(f"Failed to load PhoCLIP: {e}")
#                 raise RuntimeError("PhoCLIP load failed")

#     def embed_text(self, text: str):
#         """Chuyển Text -> Vector"""
#         try:
#             # Tokenize
#             tokens = self.tokenizer(
#                 text, 
#                 padding="max_length", 
#                 truncation=True, 
#                 max_length=64, # Khớp với MAX_LEN lúc train
#                 return_tensors="pt"
#             ).to(self.device)
            
#             with torch.no_grad():
#                 # Gọi text_encoder của PhoCLIP
#                 features = self.model.text_encoder(tokens["input_ids"], tokens["attention_mask"])
            
#             vector = features.cpu().numpy().astype('float32')
#             # Normalize (Code train có F.normalize ở forward, nên ở đây mình cũng phải normalize)
#             norm = np.linalg.norm(vector)
#             if norm > 0: vector = vector / norm
                
#             return vector
#         except Exception as e:
#             logger.error(f"Text embed error: {e}")
#             raise e

#     # def embed_image(self, image_data: Union[str, IO]):
#     #     """
#     #     Chuyển Ảnh -> Vector.
#     #     Có thể nhận vào đường dẫn file (str) hoặc file-like object (IO).
#     #     """
#     #     try:
#     #         # Mở ảnh trực tiếp từ dữ liệu được truyền vào
#     #         image = Image.open(image_data).convert("RGB")

#     #         image_tensor = self.transform(image).unsqueeze(0).to(self.device)
            
#     #         with torch.no_grad():
#     #             features = self.model.image_encoder(image_tensor)
            
#     #         vector = features.cpu().numpy().astype('float32')
#     #         norm = np.linalg.norm(vector)
#     #         if norm > 0: vector = vector / norm
                
#     #         return vector
#     #     except Exception as e:
#     #         # Sửa log để không bị lỗi nếu image_data không phải là string
#     #         logger.error(f"Error embedding image: {e}")
#     #         return None

#     def embed_image(self, image_data: Union[str, IO], target_group: str):
#         """
#         Chuyển Ảnh -> Vector, CÓ ÁP DỤNG SMART CROP VÀ RESIZE PADDING.
#         - image_data: Đường dẫn hoặc file object.
#         - target_group: Nhóm sản phẩm người bán chọn ('upper_body', 'full_body', ...).
#         """
#         try:
#             # BƯỚC 1: Mở ảnh bằng PIL và chuyển sang NumPy (định dạng RGB)
#             image_pil = Image.open(image_data).convert("RGB")
#             image_np_rgb = np.array(image_pil)
            
#             # Lấy model YOLO đã được load sẵn từ service
#             yolo_model = yolo_service.model
#             if not yolo_model:
#                 raise RuntimeError("YOLO model is not available.")

#             # BƯỚC 2: Áp dụng logic AUTO CROP y hệt như img2img_service
#             logger.info(f"[Txt2Img] Running auto_crop for group: '{target_group}'")
#             cropped_np, method = auto_crop_for_seller(yolo_model, image_np_rgb, target_group)
            
#             logger.info(f"[Txt2Img] Image cropped using method: '{method}'")
#             if cropped_np is None or cropped_np.size == 0:
#                 logger.error("[Txt2Img] Cropping failed, returned an empty image.")
#                 return None

#             # BƯỚC 3: Áp dụng RESIZE WITH PADDING y hệt như img2img_service
#             img_padded = resize_with_padding(cropped_np, target_size=INPUT_SIZE)
#             if img_padded is None:
#                 logger.error("[Txt2Img] Resize with padding failed.")
#                 return None

#             # BƯỚC 4: Chuyển ảnh đã xử lý (NumPy) trở lại dạng PIL để đưa vào transform
#             # Vì đầu vào là RGB nên đầu ra của các bước trên cũng là RGB, không cần cvtColor
#             final_pil_image = Image.fromarray(img_padded)

#             # BƯỚC 5: Áp dụng transform và tính toán embedding (logic cũ)
#             image_tensor = self.transform(final_pil_image).unsqueeze(0).to(self.device)
            
#             with torch.no_grad():
#                 features = self.model.image_encoder(image_tensor)
            
#             vector = features.cpu().numpy().astype('float32')
#             norm = np.linalg.norm(vector)
#             if norm > 0: vector = vector / norm
                
#             return vector
            
#         except Exception as e:
#             logger.error(f"Error embedding image with smart crop for Txt2Img: {e}", exc_info=True)
#             return None

# # Singleton Instance
# txt2img_service = Text2ImgService()

# /model_api/app/services/txt2img_service.py

import os
import torch
import numpy as np
from PIL import Image
from transformers import AutoTokenizer
from torchvision import transforms
from typing import Union, IO

from app.config import (
    TEXT2IMG_MODEL_PATH, TEXT2IMG_BASE_ARCH, TEXT2IMG_EMBEDDING_DIM, DEVICE,
    RGB_MEAN, RGB_STD, INPUT_SIZE, UPLOAD_ROOT_DIR
)
from app.utils.logger import logger
from app.utils.timer import Timer

from app.backbones.phoclip_arch import PhoCLIP 
import cv2
from app.services.yolo_service import yolo_service
from app.services.preprocess import auto_crop_for_seller, resize_with_padding

class Text2ImgService:
    def __init__(self):
        self.device = DEVICE
        self.model = None # Khởi tạo là None
        self.tokenizer = None # Khởi tạo là None
        
        self.transform = transforms.Compose([
            transforms.Resize((INPUT_SIZE[0], INPUT_SIZE[1])),
            transforms.ToTensor(),
            transforms.Normalize(mean=RGB_MEAN, std=RGB_STD)
        ])
        
        self.load_model()

    # === HÀM load_model ĐÃ ĐƯỢC CẬP NHẬT ===
    def load_model(self):
        with Timer("Load PhoCLIP Model"):
            logger.info(f"--- LOADING TEXT2IMG MODEL (Custom PhoCLIP) ---")
            try:
                # Load Tokenizer trước
                self.tokenizer = AutoTokenizer.from_pretrained(TEXT2IMG_BASE_ARCH, use_fast=False)

                # Khởi tạo model
                model_instance = PhoCLIP(embed_dim=TEXT2IMG_EMBEDDING_DIM).to(self.device)

                if not os.path.exists(TEXT2IMG_MODEL_PATH):
                    # Ghi lỗi và bỏ qua, không dừng ứng dụng
                    logger.error(f"❌ Checkpoint not found at {TEXT2IMG_MODEL_PATH}! PhoCLIP service will be disabled.")
                    return # Thoát khỏi hàm load_model

                logger.info(f"Loading weights from {TEXT2IMG_MODEL_PATH}")
                checkpoint = torch.load(TEXT2IMG_MODEL_PATH, map_location=self.device)
                state_dict = checkpoint.get("model_state", checkpoint)
                model_instance.load_state_dict(state_dict, strict=False)
                
                if "temperature" in checkpoint:
                    model_instance.temperature.data = torch.tensor(checkpoint["temperature"]).to(self.device)

                model_instance.eval()
                
                # Chỉ gán model vào self.model nếu tất cả các bước trên thành công
                self.model = model_instance
                
                logger.info(f"✅ PhoCLIP loaded successfully. Dim: {TEXT2IMG_EMBEDDING_DIM}")

            except Exception as e:
                # Bắt tất cả các lỗi khác (lỗi load, lỗi cấu trúc, etc.)
                logger.error(f"❌ Failed to load PhoCLIP: {e}. The service will be disabled.", exc_info=True)
                # Đảm bảo self.model vẫn là None
                self.model = None
                self.tokenizer = None

    # === HÀM embed_text ĐÃ ĐƯỢC CẬP NHẬT ===
    def embed_text(self, text: str):
        """Chuyển Text -> Vector"""
        # Kiểm tra xem model đã được load thành công chưa
        if self.model is None or self.tokenizer is None:
            logger.warning("PhoCLIP model is not available. Skipping text embedding.")
            # Trả về None thay vì gây lỗi
            return None

        try:
            tokens = self.tokenizer(
                text, padding="max_length", truncation=True, 
                max_length=64, return_tensors="pt"
            ).to(self.device)
            
            with torch.no_grad():
                features = self.model.text_encoder(tokens["input_ids"], tokens["attention_mask"])
            
            vector = features.cpu().numpy().astype('float32')
            norm = np.linalg.norm(vector)
            if norm > 0: vector = vector / norm
                
            return vector
        except Exception as e:
            logger.error(f"Text embed error: {e}", exc_info=True)
            # Trả về None trong trường hợp có lỗi runtime
            return None

    # === HÀM embed_image ĐÃ ĐƯỢC CẬP NHẬT ===
    def embed_image(self, image_data: Union[str, IO], target_group: str):
        """Chuyển Ảnh -> Vector, CÓ ÁP DỤNG SMART CROP VÀ RESIZE PADDING."""
        # Kiểm tra xem model đã được load thành công chưa
        if self.model is None:
            logger.warning("PhoCLIP model is not available. Skipping image embedding.")
            return None

        try:
            image_pil = Image.open(image_data).convert("RGB")
            image_np_rgb = np.array(image_pil)
            
            yolo_model = yolo_service.model
            if not yolo_model:
                raise RuntimeError("YOLO model is not available for cropping.")

            logger.info(f"[Txt2Img] Running auto_crop for group: '{target_group}'")
            cropped_np, method = auto_crop_for_seller(yolo_model, image_np_rgb, target_group)
            
            logger.info(f"[Txt2Img] Image cropped using method: '{method}'")
            if cropped_np is None or cropped_np.size == 0:
                logger.error("[Txt2Img] Cropping failed.")
                return None

            img_padded = resize_with_padding(cropped_np, target_size=INPUT_SIZE)
            if img_padded is None:
                logger.error("[Txt2Img] Resize with padding failed.")
                return None

            final_pil_image = Image.fromarray(img_padded)

            image_tensor = self.transform(final_pil_image).unsqueeze(0).to(self.device)
            
            with torch.no_grad():
                features = self.model.image_encoder(image_tensor)
            
            vector = features.cpu().numpy().astype('float32')
            norm = np.linalg.norm(vector)
            if norm > 0: vector = vector / norm
                
            return vector
            
        except Exception as e:
            logger.error(f"Error embedding image for Txt2Img: {e}", exc_info=True)
            return None

# Singleton Instance
txt2img_service = Text2ImgService()