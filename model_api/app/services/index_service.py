import faiss
import numpy as np

class IndexService:
    def __init__(self, index_path):
        try:
            self.index = faiss.read_index(index_path)
            print(f"Loaded FAISS index from {index_path}")
        except:
            print(f"FAISS index not found at {index_path}, creating dummy index")
            d = 512
            self.index = faiss.IndexFlatL2(d)
            self.index.add(np.random.rand(1000, d).astype('float32'))

    def search(self, query_emb, top_k=10):
        query_emb = np.array(query_emb).astype('float32')
        D, I = self.index.search(query_emb, top_k)
        return [{"id": int(i), "score": float(d)} for i, d in zip(I[0], D[0])]
