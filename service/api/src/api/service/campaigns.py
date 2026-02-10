from __future__ import annotations

from sqlalchemy.orm import Session

from src.api.schemas.campaigns import CampaignCreate, CampaignUpdate
from src.domain import Campaign, CampaignStatus


def create_campaign(db: Session, payload: CampaignCreate) -> Campaign:
    campaign = Campaign(
        name=payload.name,
        message_template=payload.message_template,
        status=payload.status or CampaignStatus.CREATED,
    )
    db.add(campaign)
    db.commit()
    db.refresh(campaign)
    return campaign


def get_campaign(db: Session, campaign_id: int) -> Campaign | None:
    return db.get(Campaign, campaign_id)


def list_campaigns(db: Session, skip: int = 0, limit: int = 100) -> list[Campaign]:
    return (
        db.query(Campaign)
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
    db.commit()
    db.refresh(campaign)
    return campaign


def delete_campaign(db: Session, campaign: Campaign) -> None:
    db.delete(campaign)
    db.commit()
