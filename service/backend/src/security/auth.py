from __future__ import annotations

from uuid import UUID

from fastapi import Depends, Request
from sqlalchemy.orm import Session, selectinload

from src.application.errors import UnauthorizedError, ValidationError
from src.config import get_settings
from src.domain import (
    Role,
    RolePermission,
    User,
    UserRole,
    UserStatus,
    Workspace,
    WorkspaceMembershipRole,
)
from src.infrastructure.db.session import SessionLocal
from src.security.jwt import decode_token


def get_current_user(request: Request) -> User | None:
    return getattr(request.state, "user", None)


def is_superadmin(user: User) -> bool:
    for user_role in user.roles:
        role = user_role.role
        if role and role.name == "SUPERADMIN":
            return True
    return False


def get_accessible_workspace_ids(
    user: User,
    db: Session | None = None,
) -> list[UUID]:
    if is_superadmin(user) and db is not None:
        return [workspace_id for (workspace_id,) in db.query(Workspace.id).all()]

    memberships = getattr(user, "memberships", None) or []
    workspace_ids: list[UUID] = []
    for membership in memberships:
        workspace_id = getattr(membership, "workspace_id", None)
        if workspace_id and workspace_id not in workspace_ids:
            workspace_ids.append(workspace_id)
    return workspace_ids


def get_workspace_membership_role(
    user: User,
    workspace_id: UUID,
) -> WorkspaceMembershipRole | None:
    memberships = getattr(user, "memberships", None) or []
    for membership in memberships:
        if membership.workspace_id == workspace_id:
            return membership.role
    return None


def ensure_workspace_role(
    user: User,
    workspace_id: UUID,
    *allowed_roles: WorkspaceMembershipRole,
) -> None:
    if is_superadmin(user):
        return

    membership_role = get_workspace_membership_role(user, workspace_id)
    if membership_role is None:
        raise UnauthorizedError("Workspace access denied")
    if allowed_roles and membership_role not in allowed_roles:
        raise UnauthorizedError("Workspace role does not allow this action")


def resolve_workspace_id(
    user: User,
    requested_workspace_id: UUID | None = None,
    db: Session | None = None,
) -> UUID:
    if is_superadmin(user):
        if requested_workspace_id:
            if db is not None:
                exists = db.query(Workspace.id).filter(Workspace.id == requested_workspace_id).first()
                if not exists:
                    raise ValidationError("Workspace not found")
            return requested_workspace_id
        workspace_ids = get_accessible_workspace_ids(user, db)
        if len(workspace_ids) == 1:
            return workspace_ids[0]
        raise ValidationError("workspace_id is required for users with multiple workspaces")

    workspace_ids = get_accessible_workspace_ids(user, db)
    if not workspace_ids:
        raise UnauthorizedError("User is not assigned to any workspace")

    if requested_workspace_id:
        if requested_workspace_id not in workspace_ids:
            raise UnauthorizedError("Workspace access denied")
        return requested_workspace_id

    if len(workspace_ids) == 1:
        return workspace_ids[0]

    raise ValidationError("workspace_id is required for users with multiple workspaces")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def require_user(request: Request, db: Session = Depends(get_db)) -> User:
    user = get_current_user(request)
    user_id = None
    if user and user.status == UserStatus.ACTIVE:
        user_id = str(user.id)

    settings = get_settings()
    if not user_id:
        token = request.cookies.get(settings.jwt_cookie_name)
        if not token:
            raise UnauthorizedError("Missing authentication token")

        payload = decode_token(token, settings.jwt_secret)
        user_id = payload.get("sub")
        if not user_id:
            raise UnauthorizedError("Invalid authentication token")

    try:
        user_uuid = UUID(user_id)
    except ValueError as error:
        raise UnauthorizedError("Invalid authentication token") from error
    user = (
        db.query(User)
        .options(
            selectinload(User.roles)
            .selectinload(UserRole.role)
            .selectinload(Role.permissions)
            .selectinload(RolePermission.permission),
            selectinload(User.memberships),
        )
        .filter(User.id == user_uuid)
        .first()
    )
    if not user or user.status != UserStatus.ACTIVE:
        raise UnauthorizedError("User not found or inactive")

    request.state.user = user
    return user


def require_admin(user: User = Depends(require_user)) -> User:
    for user_role in user.roles:
        if user_role.role and user_role.role.name in {"SUPERADMIN", "ADMIN"}:
            return user
    raise UnauthorizedError("Admin access required")


def require_superadmin(user: User = Depends(require_user)) -> User:
    if is_superadmin(user):
        return user
    raise UnauthorizedError("Superadmin access required")


def require_permission(permission_code: str):
    def _guard(user: User = Depends(require_user)) -> User:
        for user_role in user.roles:
            role = user_role.role
            if not role:
                continue
            for role_perm in role.permissions:
                if role_perm.permission and role_perm.permission.code == permission_code:
                    return user
        raise UnauthorizedError("Permission denied")

    return _guard
