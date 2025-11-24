import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import HOST, PORT

# Import các routes
from app.routes import img2img_route 
# from app.routes import txt2img_route 
from app.routes import health

app = FastAPI(title="Fashion Search & Text2Img API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# app.include_router(txt2img_route.router)
app.include_router(img2img_route.router)
app.include_router(health.router)

@app.get("/")
def root():
    return {"message": "Model API is running correctly!"}

if __name__ == "__main__":
    uvicorn.run(app, host=HOST, port=PORT)