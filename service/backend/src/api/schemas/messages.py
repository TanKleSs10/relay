from datetime import datetime

from pydantic import ConfigDict, Field, PositiveInt

from src.api.schemas.base import APIModel
from src.domain import MessageStatus


class MessageCreate(APIModel):
    recipient: str = Field(..., min_length=3, max_length=50, examples=["5590291873"])
    content: str = Field(..., min_length=1, examples=["Hello, this is a test message"])
    campaign_id: PositiveInt


class MessageRead(APIModel):
    id: PositiveInt
    campaign_id: PositiveInt
    recipient: str
    content: str
    idempotency_key: str | None = None
    status: MessageStatus
    processing_by_worker: PositiveInt | None = None
    processing_sender_id: PositiveInt | None = None
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
