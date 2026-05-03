from __future__ import annotations

from datetime import datetime

from pydantic import ConfigDict, Field, UUID4

from src.api.schemas.base import APIModel
from src.domain import WorkspaceMembershipRole


class WorkspaceBase(APIModel):
    name: str = Field(..., min_length=1, max_length=150)
    slug: str = Field(..., min_length=1, max_length=150)


class WorkspaceCreate(WorkspaceBase):
    is_active: bool = True


class WorkspaceUpdate(APIModel):
    name: str | None = Field(default=None, min_length=1, max_length=150)
    slug: str | None = Field(default=None, min_length=1, max_length=150)
    is_active: bool | None = None


class WorkspaceRead(WorkspaceBase):
    id: UUID4
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
        extra="forbid",
        str_strip_whitespace=True,
        validate_assignment=True,
    )


class WorkspaceMembershipCreate(APIModel):
    user_id: UUID4
    role: WorkspaceMembershipRole


class WorkspaceMembershipUpdate(APIModel):
    role: WorkspaceMembershipRole


class WorkspaceMembershipRead(APIModel):
    id: UUID4
    workspace_id: UUID4
    user_id: UUID4
    role: WorkspaceMembershipRole
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
        extra="forbid",
        str_strip_whitespace=True,
        validate_assignment=True,
    )
