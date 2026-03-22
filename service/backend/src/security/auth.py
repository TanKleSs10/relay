from __future__ import annotations

from fastapi import Request

from src.application.errors import UnauthorizedError
from src.domain import User


def get_current_user(request: Request) -> User | None:
    return getattr(request.state, "user", None)


def require_user(request: Request) -> User:
    user = get_current_user(request)
    if not user:
        raise UnauthorizedError("Unauthorized")
    return user
