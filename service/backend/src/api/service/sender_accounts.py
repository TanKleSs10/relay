from __future__ import annotations

from sqlalchemy.orm import Session

from src.domain import SenderAccount, SenderAccountStatus


def get_sender_accounts_by_status(
    db: Session, status: SenderAccountStatus
) -> list[SenderAccount]:
    return (
        db.query(SenderAccount)
        .filter(SenderAccount.status == status)
        .all()
    )
