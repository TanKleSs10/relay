from __future__ import annotations

from datetime import datetime

from pydantic import ConfigDict, Field, PositiveInt

from src.api.schemas.base import APIModel
from src.domain import Provider, SenderAccountStatus


class SenderAccountBase(APIModel):
    provider: Provider | None = None
    phone_number: str | None = Field(default=None, min_length=3, max_length=50)
    status: SenderAccountStatus | None = None


class SenderAccountCreate(SenderAccountBase):
    qr_code: str | None = None
    session_id: str | None = Field(default=None, max_length=255)


class SenderAccountUpdate(APIModel):
    status: SenderAccountStatus | None = None
    qr_code: str | None = None
    session_id: str | None = Field(default=None, max_length=255)
    messages_sent_hour: int | None = Field(default=None, ge=0)
    last_used_at: datetime | None = None
    last_qr_at: datetime | None = None


class SenderAccountRead(SenderAccountBase):
    id: PositiveInt
    provider: Provider
    qr_code: str | None
    session_id: str | None
    messages_sent_hour: int = Field(ge=0)
    last_used_at: datetime | None
    last_qr_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
        extra="forbid",
        str_strip_whitespace=True,
        validate_assignment=True,
    )
