# model_api/app/services/txt_index_service.py
import faiss
import numpy as np
import os
import json
import traceback # Import thư viện debug
from app.utils.logger import logger
from app.config import TEXT2IMG_INDEX_PATH, TEXT2IMG_EMBEDDING_DIM
from app.utils.timer import Timer

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
        ### TIMER ###
        with Timer("TextIndex_LoadIndex"):
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
                        temp_map = {int(k): v for k, v in data.get("mapping", {}).items()}
                        self.id_map = temp_map
                        next_id_from_file = data.get("next_id", 0)
                        max_id_in_map = max(self.id_map.keys()) if self.id_map else -1
                        self.next_id = max(next_id_from_file, max_id_in_map + 1, 0)
                        
                    logger.info(f"[TextIndex] Loaded mapping. Count: {len(self.id_map)}. Next ID set to: {self.next_id}")
                except Exception:
                    logger.error(f"[TextIndex] Error loading mapping, resetting:\n{traceback.format_exc()}")
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
        ### TIMER ###
        # Thêm metadata để biết thêm thông tin
        task_metadata = {"product_id": product_id, "image_path": image_path}
        with Timer("TextIndex_AddProduct", metadata=task_metadata):
            try:
                if vector is None: 
                    logger.error("Vector is None, skipping")
                    return False

                self.remove_specific_image_entry(product_id, image_path)

                vector_np = np.array(vector).astype('float32')
                if len(vector_np.shape) == 1:
                    vector_np = np.expand_dims(vector_np, axis=0)
                elif len(vector_np.shape) == 3:
                    vector_np = vector_np.reshape(1, -1)

                if vector_np.shape[1] != self.dim:
                    logger.error(f"Dimension mismatch! Got {vector_np.shape[1]}, expected {self.dim}")
                    return False

                ids_np = np.array([self.next_id]).astype('int64')
                self.index.add_with_ids(vector_np, ids_np)

                self.id_map[self.next_id] = {
                    "product_id": product_id,
                    "image_path": image_path
                }
                self.next_id += 1
                
                self.save()
                return True
                
            except Exception:
                logger.error(f"[TextIndex] ADD CRASHED:\n{traceback.format_exc()}")
                return False

    def remove_specific_image_entry(self, product_id: str, image_path: str):
        # Hàm này thường chạy rất nhanh, có thể không cần timer
        # Nếu muốn, bạn cũng có thể thêm timer ở đây
        ids_to_remove = []
        for int_id, info in list(self.id_map.items()):
            if not isinstance(info, dict): continue
            if str(info.get('product_id')) == str(product_id) and info.get('image_path') == image_path:
                ids_to_remove.append(int_id)
                del self.id_map[int_id]

        if ids_to_remove:
            ids_np = np.array(ids_to_remove).astype('int64')
            self.index.remove_ids(ids_np)

    def remove_product(self, product_id: str):
        ### TIMER ###
        with Timer("TextIndex_RemoveProduct", metadata={"product_id": product_id}):
            try:
                ids_to_remove = []
                for int_id, info in list(self.id_map.items()):
                    if not isinstance(info, dict): continue
                    if info.get('product_id') == product_id:
                        ids_to_remove.append(int_id)
                
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
        ### TIMER ###
        task_metadata = {"product_id": product_id, "num_images": len(image_paths)}
        with Timer("TextIndex_RemoveListImages", metadata=task_metadata):
            try:
                ids_to_remove = []
                target_images = set(image_paths)
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
        ### TIMER ###
        task_metadata = {"k": k, "index_total": self.index.ntotal}
        with Timer("TextIndex_Search", metadata=task_metadata):
            try:
                if self.index.ntotal == 0: return []
                if len(vector.shape) == 1:
                    vector = np.expand_dims(vector, axis=0)

                D, I = self.index.search(vector, k)
                
                results = []
                seen_products = set()
                for score, idx in zip(D[0], I[0]):
                    if idx == -1 or score <= 0: continue
                    
                    info = self.id_map.get(idx)
                    if info and isinstance(info, dict):
                        p_id = info.get('product_id')
                        img_path = info.get('image_path')
                        if p_id and p_id not in seen_products:
                            seen_products.add(p_id)
                            results.append({"id": p_id, "score": float(score), "image": img_path})
                return results
            except Exception:
                logger.error(f"[TextIndex] SEARCH CRASHED:\n{traceback.format_exc()}")
                return []

    def reset_index(self):
        ### TIMER ###
        with Timer("TextIndex_ResetIndex"):
            try:
                logger.warning("[TextIndex] RESETTING INDEX...")
                self._create_new()
                self.save()
                logger.info("[TextIndex] Index reset successfully.")
                return True
            except Exception as e:
                logger.error(f"[TextIndex] RESET FAILED: {e}")
                return False
            
    def save(self):
        ### TIMER ###
        # Đặt tên Timer cụ thể hơn để phân biệt với các hành động khác
        with Timer("TextIndex_SaveToDisk"):
            try:
                os.makedirs(os.path.dirname(self.index_path), exist_ok=True)
                faiss.write_index(self.index, self.index_path)
                with open(self.mapping_path, 'w', encoding='utf-8') as f:
                    json.dump({"next_id": self.next_id, "mapping": self.id_map}, f, indent=2)
                # Di chuyển log vào trong timer để chỉ log khi thành công
                # logger.info("Saved index & mapping")
            except Exception:
                logger.error(f"[TextIndex] SAVE CRASHED:\n{traceback.format_exc()}")

# Singleton
text_index_service = TextIndexService()