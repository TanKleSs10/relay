from __future__ import annotations

from sqlalchemy.orm import Session

from src.api.schemas.messages import MessageCreate, MessageUpdate
from src.application.errors import NotFoundError
from src.api.service.campaigns import get_campaign_by_id
from src.api.service.messages import (
    create_messages,
    delete_message,
    get_message_by_id,
    list_messages_filtered,
    update_message,
)
from src.domain import MessageStatus
from src.domain.models import Message


def create_message(db: Session, payload: MessageCreate) -> Message:
    campaign = get_campaign_by_id(db, payload.campaign_id)
    if not campaign:
        raise NotFoundError("Campaign not found")

    try:
        message = create_messages(
            db,
            recipient=payload.recipient,
            content=payload.content,
            campaign_id=payload.campaign_id,
        )
        db.commit()
        db.refresh(message)
        return message
    except Exception as exc:
        db.rollback()
        raise exc


def get_messages(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    campaign_id: int | None = None,
    status: MessageStatus | None = None,
):
    return list_messages_filtered(
        db, campaign_id=campaign_id, status=status, skip=skip, limit=limit
    )


def get_message(message_id: int, db: Session):
    message = get_message_by_id(db, message_id)
    if not message:
        raise NotFoundError("Message not found")
    return message


def remove_message(message_id: int, db: Session):
    message = get_message_by_id(db, message_id)
    if not message:
        raise NotFoundError("Message not found")
    try:
        delete_message(db, message)
        db.commit()
    except Exception as exc:
        db.rollback()
        raise exc


def update_message_item(message_id: int, payload: MessageUpdate, db: Session) -> Message:
    message = get_message_by_id(db, message_id)
    if not message:
        raise NotFoundError("Message not found")
    try:
        message = update_message(db, message, payload.recipient, payload.content)
        db.commit()
        db.refresh(message)
        return message
    except Exception as exc:
        db.rollback()
        raise exc
