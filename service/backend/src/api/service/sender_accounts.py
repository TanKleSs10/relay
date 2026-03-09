from __future__ import annotations

from sqlalchemy.orm import Session

from src.api.schemas.sender_accounts import SenderAccountCreate, SenderAccountUpdate
from src.domain import SenderAccount, SenderAccountStatus


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
    sender = SenderAccount(
        status=SenderAccountStatus.CREATED,
        phone_number=None,
        qr_code=None,
        session_path=None,
    )
    db.add(sender)
    return sender


def get_sender_account_by_id(db: Session, sender_id: int) -> SenderAccount | None:
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
    sender.qr_code = None
    sender.qr_generated_at = None
    sender.session_path = None
    return sender
