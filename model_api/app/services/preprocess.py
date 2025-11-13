import torch

def preprocess_text(text: str):
    # replace bằng tokenizer / embedding code thật
    return torch.tensor([1,2,3])  # dummy

def preprocess_image(image_bytes: bytes):
    # replace bằng transform thật: PIL -> tensor
    return torch.rand(1, 3, 224, 224)
