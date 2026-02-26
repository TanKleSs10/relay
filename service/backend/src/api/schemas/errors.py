from __future__ import annotations

from src.api.schemas.base import APIModel


class ErrorResponse(APIModel):
    detail: str
    error: str
