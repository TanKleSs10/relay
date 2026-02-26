from datetime import datetime

from pydantic import ConfigDict, Field, PositiveInt

from src.api.schemas.base import APIModel
from src.domain import MessageStatus


class MessageCreate(APIModel):
    recipient: str = Field(..., min_length=3, max_length=50, examples=["5590291873"])
    payload: str = Field(..., min_length=1, examples=["Hello, this is a test message"])
    campaign_id: PositiveInt


class MessageRead(APIModel):
    id: PositiveInt
    campaign_id: PositiveInt
    recipient: str
    payload: str
    status: MessageStatus
    attempts: int
    last_error: str | None
    created_at: datetime
    sent_at: datetime | None

    model_config = ConfigDict(
        from_attributes=True,
        extra="forbid",
        str_strip_whitespace=True,
        validate_assignment=True,
    )


class MessageUpdate(APIModel):
    recipient: str | None = Field(default=None, min_length=3, max_length=50)
    payload: str | None = Field(default=None, min_length=1)
