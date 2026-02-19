from __future__ import annotations


from sqlalchemy.orm import Session, joinedload

from src.api.schemas.campaigns import CampaignCreate, CampaignUpdate
from src.domain import Campaign, CampaignStatus


def create_campaign(db: Session, payload: CampaignCreate) -> Campaign:
    campaign = Campaign(
        name=payload.name,
        status=payload.status or CampaignStatus.CREATED,
    )
    db.add(campaign)
    return campaign

def get_campaign_by_name(db: Session, name: str) -> Campaign | None:
    return db.query(Campaign).filter(Campaign.name == name).first()

def get_campaign_by_id(db: Session, campaign_id: int) -> Campaign | None:
    return db.query(Campaign).options(joinedload(Campaign.messages)).filter(Campaign.id == campaign_id).first()

def list_campaigns(db: Session, skip: int = 0, limit: int = 100) -> list[Campaign]:
    return (
        db.query(Campaign)
        .options(joinedload(Campaign.messages))
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
