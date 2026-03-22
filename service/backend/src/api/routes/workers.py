from fastapi import APIRouter, Depends
from uuid import UUID
from sqlalchemy.orm import Session

from src.api.routes.deps import get_db
from src.application.errors import NotFoundError
from src.api.service.workers import (
    count_active_workers,
    count_available_workers,
    reset_worker,
)
from src.domain import Worker

router = APIRouter(prefix="/workers", tags=["workers"])


@router.get("/active-count")
def get_active_count(db: Session = Depends(get_db)):
    return {"active_workers": count_active_workers(db)}


@router.get("/available-count")
def get_available_count(db: Session = Depends(get_db)):
    return {"available_workers": count_available_workers(db)}


@router.post("/{worker_id}/reset")
def reset_worker_status(worker_id: UUID, db: Session = Depends(get_db)):
    worker = db.query(Worker).filter(Worker.id == worker_id).first()
    if not worker:
        raise NotFoundError("Worker not found")
    reset_worker(db, worker)
    db.commit()
    return {"status": "ok", "worker_id": worker.id}
