# /model_api/app/services/txt_index_service.py
import faiss
import numpy as np
import os
import json
import traceback
import threading # ### UPDATE ### Thêm threading để khóa file

from app.utils.logger import logger
from app.config import TEXT2IMG_INDEX_PATH, TEXT2IMG_EMBEDDING_DIM
from app.utils.timer import Timer

TEXT2IMG_MAP_PATH = TEXT2IMG_INDEX_PATH.replace(".faiss", "_map.json")

class TextIndexService:
    def __init__(self):
        self.index_path = TEXT2IMG_INDEX_PATH
        self.mapping_path = TEXT2IMG_MAP_PATH
        self.dim = TEXT2IMG_EMBEDDING_DIM
        
        self.index = None
        self.id_map = {}
        self.next_id = 0 
        
        # ### UPDATE ### Tạo một khóa (lock) để ngăn chặn xung đột khi ghi file
        # Điều này rất quan trọng trong môi trường đa luồng của API.
        self._file_lock = threading.Lock()

        self._load_index()

    def _load_index(self):
        with Timer("TextIndex_LoadIndex"):
            # ### UPDATE ### Sử dụng self._file_lock để đảm bảo an toàn khi đọc file lúc khởi động
            with self._file_lock:
                # Load Index
                if os.path.exists(self.index_path):
                    try:
                        self.index = faiss.read_index(self.index_path)
                        logger.info(f"[TextIndex] Loaded index from {self.index_path} with {self.index.ntotal} vectors.")
                    except Exception:
                        logger.error(f"[TextIndex] Error loading index file, creating new one:\n{traceback.format_exc()}")
                        self._create_new()
                else:
                    self._create_new()

                # Load Mapping
                if os.path.exists(self.mapping_path):
                    try:
                        with open(self.mapping_path, 'r', encoding='utf-8') as f:
                            data = json.load(f)
                        temp_map = {int(k): v for k, v in data.get("mapping", {}).items()}
                        self.id_map = temp_map
                        next_id_from_file = data.get("next_id", 0)
                        max_id_in_map = max(self.id_map.keys()) if self.id_map else -1
                        self.next_id = max(next_id_from_file, max_id_in_map + 1, 0)
                        
                        logger.info(f"[TextIndex] Loaded mapping. Count: {len(self.id_map)}. Next ID set to: {self.next_id}")
                    except (json.JSONDecodeError, Exception):
                        logger.error(f"[TextIndex] Error loading mapping file, resetting:\n{traceback.format_exc()}")
                        self.id_map = {}
                        self.next_id = max(self.id_map.keys()) + 1 if self.id_map else 0
                else:
                    self.id_map = {}
                    self.next_id = 0
    
    def _create_new(self):
        """Khởi tạo một index mới trong RAM. Chỉ gọi hàm này bên trong một lock."""
        logger.info(f"[TextIndex] Creating new index (Dim={self.dim}) in memory.")
        # IndexFlatIP rất nhanh cho việc tìm kiếm chính xác
        quantizer = faiss.IndexFlatIP(self.dim)
        # IndexIDMap2 cho phép dùng ID 64-bit không liên tiếp
        self.index = faiss.IndexIDMap2(quantizer)
        self.id_map = {}
        self.next_id = 0

    def add_product(self, vector: np.ndarray, product_id: str, image_path: str) -> bool:
        task_metadata = {"product_id": product_id, "image_path": image_path}
        with Timer("TextIndex_AddProduct", metadata=task_metadata):
            try:
                if vector is None: 
                    logger.error("[TextIndex] Add failed: Vector is None.")
                    return False
                
                # ### UPDATE ### Chuyển đổi và kiểm tra vector ở một nơi
                vector_np = self._prepare_vector(vector)
                if vector_np is None: return False

                # ### UPDATE ### Bọc các thao tác thay đổi index trong một lock
                with self._file_lock:
                    id_to_remove = self._find_id_by_image_path(image_path)
                    
                    # Thêm vector mới
                    new_id = self.next_id
                    ids_np = np.array([new_id], dtype=np.int64)
                    self.index.add_with_ids(vector_np, ids_np)
                    self.id_map[new_id] = {"product_id": product_id, "image_path": image_path}
                    self.next_id += 1
                    
                    # Chỉ xóa vector cũ sau khi đã thêm thành công vector mới
                    if id_to_remove is not None:
                        self.index.remove_ids(np.array([id_to_remove], dtype=np.int64))
                        # id_map đã được cập nhật trước đó
                        logger.info(f"[TextIndex] Replaced old entry for image: {image_path}")

                    self.save()
                return True
                
            except Exception:
                logger.error(f"[TextIndex] ADD CRASHED:\n{traceback.format_exc()}")
                return False

    def remove_list_images(self, product_id: str, image_paths: list) -> int:
        task_metadata = {"product_id": product_id, "num_images": len(image_paths)}
        with Timer("TextIndex_RemoveListImages", metadata=task_metadata):
            try:
                ids_to_remove = []
                target_images = set(image_paths)
                
                with self._file_lock:
                    for int_id, info in list(self.id_map.items()):
                        if isinstance(info, dict) and str(info.get('product_id')) == str(product_id) and info.get('image_path') in target_images:
                            ids_to_remove.append(int_id)
                    
                    if not ids_to_remove: return 0

                    for iid in ids_to_remove:
                        if iid in self.id_map: del self.id_map[iid]

                    self.index.remove_ids(np.array(ids_to_remove, dtype=np.int64))
                    self.save()
                
                logger.info(f"[TextIndex] Removed {len(ids_to_remove)} images for product {product_id}.")
                return len(ids_to_remove)
            except Exception:
                logger.error(f"[TextIndex] REMOVE BATCH CRASHED:\n{traceback.format_exc()}")
                return 0
            
    def remove_product(self, product_id: str) -> int:
        """
        Xóa TẤT CẢ các entry của một product_id.
        Hàm này sẽ tìm tất cả các image_path của sản phẩm đó và gọi remove_list_images.
        """
        task_metadata = {"product_id": product_id}
        with Timer("TextIndex_RemoveFullProduct", metadata=task_metadata):
            # 1. Tìm tất cả các image_path thuộc về product_id này
            paths_to_remove = []
            
            # Phải duyệt qua một bản copy để tránh lỗi thay đổi dict trong lúc duyệt
            for info in list(self.id_map.values()):
                if isinstance(info, dict) and str(info.get('product_id')) == str(product_id):
                    paths_to_remove.append(info.get('image_path'))

            if not paths_to_remove:
                logger.info(f"[TextIndex] No entries found for product '{product_id}'. Nothing to remove.")
                return 0
            
            # 2. Tái sử dụng hàm remove_list_images để xóa
            # Điều này giúp tập trung logic xóa và ghi file ở một nơi duy nhất.
            logger.info(f"[TextIndex] Found {len(paths_to_remove)} entries. Requesting removal for product '{product_id}'.")
            return self.remove_list_images(product_id, paths_to_remove)

    def search(self, vector: np.ndarray, k: int = 20) -> list:
        task_metadata = {"k": k, "index_total": self.index.ntotal if self.index else 0}
        with Timer("TextIndex_Search", metadata=task_metadata):
            try:
                if not self.index or self.index.ntotal == 0: return []
                
                vector_np = self._prepare_vector(vector)
                if vector_np is None: return []

                distances, indices = self.index.search(vector_np, k)
                
                results = []
                seen_products = set()
                for i in range(len(indices[0])):
                    idx = indices[0][i]
                    score = distances[0][i]
                    
                    if idx == -1 or score <= 0: continue
                    
                    info = self.id_map.get(idx)
                    if isinstance(info, dict):
                        p_id = info.get('product_id')
                        if p_id and p_id not in seen_products:
                            seen_products.add(p_id)
                            results.append({"id": p_id, "score": float(score), "image": info.get('image_path')})
                return results
            except Exception:
                logger.error(f"[TextIndex] SEARCH CRASHED:\n{traceback.format_exc()}")
                return []

    def reset_index(self):
        with Timer("TextIndex_ResetIndex"):
            try:
                logger.warning("[TextIndex] RESETTING ENTIRE INDEX...")
                with self._file_lock:
                    self._create_new()
                    self.save()
                logger.info("[TextIndex] Index reset successfully.")
                return True
            except Exception as e:
                logger.error(f"[TextIndex] RESET FAILED: {e}", exc_info=True)
                return False
            
    def save(self):
        """Lưu index và map xuống ổ cứng. Chỉ nên gọi hàm này bên trong một lock."""
        with Timer("TextIndex_SaveToDisk"):
            try:
                os.makedirs(os.path.dirname(self.index_path), exist_ok=True)
                faiss.write_index(self.index, self.index_path)
                with open(self.mapping_path, 'w', encoding='utf-8') as f:
                    json.dump({"next_id": self.next_id, "mapping": self.id_map}, f, indent=2)
            except Exception:
                logger.error(f"[TextIndex] SAVE CRASHED:\n{traceback.format_exc()}")

    # --- ### UPDATE ### Các hàm helper mới ---
    def _prepare_vector(self, vector: np.ndarray) -> np.ndarray | None:
        """Chuẩn hóa shape và type của vector đầu vào."""
        try:
            vector_np = np.array(vector, dtype=np.float32)
            if vector_np.ndim == 1:
                vector_np = np.expand_dims(vector_np, axis=0)
            
            if vector_np.shape[1] != self.dim:
                logger.error(f"[TextIndex] Vector dimension mismatch! Got {vector_np.shape[1]}, expected {self.dim}")
                return None
            return vector_np
        except Exception:
            return None

    def _find_id_by_image_path(self, image_path: str) -> int | None:
        """Tìm ID nội bộ của FAISS dựa trên image_path."""
        for int_id, info in self.id_map.items():
            if isinstance(info, dict) and info.get('image_path') == image_path:
                del self.id_map[int_id] # Xóa khỏi map ngay lập tức
                return int_id
        return None

# Singleton
try:
    text_index_service = TextIndexService()
except Exception as e:
    logger.error(f"Failed to initialize TextIndexService: {e}", exc_info=True)
    text_index_service = None