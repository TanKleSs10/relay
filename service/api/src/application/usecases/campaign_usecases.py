from fastapi import UploadFile
from sqlalchemy.orm import Session
from src.api.schemas.campaigns import CampaignCreate
from src.api.service.campaigns import create_campaign, delete_campaign, get_campaign_by_id, get_campaign_by_name, list_campaigns
from src.api.service.messages import create_messages
from src.domain.models import Campaign
from src.infrastructure.file_readers.factory import get_reader


def create_campaign_with_file(
    name: str,
    file: UploadFile | None,
    db: Session
):
    try:
        # Validate if campaign with the same name already exists
        isExist = get_campaign_by_name(db, name)
        if isExist:
            raise ValueError("Campaign with this name already exists")

        # Create campaign
        campaign = create_campaign(db, CampaignCreate(name=name))
        db.flush()

        # If there's no file, just commit and return
        if not file:
            db.commit()
            return {"status": "success", "message": f"Campaign '{name}' created without messages."}

        # Read file and create messages
        reader = get_reader(file.filename)
        data = reader.read(file)

        created = 0
        invalid_rows = []
        for idx, row in enumerate(data, start=1):
            # support multiple common header names
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

            if not recipient or not payload:
                invalid_rows.append({"row": idx, "data": row})
                continue

            create_messages(db, recipient=recipient, payload=payload, campaign_id=campaign.id)
            created += 1

        db.commit()
        return {
            "status": "success",
            "message": f"Campaign '{name}' created with {created} messages.",
            "created_messages": created,
            "invalid_rows": invalid_rows,
        }
    
    except Exception as e:
        db.rollback()
        raise e
    
def create_campaigns(db: Session, payload: CampaignCreate) -> Campaign:
    try:
        # Validate duplicate campaign name before inserting
        isExist = get_campaign_by_name(db, payload.name)
        if isExist:
            raise ValueError("Campaign with this name already exists")

        campaign = create_campaign(db, payload)
        db.commit()
        return campaign
    except Exception as e:
        db.rollback()
        raise e

def get_campaigns(db: Session):
    try:
        return list_campaigns(db)
    except Exception as e:
        raise e 
    
def get_campaign(campaign_id: int, db: Session):
    try:
        campaign = get_campaign_by_id(db, campaign_id)
        if not campaign:
            raise ValueError("Campaign not found")
        return campaign
    except Exception as e:
        raise e

def update_campaign(campaign_id: int, payload: Campaign, db: Session):
    campaign = get_campaign_by_id(db, campaign_id)
    if not campaign:
        raise ValueError("Campaign not found")

    for key, value in payload.__dict__.items():
        if key != "id":
            setattr(campaign, key, value)

    db.commit()
    db.refresh(campaign)
    return campaign

def remove_campaign(campaign_id: int, db: Session):
    campaign = get_campaign_by_id(db, campaign_id)
    if not campaign:
        raise ValueError("Campaign not found")
    delete_campaign(db, campaign)
    return {"status": "success", "message": f"Campaign with id {campaign_id} deleted successfully."}