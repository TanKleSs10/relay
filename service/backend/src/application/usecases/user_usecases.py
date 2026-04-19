from __future__ import annotations

from uuid import UUID

from sqlalchemy.orm import Session

from src.api.schemas.users import UserCreate, UserStatusUpdate
from src.api.service.user import (
    change_user_status,
    create_user,
    deactivate_user,
    get_role_by_name,
    create_user_role,
    get_user_by_id,
    list_users,
    update_user,
)
from src.application.errors import NotFoundError
from src.domain.models import User
from src.security.passwords import hash_password


def create_user_usecase(db: Session, payload: UserCreate) -> User:
    user = create_user(
        db,
        username=payload.username,
        email=payload.email,
        password_hash=hash_password(payload.password),
    )
    db.flush()  # Ensure user.id is generated before creating UserRole
    role = get_role_by_name(db, "USER")
    if not role:
        raise NotFoundError("Default role USER not found")
    create_user_role(db, user, role)
    db.commit()
    db.refresh(user)
    return user


def list_users_usecase(db: Session, skip: int = 0, limit: int = 100) -> list[User]:
    return list_users(db, skip=skip, limit=limit)


def get_user_usecase(db: Session, user_id: UUID) -> User:
    user = get_user_by_id(db, user_id)
    if not user:
        raise NotFoundError("User not found")
    return user


def update_user_status_usecase(
    db: Session, user_id: UUID, payload: UserStatusUpdate
) -> User:
    user = change_user_status(db, user_id, payload.status)
    db.commit()
    db.refresh(user)
    return user


def update_user_usecase(
    db: Session, user_id: UUID, username: str | None, email: str | None
) -> User:
    user = update_user(db, user_id, username=username, email=email)
    db.commit()
    db.refresh(user)
    return user


def delete_user_usecase(db: Session, user_id: UUID) -> User:
    user = deactivate_user(db, user_id)
    db.commit()
    db.refresh(user)
    return user
