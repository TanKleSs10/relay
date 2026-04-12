from __future__ import annotations

from datetime import datetime

from pydantic import ConfigDict, Field, UUID4, EmailStr

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
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
        extra="forbid",
        str_strip_whitespace=True,
        validate_assignment=True,
    )


class UserStatusUpdate(APIModel):
    status: UserStatus
