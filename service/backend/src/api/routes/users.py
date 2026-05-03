from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from uuid import UUID

from src.api.routes.deps import get_db
from src.api.schemas.users import UserCreate, UserRead, UserStatusUpdate, UserUpdate
from src.application.usecases.user_usecases import (
    create_user_usecase,
    delete_user_usecase,
    get_user_usecase,
    list_users_usecase,
    update_user_usecase,
    update_user_status_usecase,
)
from src.domain.models import User
from src.security.auth import require_superadmin

router = APIRouter(prefix="/users", tags=["users"])


@router.post("", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def create_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_superadmin),
):
    return create_user_usecase(db, payload, user)


@router.get("", response_model=list[UserRead], status_code=status.HTTP_200_OK)
def list_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    user: User = Depends(require_superadmin),
):
    return list_users_usecase(db, user, skip=skip, limit=limit)


@router.get("/{user_id}", response_model=UserRead, status_code=status.HTTP_200_OK)
def get_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(require_superadmin),
):
    return get_user_usecase(db, user, user_id)


@router.patch(
    "/{user_id}/status",
    response_model=UserRead,
    status_code=status.HTTP_200_OK,
)
def update_user_status(
    user_id: UUID,
    payload: UserStatusUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_superadmin),
):
    return update_user_status_usecase(db, user, user_id, payload)


@router.patch("/{user_id}", response_model=UserRead, status_code=status.HTTP_200_OK)
def update_user(
    user_id: UUID,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_superadmin),
):
    return update_user_usecase(
        db,
        user,
        user_id,
        username=payload.username,
        email=payload.email,
    )


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(require_superadmin),
):
    delete_user_usecase(db, user, user_id)
    return None
