from src.application.usecases.campaign_usecases import (
    create_campaign_with_file,
    create_campaigns,
    dispatch_campaign,
    get_campaign,
    get_campaigns,
    pause_campaign,
    remove_campaign,
    retry_campaign,
    update_campaign,
)
from fastapi import APIRouter, Depends, File, Form, UploadFile, status
from src.api.schemas.campaigns import (
    CampaignRead,
    CampaignUpdate,
    CampaignCreate,
    CampaignUploadSummary,
)
from sqlalchemy.orm import Session
from src.api.routes.deps import get_db


router = APIRouter(prefix="/campaigns", tags=["campaigns"])


@router.post(
    "", response_model=CampaignUploadSummary, status_code=status.HTTP_201_CREATED
)
def create(payload: CampaignCreate, db: Session = Depends(get_db)):
    campaign = create_campaigns(db, payload)
    return {
        "campaign": campaign,
        "created_messages": 0,
        "invalid_rows": [],
    }


@router.post(
    "/upload", response_model=CampaignUploadSummary, status_code=status.HTTP_201_CREATED
)
def create_with_file(
    name: str = Form(...), file: UploadFile = File(...), db: Session = Depends(get_db)
):
    campaign, created_messages, invalid_rows = create_campaign_with_file(name, file, db)
    return {
        "campaign": campaign,
        "created_messages": created_messages,
        "invalid_rows": invalid_rows,
    }


@router.get("", response_model=list[CampaignRead])
def list_items(db: Session = Depends(get_db)):
    return get_campaigns(db)


@router.get("/{campaign_id}", response_model=CampaignRead)
def get_item(campaign_id: int, db: Session = Depends(get_db)):
    return get_campaign(campaign_id, db)


@router.patch("/{campaign_id}", response_model=CampaignRead)
def update_item(
    campaign_id: int, payload: CampaignUpdate, db: Session = Depends(get_db)
):
    return update_campaign(campaign_id, payload, db)


@router.delete("/{campaign_id}", status_code=status.HTTP_200_OK)
def delete_item(campaign_id: int, db: Session = Depends(get_db)):
    remove_campaign(campaign_id, db)
    return {"detail": "Campaign deleted successfully"}


@router.post("/{campaign_id}/dispatch", status_code=status.HTTP_202_ACCEPTED)
def dispatch_item(campaign_id: int, db: Session = Depends(get_db)):
    return dispatch_campaign(campaign_id, db)

@router.post("/{campaign_id}/pause", status_code=status.HTTP_202_ACCEPTED)
def pause_item(campaign_id: int, db: Session = Depends(get_db)):
    return pause_campaign(campaign_id, db)


@router.post("/{campaign_id}/retry", status_code=status.HTTP_202_ACCEPTED)
def retry_item(campaign_id: int, db: Session = Depends(get_db)):
    return retry_campaign(campaign_id, db)
