from pathlib import Path
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from src.api.routes.health import router as health_router
from src.api.routes.view import router as view_router

app = FastAPI()

# Static files (css, js, images)
BASE_DIR = Path(__file__).resolve().parent
app.mount("/statics", StaticFiles(directory=BASE_DIR / "statics"), name="statics")

# Templates
templates = Jinja2Templates(directory="src/templates")

app.include_router(health_router)
app.include_router(view_router)
