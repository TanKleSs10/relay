from __future__ import annotations

from datetime import datetime

from pydantic import ConfigDict, EmailStr, Field, UUID4, field_validator

from src.api.schemas.base import APIModel
from src.domain import UserStatus


class UserCreate(APIModel):
    username: str = Field(..., min_length=3, max_length=80)
    email: EmailStr
    password: str = Field(..., min_length=8)


class UserLogin(APIModel):
    email: EmailStr
    password: str = Field(..., min_length=8)


class UserRead(APIModel):
    id: UUID4
    username: str
    email: EmailStr
    status: UserStatus
    roles: list[str] = Field(default_factory=list)
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
