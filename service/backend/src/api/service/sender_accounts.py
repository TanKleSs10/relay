from __future__ import annotations

from pathlib import Path
from shutil import rmtree
from uuid import UUID, uuid4

from sqlalchemy import func
from sqlalchemy.orm import Session

from src.api.schemas.sender_accounts import SenderAccountCreate, SenderAccountUpdate
from src.application.errors import ConflictError
from src.config import get_settings
from src.domain import (
    SenderAccount,
    SenderAccountStatus,
    SenderSession,
    SenderSessionHealth,
)

MAX_SENDER_ACCOUNTS_PER_WORKSPACE = 4


def get_sender_accounts_by_status(
    db: Session,
    status: SenderAccountStatus,
    workspace_ids: list[UUID] | None = None,
) -> list[SenderAccount]:
    query = db.query(SenderAccount).filter(SenderAccount.status == status)
    if workspace_ids is not None:
        query = query.filter(SenderAccount.workspace_id.in_(workspace_ids))
    return query.all()


def list_sender_accounts(
    db: Session,
    workspace_ids: list[UUID],
) -> list[SenderAccount]:
    return (
        db.query(SenderAccount)
        .filter(SenderAccount.workspace_id.in_(workspace_ids))
        .order_by(SenderAccount.created_at.desc())
        .all()
    )


def create_sender_account(
    db: Session,
    payload: SenderAccountCreate,
) -> SenderAccount:
    sender_count = (
        db.query(func.count(SenderAccount.id))
        .filter(SenderAccount.workspace_id == payload.workspace_id)
        .scalar()
        or 0
    )
    if sender_count >= MAX_SENDER_ACCOUNTS_PER_WORKSPACE:
        raise ConflictError(
            f"Sender limit reached for this workspace (max {MAX_SENDER_ACCOUNTS_PER_WORKSPACE})"
        )

    label = None
    if payload:
        label = payload.label
    if not label:
        label = f"Sender {uuid4().hex[:8]}"
    sender = SenderAccount(
        label=label,
        status=SenderAccountStatus.CREATED,
        phone_number=None,
        workspace_id=payload.workspace_id,
    )
    db.add(sender)
    return sender


def get_sender_account_by_id(
    db: Session,
    sender_id: UUID,
    workspace_ids: list[UUID] | None = None,
) -> SenderAccount | None:
    query = db.query(SenderAccount).filter(SenderAccount.id == sender_id)
    if workspace_ids is not None:
        query = query.filter(SenderAccount.workspace_id.in_(workspace_ids))
    return query.first()


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
    previous_session_key = sender.session.session_key if sender.session else None
    sender.status = SenderAccountStatus.QR_REQUESTED
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
    if previous_session_key:
        delete_sender_auth_dir(previous_session_key)
    return sender


def request_sender_qr(db: Session, sender: SenderAccount) -> SenderAccount:
    if sender.status in {
        SenderAccountStatus.CONNECTED,
        SenderAccountStatus.IDLE,
        SenderAccountStatus.SENDING,
        SenderAccountStatus.AUTHENTICATING,
        SenderAccountStatus.CONNECTING,
    }:
        raise ConflictError("Sender does not require QR")

    if sender.status == SenderAccountStatus.WAITING_QR and sender.session and sender.session.qr_code:
        return sender

    sender.status = SenderAccountStatus.QR_REQUESTED
    sender.phone_number = None
    session = sender.session
    if session is None:
        session = SenderSession(
            sender=sender,
            sender_account_id=sender.id,
            session_key=f"sender-{sender.id}",
            qr_code=None,
            qr_generated_at=None,
            last_ready_at=None,
            last_disconnect_at=None,
            disconnect_reason=None,
            restart_count=0,
            health_status=SenderSessionHealth.HEALTHY,
            last_heartbeat_at=None,
            auth_dir=None,
            browser_pid=None,
            websocket_state=None,
        )
        db.add(session)
        return sender

    session.qr_code = None
    session.qr_generated_at = None
    return sender


def delete_sender_auth_dir(session_key: str) -> None:
    auth_root = Path(get_settings().whatsapp_auth_path)
    session_dir = auth_root / f"session-{session_key}"
    rmtree(session_dir, ignore_errors=True)
