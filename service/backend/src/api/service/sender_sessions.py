from __future__ import annotations

from sqlalchemy.orm import Session
from uuid import UUID

from src.domain import SenderSession, SessionLog


def get_sender_session(db: Session, sender_id: UUID) -> SenderSession | None:
    return (
        db.query(SenderSession)
        .filter(SenderSession.sender_account_id == sender_id)
        .first()
    )


def list_session_logs(db: Session, sender_id: UUID) -> list[SessionLog]:
    return (
        db.query(SessionLog)
        .filter(SessionLog.sender_account_id == sender_id)
        .order_by(SessionLog.created_at.desc())
        .all()
    )
