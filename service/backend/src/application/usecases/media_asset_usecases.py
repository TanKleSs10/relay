from __future__ import annotations

from pathlib import Path
from uuid import UUID

from fastapi import UploadFile
from sqlalchemy.orm import Session

from src.api.service.campaigns import get_campaign_by_id
from src.api.service.media_assets import MediaAssetService
from src.application.errors import NotFoundError, ValidationError
from src.config import get_settings
from src.domain.models import User
from src.infrastructure.media.cloudinary_storage import CloudinaryMediaStorageProvider
from src.security.auth import get_accessible_workspace_ids


def upload_campaign_media(
    campaign_id: UUID,
    file: UploadFile,
    db: Session,
    actor: User,
    *,
    created_by_user_id: UUID | None = None,
) :
    settings = get_settings()
    campaign = get_campaign_by_id(
        db,
        campaign_id,
        workspace_ids=get_accessible_workspace_ids(actor, db),
    )
    if not campaign:
        raise NotFoundError("Campaign not found")

    existing_media = list_campaign_media(campaign_id, db, actor)
    if len(existing_media) >= settings.media_max_images_per_campaign:
        raise ValidationError(
            f"Campaign image limit reached (max {settings.media_max_images_per_campaign})"
        )

    filename = file.filename or "upload"
    extension = _resolve_image_extension(filename, file.content_type)
    allowed_formats = _allowed_image_formats(settings.media_allowed_image_formats)
    if extension not in allowed_formats:
        raise ValidationError(
            f"Unsupported image format '{extension}'. Allowed: {', '.join(sorted(allowed_formats))}"
        )

    file_bytes = file.file.read()
    if not file_bytes:
        raise ValidationError("Uploaded file is empty")
    if len(file_bytes) > settings.media_max_image_bytes:
        raise ValidationError(
            f"Image exceeds max size of {settings.media_max_image_bytes} bytes"
        )
    if file.content_type and not file.content_type.startswith("image/"):
        raise ValidationError("Uploaded file must be an image")

    service = MediaAssetService(CloudinaryMediaStorageProvider())
    try:
        _, link = service.upload_campaign_image(
            db,
            campaign=campaign,
            file_bytes=file_bytes,
            filename=filename,
            created_by_user_id=created_by_user_id,
        )
        db.commit()
        db.refresh(link)
        return service.list_campaign_media(db, campaign_id=campaign_id)[-1]
    except Exception as exc:
        db.rollback()
        raise exc


def list_campaign_media(campaign_id: UUID, db: Session, actor: User):
    campaign = get_campaign_by_id(
        db,
        campaign_id,
        workspace_ids=get_accessible_workspace_ids(actor, db),
    )
    if not campaign:
        raise NotFoundError("Campaign not found")

    service = MediaAssetService(CloudinaryMediaStorageProvider())
    return service.list_campaign_media(db, campaign_id=campaign_id)


def remove_campaign_media(
    campaign_id: UUID,
    media_asset_id: UUID,
    db: Session,
    actor: User,
) -> None:
    campaign = get_campaign_by_id(
        db,
        campaign_id,
        workspace_ids=get_accessible_workspace_ids(actor, db),
    )
    if not campaign:
        raise NotFoundError("Campaign not found")

    service = MediaAssetService(CloudinaryMediaStorageProvider())
    try:
        service.detach_campaign_media(
            db,
            campaign_id=campaign_id,
            media_asset_id=media_asset_id,
        )
        service.delete_asset_if_orphaned(db, media_asset_id=media_asset_id)
        db.commit()
    except Exception as exc:
        db.rollback()
        raise exc


def _resolve_image_extension(filename: str, content_type: str | None) -> str:
    suffix = Path(filename).suffix.strip(".").lower()
    if suffix:
        return suffix
    if content_type and "/" in content_type:
        return content_type.split("/", 1)[1].lower()
    raise ValidationError("Uploaded image must include a recognizable extension")


def _allowed_image_formats(raw_formats: str) -> set[str]:
    return {item.strip().lower() for item in raw_formats.split(",") if item.strip()}
