from src.application.usecases.campaign_usecases import (
    create_campaign_with_file,
    create_campaigns,
    get_campaign, 
    get_campaigns, 
    update_campaign,
    remove_campaign,
    )
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from src.api.schemas.campaigns import CampaignRead, CampaignUpdate, CampaignCreate, CampaignUploadSummary
from sqlalchemy.orm import Session
from src.api.routes.deps import get_db


router = APIRouter(prefix="/campaigns", tags=["campaigns"])


@router.post("", response_model=CampaignUploadSummary, status_code=status.HTTP_201_CREATED)
def create(
    payload: CampaignCreate,
    db: Session = Depends(get_db)
):
    try:
        campaign = create_campaigns(db, payload)
        return {
            "campaign": campaign,
            "created_messages": 0,
            "invalid_rows": [],
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/upload", response_model=CampaignUploadSummary, status_code=status.HTTP_201_CREATED)
def create_with_file(
    name: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    try:
        campaign, created_messages, invalid_rows = create_campaign_with_file(
            name, file, db
        )
        return {
            "campaign": campaign,
            "created_messages": created_messages,
            "invalid_rows": invalid_rows,
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("", response_model=list[CampaignRead])
def list_items(
    db: Session = Depends(get_db)
    ):
    try:
        return get_campaigns(db)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/{campaign_id}", response_model=CampaignRead)
def get_item(campaign_id: int, db: Session = Depends(get_db)):
    try:
        return get_campaign(campaign_id, db)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.patch("/{campaign_id}", response_model=CampaignRead)
def update_item(
    campaign_id: int, payload: CampaignUpdate, db: Session = Depends(get_db)
    ):
    try:
        return update_campaign(campaign_id, payload, db)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.delete("/{campaign_id}", status_code=status.HTTP_200_OK)
def delete_item(campaign_id: int, db: Session = Depends(get_db)):
    try:
        remove_campaign(campaign_id, db)
        return {"detail": "Campaign deleted successfully"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
