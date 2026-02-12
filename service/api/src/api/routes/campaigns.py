from src.application.usecases.campaign_usecases import (
    create_campaign_with_file,
    create_campaigns,
    get_campaign, 
    get_campaigns, 
    update_campaign,
    remove_campaign,
    )
from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from src.api.schemas.campaigns import CampaignRead, CampaignUpdate, CampaignCreate
from sqlalchemy.orm import Session
from src.api.routes.deps import get_db


router = APIRouter(prefix="/campaigns", tags=["campaigns"])


@router.post("", response_model=CampaignRead, status_code=status.HTTP_201_CREATED)
def create(
    payload: CampaignCreate | None = None,
    name: str | None = Form(None),
    file: UploadFile | None = File(None),
    db: Session = Depends(get_db)
    ):
    try:
        # If a file is provided, create campaign and messages from file
        if file:
            # Determine name from JSON body or form
            campaign_name = None
            if payload is not None:
                campaign_name = payload.name
            elif name:
                campaign_name = name

            if not campaign_name:
                raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Missing 'name' for file upload")

            return create_campaign_with_file(campaign_name, file, db)

        # No file: accept name from JSON body or form-urlencoded
        if payload is None and not name:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Missing 'name' in request")

        if payload is None:
            payload = CampaignCreate(name=name)

        return create_campaigns(db, payload)
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