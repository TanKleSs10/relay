from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from src.api.routes.deps import get_db
from src.api.schemas.campaigns import CampaignCreate, CampaignRead, CampaignUpdate
from src.api.service.campaigns import (
    create_campaign,
    delete_campaign,
    get_campaign,
    list_campaigns,
    update_campaign,
)

router = APIRouter(prefix="/campaigns", tags=["campaigns"])


@router.post("", response_model=CampaignRead, status_code=status.HTTP_201_CREATED)
def create(payload: CampaignCreate, db: Session = Depends(get_db)):
    return create_campaign(db, payload)


@router.get("", response_model=list[CampaignRead])
def list_items(
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
):
    return list_campaigns(db, skip=skip, limit=limit)


@router.get("/{campaign_id}", response_model=CampaignRead)
def get_item(campaign_id: int, db: Session = Depends(get_db)):
    campaign = get_campaign(db, campaign_id)
    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found"
        )
    return campaign


@router.patch("/{campaign_id}", response_model=CampaignRead)
def update_item(
    campaign_id: int, payload: CampaignUpdate, db: Session = Depends(get_db)
):
    campaign = get_campaign(db, campaign_id)
    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found"
        )
    return update_campaign(db, campaign, payload)


@router.delete("/{campaign_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(campaign_id: int, db: Session = Depends(get_db)):
    campaign = get_campaign(db, campaign_id)
    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found"
        )
    delete_campaign(db, campaign)
