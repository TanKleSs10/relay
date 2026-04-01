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
)
from src.security.passwords import hash_password

DEFAULT_PERMISSIONS = [
    "sender.manage",
    "campaign.create",
    "campaign.dispatch",
    "campaign.read",
    "campaign.manage",
]


def seed_default_data(db: Session) -> None:
    settings = get_settings()
    if not settings.seed_superuser:
        return

    role_admin = db.query(Role).filter(Role.name == "ADMIN").first()
    if not role_admin:
        role_admin = Role(name="ADMIN")
        db.add(role_admin)
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
        .filter(UserRole.user_id == user.id, UserRole.role_id == role_admin.id)
        .first()
    )
    if not user_role:
        db.add(UserRole(user_id=user.id, role_id=role_admin.id))

    db.commit()
