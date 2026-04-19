from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    db_url: str = ""
    sql_echo: bool = False
    log_level: str = "INFO"
    auto_create_schema: bool = False
    seed_superuser: bool = True
    superuser_username: str = "admin"
    superuser_email: str = "admin@relay.com"
    superuser_password: str = "admin123"
    jwt_secret: str = ""
    jwt_expires_minutes: int = 120
    jwt_cookie_name: str = "relay_access"
    jwt_cookie_secure: bool = False

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
