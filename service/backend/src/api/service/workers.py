from __future__ import annotations

from sqlalchemy.orm import Session

from src.domain import WorkerState, WorkerStatus


def count_active_workers(db: Session) -> int:
    return (
        db.query(WorkerState)
        .filter(WorkerState.status == WorkerStatus.RUNNING)
        .count()
    )


def get_idle_worker(db: Session) -> WorkerState | None:
    return (
        db.query(WorkerState)
        .filter(WorkerState.status == WorkerStatus.IDLE)
        .order_by(WorkerState.id.asc())
        .first()
    )


def assign_campaign(db: Session, worker: WorkerState, campaign_id: int) -> WorkerState:
    worker.status = WorkerStatus.RUNNING
    worker.current_campaign_id = campaign_id
    return worker
