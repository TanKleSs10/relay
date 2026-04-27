from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    db_url: str = ""
    sql_echo: bool = False
    log_level: str = "INFO"
    auto_create_schema: bool = False
    cors_allowed_origins: str = (
        "http://localhost:5173,"
        "http://127.0.0.1:5173,"
        "https://relayengine.app,"
        "https://www.relayengine.app"
    )
    seed_superuser: bool = True
    superuser_username: str = "admin"
    superuser_email: str = "admin@relay.com"
    superuser_password: str = "admin123"
    jwt_secret: str = ""
    jwt_expires_minutes: int = 120
    jwt_cookie_name: str = "relay_access"
    jwt_cookie_secure: bool = False
    whatsapp_auth_path: str = "/app/.wwebjs_auth"
    cloudinary_cloud_name: str = ""
    cloudinary_api_key: str = ""
    cloudinary_api_secret: str = ""
    cloudinary_folder: str = "relay_engine"
    media_max_images_per_campaign: int = 5
    media_max_image_bytes: int = 10 * 1024 * 1024
    media_allowed_image_formats: str = "jpg,jpeg,png,webp"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    if not settings.db_url:
        raise RuntimeError("DB_URL environment variable is not set")
    if not settings.jwt_secret:
        raise RuntimeError("JWT_SECRET environment variable is not set")
    return settings


def get_cors_allowed_origins(settings: Settings) -> list[str]:
    return [
        origin.strip()
        for origin in settings.cors_allowed_origins.split(",")
        if origin.strip()
    ]
