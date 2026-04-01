from __future__ import annotations

from sqlalchemy.orm import Session
from uuid import UUID

from src.api.schemas.sender_accounts import SenderAccountCreate, SenderAccountUpdate
from src.domain import SenderAccount, SenderAccountStatus
from uuid import UUID, uuid4


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
    db.delete(sender)


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
    return sender
