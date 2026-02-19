from __future__ import annotations

from fastapi import APIRouter

from src.api.schemas.metadata import EnumIndex
from src.domain.enums import enum_values

router = APIRouter(prefix="/metadata", tags=["metadata"])


@router.get("/enums", response_model=EnumIndex)
def list_enums() -> EnumIndex:
    return EnumIndex(enums=enum_values())
