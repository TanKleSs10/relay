from __future__ import annotations

from uuid import UUID

from sqlalchemy.orm import Session

from src.api.schemas.users import UserCreate, UserStatusUpdate
from src.api.service.user import (
    change_user_status,
    create_user,
    create_workspace_membership,
    deactivate_user,
    delete_user,
    get_role_by_name,
    create_user_role,
    get_user_by_id,
    list_users,
    update_user,
)
from src.application.errors import NotFoundError, ValidationError
from src.domain.models import User, WorkspaceMembershipRole
from src.security.auth import get_accessible_workspace_ids, resolve_workspace_id
from src.security.passwords import hash_password


def _resolve_memberships(
    payload: UserCreate,
) -> list[tuple[UUID, WorkspaceMembershipRole]]:
    if payload.memberships:
        seen: set[UUID] = set()
        resolved: list[tuple[UUID, WorkspaceMembershipRole]] = []
        for membership in payload.memberships:
            workspace_id = UUID(str(membership.workspace_id))
            if workspace_id in seen:
                raise ValidationError("Duplicate workspace in memberships")
            seen.add(workspace_id)
            resolved.append((workspace_id, membership.role))
        return resolved

    if payload.workspace_id:
        return [(UUID(str(payload.workspace_id)), WorkspaceMembershipRole.OPERATOR)]

    raise ValidationError("At least one workspace membership is required")


def create_user_usecase(db: Session, payload: UserCreate, actor: User) -> User:
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
    memberships = _resolve_memberships(payload)
    for requested_workspace_id, membership_role in memberships:
        workspace_id = resolve_workspace_id(actor, requested_workspace_id, db)
        create_workspace_membership(
            db,
            user,
            workspace_id,
            role=membership_role,
        )
    db.commit()
    return get_user_by_id(db, user.id)


def list_users_usecase(
    db: Session, actor: User, skip: int = 0, limit: int = 100
) -> list[User]:
    return list_users(
        db,
        skip=skip,
        limit=limit,
        workspace_ids=get_accessible_workspace_ids(actor, db),
    )


def get_user_usecase(db: Session, actor: User, user_id: UUID) -> User:
    user = get_user_by_id(
        db, user_id, workspace_ids=get_accessible_workspace_ids(actor, db)
    )
    if not user:
        raise NotFoundError("User not found")
    return user


def update_user_status_usecase(
    db: Session, actor: User, user_id: UUID, payload: UserStatusUpdate
) -> User:
    get_user_by_id(db, user_id, workspace_ids=get_accessible_workspace_ids(actor, db))
    user = change_user_status(db, user_id, payload.status)
    db.commit()
    db.refresh(user)
    return user


def update_user_usecase(
    db: Session, actor: User, user_id: UUID, username: str | None, email: str | None
) -> User:
    get_user_by_id(db, user_id, workspace_ids=get_accessible_workspace_ids(actor, db))
    user = update_user(db, user_id, username=username, email=email)
    db.commit()
    db.refresh(user)
    return user


def delete_user_usecase(db: Session, actor: User, user_id: UUID) -> None:
    get_user_by_id(db, user_id, workspace_ids=get_accessible_workspace_ids(actor, db))
    delete_user(db, user_id)
    db.commit()
    return
