from __future__ import annotations

from uuid import UUID

from sqlalchemy.orm import Session, selectinload

from src.api.schemas.workspaces import WorkspaceCreate, WorkspaceUpdate
from src.application.errors import ConflictError, NotFoundError
from src.domain.models import User, Workspace, WorkspaceMembership, WorkspaceMembershipRole


def list_workspaces(db: Session) -> list[Workspace]:
    return db.query(Workspace).order_by(Workspace.created_at.desc()).all()


def get_workspace_by_id(db: Session, workspace_id: UUID) -> Workspace | None:
    return db.query(Workspace).filter(Workspace.id == workspace_id).first()


def get_workspace_by_slug(db: Session, slug: str) -> Workspace | None:
    return db.query(Workspace).filter(Workspace.slug == slug).first()


def create_workspace(db: Session, payload: WorkspaceCreate) -> Workspace:
    if db.query(Workspace).filter(Workspace.name == payload.name).first():
        raise ConflictError("Workspace name already exists")
    if db.query(Workspace).filter(Workspace.slug == payload.slug).first():
        raise ConflictError("Workspace slug already exists")

    workspace = Workspace(
        name=payload.name,
        slug=payload.slug,
        is_active=payload.is_active,
    )
    db.add(workspace)
    return workspace


def update_workspace(
    db: Session,
    workspace: Workspace,
    payload: WorkspaceUpdate,
) -> Workspace:
    updates = payload.model_dump(exclude_unset=True)

    next_name = updates.get("name")
    if next_name and next_name != workspace.name:
        if db.query(Workspace).filter(Workspace.name == next_name).first():
            raise ConflictError("Workspace name already exists")

    next_slug = updates.get("slug")
    if next_slug and next_slug != workspace.slug:
        if db.query(Workspace).filter(Workspace.slug == next_slug).first():
            raise ConflictError("Workspace slug already exists")

    for field, value in updates.items():
        setattr(workspace, field, value)
    return workspace


def delete_workspace(db: Session, workspace: Workspace) -> None:
    if workspace.campaigns:
        raise ConflictError("Cannot delete a workspace with campaigns")
    if workspace.sender_accounts:
        raise ConflictError("Cannot delete a workspace with sender accounts")
    if workspace.memberships:
        raise ConflictError("Cannot delete a workspace with memberships")
    db.delete(workspace)


def list_workspace_memberships(
    db: Session,
    workspace_id: UUID,
) -> list[WorkspaceMembership]:
    return (
        db.query(WorkspaceMembership)
        .options(selectinload(WorkspaceMembership.user))
        .filter(WorkspaceMembership.workspace_id == workspace_id)
        .order_by(WorkspaceMembership.created_at.asc())
        .all()
    )


def get_workspace_membership_by_id(
    db: Session,
    workspace_id: UUID,
    membership_id: UUID,
) -> WorkspaceMembership | None:
    return (
        db.query(WorkspaceMembership)
        .filter(
            WorkspaceMembership.workspace_id == workspace_id,
            WorkspaceMembership.id == membership_id,
        )
        .first()
    )


def create_workspace_membership_record(
    db: Session,
    workspace: Workspace,
    user: User,
    role: WorkspaceMembershipRole,
) -> WorkspaceMembership:
    existing = (
        db.query(WorkspaceMembership)
        .filter(
            WorkspaceMembership.workspace_id == workspace.id,
            WorkspaceMembership.user_id == user.id,
        )
        .first()
    )
    if existing:
        raise ConflictError("User is already assigned to this workspace")

    membership = WorkspaceMembership(
        workspace_id=workspace.id,
        user_id=user.id,
        role=role,
    )
    db.add(membership)
    return membership


def update_workspace_membership_role(
    membership: WorkspaceMembership,
    role: WorkspaceMembershipRole,
) -> WorkspaceMembership:
    membership.role = role
    return membership


def delete_workspace_membership_record(
    db: Session,
    membership: WorkspaceMembership,
) -> None:
    db.delete(membership)


def require_existing_workspace(db: Session, workspace_id: UUID) -> Workspace:
    workspace = get_workspace_by_id(db, workspace_id)
    if not workspace:
        raise NotFoundError("Workspace not found")
    return workspace
