from fastapi import APIRouter, Depends, Query, Response, status
from uuid import UUID
from sqlalchemy.orm import Session

from src.api.routes.deps import get_db
from src.api.schemas.messages import MessageCreate, MessageRead, MessageUpdate
from src.domain import MessageStatus
from src.application.usecases.message_usecases import (
    create_message,
    get_message,
    get_messages,
    remove_message,
    update_message_item,
)
from src.api.service.messages import count_messages_filtered
from src.security.auth import require_permission
from src.security.permissions import PERM_CAMPAIGN_MANAGE, PERM_CAMPAIGN_READ

router = APIRouter(prefix="/messages", tags=["messages"])


@router.post("", response_model=MessageRead, status_code=status.HTTP_201_CREATED)
def create(
    payload: MessageCreate,
    db: Session = Depends(get_db),
    _: object = Depends(require_permission(PERM_CAMPAIGN_MANAGE)),
):
    return create_message(db, payload)


@router.get("", response_model=list[MessageRead])
def list_items(
    response: Response,
    db: Session = Depends(get_db),
    _: object = Depends(require_permission(PERM_CAMPAIGN_READ)),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    campaign_id: UUID | None = Query(default=None),
    status: MessageStatus | None = Query(default=None),
):
    items = get_messages(
        db, skip=skip, limit=limit, campaign_id=campaign_id, status=status
    )
    total = count_messages_filtered(db, campaign_id=campaign_id, status=status)
    response.headers["X-Total-Count"] = str(total)
    return items


@router.get("/{message_id}", response_model=MessageRead)
def get_item(
    message_id: UUID,
    db: Session = Depends(get_db),
    _: object = Depends(require_permission(PERM_CAMPAIGN_READ)),
):
    return get_message(message_id, db)


@router.delete("/{message_id}", status_code=status.HTTP_200_OK)
def delete_item(
    message_id: UUID,
    db: Session = Depends(get_db),
    _: object = Depends(require_permission(PERM_CAMPAIGN_MANAGE)),
):
    remove_message(message_id, db)
    return {"detail": "Message deleted successfully"}


@router.patch("/{message_id}", response_model=MessageRead)
def update_item(
    message_id: UUID,
    payload: MessageUpdate,
    db: Session = Depends(get_db),
    _: object = Depends(require_permission(PERM_CAMPAIGN_MANAGE)),
):
    return update_message_item(message_id, payload, db)
