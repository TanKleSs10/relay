from __future__ import annotations

from sqlalchemy.orm import Session
from uuid import UUID

from datetime import datetime, timezone

from src.application.errors import ConflictError
from src.domain import Worker, WorkerStatus
from src.infrastructure.machine.worker_machine import can_transition


def count_active_workers(db: Session) -> int:
    return (
        db.query(Worker)
        .filter(Worker.status == WorkerStatus.ONLINE)
        .count()
    )


def count_available_workers(db: Session) -> int:
    return (
        db.query(Worker)
        .filter(Worker.status == WorkerStatus.ONLINE)
        .count()
    )


def get_idle_worker(db: Session) -> Worker | None:
    return db.query(Worker).filter(Worker.status == WorkerStatus.ONLINE).first()


def assign_campaign(db: Session, worker: Worker, campaign_id: UUID) -> Worker:
    if not can_transition(worker.status, WorkerStatus.ONLINE):
        raise ConflictError(
            f"Worker {worker.id} cannot transition from {worker.status} to ONLINE"
        )
    worker.status = WorkerStatus.ONLINE
    worker.last_seen = datetime.now(timezone.utc)
    return worker


def reset_worker(db: Session, worker: Worker) -> Worker:
    if not can_transition(worker.status, WorkerStatus.ONLINE):
        raise ConflictError(
            f"Worker {worker.id} cannot transition from {worker.status} to ONLINE"
        )
    worker.status = WorkerStatus.ONLINE
    worker.last_seen = datetime.now(timezone.utc)
    return worker
