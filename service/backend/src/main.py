import logging
from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from src.api.routes.campaigns import router as campaigns_router
from src.api.routes.health import router as health_router
from src.api.routes.messages import router as messages_router
from src.api.routes.sender_accounts import router as sender_accounts_router
from src.api.routes.view import router as view_router
from src.api.routes.workers import router as workers_router
from src.config import get_settings
from src.domain import models
from src.infrastructure.db.base import Base
from src.infrastructure.db.session import engine

app = FastAPI()
settings = get_settings()

logging.basicConfig(level=settings.log_level)

# Static files (css, js, images)
BASE_DIR = Path(__file__).resolve().parent
app.mount("/statics", StaticFiles(directory=BASE_DIR / "statics"), name="statics")

# Templates
templates = Jinja2Templates(directory="src/templates")

app.include_router(health_router)
app.include_router(view_router)
app.include_router(campaigns_router)
app.include_router(messages_router)
app.include_router(sender_accounts_router)
app.include_router(workers_router)


@app.on_event("startup")
def create_tables() -> None:
    Base.metadata.create_all(bind=engine)
