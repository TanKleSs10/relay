from __future__ import annotations

from datetime import datetime

from pydantic import ConfigDict, UUID4

from src.api.schemas.base import APIModel


class PermissionRead(APIModel):
    id: UUID4
    code: str
    description: str | None = None

    model_config = ConfigDict(
        from_attributes=True,
        extra="forbid",
        str_strip_whitespace=True,
        validate_assignment=True,
    )


class RoleRead(APIModel):
    id: UUID4
    name: str
    created_at: datetime
    updated_at: datetime
    permissions: list[PermissionRead] = []

    model_config = ConfigDict(
        from_attributes=True,
        extra="forbid",
        str_strip_whitespace=True,
        validate_assignment=True,
    )
