from __future__ import annotations

from datetime import datetime

from pydantic import ConfigDict, Field, PositiveInt

from src.api.schemas.base import APIModel
from src.domain import CampaignStatus


class CampaignBase(APIModel):
    name: str = Field(..., min_length=1, max_length=255)


class CampaignCreate(CampaignBase):
    status: CampaignStatus | None = None


class CampaignUpdate(APIModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    status: CampaignStatus | None = None



from src.api.schemas.messages import MessageRead


class CampaignMetrics(APIModel):
    campaign_id: PositiveInt
    total: int = Field(ge=0)
    sent: int = Field(ge=0)
    failed: int = Field(ge=0)
    pending: int = Field(ge=0)
    processing: int = Field(ge=0)
    no_wa: int = Field(ge=0)
    effectiveness: float = Field(ge=0, le=1)

class CampaignRead(CampaignBase):
    id: PositiveInt
    status: CampaignStatus
    created_at: datetime
    started_at: datetime | None = None
    finished_at: datetime | None = None
    messages: list[MessageRead] = Field(default_factory=list)

    model_config = ConfigDict(
        from_attributes=True,
        extra="forbid",
        str_strip_whitespace=True,
        validate_assignment=True,
    )


class CampaignUploadSummary(APIModel):
    campaign: CampaignRead
    created_messages: int = Field(ge=0)
    invalid_rows: list[dict[str, object]]
