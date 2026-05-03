from __future__ import annotations

from datetime import datetime

from pydantic import AliasChoices, ConfigDict, EmailStr, Field, UUID4, field_validator

from src.api.schemas.base import APIModel
from src.domain import UserStatus, WorkspaceMembershipRole


class UserWorkspaceMembershipCreate(APIModel):
    workspace_id: UUID4
    role: WorkspaceMembershipRole


class UserWorkspaceMembershipRead(APIModel):
    workspace_id: UUID4
    role: WorkspaceMembershipRole


class UserCreate(APIModel):
    username: str = Field(..., min_length=3, max_length=80)
    email: EmailStr
    password: str = Field(..., min_length=8)
    workspace_id: UUID4 | None = None
    memberships: list[UserWorkspaceMembershipCreate] = Field(default_factory=list)


class UserLogin(APIModel):
    email: EmailStr
    password: str = Field(..., min_length=8)


class UserRead(APIModel):
    id: UUID4
    username: str
    email: EmailStr
    status: UserStatus
    roles: list[str] = Field(default_factory=list)
    workspace_ids: list[UUID4] = Field(
        default_factory=list,
        validation_alias=AliasChoices("workspace_ids", "memberships"),
    )
    workspace_memberships: list[UserWorkspaceMembershipRead] = Field(
        default_factory=list,
        validation_alias=AliasChoices("workspace_memberships", "memberships"),
    )
    created_at: datetime

    @field_validator("roles", mode="before")
    @classmethod
    def normalize_roles(cls, value):  # noqa: ANN001
        if not value:
            return []
        if isinstance(value, list):
            names: list[str] = []
            for item in value:
                if isinstance(item, str):
                    names.append(item)
                    continue
                role = getattr(item, "role", None)
                name = getattr(role, "name", None)
                if isinstance(name, str) and name:
                    names.append(name)
            return names
        return []

    @field_validator("workspace_ids", mode="before")
    @classmethod
    def normalize_workspace_ids(cls, value):  # noqa: ANN001
        if not value:
            return []
        if isinstance(value, list):
            ids: list[str] = []
            for item in value:
                if isinstance(item, str):
                    ids.append(item)
                    continue
                workspace_id = getattr(item, "workspace_id", None)
                if workspace_id:
                    ids.append(str(workspace_id))
            return ids
        return []

    @field_validator("workspace_memberships", mode="before")
    @classmethod
    def normalize_workspace_memberships(cls, value):  # noqa: ANN001
        if not value:
            return []
        if isinstance(value, list):
            memberships: list[dict[str, str]] = []
            for item in value:
                workspace_id = getattr(item, "workspace_id", None)
                role = getattr(item, "role", None)
                if workspace_id and role:
                    memberships.append(
                        {
                            "workspace_id": str(workspace_id),
                            "role": role.value if hasattr(role, "value") else str(role),
                        }
                    )
            return memberships
        return []

    model_config = ConfigDict(
        from_attributes=True,
        extra="forbid",
        str_strip_whitespace=True,
        validate_assignment=True,
    )


class UserStatusUpdate(APIModel):
    status: UserStatus


class UserUpdate(APIModel):
    username: str | None = Field(default=None, min_length=3, max_length=80)
    email: EmailStr | None = None
