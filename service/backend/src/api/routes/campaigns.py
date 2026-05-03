from src.application.usecases.campaign_usecases import (
    create_campaign_with_file,
    create_campaigns,
    dispatch_campaign,
    get_campaign,
    get_campaigns,
    get_campaign_metrics,
    pause_campaign,
    remove_campaign,
    retry_campaign,
    update_campaign,
)
from src.application.usecases.media_asset_usecases import (
    list_campaign_media,
    remove_campaign_media,
    upload_campaign_media,
)
from datetime import datetime

from fastapi import APIRouter, Depends, File, Form, Query, UploadFile, status
from uuid import UUID
from src.api.schemas.campaigns import (
    CampaignRead,
    CampaignUpdate,
    CampaignCreate,
    CampaignUploadSummary,
    CampaignMetrics,
)
from src.api.schemas.media_assets import CampaignMediaAssetRead
from sqlalchemy.orm import Session
from src.api.routes.deps import get_db
from src.security.auth import require_permission
from src.security.permissions import (
    PERM_CAMPAIGN_CREATE,
    PERM_CAMPAIGN_DISPATCH,
    PERM_CAMPAIGN_MANAGE,
    PERM_CAMPAIGN_READ,
)
from src.domain.models import User


router = APIRouter(prefix="/campaigns", tags=["campaigns"])


@router.post(
    "", response_model=CampaignUploadSummary, status_code=status.HTTP_201_CREATED
)
def create(
    payload: CampaignCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission(PERM_CAMPAIGN_CREATE)),
):
    campaign = create_campaigns(db, payload, user)
    return {
        "campaign": campaign,
        "created_messages": 0,
        "invalid_rows": [],
    }


@router.post(
    "/upload", response_model=CampaignUploadSummary, status_code=status.HTTP_201_CREATED
)
def create_with_file(
    name: str = Form(...),
    file: UploadFile = File(...),
    workspace_id: UUID | None = Form(default=None),
    db: Session = Depends(get_db),
    user: User = Depends(require_permission(PERM_CAMPAIGN_CREATE)),
):
    campaign, created_messages, invalid_rows = create_campaign_with_file(
        name, file, db, user, workspace_id
    )
    return {
        "campaign": campaign,
        "created_messages": created_messages,
        "invalid_rows": invalid_rows,
    }


@router.get("", response_model=list[CampaignRead])
def list_items(
    db: Session = Depends(get_db),
    user: User = Depends(require_permission(PERM_CAMPAIGN_READ)),
):
    return get_campaigns(db, user)


@router.get("/{campaign_id}", response_model=CampaignRead)
def get_item(
    campaign_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission(PERM_CAMPAIGN_READ)),
):
    return get_campaign(campaign_id, db, user)


@router.get("/{campaign_id}/metrics", response_model=CampaignMetrics)
def get_metrics(
    campaign_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission(PERM_CAMPAIGN_READ)),
    created_from: datetime | None = Query(default=None),
    created_to: datetime | None = Query(default=None),
    sent_from: datetime | None = Query(default=None),
    sent_to: datetime | None = Query(default=None),
    include_no_wa: bool = Query(default=True),
):
    return get_campaign_metrics(
        campaign_id,
        db,
        user,
        created_from=created_from,
        created_to=created_to,
        sent_from=sent_from,
        sent_to=sent_to,
        include_no_wa=include_no_wa,
    )


@router.patch("/{campaign_id}", response_model=CampaignRead)
def update_item(
    campaign_id: UUID,
    payload: CampaignUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission(PERM_CAMPAIGN_MANAGE)),
):
    return update_campaign(campaign_id, payload, db, user)


@router.delete("/{campaign_id}", status_code=status.HTTP_200_OK)
def delete_item(
    campaign_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission(PERM_CAMPAIGN_MANAGE)),
):
    remove_campaign(campaign_id, db, user)
    return {"detail": "Campaign deleted successfully"}


@router.post("/{campaign_id}/dispatch", status_code=status.HTTP_202_ACCEPTED)
def dispatch_item(
    campaign_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission(PERM_CAMPAIGN_DISPATCH)),
):
    return dispatch_campaign(campaign_id, db, user)

@router.post("/{campaign_id}/pause", status_code=status.HTTP_202_ACCEPTED)
def pause_item(
    campaign_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission(PERM_CAMPAIGN_MANAGE)),
):
    return pause_campaign(campaign_id, db, user)


@router.post("/{campaign_id}/retry", status_code=status.HTTP_202_ACCEPTED)
def retry_item(
    campaign_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission(PERM_CAMPAIGN_MANAGE)),
):
    return retry_campaign(campaign_id, db, user)


@router.get("/{campaign_id}/media", response_model=list[CampaignMediaAssetRead])
def list_media_items(
    campaign_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission(PERM_CAMPAIGN_READ)),
):
    return list_campaign_media(campaign_id, db, user)


@router.post(
    "/{campaign_id}/media",
    response_model=CampaignMediaAssetRead,
    status_code=status.HTTP_201_CREATED,
)
def upload_media_item(
    campaign_id: UUID,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(require_permission(PERM_CAMPAIGN_MANAGE)),
):
    return upload_campaign_media(campaign_id, file, db, user)


@router.delete("/{campaign_id}/media/{media_asset_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_media_item(
    campaign_id: UUID,
    media_asset_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission(PERM_CAMPAIGN_MANAGE)),
):
    remove_campaign_media(campaign_id, media_asset_id, db, user)
    return None
