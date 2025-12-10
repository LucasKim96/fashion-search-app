# E:\LuanVanTotNghiep\fashion-search-app\model_api\app\main.py

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.config import HOST, PORT
from app.utils.logger import logger

# --- 1. Import các service và factory cần thiết ---
from app.services.img2img_service import Img2ImgService
# Giả sử bạn đã tạo file factory như hướng dẫn trước
from app.services import get_index_service_instance 

# Import các routes
from app.routes import img2img_route 
from app.routes import txt2img_route
from app.routes import health

# --- 2. Định nghĩa Lifespan Manager ---
# Đây là nơi các model và service sẽ được load KHI và CHỈ KHI ứng dụng khởi động
@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- Logic thực thi khi startup ---
    logger.info("--- Application Startup ---")
    logger.info("Initializing services and loading models...")
    
    # Khởi tạo Img2ImgService (sẽ tự load YOLO và backbone được cấu hình)
    img2img_service = Img2ImgService()
    
    # Dùng factory để khởi tạo IndexService (sẽ tự load đúng file index)
    index_service = get_index_service_instance()
    
    # Gắn các service vào state của ứng dụng để các route có thể truy cập
    app.state.img2img_service = img2img_service
    app.state.index_service = index_service
    
    logger.info("Services initialized and models loaded successfully.")
    
    yield  # Ứng dụng sẽ chạy và xử lý request ở đây
    
    # --- Logic thực thi khi shutdown ---
    logger.info("--- Application Shutdown ---")
    # (Ví dụ: dọn dẹp, đóng kết nối,...)


# --- 3. Khởi tạo FastAPI app với lifespan manager ---
app = FastAPI(
    title="Fashion Search & Text2Img API",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(txt2img_route.router, prefix="/txt2img", tags=["Text-to-Image Search"])
app.include_router(img2img_route.router)
app.include_router(health.router)

@app.get("/")
def root():
    return {"message": "Model API is running correctly!"}

if __name__ == "__main__":
    uvicorn.run(app, host=HOST, port=PORT)