import torch
import torch.nn as nn
import torchvision.models as models

class ViT_EvoLVe(nn.Module):
    def __init__(self, input_size=[224, 224], embedding_size=512, pretrained=True):
        super(ViT_EvoLVe, self).__init__()

        # Load ViT-Base
        # Mặc định dùng ImageNet weights
        if pretrained:
            self.backbone = models.vit_b_16(weights=models.ViT_B_16_Weights.DEFAULT)
        else:
            self.backbone = models.vit_b_16(weights=None)

        # Bỏ lớp phân loại
        self.backbone.heads = nn.Identity()

        # Feature dim chuẩn của ViT-Base là 768
        self.feature_dim = 768

        # Output layer: Giảm chiều về 512 + BatchNorm giúp hội tụ tốt hơn trên ArcFace
        self.output_layer = nn.Sequential(
            nn.BatchNorm1d(self.feature_dim),
            nn.Dropout(p=0.4),
            nn.Linear(self.feature_dim, embedding_size),
            nn.BatchNorm1d(embedding_size)
        )

    def forward(self, x):
        # ViT trả về [Batch, 768]
        features = self.backbone(x)
        # Nén xuống [Batch, 512]
        embedding = self.output_layer(features)
        return embedding