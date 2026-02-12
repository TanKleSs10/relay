from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from src.domain import MessageStatus


class MessageCreate(BaseModel):
    recipient: str = Field(..., examples=["5590291873"])
    payload: str = Field(..., examples=["Hello, this is a test message"])
    campaign_id: int


class MessageRead(BaseModel):
    id: int
    campaign_id: int
    recipient: str
    payload: str
    status: MessageStatus
    attempts: int
    last_error: str | None
    created_at: datetime
    sent_at: datetime | None

    model_config = ConfigDict(from_attributes=True)
