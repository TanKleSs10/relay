from __future__ import annotations
from src.api.schemas.messages import MessageCreate

from sqlalchemy.orm import Session
from src.domain import Message, MessageStatus

def create_messages(
        db: Session, 
        recipient: str,
        payload: str,
        campaign_id: int
    ) -> Message:
    message = Message(
        recipient=recipient,
        payload=payload,
        campaign_id=campaign_id,
        status=MessageStatus.QUEUED
    )
    db.add(message)
    return message