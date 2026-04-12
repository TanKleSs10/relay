from datetime import datetime

from pydantic import ConfigDict, Field, UUID4

from src.api.schemas.base import APIModel
from src.domain import MessageStatus


class MessageCreate(APIModel):
    recipient: str = Field(..., min_length=3, max_length=50, examples=["5590291873"])
    content: str = Field(..., min_length=1, examples=["Hello, this is a test message"])
    external_id: str | None = Field(default=None, max_length=120)
    campaign_id: UUID4


class MessageRead(APIModel):
    id: UUID4
    campaign_id: UUID4
    recipient: str
    content: str
    external_id: str | None = None
    idempotency_key: str | None = None
    status: MessageStatus
    processing_by_worker: UUID4 | None = None
    processing_sender_id: UUID4 | None = None
    locked_at: datetime | None
    created_at: datetime
    updated_at: datetime
    sent_at: datetime | None
    retry_count: int

    model_config = ConfigDict(
        from_attributes=True,
        extra="forbid",
        str_strip_whitespace=True,
        validate_assignment=True,
    )


class MessageUpdate(APIModel):
    recipient: str | None = Field(default=None, min_length=3, max_length=50)
    content: str | None = Field(default=None, min_length=1)
