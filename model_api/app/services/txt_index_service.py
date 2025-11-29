import faiss
import numpy as np
import os
import json
import traceback # Import thư viện debug
from app.utils.logger import logger
from app.config import TEXT2IMG_INDEX_PATH, TEXT2IMG_EMBEDDING_DIM

TEXT2IMG_MAP_PATH = TEXT2IMG_INDEX_PATH.replace(".faiss", "_map.json")

class TextIndexService:
    def __init__(self):
        self.index_path = TEXT2IMG_INDEX_PATH
        self.mapping_path = TEXT2IMG_MAP_PATH
        self.dim = TEXT2IMG_EMBEDDING_DIM
        
        self.id_map = {}
        self.next_id = 0 

        self._load_index()

    def _load_index(self):
        # Load Index
        if os.path.exists(self.index_path):
            try:
                self.index = faiss.read_index(self.index_path)
                logger.info(f"[TextIndex] Loaded index from {self.index_path}")
            except Exception:
                logger.error(f"[TextIndex] Error loading index:\n{traceback.format_exc()}")
                self._create_new()
        else:
            self._create_new()

        # Load Mapping
        if os.path.exists(self.mapping_path):
            try:
                with open(self.mapping_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    # Convert key string sang int
                    self.id_map = {int(k): v for k, v in data.get("mapping", {}).items()}
                    self.next_id = data.get("next_id", 0)
                logger.info(f"[TextIndex] Loaded mapping. Count: {len(self.id_map)}")
            except Exception:
                logger.error(f"[TextIndex] Error loading mapping:\n{traceback.format_exc()}")
                self.id_map = {}
                self.next_id = 0
        else:
            self.id_map = {}
            self.next_id = 0

    def _create_new(self):
        logger.info(f"[TextIndex] Creating new index (Dim={self.dim})")
        quantizer = faiss.IndexFlatIP(self.dim)
        self.index = faiss.IndexIDMap2(quantizer)
        self.id_map = {}
        self.next_id = 0

    def add_product(self, vector, product_id: str, image_path: str):
        """Thêm vector của 1 ảnh sản phẩm"""
        try:
            # --- DEBUG LOG ---
            # print(f"DEBUG: Adding {product_id} | Path: {image_path}")

            if vector is None: 
                logger.error("Vector is None, skipping")
                return False

            # 1. Xóa dữ liệu cũ trước (quan trọng)
            self.remove_product(product_id)

            # 2. Chuẩn bị vector
            vector_np = np.array(vector).astype('float32')

            if len(vector_np.shape) == 1:
                # Nếu là (256,) -> thêm chiều thành (1, 256)
                vector_np = np.expand_dims(vector_np, axis=0)
            elif len(vector_np.shape) == 3:
                # Nếu lỡ bị (1, 1, 256) -> ép về (1, 256)
                vector_np = vector_np.reshape(1, -1)
            
            # Kiểm tra lần cuối
            if vector_np.shape[1] != self.dim:
                logger.error(f"Dimension mismatch! Got {vector_np.shape[1]}, expected {self.dim}")
                return False
            
            ids_np = np.array([self.next_id]).astype('int64')

            # 3. Add vào FAISS
            self.index.add_with_ids(vector_np, ids_np)

            # 4. Lưu Metadata
            self.id_map[self.next_id] = {
                "product_id": product_id,
                "image_path": image_path
            }
            self.next_id += 1
            
            # 5. Lưu ngay lập tức để test
            self.save()
            return True
            
        except Exception:
            logger.error(f"[TextIndex] ADD CRASHED:\n{traceback.format_exc()}")
            return False

    def remove_product(self, product_id: str):
        """Xóa sản phẩm khỏi index"""
        ids_to_remove = []
        
        # --- VÒNG LẶP AN TOÀN ---
        # Sử dụng copy của keys để tránh lỗi runtime nếu dictionary thay đổi
        try:
            for int_id, info in list(self.id_map.items()):
                
                # --- KIỂM TRA CẤU TRÚC DỮ LIỆU ---
                if not isinstance(info, dict):
                    # Nếu dữ liệu cũ bị sai (là string), bỏ qua hoặc xử lý riêng
                    continue

                if info.get('product_id') == product_id:
                    ids_to_remove.append(int_id)
                    # Lưu ý: Không xóa khỏi map ngay trong vòng lặp này để tránh lỗi iteration
            
            # Xóa thật sự
            if ids_to_remove:
                for iid in ids_to_remove:
                    if iid in self.id_map:
                        del self.id_map[iid]

                ids_np = np.array(ids_to_remove).astype('int64')
                self.index.remove_ids(ids_np)
                logger.info(f"[TextIndex] Removed {product_id}")
                return len(ids_to_remove)
                
            return 0
            
        except Exception:
            logger.error(f"[TextIndex] REMOVE CRASHED:\n{traceback.format_exc()}")
            return 0

    def remove_list_images(self, product_id: str, image_paths: list):
        # Logic tương tự remove_product nhưng thêm check image_path
        ids_to_remove = []
        target_images = set(image_paths)
        
        try:
            for int_id, info in list(self.id_map.items()):
                if not isinstance(info, dict): continue
                
                if info.get('product_id') == product_id and info.get('image_path') in target_images:
                    ids_to_remove.append(int_id)

            if ids_to_remove:
                for iid in ids_to_remove:
                    if iid in self.id_map: del self.id_map[iid]

                ids_np = np.array(ids_to_remove).astype('int64')
                self.index.remove_ids(ids_np)
                self.save()
                return len(ids_to_remove)
            return 0
        except Exception:
            logger.error(f"[TextIndex] REMOVE BATCH CRASHED:\n{traceback.format_exc()}")
            return 0

    def search(self, vector, k=20):
        try:
            if self.index.ntotal == 0: return []

            if len(vector.shape) == 1:
                vector = np.expand_dims(vector, axis=0)

            D, I = self.index.search(vector, k)
            
            results = []
            seen_products = set()

            for score, idx in zip(D[0], I[0]):
                if idx == -1: continue
                
                info = self.id_map.get(idx)
                if info and isinstance(info, dict):
                    p_id = info.get('product_id')
                    img_path = info.get('image_path')
                    
                    if p_id and p_id not in seen_products:
                        seen_products.add(p_id)
                        results.append({
                            "id": p_id,
                            "score": float(score),
                            "image": img_path
                        })
            return results
        except Exception:
            logger.error(f"[TextIndex] SEARCH CRASHED:\n{traceback.format_exc()}")
            return []

    def save(self):
        """Lưu xuống ổ cứng"""
        try:
            # Đảm bảo thư mục tồn tại
            os.makedirs(os.path.dirname(self.index_path), exist_ok=True)
            
            faiss.write_index(self.index, self.index_path)
            with open(self.mapping_path, 'w', encoding='utf-8') as f:
                json.dump({
                    "next_id": self.next_id,
                    "mapping": self.id_map
                }, f, indent=2)
            logger.info("Saved index & mapping")
        except Exception:
            logger.error(f"[TextIndex] SAVE CRASHED:\n{traceback.format_exc()}")

# Singleton
text_index_service = TextIndexService()