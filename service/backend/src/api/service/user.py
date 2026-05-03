from uuid import UUID

from sqlalchemy.orm import Session, selectinload

from src.application.errors import ConflictError, NotFoundError
from src.config import get_settings
from src.domain.models import (
    Campaign,
    MediaAsset,
    Role,
    SenderAccount,
    User,
    UserRole,
    UserStatus,
    Workspace,
    WorkspaceMembership,
    WorkspaceMembershipRole,
)


def _is_protected_superuser(user: User) -> bool:
    settings = get_settings()
    return user.email.strip().lower() == settings.superuser_email.strip().lower()


def get_user_by_email(db: Session, email: str) -> User:
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise NotFoundError("User not found")
    return user


def get_user_by_id(
    db: Session, user_id: UUID, workspace_ids: list[UUID] | None = None
) -> User | None:
    user = (
        db.query(User)
        .options(
            selectinload(User.roles).selectinload(UserRole.role),
            selectinload(User.memberships),
        )
        .filter(User.id == user_id)
        .first()
    )
    if not user:
        raise NotFoundError("User not found")
    if workspace_ids is not None:
        membership_workspace_ids = {
            membership.workspace_id for membership in (user.memberships or [])
        }
        if not membership_workspace_ids.intersection(set(workspace_ids)):
            raise NotFoundError("User not found")
    return user


def list_users(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    workspace_ids: list[UUID] | None = None,
) -> list[User]:
    query = db.query(User).options(
        selectinload(User.roles).selectinload(UserRole.role),
        selectinload(User.memberships),
    )
    if workspace_ids is not None:
        query = query.join(WorkspaceMembership).filter(
            WorkspaceMembership.workspace_id.in_(workspace_ids)
        )
        query = query.distinct()
    return query.order_by(User.created_at.desc()).offset(skip).limit(limit).all()


def get_role_by_name(db: Session, name: str) -> Role | None:
    return db.query(Role).filter(Role.name == name).first()


def create_user_role(db: Session, user: User, role: Role) -> UserRole:
    user_role = UserRole(user_id=user.id, role_id=role.id)
    db.add(user_role)
    return user_role


def create_workspace_membership(
    db: Session,
    user: User,
    workspace_id: UUID,
    role: WorkspaceMembershipRole = WorkspaceMembershipRole.OPERATOR,
) -> WorkspaceMembership:
    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not workspace:
        raise NotFoundError("Workspace not found")
    existing = (
        db.query(WorkspaceMembership)
        .filter(
            WorkspaceMembership.user_id == user.id,
            WorkspaceMembership.workspace_id == workspace_id,
        )
        .first()
    )
    if existing:
        raise ConflictError("User is already assigned to this workspace")
    membership = WorkspaceMembership(
        user_id=user.id,
        workspace_id=workspace_id,
        role=role,
    )
    db.add(membership)
    return membership


def create_user(db: Session, username: str, email: str, password_hash: str) -> User:
    if db.query(User).filter(User.email == email).first():
        raise ConflictError("Email already exists")
    if db.query(User).filter(User.username == username).first():
        raise ConflictError("Username already exists")

    user = User(
        username=username,
        email=email,
        password_hash=password_hash,
        status=UserStatus.ACTIVE,
    )
    db.add(user)
    return user


def change_user_username(db: Session, user_id: UUID, username: str) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise NotFoundError("User not found")
    found_username = db.query(User).filter(User.username == username).first()
    if found_username:
        raise ConflictError("Username already exists")
    user.username = username
    db.commit()
    db.refresh(user)
    return user


def change_user_password(db: Session, user_id: UUID, new_password_hash: str) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise NotFoundError("User not found")
    user.password_hash = new_password_hash
    db.commit()
    db.refresh(user)
    return user


def change_user_status(db: Session, user_id: UUID, new_status: UserStatus) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise NotFoundError("User not found")
    if _is_protected_superuser(user) and new_status == UserStatus.INACTIVE:
        raise ConflictError("Superadmin cannot be deactivated")
    user.status = new_status
    return user


def update_user(
    db: Session, user_id: UUID, username: str | None, email: str | None
) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise NotFoundError("User not found")

    if username and username != user.username:
        found_username = db.query(User).filter(User.username == username).first()
        if found_username:
            raise ConflictError("Username already exists")
        user.username = username

    if email and email != user.email:
        found_email = db.query(User).filter(User.email == email).first()
        if found_email:
            raise ConflictError("Email already exists")
        user.email = email

    return user


def deactivate_user(db: Session, user_id: UUID) -> User:
    # MVP-safe "delete": keep the row to avoid FK issues (campaigns/messages ownership).
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise NotFoundError("User not found")
    if _is_protected_superuser(user):
        raise ConflictError("Superadmin cannot be deleted")
    user.status = UserStatus.INACTIVE
    return user


def delete_user(db: Session, user_id: UUID) -> None:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise NotFoundError("User not found")
    if _is_protected_superuser(user):
        raise ConflictError("Superadmin cannot be deleted")
    has_campaigns = (
        db.query(Campaign.id)
        .filter(Campaign.created_by_user_id == user.id)
        .first()
    )
    if has_campaigns:
        raise ConflictError(
            "User cannot be deleted because it has campaign history"
        )
    has_senders = (
        db.query(SenderAccount.id)
        .filter(SenderAccount.created_by_user_id == user.id)
        .first()
    )
    if has_senders:
        raise ConflictError(
            "User cannot be deleted because it has sender history"
        )
    has_media_assets = (
        db.query(MediaAsset.id)
        .filter(MediaAsset.created_by_user_id == user.id)
        .first()
    )
    if has_media_assets:
        raise ConflictError(
            "User cannot be deleted because it has media asset history"
        )
    db.delete(user)
