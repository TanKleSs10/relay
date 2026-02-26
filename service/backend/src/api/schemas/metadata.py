from __future__ import annotations

from src.api.schemas.base import APIModel


class EnumIndex(APIModel):
    enums: dict[str, list[str]]
