from __future__ import annotations

from datetime import datetime

from pydantic import ConfigDict, Field, PositiveInt

from src.api.schemas.base import APIModel
from src.domain import SenderAccountStatus


class SenderAccountBase(APIModel):
    phone_number: str | None = Field(default=None, min_length=3, max_length=50)
    status: SenderAccountStatus | None = None


class SenderAccountCreate(SenderAccountBase):
    qr_code: str | None = None
    session_path: str | None = Field(default=None, max_length=255)


class SenderAccountUpdate(APIModel):
    status: SenderAccountStatus | None = None
    qr_code: str | None = None
    session_path: str | None = Field(default=None, max_length=255)
    qr_generated_at: datetime | None = None
    cooldown_until: datetime | None = None
    last_sent_at: datetime | None = None


class SenderAccountRead(SenderAccountBase):
    id: PositiveInt
    qr_code: str | None
    qr_generated_at: datetime | None
    session_path: str | None
    cooldown_until: datetime | None
    last_sent_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
        extra="forbid",
        str_strip_whitespace=True,
        validate_assignment=True,
    )
