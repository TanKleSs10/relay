from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from src.api.routes.deps import get_db
from src.api.schemas.messages import MessageCreate, MessageRead, MessageUpdate
from src.application.usecases.message_usecases import (
    create_message,
    get_message,
    get_messages,
    remove_message,
    update_message_item,
)

router = APIRouter(prefix="/messages", tags=["messages"])


@router.post("", response_model=MessageRead, status_code=status.HTTP_201_CREATED)
def create(payload: MessageCreate, db: Session = Depends(get_db)):
    return create_message(db, payload)


@router.get("", response_model=list[MessageRead])
def list_items(db: Session = Depends(get_db)):
    return get_messages(db)


@router.get("/{message_id}", response_model=MessageRead)
def get_item(message_id: int, db: Session = Depends(get_db)):
    return get_message(message_id, db)


@router.delete("/{message_id}", status_code=status.HTTP_200_OK)
def delete_item(message_id: int, db: Session = Depends(get_db)):
    remove_message(message_id, db)
    return {"detail": "Message deleted successfully"}


@router.patch("/{message_id}", response_model=MessageRead)
def update_item(
    message_id: int,
    payload: MessageUpdate,
    db: Session = Depends(get_db)
):
    return update_message_item(message_id, payload, db)
