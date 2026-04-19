from __future__ import annotations

from fastapi import APIRouter, Depends

from src.api.schemas.metadata import EnumIndex
from src.domain.enums import enum_values
from src.security.auth import require_admin

router = APIRouter(prefix="/metadata", tags=["metadata"])


@router.get("/enums", response_model=EnumIndex)
def list_enums(_: object = Depends(require_admin)) -> EnumIndex:
    return EnumIndex(enums=enum_values())
