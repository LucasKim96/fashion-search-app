import faiss
import numpy as np
import os
import json
from app.utils.logger import logger
from app.config import TEXT2IMG_INDEX_PATH, TEXT2IMG_EMBEDDING_DIM

# Đường dẫn file mapping JSON (lưu cùng chỗ với index)
TEXT2IMG_MAP_PATH = TEXT2IMG_INDEX_PATH.replace(".faiss", "_map.json")

class TextIndexService:
    def __init__(self):
        self.index_path = TEXT2IMG_INDEX_PATH
        self.mapping_path = TEXT2IMG_MAP_PATH
        self.dim = TEXT2IMG_EMBEDDING_DIM # 256
        
        # Cấu trúc map chuẩn: int_id -> { "product_id": str, "image_path": str }
        self.id_map = {}
        self.next_id = 0 

        self._load_index()

    def _load_index(self):
        # 1. Load Index FAISS
        if os.path.exists(self.index_path):
            try:
                self.index = faiss.read_index(self.index_path)
                logger.info(f"[TextIndex] Loaded index from {self.index_path}")
            except Exception as e:
                logger.error(f"[TextIndex] Error loading index: {e}")
                self._create_new()
        else:
            self._create_new()

        # 2. Load Mapping JSON
        if os.path.exists(self.mapping_path):
            try:
                with open(self.mapping_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    # Convert key string sang int
                    self.id_map = {int(k): v for k, v in data.get("mapping", {}).items()}
                    self.next_id = data.get("next_id", 0)
                logger.info(f"[TextIndex] Loaded mapping. Next ID: {self.next_id}")
            except Exception as e:
                logger.error(f"[TextIndex] Error loading mapping: {e}")
                self.id_map = {}
        else:
            self.id_map = {}

    def _create_new(self):
        """Tạo index mới dùng Inner Product (Cosine Sim)"""
        logger.info(f"[TextIndex] Creating new index (Dim={self.dim})")
        quantizer = faiss.IndexFlatIP(self.dim)
        self.index = faiss.IndexIDMap2(quantizer)
        self.id_map = {}
        self.next_id = 0

    # --- [SỬA] Thêm tham số image_path và lưu full object ---
    def add_product(self, vector, product_id: str, image_path: str):
        """Thêm vector của 1 ảnh sản phẩm"""
        if vector is None: return False

        # Chuẩn bị vector
        vector_np = np.array([vector]).astype('float32')
        ids_np = np.array([self.next_id]).astype('int64')

        # Add vào FAISS
        self.index.add_with_ids(vector_np, ids_np)

        # [QUAN TRỌNG] Lưu Object đầy đủ vào Map
        self.id_map[self.next_id] = {
            "product_id": product_id,
            "image_path": image_path
        }
        self.next_id += 1
        
        self.save()
        return True

    # --- [BỔ SUNG] Hàm xóa danh sách ảnh cụ thể ---
    def remove_list_images(self, product_id: str, image_paths: list):
        """Xóa danh sách các ảnh cụ thể của 1 sản phẩm"""
        ids_to_remove = []
        target_images = set(image_paths) # Dùng set để tìm nhanh hơn
        
        # Duyệt map để tìm ID số tương ứng
        for int_id, info in list(self.id_map.items()):
            # info là dict {product_id, image_path}
            if info['product_id'] == product_id and info['image_path'] in target_images:
                ids_to_remove.append(int_id)
                del self.id_map[int_id]

        if ids_to_remove:
            ids_np = np.array(ids_to_remove).astype('int64')
            self.index.remove_ids(ids_np)
            self.save()
            logger.info(f"[TextIndex] Deleted {len(ids_to_remove)} images for product {product_id}")
            return len(ids_to_remove)
        return 0

    def remove_product(self, product_id: str):
        """Xóa sản phẩm khỏi index (Phiên bản an toàn)"""
        ids_to_remove = []
        
        # Duyệt qua copy của items để tránh lỗi runtime khi delete
        for item in list(self.id_map.items()):
            # [FIX] Không unpack ngay tại for loop để tránh lỗi "too many values"
            int_id = item[0]
            info = item[1] 

            try:
                # Kiểm tra info là dict (Cấu trúc mới)
                if isinstance(info, dict):
                    if info.get('product_id') == product_id:
                        ids_to_remove.append(int_id)
                        del self.id_map[int_id]
                
                # Kiểm tra info là string (Cấu trúc cũ - fallback)
                elif isinstance(info, str):
                    if info == product_id:
                        ids_to_remove.append(int_id)
                        del self.id_map[int_id]
            except Exception as e:
                logger.error(f"Skipping error item {int_id}: {e}")
                continue

        if ids_to_remove:
            ids_np = np.array(ids_to_remove).astype('int64')
            self.index.remove_ids(ids_np)
            self.save() # Lưu ngay
            logger.info(f"[TextIndex] Removed product {product_id} ({len(ids_to_remove)} vectors)")
            return len(ids_to_remove)
        return 0

    # --- [SỬA] Trả về đầy đủ thông tin ảnh ---
    def search(self, vector, k=20):
        """Tìm kiếm"""
        if self.index.ntotal == 0: return []

        # Search
        # vector phải có shape (1, dim)
        if len(vector.shape) == 1:
            vector = np.expand_dims(vector, axis=0)

        D, I = self.index.search(vector, k)
        
        results = []
        seen_products = set()

        for score, idx in zip(D[0], I[0]):
            if idx == -1: continue
            
            info = self.id_map.get(idx)
            if info:
                p_id = info['product_id']
                
                # Logic lọc trùng: 1 sản phẩm chỉ hiện 1 lần (với ảnh giống nhất)
                if p_id not in seen_products:
                    seen_products.add(p_id)
                    results.append({
                        "id": p_id,                 # ID sản phẩm
                        "score": float(score),      # Điểm số
                        "image": info['image_path'] # [QUAN TRỌNG] Trả về ảnh khớp nhất
                    })
        
        return results

    def save(self):
        """Lưu xuống ổ cứng"""
        try:
            faiss.write_index(self.index, self.index_path)
            with open(self.mapping_path, 'w', encoding='utf-8') as f:
                json.dump({
                    "next_id": self.next_id,
                    "mapping": self.id_map
                }, f, indent=2) # indent cho dễ đọc
        except Exception as e:
            logger.error(f"[TextIndex] Save failed: {e}")

# Singleton
text_index_service = TextIndexService()