from __future__ import annotations


from sqlalchemy.orm import Session, joinedload
from uuid import UUID

from src.api.schemas.campaigns import CampaignCreate, CampaignUpdate
from src.domain import Campaign, CampaignStatus


def create_campaign(db: Session, payload: CampaignCreate) -> Campaign:
    campaign = Campaign(
        name=payload.name,
        status=payload.status or CampaignStatus.CREATED,
        workspace_id=payload.workspace_id,
    )
    db.add(campaign)
    return campaign


def get_campaign_by_name(
    db: Session, workspace_id: UUID, name: str
) -> Campaign | None:
    return (
        db.query(Campaign)
        .filter(Campaign.workspace_id == workspace_id, Campaign.name == name)
        .first()
    )


def get_campaign_by_id(
    db: Session, campaign_id: UUID, workspace_ids: list[UUID] | None = None
) -> Campaign | None:
    query = db.query(Campaign).options(joinedload(Campaign.messages))
    if workspace_ids is not None:
        query = query.filter(Campaign.workspace_id.in_(workspace_ids))
    return query.filter(Campaign.id == campaign_id).first()


def list_campaigns(
    db: Session,
    workspace_ids: list[UUID],
    skip: int = 0,
    limit: int = 100,
) -> list[Campaign]:
    return (
        db.query(Campaign)
        .options(joinedload(Campaign.messages))
        .filter(Campaign.workspace_id.in_(workspace_ids))
        .order_by(Campaign.id.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def update_campaign(
    db: Session, campaign: Campaign, payload: CampaignUpdate
) -> Campaign:
    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(campaign, field, value)
    return campaign


def delete_campaign(db: Session, campaign: Campaign) -> None:
    db.delete(campaign)
