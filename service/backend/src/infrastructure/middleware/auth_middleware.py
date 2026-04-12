from __future__ import annotations

from uuid import UUID

from fastapi import Request

from src.config import get_settings
from src.domain import User, UserStatus
from src.infrastructure.db.session import SessionLocal
from src.security.jwt import try_decode_token


async def auth_middleware(request: Request, call_next):
    settings = get_settings()
    token = request.cookies.get(settings.jwt_cookie_name)
    request.state.user = None
    if token:
        try:
            payload = try_decode_token(token, settings.jwt_secret)
            user_id = payload.get("sub")
            if user_id:
                db = SessionLocal()
                try:
                    user = db.query(User).filter(User.id == UUID(user_id)).first()
                    if user and user.status == UserStatus.ACTIVE:
                        request.state.user = user
                finally:
                    db.close()
        except Exception:
            request.state.user = None
    return await call_next(request)
