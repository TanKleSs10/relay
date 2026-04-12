from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from uuid import UUID

from src.api.routes.deps import get_db
from src.api.schemas.users import UserCreate, UserRead, UserStatusUpdate
from src.application.usecases.user_usecases import (
    create_user_usecase,
    get_user_usecase,
    list_users_usecase,
    update_user_status_usecase,
)
from src.security.auth import require_admin

router = APIRouter(prefix="/users", tags=["users"])


@router.post("", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def create_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
    _: UserRead = Depends(require_admin),
):
    return create_user_usecase(db, payload)


@router.get("", response_model=list[UserRead], status_code=status.HTTP_200_OK)
def list_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    _: UserRead = Depends(require_admin),
):
    return list_users_usecase(db, skip=skip, limit=limit)


@router.get("/{user_id}", response_model=UserRead, status_code=status.HTTP_200_OK)
def get_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    _: UserRead = Depends(require_admin),
):
    return get_user_usecase(db, user_id)


@router.patch(
    "/{user_id}/status",
    response_model=UserRead,
    status_code=status.HTTP_200_OK,
)
def update_user_status(
    user_id: UUID,
    payload: UserStatusUpdate,
    db: Session = Depends(get_db),
    _: UserRead = Depends(require_admin),
):
    return update_user_status_usecase(db, user_id, payload)
