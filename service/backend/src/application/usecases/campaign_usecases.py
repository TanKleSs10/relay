from datetime import datetime
from uuid import UUID
from sqlalchemy import func
from fastapi import UploadFile
from sqlalchemy.orm import Session
from src.api.schemas.campaigns import CampaignCreate, CampaignUpdate
from src.application.errors import ConflictError, NotFoundError
from src.api.service.campaigns import (
    create_campaign,
    delete_campaign,
    get_campaign_by_id,
    get_campaign_by_name,
    list_campaigns,
    update_campaign as update_campaign_service,
)
from src.api.service.messages import create_messages, reset_messages_by_campaign
from src.domain.models import Campaign, SenderAccount, Message
from src.domain import CampaignStatus, SenderAccountStatus, MessageStatus
from src.infrastructure.file_readers.factory import get_reader
from src.infrastructure.machine.campaign_machine import can_transition


def _ensure_unique_campaign_name(db: Session, name: str) -> None:
    existing = get_campaign_by_name(db, name)
    if existing:
        raise ConflictError("Campaign with this name already exists")


def _extract_message_row(
    row: dict[str, str],
) -> tuple[str | None, str | None, str | None]:
    recipient = row.get("phone") or row.get("recipient") or row.get("phone_number")
    content = row.get("message") or row.get("payload") or row.get("text")
    external_id = row.get("external_id") or row.get("credit_id") or row.get("id")
    recipient_str = recipient if isinstance(recipient, str) else None
    content_str = content if isinstance(content, str) else None
    external_id_str = external_id if isinstance(external_id, str) else None
    return recipient_str, content_str, external_id_str


def create_campaign_with_file(name: str, file: UploadFile | None, db: Session):
    try:
        _ensure_unique_campaign_name(db, name)

        # Create campaign
        campaign = create_campaign(db, CampaignCreate(name=name))
        db.flush()

        # If there's no file, just commit and return with empty summary
        if not file:
            db.commit()
            db.refresh(campaign)
            return campaign, 0, []

        # Read file and create messages
        reader = get_reader(str(file.filename))
        data: list[dict[str, str]] = reader.read(file)
        print(f"Data read from file: {data}")
        created = 0
        invalid_rows: list[dict[str, object]] = []

        for idx, row in enumerate(data, start=1):
            recipient, content, external_id = _extract_message_row(row)

            if not recipient or not content:
                invalid_rows.append({"row": idx, "data": row})
                continue

            message = create_messages(
                db,
                recipient=recipient,
                content=content,
                campaign_id=campaign.id,
                external_id=external_id,
                allow_duplicate=True,
            )
            if message:
                created += 1

        db.commit()
        db.refresh(campaign)
        return campaign, created, invalid_rows
    except Exception as exc:
        db.rollback()
        raise exc


def create_campaigns(db: Session, payload: CampaignCreate) -> Campaign:
    try:
        _ensure_unique_campaign_name(db, payload.name)

        if payload.status and payload.status not in {
            CampaignStatus.CREATED,
            CampaignStatus.PAUSED,
        }:
            raise ConflictError("Campaign status can only start as CREATED or PAUSED")

        campaign = create_campaign(db, payload)
        db.commit()
        db.refresh(campaign)
        return campaign
    except Exception as exc:
        db.rollback()
        raise exc


def get_campaigns(db: Session):
    return list_campaigns(db)


def get_campaign(campaign_id: UUID, db: Session):
    campaign = get_campaign_by_id(db, campaign_id)
    if not campaign:
        raise NotFoundError("Campaign not found")
    return campaign


def update_campaign(campaign_id: UUID, payload: CampaignUpdate, db: Session):
    campaign = get_campaign_by_id(db, campaign_id)
    if not campaign:
        raise NotFoundError("Campaign not found")

    if payload.status and not can_transition(campaign.status, payload.status):
        raise ConflictError(
            f"Invalid campaign status transition {campaign.status} -> {payload.status}"
        )

    try:
        campaign = update_campaign_service(db, campaign, payload)
        db.commit()
        db.refresh(campaign)
        return campaign
    except Exception as exc:
        db.rollback()
        raise exc


def remove_campaign(campaign_id: UUID, db: Session):
    campaign = get_campaign_by_id(db, campaign_id)
    if not campaign:
        raise NotFoundError("Campaign not found")
    if campaign.status == CampaignStatus.ACTIVE:
        raise ConflictError("Cannot delete a campaign that is currently active")
    try:
        delete_campaign(db, campaign)
        db.commit()
    except Exception as exc:
        db.rollback()
        raise exc
    return {
        "status": "success",
        "message": f"Campaign with id {campaign_id} deleted successfully.",
    }


