from __future__ import annotations

from uuid import UUID

from sqlalchemy.orm import Session

from src.api.schemas.workspaces import (
    WorkspaceCreate,
    WorkspaceMembershipCreate,
    WorkspaceMembershipUpdate,
    WorkspaceUpdate,
)
from src.api.service.user import get_user_by_id
from src.api.service.workspaces import (
    create_workspace,
    create_workspace_membership_record,
    delete_workspace,
    delete_workspace_membership_record,
    get_workspace_membership_by_id,
    list_workspace_memberships,
    list_workspaces,
    require_existing_workspace,
    update_workspace,
    update_workspace_membership_role,
)
from src.application.errors import NotFoundError
from src.domain.models import Workspace, WorkspaceMembership


def create_workspace_usecase(db: Session, payload: WorkspaceCreate) -> Workspace:
    try:
        workspace = create_workspace(db, payload)
        db.commit()
        db.refresh(workspace)
        return workspace
    except Exception as exc:
        db.rollback()
        raise exc


def list_workspaces_usecase(db: Session) -> list[Workspace]:
    return list_workspaces(db)


def get_workspace_usecase(db: Session, workspace_id: UUID) -> Workspace:
    workspace = require_existing_workspace(db, workspace_id)
    return workspace


def update_workspace_usecase(
    db: Session,
    workspace_id: UUID,
    payload: WorkspaceUpdate,
) -> Workspace:
    workspace = require_existing_workspace(db, workspace_id)
    try:
        workspace = update_workspace(db, workspace, payload)
        db.commit()
        db.refresh(workspace)
        return workspace
    except Exception as exc:
        db.rollback()
        raise exc


def delete_workspace_usecase(db: Session, workspace_id: UUID) -> None:
    workspace = require_existing_workspace(db, workspace_id)
    try:
        delete_workspace(db, workspace)
        db.commit()
    except Exception as exc:
        db.rollback()
        raise exc


def list_workspace_memberships_usecase(
    db: Session,
    workspace_id: UUID,
) -> list[WorkspaceMembership]:
    require_existing_workspace(db, workspace_id)
    return list_workspace_memberships(db, workspace_id)


def create_workspace_membership_usecase(
    db: Session,
    workspace_id: UUID,
    payload: WorkspaceMembershipCreate,
) -> WorkspaceMembership:
    workspace = require_existing_workspace(db, workspace_id)
    user = get_user_by_id(db, payload.user_id)
    if not user:
        raise NotFoundError("User not found")
    try:
        membership = create_workspace_membership_record(db, workspace, user, payload.role)
        db.commit()
        db.refresh(membership)
        return membership
    except Exception as exc:
        db.rollback()
        raise exc


def update_workspace_membership_usecase(
    db: Session,
    workspace_id: UUID,
    membership_id: UUID,
    payload: WorkspaceMembershipUpdate,
) -> WorkspaceMembership:
    require_existing_workspace(db, workspace_id)
    membership = get_workspace_membership_by_id(db, workspace_id, membership_id)
    if not membership:
        raise NotFoundError("Workspace membership not found")
    try:
        membership = update_workspace_membership_role(membership, payload.role)
        db.commit()
        db.refresh(membership)
        return membership
    except Exception as exc:
        db.rollback()
        raise exc


def delete_workspace_membership_usecase(
    db: Session,
    workspace_id: UUID,
    membership_id: UUID,
) -> None:
    require_existing_workspace(db, workspace_id)
    membership = get_workspace_membership_by_id(db, workspace_id, membership_id)
    if not membership:
        raise NotFoundError("Workspace membership not found")
    try:
        delete_workspace_membership_record(db, membership)
        db.commit()
    except Exception as exc:
        db.rollback()
        raise exc
