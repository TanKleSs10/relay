from __future__ import annotations

from datetime import datetime

from pydantic import ConfigDict, Field, UUID4, EmailStr

from src.api.schemas.base import APIModel
from src.domain import UserStatus


class UserBase(APIModel):
    email: EmailStr


class UserCreate(UserBase):
    password: str = Field(..., min_length=8)


class UserLogin(UserBase):
    password: str = Field(..., min_length=8)


class UserRead(UserBase):
    id: UUID4
    status: UserStatus
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
        extra="forbid",
        str_strip_whitespace=True,
        validate_assignment=True,
    )
