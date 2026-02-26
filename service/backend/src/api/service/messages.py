from __future__ import annotations

import re

from sqlalchemy.orm import Session

from src.domain import Message, MessageStatus

def create_messages(
    db: Session,
    recipient: str,
    payload: str,
    campaign_id: int
) -> Message:
    message = Message(
        recipient=normalize_mx_recipient(recipient),
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


def list_messages_by_campaign(
    db: Session, campaign_id: int, skip: int = 0, limit: int = 100
) -> list[Message]:
    return (
        db.query(Message)
        .filter(Message.campaign_id == campaign_id)
        .order_by(Message.id.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def list_messages_by_status(
    db: Session, status: MessageStatus, skip: int = 0, limit: int = 100
) -> list[Message]:
    return (
        db.query(Message)
        .filter(Message.status == status)
        .order_by(Message.id.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def update_message_status(
    db: Session, message: Message, status: MessageStatus
) -> Message:
    message.status = status
    return message


def update_message_error(
    db: Session, message: Message, error: str, increment_attempts: bool = True
) -> Message:
    message.last_error = error
    if increment_attempts:
        message.attempts += 1
    return message


def update_message(db: Session, message: Message, recipient: str | None, payload: str | None) -> Message:
    if recipient is not None:
        message.recipient = normalize_mx_recipient(recipient)
    if payload is not None:
        message.payload = payload
    return message


def delete_message(db: Session, message: Message) -> None:
    db.delete(message)


def delete_messages_by_campaign(db: Session, campaign_id: int) -> int:
    count = db.query(Message).filter(Message.campaign_id == campaign_id).delete()
    return count


def normalize_mx_recipient(recipient: str) -> str:
    digits = re.sub(r"\D", "", recipient)
    if len(digits) == 10:
        return f"521{digits}"
    if len(digits) == 12 and digits.startswith("52") and not digits.startswith("521"):
        return f"521{digits[2:]}"
    if len(digits) == 13 and digits.startswith("521"):
        return digits
    return digits or recipient
