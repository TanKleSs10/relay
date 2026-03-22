from src.domain.models import User


def get_user_by_email(db, email) -> User:
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise ValueError("User not found")
    return user
