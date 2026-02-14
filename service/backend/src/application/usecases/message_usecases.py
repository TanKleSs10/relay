from __future__ import annotations

from sqlalchemy.orm import Session

from src.api.schemas.messages import MessageCreate, MessageUpdate
from src.api.service.campaigns import get_campaign_by_id
from src.api.service.messages import (
    create_messages,
    delete_message,
    get_message_by_id,
    list_messages,
    update_message,
)
from src.domain.models import Message


def create_message(db: Session, payload: MessageCreate) -> Message:
    campaign = get_campaign_by_id(db, payload.campaign_id)
    if not campaign:
        raise ValueError("Campaign not found")

    message = create_messages(
        db,
        recipient=payload.recipient,
        payload=payload.payload,
        campaign_id=payload.campaign_id,
    )
    db.commit()
    db.refresh(message)
    return message


def get_messages(db: Session):
    return list_messages(db)


def get_message(message_id: int, db: Session):
    message = get_message_by_id(db, message_id)
    if not message:
        raise ValueError("Message not found")
    return message


def remove_message(message_id: int, db: Session):
    message = get_message_by_id(db, message_id)
    if not message:
        raise ValueError("Message not found")
    delete_message(db, message)


def update_message_item(message_id: int, payload: MessageUpdate, db: Session) -> Message:
    message = get_message_by_id(db, message_id)
    if not message:
        raise ValueError("Message not found")
    return update_message(db, message, payload.recipient, payload.payload)
