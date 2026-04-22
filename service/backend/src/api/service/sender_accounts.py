from __future__ import annotations

from pathlib import Path
from shutil import rmtree
from sqlalchemy.orm import Session
from uuid import UUID

from src.api.schemas.sender_accounts import SenderAccountCreate, SenderAccountUpdate
from src.application.errors import ConflictError
from src.config import get_settings
from src.domain import (
    SenderAccount,
    SenderAccountStatus,
    SenderSession,
    SenderSessionHealth,
)
from uuid import UUID, uuid4

MAX_SENDER_ACCOUNTS = 8


def get_sender_accounts_by_status(
    db: Session, status: SenderAccountStatus
) -> list[SenderAccount]:
    return (
        db.query(SenderAccount)
        .filter(SenderAccount.status == status)
        .all()
    )


def list_sender_accounts(db: Session) -> list[SenderAccount]:
    return db.query(SenderAccount).order_by(SenderAccount.created_at.desc()).all()


def create_sender_account(
    db: Session, payload: SenderAccountCreate | None = None
) -> SenderAccount:
    sender_count = db.query(SenderAccount).count()
    if sender_count >= MAX_SENDER_ACCOUNTS:
        raise ConflictError(f"Sender limit reached (max {MAX_SENDER_ACCOUNTS})")

    label = None
    if payload:
        label = payload.label
    if not label:
        label = f"Sender {uuid4().hex[:8]}"
    sender = SenderAccount(
        label=label,
        status=SenderAccountStatus.CREATED,
        phone_number=None,
    )
    db.add(sender)
    return sender


def get_sender_account_by_id(db: Session, sender_id: UUID) -> SenderAccount | None:
    return db.query(SenderAccount).filter(SenderAccount.id == sender_id).first()


def delete_sender_account(db: Session, sender: SenderAccount) -> None:
    session_key = sender.session.session_key if sender.session else None
    db.delete(sender)
    if session_key:
        delete_sender_auth_dir(session_key)


def update_sender_account(
    db: Session, sender: SenderAccount, payload: SenderAccountUpdate
) -> SenderAccount:
    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(sender, field, value)
    return sender


def reset_sender_session(db: Session, sender: SenderAccount) -> SenderAccount:
    sender.status = SenderAccountStatus.WAITING_QR
    sender.phone_number = None
    new_session_key = f"sender-{sender.id}-{uuid4().hex[:8]}"
    session = sender.session
    if session is None:
        session = SenderSession(
            sender=sender,
            sender_account_id=sender.id,
            session_key=new_session_key,
            qr_code=None,
            qr_generated_at=None,
            last_ready_at=None,
            last_disconnect_at=None,
            disconnect_reason="manual reset",
            restart_count=1,
            health_status=SenderSessionHealth.HEALTHY,
            last_heartbeat_at=None,
            auth_dir=None,
            browser_pid=None,
            websocket_state=None,
        )
        db.add(session)
    else:
        session.session_key = new_session_key
        session.auth_dir = None
        session.browser_pid = None
        session.websocket_state = None
        session.qr_code = None
        session.qr_generated_at = None
        session.last_ready_at = None
        session.last_disconnect_at = None
        session.disconnect_reason = "manual reset"
        session.restart_count += 1
        session.health_status = SenderSessionHealth.HEALTHY
        session.last_heartbeat_at = None
    return sender


def delete_sender_auth_dir(session_key: str) -> None:
    auth_root = Path(get_settings().whatsapp_auth_path)
    session_dir = auth_root / f"session-{session_key}"
    rmtree(session_dir, ignore_errors=True)
