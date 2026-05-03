from __future__ import annotations

from sqlalchemy.orm import Session

from src.config import get_settings
from src.domain.models import (
    Permission,
    Role,
    RolePermission,
    User,
    UserRole,
    UserStatus,
    Workspace,
    WorkspaceMembership,
    WorkspaceMembershipRole,
)
from src.security.passwords import hash_password

DEFAULT_PERMISSIONS = [
    "sender.manage",
    "campaign.create",
    "campaign.dispatch",
    "campaign.read",
    "campaign.manage",
]

USER_PERMISSIONS = [
    "sender.manage",
]
DEFAULT_WORKSPACE_NAME = "Default Workspace"
DEFAULT_WORKSPACE_SLUG = "default"


def seed_default_data(db: Session) -> None:
    settings = get_settings()
    if not settings.seed_superuser:
        return

    role_admin = db.query(Role).filter(Role.name == "ADMIN").first()
    if not role_admin:
        role_admin = Role(name="ADMIN")
        db.add(role_admin)
        db.flush()

    role_superadmin = db.query(Role).filter(Role.name == "SUPERADMIN").first()
    if not role_superadmin:
        role_superadmin = Role(name="SUPERADMIN")
        db.add(role_superadmin)
        db.flush()

    role_user = db.query(Role).filter(Role.name == "USER").first()
    if not role_user:
        role_user = Role(name="USER")
        db.add(role_user)
        db.flush()

    for code in DEFAULT_PERMISSIONS:
        permission = db.query(Permission).filter(Permission.code == code).first()
        if not permission:
            permission = Permission(code=code)
            db.add(permission)
            db.flush()
        exists = (
            db.query(RolePermission)
            .filter(
                RolePermission.role_id == role_admin.id,
                RolePermission.permission_id == permission.id,
            )
            .first()
        )
        if not exists:
            db.add(RolePermission(role_id=role_admin.id, permission_id=permission.id))

        superadmin_exists = (
            db.query(RolePermission)
            .filter(
                RolePermission.role_id == role_superadmin.id,
                RolePermission.permission_id == permission.id,
            )
            .first()
        )
        if not superadmin_exists:
            db.add(
                RolePermission(
                    role_id=role_superadmin.id,
                    permission_id=permission.id,
                )
            )

        if code in USER_PERMISSIONS:
            user_exists = (
                db.query(RolePermission)
                .filter(
                    RolePermission.role_id == role_user.id,
                    RolePermission.permission_id == permission.id,
                )
                .first()
            )
            if not user_exists:
                db.add(RolePermission(role_id=role_user.id, permission_id=permission.id))

    user = db.query(User).filter(User.email == settings.superuser_email).first()
    if not user:
        user = User(
            username=settings.superuser_username,
            email=settings.superuser_email,
            password_hash=hash_password(settings.superuser_password),
            status=UserStatus.ACTIVE,
        )
        db.add(user)
        db.flush()

    user_role = (
        db.query(UserRole)
        .filter(UserRole.user_id == user.id, UserRole.role_id == role_superadmin.id)
        .first()
    )
    if not user_role:
        db.add(UserRole(user_id=user.id, role_id=role_superadmin.id))

    workspace = db.query(Workspace).filter(Workspace.slug == DEFAULT_WORKSPACE_SLUG).first()
    if not workspace:
        workspace = Workspace(
            name=DEFAULT_WORKSPACE_NAME,
            slug=DEFAULT_WORKSPACE_SLUG,
            is_active=True,
        )
        db.add(workspace)
        db.flush()

    membership = (
        db.query(WorkspaceMembership)
        .filter(
            WorkspaceMembership.workspace_id == workspace.id,
            WorkspaceMembership.user_id == user.id,
        )
        .first()
    )
    if not membership:
        db.add(
            WorkspaceMembership(
                workspace_id=workspace.id,
                user_id=user.id,
                role=WorkspaceMembershipRole.WORKSPACE_ADMIN,
            )
        )

    db.commit()
