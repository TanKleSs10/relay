from __future__ import annotations

from fastapi import Depends, Request
from sqlalchemy.orm import Session

from src.application.errors import UnauthorizedError
from src.config import get_settings
from src.domain import User, UserStatus
from src.infrastructure.db.session import SessionLocal
from src.security.jwt import decode_token


def get_current_user(request: Request) -> User | None:
    return getattr(request.state, "user", None)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def require_user(request: Request, db: Session = Depends(get_db)) -> User:
    user = get_current_user(request)
    if user and user.status == UserStatus.ACTIVE:
        return user

    settings = get_settings()
    token = request.cookies.get(settings.jwt_cookie_name)
    if not token:
        raise UnauthorizedError("Missing authentication token")

    payload = decode_token(token, settings.jwt_secret)
    user_id = payload.get("sub")
    if not user_id:
        raise UnauthorizedError("Invalid authentication token")

    user = db.query(User).filter(User.id == user_id).first()
    if not user or user.status != UserStatus.ACTIVE:
        raise UnauthorizedError("User not found or inactive")

    request.state.user = user
    return user


def require_admin(user: User = Depends(require_user)) -> User:
    for user_role in user.roles:
        if user_role.role and user_role.role.name == "ADMIN":
            return user
    raise UnauthorizedError("Admin access required")


def require_permission(permission_code: str):
    def _guard(user: User = Depends(require_user)) -> User:
        for user_role in user.roles:
            role = user_role.role
            if not role:
                continue
            for role_perm in role.permissions:
                if role_perm.permission and role_perm.permission.code == permission_code:
                    return user
        raise UnauthorizedError("Permission denied")

    return _guard
