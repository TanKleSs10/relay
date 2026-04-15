from sqlalchemy.orm import Session, joinedload
from uuid import UUID
from src.domain import Role
from src.domain.models import RolePermission


def list_roles(db: Session) -> list[Role]:
    return (
        db.query(Role)
        .options(joinedload(Role.permissions).joinedload(RolePermission.permission))
        .order_by(Role.name.asc())
        .all()
    )


def get_role_by_id(db: Session, role_id: UUID) -> Role | None:
    return (
        db.query(Role)
        .options(joinedload(Role.permissions).joinedload(RolePermission.permission))
        .filter(Role.id == role_id)
        .first()
    )
