from __future__ import annotations

from sqlalchemy.orm import Session

from src.api.schemas.sender_accounts import SenderAccountCreate, SenderAccountUpdate
from src.domain import Provider, SenderAccount, SenderAccountStatus


def get_sender_accounts_by_status(
    db: Session, status: SenderAccountStatus
) -> list[SenderAccount]:
    return (
        db.query(SenderAccount)
        .filter(SenderAccount.status == status)
        .all()
    )


def create_sender_account(
    db: Session, payload: SenderAccountCreate | None = None
) -> SenderAccount:
    provider = Provider.WHATSAPP_WEB
    if payload and payload.provider:
        provider = payload.provider
    sender = SenderAccount(
        provider=provider,
        status=SenderAccountStatus.CREATED,
        phone_number=None,
        qr_code=None,
        session_id=None,
    )
    db.add(sender)
    db.commit()
    db.refresh(sender)
    return sender


def get_sender_account_by_id(db: Session, sender_id: int) -> SenderAccount | None:
    return db.query(SenderAccount).filter(SenderAccount.id == sender_id).first()


def update_sender_account(
    db: Session, sender: SenderAccount, payload: SenderAccountUpdate
) -> SenderAccount:
    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(sender, field, value)
    db.commit()
    db.refresh(sender)
    return sender
