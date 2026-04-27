from __future__ import annotations

from uuid import UUID

from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from src.application.errors import NotFoundError
from src.application.ports.media_storage import MediaStorageProvider, MediaUploadResult
from src.domain import Campaign, CampaignMediaAsset, MediaAsset


class MediaAssetService:
    def __init__(self, storage: MediaStorageProvider) -> None:
        self.storage = storage

    def upload_campaign_image(
        self,
        db: Session,
        *,
        campaign: Campaign,
        file_bytes: bytes,
        filename: str,
        created_by_user_id: UUID | None = None,
        sort_order: int | None = None,
    ) -> tuple[MediaAsset, CampaignMediaAsset]:
        upload = self.storage.upload_image(file_bytes=file_bytes, filename=filename)
        media_asset = self.create_asset_record(
            db,
            upload=upload,
            created_by_user_id=created_by_user_id,
        )
        campaign_link = self.attach_asset_to_campaign(
            db,
            campaign=campaign,
            media_asset=media_asset,
            sort_order=sort_order,
        )
        return media_asset, campaign_link

    def create_asset_record(
        self,
        db: Session,
        *,
        upload: MediaUploadResult,
        created_by_user_id: UUID | None = None,
    ) -> MediaAsset:
        media_asset = MediaAsset(
            provider=upload.provider,
            resource_type=upload.resource_type,
            public_id=upload.public_id,
            secure_url=upload.secure_url,
            bytes=upload.bytes,
            format=upload.format,
            width=upload.width,
            height=upload.height,
            original_filename=upload.original_filename,
            created_by_user_id=created_by_user_id,
        )
        db.add(media_asset)
        db.flush()
        return media_asset

    def attach_asset_to_campaign(
        self,
        db: Session,
        *,
        campaign: Campaign,
        media_asset: MediaAsset,
        sort_order: int | None = None,
    ) -> CampaignMediaAsset:
        link = CampaignMediaAsset(
            campaign=campaign,
            media_asset=media_asset,
            sort_order=self._resolve_sort_order(db, campaign.id, sort_order),
        )
        db.add(link)
        db.flush()
        return link

    def list_campaign_media(
        self,
        db: Session,
        *,
        campaign_id: UUID,
    ) -> list[CampaignMediaAsset]:
        return (
            db.query(CampaignMediaAsset)
            .options(joinedload(CampaignMediaAsset.media_asset))
            .filter(CampaignMediaAsset.campaign_id == campaign_id)
            .order_by(
                CampaignMediaAsset.sort_order.asc(),
                CampaignMediaAsset.created_at.asc(),
            )
            .all()
        )

    def detach_campaign_media(
        self,
        db: Session,
        *,
        campaign_id: UUID,
        media_asset_id: UUID,
    ) -> CampaignMediaAsset:
        link = (
            db.query(CampaignMediaAsset)
            .options(joinedload(CampaignMediaAsset.media_asset))
            .filter(
                CampaignMediaAsset.campaign_id == campaign_id,
                CampaignMediaAsset.media_asset_id == media_asset_id,
            )
            .first()
        )
        if not link:
            raise NotFoundError("Campaign media asset link not found")

        db.delete(link)
        db.flush()
        return link

    def delete_asset_if_orphaned(
        self,
        db: Session,
        *,
        media_asset_id: UUID,
    ) -> bool:
        remaining_links = (
            db.query(CampaignMediaAsset)
            .filter(CampaignMediaAsset.media_asset_id == media_asset_id)
            .count()
        )
        if remaining_links > 0:
            return False

        media_asset = db.query(MediaAsset).filter(MediaAsset.id == media_asset_id).first()
        if not media_asset:
            return False

        self.storage.delete_asset(media_asset.public_id)
        db.delete(media_asset)
        db.flush()
        return True

    def _resolve_sort_order(
        self,
        db: Session,
        campaign_id: UUID,
        sort_order: int | None,
    ) -> int:
        if sort_order is not None:
            return sort_order

        current_max = (
            db.query(func.max(CampaignMediaAsset.sort_order))
            .filter(CampaignMediaAsset.campaign_id == campaign_id)
            .scalar()
        )
        return int(current_max + 1) if current_max is not None else 0
