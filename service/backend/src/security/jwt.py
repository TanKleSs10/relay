from __future__ import annotations

from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt

ALGORITHM = "HS256"


def create_access_token(data: dict, secret: str, expires_minutes: int) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=expires_minutes)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, secret, algorithm=ALGORITHM)


def decode_token(token: str, secret: str) -> dict:
    return jwt.decode(token, secret, algorithms=[ALGORITHM])


class InvalidTokenError(Exception):
    pass


def try_decode_token(token: str, secret: str) -> dict:
    try:
        return decode_token(token, secret)
    except JWTError as exc:
        raise InvalidTokenError("Invalid token") from exc
