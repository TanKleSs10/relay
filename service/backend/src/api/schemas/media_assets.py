from __future__ import annotations

from datetime import datetime

from pydantic import ConfigDict, Field, UUID4

from src.api.schemas.base import APIModel


class MediaAssetRead(APIModel):
    id: UUID4
    provider: str
    resource_type: str
    public_id: str
    secure_url: str
    bytes: int = Field(ge=0)
    format: str
    width: int | None = Field(default=None, ge=0)
    height: int | None = Field(default=None, ge=0)
    original_filename: str | None = None
    deleted_at: datetime | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
        extra="forbid",
        str_strip_whitespace=True,
        validate_assignment=True,
    )


class CampaignMediaAssetRead(APIModel):
    id: UUID4
    campaign_id: UUID4
    media_asset_id: UUID4
    sort_order: int = Field(ge=0)
    created_at: datetime
    media_asset: MediaAssetRead

    model_config = ConfigDict(
        from_attributes=True,
        extra="forbid",
        str_strip_whitespace=True,
        validate_assignment=True,
    )
