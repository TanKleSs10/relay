from __future__ import annotations

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


def get_message_by_id(db: Session, message_id: int) -> Message | None:
    return db.query(Message).filter(Message.id == message_id).first()


def list_messages(db: Session, skip: int = 0, limit: int = 100) -> list[Message]:
    return (
        db.query(Message)
        .order_by(Message.id.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def delete_message(db: Session, message: Message) -> None:
    db.delete(message)
    db.commit()
