from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from src.api.routes.deps import get_db
from src.api.schemas.sender_accounts import (
    SenderAccountCreate,
    SenderAccountRead,
)
from src.api.service.sender_accounts import (
    create_sender_account,
    delete_sender_account,
    get_sender_account_by_id,
    list_sender_accounts,
)

router = APIRouter(prefix="/sender-accounts", tags=["sender-accounts"])


@router.post("/create", status_code=status.HTTP_201_CREATED)
def create_sender(
    payload: SenderAccountCreate | None = None, db: Session = Depends(get_db)
):
    sender = create_sender_account(db, payload)
    return {"id": sender.id}


@router.post("", status_code=status.HTTP_201_CREATED)
def create(
    payload: SenderAccountCreate | None = None, db: Session = Depends(get_db)
):
    sender = create_sender_account(db, payload)
    return {"id": sender.id}


@router.get("", response_model=list[SenderAccountRead])
def list_items(db: Session = Depends(get_db)):
    return list_sender_accounts(db)


@router.get("/{sender_id}", response_model=SenderAccountRead)
def get_item(sender_id: int, db: Session = Depends(get_db)):
    sender = get_sender_account_by_id(db, sender_id)
    if not sender:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sender account not found",
        )
    return sender


@router.delete("/{sender_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(sender_id: int, db: Session = Depends(get_db)):
    sender = get_sender_account_by_id(db, sender_id)
    if not sender:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sender account not found",
        )
    delete_sender_account(db, sender)
    return None
