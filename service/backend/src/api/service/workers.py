from __future__ import annotations

from sqlalchemy.orm import Session

from src.domain import WorkerState, WorkerStatus


def count_active_workers(db: Session) -> int:
    return (
        db.query(WorkerState)
        .filter(WorkerState.status == WorkerStatus.RUNNING)
        .count()
    )
