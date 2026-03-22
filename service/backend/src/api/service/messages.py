from __future__ import annotations

import hashlib
import re

from sqlalchemy.orm import Session
from uuid import UUID

from src.application.errors import ConflictError
from src.domain import Message, MessageStatus
from src.infrastructure.machine.message_machine import can_transition

def create_messages(
    db: Session,
    recipient: str,
    content: str,
    campaign_id: UUID,
    workspace_id: UUID,
    allow_duplicate: bool = False,
) -> Message | None:
    normalized_recipient = normalize_mx_recipient(recipient)
    idempotency_key = build_idempotency_key(normalized_recipient, content)
    existing = (
        db.query(Message)
        .filter(
            Message.campaign_id == campaign_id,
            Message.idempotency_key == idempotency_key,
        )
        .first()
    )
    if existing:
        if allow_duplicate:
            return None
        raise ConflictError("Duplicate message for this campaign")

    message = Message(
        recipient=normalized_recipient,
        content=content,
        campaign_id=campaign_id,
        workspace_id=workspace_id,
        idempotency_key=idempotency_key,
        status=MessageStatus.PENDING,
    )
    db.add(message)
    return message


def get_message_by_id(db: Session, message_id: UUID) -> Message | None:
    return db.query(Message).filter(Message.id == message_id).first()


def list_messages_filtered(
    db: Session,
    campaign_id: UUID | None = None,
    status: MessageStatus | None = None,
    skip: int = 0,
    limit: int = 100,
) -> list[Message]:
    query = db.query(Message)
    if campaign_id is not None:
        query = query.filter(Message.campaign_id == campaign_id)
    if status is not None:
        query = query.filter(Message.status == status)
    return (
        query.order_by(Message.id.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def count_messages_filtered(
    db: Session,
    campaign_id: UUID | None = None,
    status: MessageStatus | None = None,
) -> int:
    query = db.query(Message)
    if campaign_id is not None:
        query = query.filter(Message.campaign_id == campaign_id)
    if status is not None:
        query = query.filter(Message.status == status)
    return query.count()


def update_message_status(
    db: Session, message: Message, status: MessageStatus
) -> Message:
    if not can_transition(message.status, status):
        raise ConflictError(
            f"Invalid message status transition {message.status} -> {status}"
        )
    message.status = status
    return message


def update_message_error(
    db: Session, message: Message, error: str, increment_attempts: bool = True
) -> Message:
    if increment_attempts:
        message.retry_count += 1
    return message


def update_message(
    db: Session, message: Message, recipient: str | None, payload: str | None
) -> Message:
    next_recipient = normalize_mx_recipient(recipient) if recipient is not None else message.recipient
    next_content = payload if payload is not None else message.content

    if next_recipient != message.recipient or next_content != message.content:
        next_key = build_idempotency_key(next_recipient, next_content)
        existing = (
            db.query(Message)
            .filter(
                Message.campaign_id == message.campaign_id,
                Message.idempotency_key == next_key,
                Message.id != message.id,
            )
            .first()
        )
        if existing:
            raise ConflictError("Duplicate message for this campaign")
        message.idempotency_key = next_key
        message.recipient = next_recipient
        message.content = next_content
    return message


def delete_message(db: Session, message: Message) -> None:
    db.delete(message)


def delete_messages_by_campaign(db: Session, campaign_id: UUID) -> int:
    count = db.query(Message).filter(Message.campaign_id == campaign_id).delete()
    return count


def reset_messages_by_campaign(db: Session, campaign_id: UUID) -> int:
    count = (
        db.query(Message)
        .filter(
            Message.campaign_id == campaign_id,
            Message.status == MessageStatus.FAILED,
        )
        .update(
            {
                Message.status: MessageStatus.PENDING,
                Message.retry_count: 0,
                Message.sent_at: None,
            },
            synchronize_session=False,
        )
    )
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


def build_idempotency_key(recipient: str, content: str) -> str:
    base = f"{recipient}:{content.strip()}"
    return hashlib.sha256(base.encode("utf-8")).hexdigest()
