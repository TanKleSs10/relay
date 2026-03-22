from __future__ import annotations

from sqlalchemy.orm import Session
from uuid import UUID

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
from src.api.service.workspaces import get_default_workspace_id
from src.domain import SenderAccount


def create_sender(db: Session, payload: SenderAccountCreate | None = None) -> SenderAccount:
    try:
        workspace_id = get_default_workspace_id(db)
        sender = create_sender_account(db, workspace_id, payload)
        db.commit()
        db.refresh(sender)
        return sender
    except Exception as exc:
        db.rollback()
        raise exc


def list_senders(db: Session) -> list[SenderAccount]:
    return list_sender_accounts(db)


def get_sender(sender_id: UUID, db: Session) -> SenderAccount:
    sender = get_sender_account_by_id(db, sender_id)
    if not sender:
        raise NotFoundError("Sender account not found")
    return sender


def remove_sender(sender_id: UUID, db: Session) -> None:
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
    sender_id: UUID, payload: SenderAccountUpdate, db: Session
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


def reset_sender(sender_id: UUID, db: Session) -> SenderAccount:
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
