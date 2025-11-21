import torch

class Img2ImgService:
    def __init__(self, model_path, device="cuda"):
        self.device = device
        self.model = self._load_model(model_path)
        self.model.eval()

    def _load_model(self, path):
        print(f"Loading img2img model from {path}")
        return torch.nn.Identity()

    @torch.inference_mode()
    def encode_image(self, image_tensor):
        # giả lập encode image -> vector
        return torch.rand(1, 512).numpy()
