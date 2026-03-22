from fastapi import APIRouter, Depends, status
from uuid import UUID
from sqlalchemy.orm import Session

from src.api.routes.deps import get_db
from src.api.schemas.sender_accounts import (
    SenderAccountCreate,
    SenderAccountRead,
)
from src.application.usecases.sender_account_usecases import (
    create_sender as create_sender_usecase,
    get_sender as get_sender_usecase,
    list_senders as list_senders_usecase,
    remove_sender as remove_sender_usecase,
    reset_sender as reset_sender_usecase,
)

router = APIRouter(prefix="/sender-accounts", tags=["sender-accounts"])


@router.post("/create", status_code=status.HTTP_201_CREATED)
def create_sender(
    payload: SenderAccountCreate | None = None, db: Session = Depends(get_db)
):
    sender = create_sender_usecase(db, payload)
    return {"id": sender.id}


@router.post("", status_code=status.HTTP_201_CREATED)
def create(
    payload: SenderAccountCreate | None = None, db: Session = Depends(get_db)
):
    sender = create_sender_usecase(db, payload)
    return {"id": sender.id}


@router.get("", response_model=list[SenderAccountRead])
def list_items(db: Session = Depends(get_db)):
    return list_senders_usecase(db)


@router.get("/{sender_id}", response_model=SenderAccountRead)
def get_item(sender_id: UUID, db: Session = Depends(get_db)):
    return get_sender_usecase(sender_id, db)


@router.delete("/{sender_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(sender_id: UUID, db: Session = Depends(get_db)):
    remove_sender_usecase(sender_id, db)
    return None


@router.post("/{sender_id}/reset-session", response_model=SenderAccountRead)
def reset_session(sender_id: UUID, db: Session = Depends(get_db)):
    return reset_sender_usecase(sender_id, db)
