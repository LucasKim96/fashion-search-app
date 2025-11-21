from fastapi import FastAPI
from app.routes import txt2img_route, img2img_route, health

app = FastAPI(title="Model API")

# include routers
app.include_router(txt2img_route.router)
app.include_router(img2img_route.router)
app.include_router(health.router)

@app.get("/")
def root():
    return {"message": "Model API is running"}
