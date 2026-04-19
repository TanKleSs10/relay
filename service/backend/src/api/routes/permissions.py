from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from src.api.routes.deps import get_db
from src.api.schemas.roles import PermissionRead
from src.api.service.permissions import list_permissions
from src.security.auth import require_admin

router = APIRouter(prefix="/permissions", tags=["permissions"])


@router.get("", response_model=list[PermissionRead], status_code=status.HTTP_200_OK)
def list_items(
    db: Session = Depends(get_db),
    _: object = Depends(require_admin),
):
    return list_permissions(db)
