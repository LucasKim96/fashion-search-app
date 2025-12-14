import torch

DEVICE_AVAILABLE = "cuda" if torch.cuda.is_available() else "cpu"
configurations = {
    1: dict(
        SEED = 1337,

        DATA_ROOT = '/home/khainq/data/DeepFashion52K',
        TRAIN_DIR = 'train',
        VAL_DIR = 'val',

        MODEL_ROOT = '/home/khainq/workspace_ngan/face.evoLVe/r50_softmax_augment/weights',
        LOG_ROOT = '/home/khainq/workspace_ngan/face.evoLVe/r50_softmax_augment/logs',
        BACKBONE_RESUME_ROOT = '',
        HEAD_RESUME_ROOT = '',

        BACKBONE_NAME = 'ResNet_50',
        HEAD_NAME = 'Softmax',
        LOSS_NAME = 'Softmax',

        INPUT_SIZE = [224, 224],
        RGB_MEAN = [0.5, 0.5, 0.5],
        RGB_STD = [0.5, 0.5, 0.5],
        EMBEDDING_SIZE = 512,
        BATCH_SIZE = 64,
        DROP_LAST = True,
        LR = 0.1,
        NUM_EPOCH = 210,
        WEIGHT_DECAY = 5e-4,
        MOMENTUM = 0.9,
        STAGES = [25, 40],

        DEVICE = torch.device(DEVICE_AVAILABLE),
        MULTI_GPU = False,
        GPU_ID = [0] if DEVICE_AVAILABLE == "cuda" else [],
        PIN_MEMORY = torch.cuda.is_available(),
        NUM_WORKERS = 4,
    ),
}
