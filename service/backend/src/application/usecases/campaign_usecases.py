from fastapi import UploadFile
from sqlalchemy.orm import Session

from src.api.schemas.campaigns import CampaignCreate, CampaignUpdate
from src.application.errors import ConflictError, NotFoundError
from src.api.service.campaigns import (
    create_campaign,
    delete_campaign,
    get_campaign_by_id,
    get_campaign_by_name,
    list_campaigns,
    update_campaign as update_campaign_service,
)
from src.api.service.workers import assign_campaign, get_idle_worker
from src.api.service.messages import create_messages
from src.domain.models import Campaign
from src.domain import CampaignStatus
from src.infrastructure.file_readers.factory import get_reader


def _ensure_unique_campaign_name(db: Session, name: str) -> None:
    existing = get_campaign_by_name(db, name)
    if existing:
        raise ConflictError("Campaign with this name already exists")


def _extract_message_row(row: dict[str, object]) -> tuple[str | None, str | None]:
    recipient = (
        row.get("phone")
        or row.get("recipient")
        or row.get("phone_number")
    )
    payload = (
        row.get("message")
        or row.get("payload")
        or row.get("text")
    )
    return recipient, payload


def create_campaign_with_file(
    name: str,
    file: UploadFile | None,
    db: Session
):
    try:
        _ensure_unique_campaign_name(db, name)

        # Create campaign
        campaign = create_campaign(db, CampaignCreate(name=name))
        db.flush()

        # If there's no file, just commit and return with empty summary
        if not file:
            db.commit()
            db.refresh(campaign)
            return campaign, 0, []

        # Read file and create messages
        reader = get_reader(file.filename)
        data = reader.read(file)
        print(f"Data read from file: {data}")
        created = 0
        invalid_rows: list[dict[str, object]] = []

        for idx, row in enumerate(data, start=1):
            recipient, payload = _extract_message_row(row)

            if not recipient or not payload:
                invalid_rows.append({"row": idx, "data": row})
                continue

            create_messages(db, recipient=recipient, payload=payload, campaign_id=campaign.id)
            created += 1

        db.commit()
        db.refresh(campaign)
        return campaign, created, invalid_rows
    except Exception as exc:
        db.rollback()
        raise exc
    
def create_campaigns(db: Session, payload: CampaignCreate) -> Campaign:
    try:
        _ensure_unique_campaign_name(db, payload.name)

        campaign = create_campaign(db, payload)
        db.commit()
        db.refresh(campaign)
        return campaign
    except Exception as exc:
        db.rollback()
        raise exc

def get_campaigns(db: Session):
    return list_campaigns(db)
    
def get_campaign(campaign_id: int, db: Session):
    campaign = get_campaign_by_id(db, campaign_id)
    if not campaign:
        raise NotFoundError("Campaign not found")
    return campaign

def update_campaign(campaign_id: int, payload: CampaignUpdate, db: Session):
    campaign = get_campaign_by_id(db, campaign_id)
    if not campaign:
        raise NotFoundError("Campaign not found")

    try:
        campaign = update_campaign_service(db, campaign, payload)
        db.commit()
        db.refresh(campaign)
        return campaign
    except Exception as exc:
        db.rollback()
        raise exc

def remove_campaign(campaign_id: int, db: Session):
    campaign = get_campaign_by_id(db, campaign_id)
    if not campaign:
        raise NotFoundError("Campaign not found")
    try:
        delete_campaign(db, campaign)
        db.commit()
    except Exception as exc:
        db.rollback()
        raise exc
    return {"status": "success", "message": f"Campaign with id {campaign_id} deleted successfully."}


def dispatch_campaign(campaign_id: int, db: Session) -> dict[str, int]:
    campaign = get_campaign_by_id(db, campaign_id)
    if not campaign:
        raise NotFoundError("Campaign not found")
    if campaign.status == CampaignStatus.PROCESSING:
        raise ConflictError("Campaign is already processing")

    worker = get_idle_worker(db)
    if not worker:
        raise ConflictError("No idle workers available")

    try:
        campaign.status = CampaignStatus.PROCESSING
        assign_campaign(db, worker, campaign_id)
        db.commit()
        return {"worker_id": worker.id}
    except Exception as exc:
        db.rollback()
        raise exc
