# import torch

# class Txt2ImgService:
#     def __init__(self, model_path, device="cuda"):
#         self.device = device
#         # giả lập load model
#         self.model = self._load_model(model_path)
#         self.model.eval()

#     def _load_model(self, path):
#         # replace bằng actual model loading code
#         print(f"Loading text2img model from {path}")
#         return torch.nn.Identity()

#     @torch.inference_mode()
#     def encode_text(self, text_tensor):
#         # giả lập encode text -> vector
#         return torch.rand(1, 512).numpy()
