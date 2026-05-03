from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from src.api.routes.deps import get_db
from src.api.schemas.workspaces import (
    WorkspaceCreate,
    WorkspaceMembershipCreate,
    WorkspaceMembershipRead,
    WorkspaceMembershipUpdate,
    WorkspaceRead,
    WorkspaceUpdate,
)
from src.application.usecases.workspace_usecases import (
    create_workspace_membership_usecase,
    create_workspace_usecase,
    delete_workspace_membership_usecase,
    delete_workspace_usecase,
    get_workspace_usecase,
    list_workspace_memberships_usecase,
    list_workspaces_usecase,
    update_workspace_membership_usecase,
    update_workspace_usecase,
)
from src.domain.models import User
from src.security.auth import require_superadmin

router = APIRouter(prefix="/workspaces", tags=["workspaces"])


@router.post("", response_model=WorkspaceRead, status_code=status.HTTP_201_CREATED)
def create_item(
    payload: WorkspaceCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_superadmin),
):
    return create_workspace_usecase(db, payload)


@router.get("", response_model=list[WorkspaceRead], status_code=status.HTTP_200_OK)
def list_items(
    db: Session = Depends(get_db),
    _: User = Depends(require_superadmin),
):
    return list_workspaces_usecase(db)


@router.get("/{workspace_id}", response_model=WorkspaceRead, status_code=status.HTTP_200_OK)
def get_item(
    workspace_id: UUID,
    db: Session = Depends(get_db),
    _: User = Depends(require_superadmin),
):
    return get_workspace_usecase(db, workspace_id)


@router.patch("/{workspace_id}", response_model=WorkspaceRead, status_code=status.HTTP_200_OK)
def update_item(
    workspace_id: UUID,
    payload: WorkspaceUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_superadmin),
):
    return update_workspace_usecase(db, workspace_id, payload)


@router.delete("/{workspace_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(
    workspace_id: UUID,
    db: Session = Depends(get_db),
    _: User = Depends(require_superadmin),
):
    delete_workspace_usecase(db, workspace_id)
    return None


@router.get(
    "/{workspace_id}/memberships",
    response_model=list[WorkspaceMembershipRead],
    status_code=status.HTTP_200_OK,
)
def list_memberships(
    workspace_id: UUID,
    db: Session = Depends(get_db),
    _: User = Depends(require_superadmin),
):
    return list_workspace_memberships_usecase(db, workspace_id)


@router.post(
    "/{workspace_id}/memberships",
    response_model=WorkspaceMembershipRead,
    status_code=status.HTTP_201_CREATED,
)
def create_membership(
    workspace_id: UUID,
    payload: WorkspaceMembershipCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_superadmin),
):
    return create_workspace_membership_usecase(db, workspace_id, payload)


@router.patch(
    "/{workspace_id}/memberships/{membership_id}",
    response_model=WorkspaceMembershipRead,
    status_code=status.HTTP_200_OK,
)
def update_membership(
    workspace_id: UUID,
    membership_id: UUID,
    payload: WorkspaceMembershipUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_superadmin),
):
    return update_workspace_membership_usecase(db, workspace_id, membership_id, payload)


@router.delete(
    "/{workspace_id}/memberships/{membership_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_membership(
    workspace_id: UUID,
    membership_id: UUID,
    db: Session = Depends(get_db),
    _: User = Depends(require_superadmin),
):
    delete_workspace_membership_usecase(db, workspace_id, membership_id)
    return None
