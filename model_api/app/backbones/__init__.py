from .model_resnet import ResNet_50, ResNet_101
from .model_vit import ViT_EvoLVe
from ..config import EMBEDDING_SIZE

def get_backbone(name: str, **kwargs):
    """
    Hàm factory để lấy instance của backbone model.
    
    Args:
        name (str): Tên của model (ví dụ: 'ResNet_50', 'ViT').
        **kwargs: Các tham số bổ sung cho constructor của model.

    Returns:
        torch.nn.Module: Instance của model.
    """
    if name == 'ResNet_50':
        return ResNet_50(input_size=kwargs.get('input_size'))
    
    elif name == 'ResNet_101':
        return ResNet_101(input_size=kwargs.get('input_size'))
        
    elif name == 'ViT':
        return ViT_EvoLVe(
            input_size=kwargs.get('input_size'),
            embedding_size=EMBEDDING_SIZE, # Lấy từ config
            pretrained=True # Mặc định là True
        )
        
    else:
        raise ValueError(f"Backbone '{name}' không được hỗ trợ.")