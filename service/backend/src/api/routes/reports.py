from __future__ import annotations

import csv
from datetime import datetime
from io import StringIO
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from src.api.routes.deps import get_db
from src.application.errors import NotFoundError
from src.api.service.campaigns import get_campaign_by_id
from src.domain import Message, MessageStatus
from src.domain.models import User
from src.security.auth import get_accessible_workspace_ids, require_permission
from src.security.permissions import PERM_CAMPAIGN_READ

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/campaigns/{campaign_id}/messages.csv")
def export_campaign_messages(
    campaign_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission(PERM_CAMPAIGN_READ)),
    status: MessageStatus | None = Query(default=None),
    created_from: datetime | None = Query(default=None),
    created_to: datetime | None = Query(default=None),
    sent_from: datetime | None = Query(default=None),
    sent_to: datetime | None = Query(default=None),
):
    campaign = get_campaign_by_id(
        db,
        campaign_id,
        workspace_ids=get_accessible_workspace_ids(user, db),
    )
    if not campaign:
        raise NotFoundError("Campaign not found")

    query = db.query(Message).filter(Message.campaign_id == campaign_id)
    if status:
        query = query.filter(Message.status == status)
    if created_from:
        query = query.filter(Message.created_at >= created_from)
    if created_to:
        query = query.filter(Message.created_at <= created_to)
    if sent_from:
        query = query.filter(Message.sent_at >= sent_from)
    if sent_to:
        query = query.filter(Message.sent_at <= sent_to)

    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(
        [
            "external_id",
            "recipient",
            "content",
            "status",
            "sent_at",
            "error_message",
        ]
    )

    for message in query.order_by(Message.created_at.asc()).all():
        writer.writerow(
            [
                message.external_id,
                message.recipient,
                message.content,
                message.status.value,
                message.sent_at.isoformat() if message.sent_at else "",
                message.last_error_message or "",
            ]
        )

    output.seek(0)
    filename = f"campaign_{campaign_id}_messages.csv"
    headers = {"Content-Disposition": f"attachment; filename={filename}"}
    return StreamingResponse(iter([output.getvalue()]), media_type="text/csv", headers=headers)
