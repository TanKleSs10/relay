import logging
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from src.api.routes.campaigns import router as campaigns_router
from src.api.routes.health import router as health_router
from src.api.routes.metadata import router as metadata_router
from src.api.routes.messages import router as messages_router
from src.api.routes.sender_accounts import router as sender_accounts_router
from src.api.routes.auth import router as auth_router
from src.api.routes.users import router as users_router
from src.api.routes.roles import router as roles_router
from src.api.routes.permissions import router as permissions_router
from src.api.routes.reports import router as reports_router
from src.api.routes.workers import router as workers_router
from src.application.errors import (
    ConflictError,
    NotFoundError,
    ValidationError,
    UnauthorizedError,
)
from src.config import get_settings
from src.infrastructure.db.base import Base
from src.infrastructure.db.session import SessionLocal, engine
from src.infrastructure.db.seed import seed_default_data
from src.infrastructure.middleware.auth_middleware import auth_middleware

app = FastAPI()
settings = get_settings()

logging.basicConfig(level=settings.log_level)

app.include_router(health_router)
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(roles_router)
app.include_router(permissions_router)
app.include_router(reports_router)
app.include_router(campaigns_router)
app.include_router(messages_router)
app.include_router(sender_accounts_router)
app.include_router(workers_router)
app.include_router(metadata_router)


app.middleware("http")(auth_middleware)


@app.on_event("startup")
def create_tables() -> None:
    if settings.auto_create_schema:
        Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_default_data(db)
    finally:
        db.close()


@app.exception_handler(NotFoundError)
def not_found_handler(request: Request, exc: NotFoundError) -> JSONResponse:
    return JSONResponse(
        status_code=404,
        content={"detail": str(exc), "error": "not_found"},
    )


@app.exception_handler(ConflictError)
def conflict_handler(request: Request, exc: ConflictError) -> JSONResponse:
    return JSONResponse(
        status_code=409,
        content={"detail": str(exc), "error": "conflict"},
    )


@app.exception_handler(ValidationError)
def validation_handler(request: Request, exc: ValidationError) -> JSONResponse:
    return JSONResponse(
        status_code=400,
        content={"detail": str(exc), "error": "invalid_request"},
    )


@app.exception_handler(UnauthorizedError)
def unauthorized_handler(request: Request, exc: UnauthorizedError) -> JSONResponse:
    return JSONResponse(
        status_code=401,
        content={"detail": str(exc), "error": "unauthorized"},
    )


@app.exception_handler(Exception)
def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logging.exception("Unhandled error: %s", exc)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "error": "internal_error"},
    )
