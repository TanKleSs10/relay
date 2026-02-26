from __future__ import annotations

from sqlalchemy.orm import Session

from src.application.errors import ConflictError
from src.domain import WorkerState, WorkerStatus
from src.infrastructure.machine.worker_machine import can_transition


def count_active_workers(db: Session) -> int:
    return (
        db.query(WorkerState)
        .filter(
            (WorkerState.status == WorkerStatus.RUNNING)
            & (WorkerState.current_campaign_id.is_not(None))
        )
        .count()
    )


def count_available_workers(db: Session) -> int:
    return (
        db.query(WorkerState)
        .filter(
            (WorkerState.status == WorkerStatus.IDLE)
            | (
                (WorkerState.status == WorkerStatus.RUNNING)
                & (WorkerState.current_campaign_id.is_(None))
            )
        )
        .count()
    )


def get_idle_worker(db: Session) -> WorkerState | None:
    return (
        db.query(WorkerState)
        .filter(
            (WorkerState.status == WorkerStatus.IDLE)
            | (
                (WorkerState.status == WorkerStatus.RUNNING)
                & (WorkerState.current_campaign_id.is_(None))
            )
        )
        .order_by(WorkerState.id.asc())
        .first()
    )


def assign_campaign(db: Session, worker: WorkerState, campaign_id: int) -> WorkerState:
    if not can_transition(worker.status, WorkerStatus.RUNNING):
        raise ConflictError(
            f"Worker {worker.id} cannot transition from {worker.status} to RUNNING"
        )
    worker.status = WorkerStatus.RUNNING
    worker.current_campaign_id = campaign_id
    return worker


def reset_worker(db: Session, worker: WorkerState) -> WorkerState:
    if not can_transition(worker.status, WorkerStatus.IDLE):
        raise ConflictError(
            f"Worker {worker.id} cannot transition from {worker.status} to IDLE"
        )
    worker.status = WorkerStatus.IDLE
    worker.current_campaign_id = None
    return worker
