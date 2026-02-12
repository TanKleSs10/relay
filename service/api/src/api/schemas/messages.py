from pydantic import BaseModel, Field


class MessageCreate(BaseModel):
    recipient: str = Field(..., examples=["5590291873"])
    payload: str = Field(..., examples=["Hello, this is a test message"])
    campaign_id: int