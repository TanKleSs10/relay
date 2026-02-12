from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from src.domain import CampaignStatus


class CampaignBase(BaseModel):
    name: str = Field(..., max_length=255)


class CampaignCreate(CampaignBase):
    status: CampaignStatus | None = None


class CampaignUpdate(BaseModel):
    name: str | None = Field(default=None, max_length=255)
    status: CampaignStatus | None = None


class CampaignRead(CampaignBase):
    id: int
    status: CampaignStatus
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
