from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from src.api.routes.deps import get_db
from src.api.service.workers import count_active_workers

router = APIRouter(prefix="/workers", tags=["workers"])


@router.get("/active-count")
def get_active_count(db: Session = Depends(get_db)):
    return {"active_workers": count_active_workers(db)}
