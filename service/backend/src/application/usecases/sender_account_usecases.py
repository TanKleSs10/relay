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
    request_sender_qr,
    reset_sender_session,
    update_sender_account,
)
from src.domain import SenderAccount
from src.domain.models import User
from src.security.auth import get_accessible_workspace_ids, resolve_workspace_id


def create_sender(
    db: Session,
    actor: User,
    payload: SenderAccountCreate | None = None,
) -> SenderAccount:
    try:
        target_workspace_id = resolve_workspace_id(
            actor,
            payload.workspace_id if payload else None,
            db,
        )
        effective_payload = (
            payload.model_copy(update={"workspace_id": target_workspace_id})
            if payload
            else SenderAccountCreate(workspace_id=target_workspace_id)
        )
        sender = create_sender_account(db, effective_payload)
        db.commit()
        db.refresh(sender)
        return sender
    except Exception as exc:
        db.rollback()
        raise exc


def list_senders(db: Session, actor: User) -> list[SenderAccount]:
    return list_sender_accounts(db, get_accessible_workspace_ids(actor, db))


def get_sender(sender_id: UUID, db: Session, actor: User) -> SenderAccount:
    sender = get_sender_account_by_id(
        db,
        sender_id,
        workspace_ids=get_accessible_workspace_ids(actor, db),
    )
    if not sender:
        raise NotFoundError("Sender account not found")
    return sender


def remove_sender(sender_id: UUID, db: Session, actor: User) -> None:
    sender = get_sender_account_by_id(
        db,
        sender_id,
        workspace_ids=get_accessible_workspace_ids(actor, db),
    )
    if not sender:
        raise NotFoundError("Sender account not found")
    try:
        delete_sender_account(db, sender)
        db.commit()
    except Exception as exc:
        db.rollback()
        raise exc


def update_sender(
    sender_id: UUID,
    payload: SenderAccountUpdate,
    db: Session,
    actor: User,
) -> SenderAccount:
    sender = get_sender_account_by_id(
        db,
        sender_id,
        workspace_ids=get_accessible_workspace_ids(actor, db),
    )
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


def reset_sender(sender_id: UUID, db: Session, actor: User) -> SenderAccount:
    sender = get_sender_account_by_id(
        db,
        sender_id,
        workspace_ids=get_accessible_workspace_ids(actor, db),
    )
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


def request_sender_qr_code(sender_id: UUID, db: Session, actor: User) -> SenderAccount:
    sender = get_sender_account_by_id(
        db,
        sender_id,
        workspace_ids=get_accessible_workspace_ids(actor, db),
    )
    if not sender:
        raise NotFoundError("Sender account not found")
    try:
        sender = request_sender_qr(db, sender)
        db.commit()
        db.refresh(sender)
        return sender
    except Exception as exc:
        db.rollback()
        raise exc
