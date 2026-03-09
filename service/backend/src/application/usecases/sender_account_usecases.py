from __future__ import annotations

from sqlalchemy.orm import Session

from src.api.schemas.sender_accounts import SenderAccountCreate, SenderAccountUpdate
from src.application.errors import NotFoundError
from src.api.service.sender_accounts import (
    create_sender_account,
    delete_sender_account,
    get_sender_account_by_id,
    list_sender_accounts,
    reset_sender_session,
    update_sender_account,
)
from src.domain import SenderAccount


def create_sender(db: Session, payload: SenderAccountCreate | None = None) -> SenderAccount:
    try:
        sender = create_sender_account(db, payload)
        db.commit()
        db.refresh(sender)
        return sender
    except Exception as exc:
        db.rollback()
        raise exc


def list_senders(db: Session) -> list[SenderAccount]:
    return list_sender_accounts(db)


def get_sender(sender_id: int, db: Session) -> SenderAccount:
    sender = get_sender_account_by_id(db, sender_id)
    if not sender:
        raise NotFoundError("Sender account not found")
    return sender


def remove_sender(sender_id: int, db: Session) -> None:
    sender = get_sender_account_by_id(db, sender_id)
    if not sender:
        raise NotFoundError("Sender account not found")
    try:
        delete_sender_account(db, sender)
        db.commit()
    except Exception as exc:
        db.rollback()
        raise exc


def update_sender(
    sender_id: int, payload: SenderAccountUpdate, db: Session
) -> SenderAccount:
    sender = get_sender_account_by_id(db, sender_id)
    if not sender:
        raise NotFoundError("Sender account not found")
    try:
        sender = update_sender_account(db, sender, payload)
        db.commit()
        db.refresh(sender)
        return sender
    except Exception as exc:
        db.rollback()
        raise exc


def reset_sender(sender_id: int, db: Session) -> SenderAccount:
    sender = get_sender_account_by_id(db, sender_id)
    if not sender:
        raise NotFoundError("Sender account not found")
    try:
        sender = reset_sender_session(db, sender)
        db.commit()
        db.refresh(sender)
        return sender
    except Exception as exc:
        db.rollback()
        raise exc
