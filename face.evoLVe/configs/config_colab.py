import torch

DEVICE_AVAILABLE = "cuda" if torch.cuda.is_available() else "cpu"
configurations = {
    1: dict(
        SEED = 1337,

        DATA_ROOT = '/content/DeepFashion_dataset_split',
        TRAIN_DIR = 'train',
        VAL_DIR = 'val',

        MODEL_ROOT = '/content/drive/MyDrive/LuanVanTN/Model_Arcface/17face_evoLVe_models',
        LOG_ROOT = '/content/drive/MyDrive/LuanVanTN/Model_Arcface/17face_evoLVe_logs',
        BACKBONE_RESUME_ROOT = '',
        HEAD_RESUME_ROOT = '',

        BACKBONE_NAME = 'ResNet_50',
        HEAD_NAME = 'ArcFace',
        LOSS_NAME = 'Focal',

        INPUT_SIZE = [224, 224],
        RGB_MEAN = [0.5, 0.5, 0.5],
        RGB_STD = [0.5, 0.5, 0.5],
        EMBEDDING_SIZE = 512,
        BATCH_SIZE = 64,
        DROP_LAST = False,
        LR = 0.1,
        NUM_EPOCH = 200,
        WEIGHT_DECAY = 5e-4,
        MOMENTUM = 0.9,
        STAGES = [25, 40],

        DEVICE = torch.device(DEVICE_AVAILABLE),
        MULTI_GPU = False,
        GPU_ID = [0] if DEVICE_AVAILABLE == "cuda" else [],
        PIN_MEMORY = torch.cuda.is_available(),
        NUM_WORKERS = 2,
    ),
}
