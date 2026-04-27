from fastapi import APIRouter, Depends, status
from uuid import UUID
from sqlalchemy.orm import Session

from src.api.routes.deps import get_db
from src.api.schemas.sender_accounts import (
    SenderAccountCreate,
    SenderAccountRead,
    SenderAccountUpdate,
)
from src.api.schemas.sender_sessions import (
    SenderSessionRead,
    SenderQrRead,
    SessionLogRead,
)
from src.application.usecases.sender_account_usecases import (
    create_sender as create_sender_usecase,
    get_sender as get_sender_usecase,
    list_senders as list_senders_usecase,
    remove_sender as remove_sender_usecase,
    request_sender_qr_code as request_sender_qr_code_usecase,
    reset_sender as reset_sender_usecase,
    update_sender as update_sender_usecase,
)
from src.api.service.sender_sessions import get_sender_session, list_session_logs
from src.security.auth import require_permission
from src.security.permissions import PERM_SENDER_MANAGE

router = APIRouter(prefix="/sender-accounts", tags=["sender-accounts"])


@router.post("/create", status_code=status.HTTP_201_CREATED)
def create_sender(
    payload: SenderAccountCreate | None = None,
    db: Session = Depends(get_db),
    _: object = Depends(require_permission(PERM_SENDER_MANAGE)),
):
    sender = create_sender_usecase(db, payload)
    return {"id": sender.id}


@router.post("", status_code=status.HTTP_201_CREATED)
def create(
    payload: SenderAccountCreate | None = None,
    db: Session = Depends(get_db),
    _: object = Depends(require_permission(PERM_SENDER_MANAGE)),
):
    sender = create_sender_usecase(db, payload)
    return {"id": sender.id}


@router.get("", response_model=list[SenderAccountRead])
def list_items(
    db: Session = Depends(get_db),
    _: object = Depends(require_permission(PERM_SENDER_MANAGE)),
):
    return list_senders_usecase(db)


@router.get("/{sender_id}", response_model=SenderAccountRead)
def get_item(
    sender_id: UUID,
    db: Session = Depends(get_db),
    _: object = Depends(require_permission(PERM_SENDER_MANAGE)),
):
    return get_sender_usecase(sender_id, db)


@router.delete("/{sender_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(
    sender_id: UUID,
    db: Session = Depends(get_db),
    _: object = Depends(require_permission(PERM_SENDER_MANAGE)),
):
    remove_sender_usecase(sender_id, db)
    return None


@router.patch("/{sender_id}", response_model=SenderAccountRead)
def update_item(
    sender_id: UUID,
    payload: SenderAccountUpdate,
    db: Session = Depends(get_db),
    _: object = Depends(require_permission(PERM_SENDER_MANAGE)),
):
    return update_sender_usecase(sender_id, payload, db)


@router.post("/{sender_id}/reset-session", response_model=SenderAccountRead)
def reset_session(
    sender_id: UUID,
    db: Session = Depends(get_db),
    _: object = Depends(require_permission(PERM_SENDER_MANAGE)),
):
    return reset_sender_usecase(sender_id, db)


@router.post("/{sender_id}/request-qr", response_model=SenderAccountRead)
def request_qr(
    sender_id: UUID,
    db: Session = Depends(get_db),
    _: object = Depends(require_permission(PERM_SENDER_MANAGE)),
):
    return request_sender_qr_code_usecase(sender_id, db)


@router.get("/{sender_id}/session", response_model=SenderSessionRead | None)
def get_session(
    sender_id: UUID,
    db: Session = Depends(get_db),
    _: object = Depends(require_permission(PERM_SENDER_MANAGE)),
):
    session = get_sender_session(db, sender_id)
    if not session:
        return None
    return session


@router.get("/{sender_id}/qr", response_model=SenderQrRead)
def get_qr(
    sender_id: UUID,
    db: Session = Depends(get_db),
    _: object = Depends(require_permission(PERM_SENDER_MANAGE)),
):
    session = get_sender_session(db, sender_id)
    if not session:
        return {"sender_account_id": sender_id, "qr_code": None, "qr_generated_at": None}
    return {
        "sender_account_id": sender_id,
        "qr_code": session.qr_code,
        "qr_generated_at": session.qr_generated_at,
    }


@router.get("/{sender_id}/session/logs", response_model=list[SessionLogRead])
def get_session_logs(
    sender_id: UUID,
    db: Session = Depends(get_db),
    _: object = Depends(require_permission(PERM_SENDER_MANAGE)),
):
    return list_session_logs(db, sender_id)
