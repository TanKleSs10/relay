from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict

from src.domain import Provider, SenderAccountStatus


class SenderAccountBase(BaseModel):
    provider: Provider | None = None
    phone_number: str | None = None
    status: SenderAccountStatus | None = None


class SenderAccountCreate(SenderAccountBase):
    qr_code: str | None = None
    session_id: str | None = None


class SenderAccountUpdate(BaseModel):
    status: SenderAccountStatus | None = None
    qr_code: str | None = None
    session_id: str | None = None
    messages_sent_hour: int | None = None
    last_used_at: datetime | None = None
    last_qr_at: datetime | None = None


class SenderAccountRead(SenderAccountBase):
    id: int
    provider: Provider
    qr_code: str | None
    session_id: str | None
    messages_sent_hour: int
    last_used_at: datetime | None
    last_qr_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
