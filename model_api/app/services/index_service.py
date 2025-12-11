import faiss
import numpy as np
import os
import json
from app.utils.logger import logger

class IndexService:
    def __init__(self, index_path, mapping_path, dim=512):
        self.index_path = index_path
        self.mapping_path = mapping_path
        self.dim = dim
        self.id_map = {} # Map: unique_int_id -> {"product_id": str, "image_id": str}
        self.next_id = 0 # Bộ đếm ID tự tăng

        # 1. Load hoặc Tạo Index mới
        if os.path.exists(index_path):
            try:
                self.index = faiss.read_index(index_path)
                logger.info(f"Loaded FAISS index from {index_path}")
            except Exception as e:
                logger.error(f"Error loading index: {e}")
                self._create_new_index()
        else:
            self._create_new_index()

        # 2. Load Mapping
        if os.path.exists(mapping_path):
            try:
                with open(mapping_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    # Convert key từ string về int
                    self.id_map = {int(k): v for k, v in data.get("mapping", {}).items()}
                    self.next_id = data.get("next_id", 0)
                logger.info(f"Loaded Mapping. Next ID: {self.next_id}")
            except Exception as e:
                logger.error(f"Error loading mapping: {e}")
                self.id_map = {}
                self.next_id = 0

    def _create_new_index(self):
        """Tạo index hỗ trợ ID tùy chỉnh"""
        logger.info(f"Creating a new, empty index at {self.index_path}")
        quantizer = faiss.IndexFlatIP(self.dim)
        self.index = faiss.IndexIDMap2(quantizer)
        self.id_map = {}
        self.next_id = 0

    def add_item(self, vector, product_id: str, image_id: str):
        """Thêm vector + metadata"""
        vector = np.array([vector]).astype('float32')
        ids = np.array([self.next_id]).astype('int64')

        self.index.add_with_ids(vector, ids)

        self.id_map[self.next_id] = {
            "product_id": product_id,
            "image_id": image_id
        }
        self.next_id += 1

    def remove_list_images(self, product_id: str, image_ids: list):
        """Xóa danh sách nhiều ảnh của 1 sản phẩm (Batch Delete)"""
        ids_to_remove = []
        
        # Duyệt map để tìm các ID cần xóa
        # Lưu ý: Convert image_ids sang set để tìm kiếm O(1) nếu list dài
        target_images = set(image_ids)
        
        for int_id, info in list(self.id_map.items()):
            if info['product_id'] == product_id and info['image_id'] in target_images:
                ids_to_remove.append(int_id)
                del self.id_map[int_id]

        if ids_to_remove:
            ids_np = np.array(ids_to_remove).astype('int64')
            self.index.remove_ids(ids_np)
            logger.info(f"Deleted batch: {len(ids_to_remove)} vectors for product {product_id}")
            return len(ids_to_remove)
        
        logger.warning(f"No images found to delete for product {product_id}")
        return 0

    def remove_product(self, product_id: str):
        """Xóa toàn bộ ảnh của 1 sản phẩm"""
        ids_to_remove = []
        for int_id, info in list(self.id_map.items()):
            if info['product_id'] == product_id:
                ids_to_remove.append(int_id)
                del self.id_map[int_id]

        if ids_to_remove:
            ids_np = np.array(ids_to_remove).astype('int64')
            self.index.remove_ids(ids_np)
            logger.info(f"Deleted product {product_id} ({len(ids_to_remove)} vectors)")
            return len(ids_to_remove)
        return 0

    def save(self):
        """Lưu Index và Map xuống đĩa"""
        try:
            # Lưu Index
            faiss.write_index(self.index, self.index_path)
            
            # Lưu Map
            data = {
                "next_id": self.next_id,
                "mapping": self.id_map
            }
            # Tạo thư mục cha nếu chưa có (đề phòng)
            os.makedirs(os.path.dirname(self.mapping_path), exist_ok=True)
            
            with open(self.mapping_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            
            logger.info("Index and Mapping saved successfully.")
        except Exception as e:
            logger.error(f"Failed to save index: {e}")

    def search(self, query_emb, k=20):
        if self.index.ntotal == 0: return []

        query_emb = np.array([query_emb]).astype('float32')
        
        # Lấy gấp 10 lần k để lọc trùng sản phẩm
        fetch_k = min(k * 10, self.index.ntotal)
        
        # Search (Cosine Similarity dùng IndexFlatIP)
        D, I = self.index.search(query_emb, fetch_k)
        
        unique_results = []
        seen_product_ids = set()
        
        for rank, (idx, score) in enumerate(zip(I[0], D[0])):
            if idx == -1: continue 
            
            info = self.id_map.get(idx)
            if not info: continue
            
            p_id = info['product_id']
            
            # Chỉ lấy ảnh đại diện có điểm cao nhất của mỗi sản phẩm
            if p_id not in seen_product_ids:
                seen_product_ids.add(p_id)
                
                unique_results.append({
                    "product_id": p_id,
                    "image_id": info['image_id'],
                    "score": float(score),
                    "rank": len(unique_results) + 1
                })
            
            # Kiểm tra điều kiện dừng với biến k
            if len(unique_results) >= k:
                break
                
        return unique_results