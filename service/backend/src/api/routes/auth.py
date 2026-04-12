from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from src.api.routes.deps import get_db
from src.api.schemas.users import UserLogin, UserRead
from src.application.usecases.auth_usecases import login_usecase
from src.config import get_settings
from src.security.auth import require_user
from src.security.jwt import create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=UserRead, status_code=status.HTTP_200_OK)
def login(payload: UserLogin, response: Response, db: Session = Depends(get_db)):
    user = login_usecase(payload, db)
    settings = get_settings()
    token = create_access_token(
        {"sub": str(user.id)},
        settings.jwt_secret,
        settings.jwt_expires_minutes,
    )
    response.set_cookie(
        settings.jwt_cookie_name,
        token,
        httponly=True,
        secure=settings.jwt_cookie_secure,
        samesite="lax",
        max_age=settings.jwt_expires_minutes * 60,
    )
    return user


@router.get("/me", response_model=UserRead, status_code=status.HTTP_200_OK)
def read_current_user(current_user: UserRead = Depends(require_user)):
    return current_user


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(response: Response):
    settings = get_settings()
    response.delete_cookie(settings.jwt_cookie_name)
    return response