def dispatch_campaign(campaign_id: UUID, db: Session) -> dict[str, UUID]:
    campaign = get_campaign_by_id(db, campaign_id)
    if not campaign:
        raise NotFoundError("Campaign not found")
    if not can_transition(campaign.status, CampaignStatus.ACTIVE):
        raise ConflictError(
            f"Campaign cannot be activated from status {campaign.status}"
        )
    active = (
        db.query(Campaign)
        .filter(Campaign.status == CampaignStatus.ACTIVE, Campaign.id != campaign_id)
        .first()
    )
    if active:
        raise ConflictError("Another campaign is already ACTIVE")
    available_sender = (
        db.query(SenderAccount)
        .filter(SenderAccount.status == SenderAccountStatus.CONNECTED)
        .first()
    )
    if not available_sender:
        raise ConflictError("No CONNECTED senders available")

    try:
        campaign.status = CampaignStatus.ACTIVE
        campaign.started_at = datetime.utcnow()
        db.commit()
        return {"campaign_id": campaign.id}
    except Exception as exc:
        db.rollback()
        raise exc


def pause_campaign(campaign_id: UUID, db: Session) -> dict[str, UUID]:
    campaign = get_campaign_by_id(db, campaign_id)
    if not campaign:
        raise NotFoundError("Campaign not found")
    if not can_transition(campaign.status, CampaignStatus.PAUSED):
        raise ConflictError(f"Campaign cannot be paused from status {campaign.status}")
    try:
        campaign.status = CampaignStatus.PAUSED
        db.commit()
        return {"campaign_id": campaign.id}
    except Exception as exc:
        db.rollback()
        raise exc


def retry_campaign(campaign_id: UUID, db: Session) -> dict[str, int]:
    campaign = get_campaign_by_id(db, campaign_id)
    if not campaign:
        raise NotFoundError("Campaign not found")
    if not can_transition(campaign.status, CampaignStatus.ACTIVE):
        raise ConflictError(f"Campaign cannot be retried from status {campaign.status}")
    active = (
        db.query(Campaign)
        .filter(Campaign.status == CampaignStatus.ACTIVE, Campaign.id != campaign_id)
        .first()
    )
    if active:
        raise ConflictError("Another campaign is already ACTIVE")
    available_sender = (
        db.query(SenderAccount)
        .filter(SenderAccount.status == SenderAccountStatus.CONNECTED)
        .first()
    )
    if not available_sender:
        raise ConflictError("No CONNECTED senders available")

    try:
        reset_count = reset_messages_by_campaign(db, campaign_id)
        campaign.status = CampaignStatus.ACTIVE
        db.commit()
        return {"reset_messages": reset_count}
    except Exception as exc:
        db.rollback()
        raise exc


def get_campaign_metrics(
    campaign_id: UUID,
    db: Session,
    created_from: datetime | None = None,
    created_to: datetime | None = None,
    sent_from: datetime | None = None,
    sent_to: datetime | None = None,
    include_no_wa: bool = True,
) -> dict[str, int | float | UUID]:
    campaign = get_campaign_by_id(db, campaign_id)
    if not campaign:
        raise NotFoundError("Campaign not found")
    query = db.query(Message.status, func.count(Message.id)).filter(
        Message.campaign_id == campaign_id
    )
    if created_from:
        query = query.filter(Message.created_at >= created_from)
    if created_to:
        query = query.filter(Message.created_at <= created_to)
    if sent_from:
        query = query.filter(Message.sent_at >= sent_from)
    if sent_to:
        query = query.filter(Message.sent_at <= sent_to)
    if not include_no_wa:
        query = query.filter(Message.status != MessageStatus.NO_WA)

    rows = query.group_by(Message.status).all()
    counts: dict[MessageStatus, int] = {}
    for status, count in rows:
        counts[status] = int(count)
    total = sum(counts.values()) if counts else 0
    sent = counts.get(MessageStatus.SENT, 0)
    failed = counts.get(MessageStatus.FAILED, 0)
    pending = counts.get(MessageStatus.PENDING, 0)
    processing = counts.get(MessageStatus.PROCESSING, 0)
    no_wa = counts.get(MessageStatus.NO_WA, 0) if include_no_wa else 0
    effectiveness = (sent / total) if total else 0.0
    return {
        "campaign_id": campaign_id,
        "total": total,
        "sent": sent,
        "failed": failed,
        "pending": pending,
        "processing": processing,
        "no_wa": no_wa,
        "effectiveness": effectiveness,
    }
