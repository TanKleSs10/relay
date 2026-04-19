from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from uuid import UUID

from src.api.routes.deps import get_db
from src.api.schemas.roles import RoleRead
from src.api.service.roles import get_role_by_id, list_roles
from src.application.errors import NotFoundError
from src.security.auth import require_admin

router = APIRouter(prefix="/roles", tags=["roles"])


@router.get("", response_model=list[RoleRead], status_code=status.HTTP_200_OK)
def list_items(
    db: Session = Depends(get_db),
    _: object = Depends(require_admin),
):
    return list_roles(db)


@router.get("/{role_id}", response_model=RoleRead, status_code=status.HTTP_200_OK)
def get_item(
    role_id: UUID,
    db: Session = Depends(get_db),
    _: object = Depends(require_admin),
):
    role = get_role_by_id(db, role_id)
    if not role:
        raise NotFoundError("Role not found")
    return role
