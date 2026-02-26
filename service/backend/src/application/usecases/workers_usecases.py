from sqlalchemy.orm import Session
from src.api.service.workers import assign_campaign


def remove_campaign_worker(db: Session):
    try:
        assign_campaign(db, worker, None)
        db.commit()
    except Exception as exc:
        db.rollback()
        raise exc
