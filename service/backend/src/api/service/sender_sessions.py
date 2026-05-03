from __future__ import annotations

from sqlalchemy.orm import Session
from uuid import UUID

from src.domain import SenderSession, SessionLog
from src.domain.models import SenderAccount


def get_sender_session(
    db: Session,
    sender_id: UUID,
    workspace_ids: list[UUID] | None = None,
) -> SenderSession | None:
    query = db.query(SenderSession).join(
        SenderAccount,
        SenderAccount.id == SenderSession.sender_account_id,
    )
    if workspace_ids is not None:
        query = query.filter(SenderAccount.workspace_id.in_(workspace_ids))
    return query.filter(SenderSession.sender_account_id == sender_id).first()


def list_session_logs(
    db: Session,
    sender_id: UUID,
    workspace_ids: list[UUID] | None = None,
) -> list[SessionLog]:
    query = db.query(SessionLog).join(
        SenderAccount,
        SenderAccount.id == SessionLog.sender_account_id,
    )
    if workspace_ids is not None:
        query = query.filter(SenderAccount.workspace_id.in_(workspace_ids))
    return (
        query.filter(SessionLog.sender_account_id == sender_id)
        .order_by(SessionLog.created_at.desc())
        .all()
    )
