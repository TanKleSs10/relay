from __future__ import annotations

from datetime import datetime

from pydantic import ConfigDict, Field, UUID4

from src.api.schemas.base import APIModel
from src.domain import SenderAccountStatus


class SenderAccountBase(APIModel):
    label: str | None = Field(default=None, min_length=1, max_length=150)
    phone_number: str | None = Field(default=None, min_length=3, max_length=50)
    status: SenderAccountStatus | None = None


class SenderAccountCreate(SenderAccountBase):
    pass


class SenderAccountUpdate(APIModel):
    status: SenderAccountStatus | None = None
    cooldown_until: datetime | None = None
    last_sent_at: datetime | None = None


class SenderAccountRead(SenderAccountBase):
    id: UUID4
    workspace_id: UUID4
    label: str
    cooldown_until: datetime | None
    last_sent_at: datetime | None
    last_seen_at: datetime | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
        extra="forbid",
        str_strip_whitespace=True,
        validate_assignment=True,
    )
