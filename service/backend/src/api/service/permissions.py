from sqlalchemy.orm import Session

from src.domain import Permission


def list_permissions(db: Session) -> list[Permission]:
    return db.query(Permission).order_by(Permission.code.asc()).all()
