from uuid import UUID

from sqlalchemy.orm import Session, selectinload

from src.application.errors import ConflictError, NotFoundError
from src.config import get_settings
from src.domain.models import Role, User, UserRole, UserStatus


def _is_protected_superuser(user: User) -> bool:
    settings = get_settings()
    return user.email.strip().lower() == settings.superuser_email.strip().lower()


def get_user_by_email(db: Session, email: str) -> User:
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise NotFoundError("User not found")
    return user


def get_user_by_id(db: Session, user_id: UUID) -> User | None:
    user = (
        db.query(User)
        .options(selectinload(User.roles).selectinload(UserRole.role))
        .filter(User.id == user_id)
        .first()
    )
    if not user:
        raise NotFoundError("User not found")
    return user


def list_users(db: Session, skip: int = 0, limit: int = 100) -> list[User]:
    return (
        db.query(User)
        .options(selectinload(User.roles).selectinload(UserRole.role))
        .order_by(User.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_role_by_name(db: Session, name: str) -> Role | None:
    return db.query(Role).filter(Role.name == name).first()


def create_user_role(db: Session, user: User, role: Role) -> UserRole:
    user_role = UserRole(user_id=user.id, role_id=role.id)
    db.add(user_role)
    return user_role


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


def update_user(db: Session, user_id: UUID, username: str | None, email: str | None) -> User:
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
