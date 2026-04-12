from sqlalchemy.orm import Session

from src.api.schemas.users import UserLogin
from src.api.service.user import get_user_by_email
from src.application.errors import NotFoundError, ValidationError
from src.domain import UserStatus
from src.domain.models import User
from src.security.passwords import verify_password


def login_usecase(payload: UserLogin, db: Session) -> User:
    user = get_user_by_email(db, payload.email)

    if not user:
        raise NotFoundError("User not found")

    if user.status != UserStatus.ACTIVE:
        raise ValidationError("User is inactive")

    if not verify_password(payload.password, user.password_hash):
        raise ValidationError("Invalid credentials")

    return user
