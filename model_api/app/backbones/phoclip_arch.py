# model_api/app/backbones/phoclip_arch.py

import torch
import torch.nn as nn
import torch.nn.functional as F
from transformers import AutoModel
from torchvision import models

# --- Copy y nguyên từ code train ---

class PhoBERTEncoder(nn.Module):
    def __init__(self, model_name="vinai/phobert-base", embed_dim=256):
        super().__init__()
        # Load PhoBERT từ HuggingFace
        self.phobert = AutoModel.from_pretrained(model_name)
        self.projection = nn.Linear(self.phobert.config.hidden_size, embed_dim)
    
    def forward(self, input_ids, attention_mask):
        out = self.phobert(input_ids=input_ids, attention_mask=attention_mask)
        # Lấy token CLS (vị trí 0)
        return self.projection(out.last_hidden_state[:, 0, :])

class ImageEncoder(nn.Module):
    def __init__(self, embed_dim=256, base_model="vit_b_16"):
        super().__init__()
        # Load ViT từ Torchvision (Đúng như lúc train)
        vit = getattr(models, base_model)(weights=None) # Weights=None vì ta sẽ load từ file .pt
        in_features = vit.heads.head.in_features
        vit.heads = nn.Identity()
        self.backbone = vit
        self.projection = nn.Linear(in_features, embed_dim)
    
    def forward(self, x):
        feats = self.backbone(x)
        return self.projection(feats)

class PhoCLIP(nn.Module):
    def __init__(self, embed_dim=256, temperature=0.07):
        super().__init__()
        self.text_encoder = PhoBERTEncoder(embed_dim=embed_dim)
        self.image_encoder = ImageEncoder(embed_dim=embed_dim)
        self.temperature = nn.Parameter(torch.tensor(temperature))
    
    def forward(self, input_ids, attention_mask, images):
        # Hàm này lúc inference ít dùng, chủ yếu dùng 2 hàm con encode bên dưới
        txt = F.normalize(self.text_encoder(input_ids, attention_mask), p=2, dim=-1)
        img = F.normalize(self.image_encoder(images), p=2, dim=-1)
        return txt, img