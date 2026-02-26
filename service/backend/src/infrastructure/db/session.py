from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from src.config import get_settings

settings = get_settings()

engine = create_engine(
    settings.db_url, echo=settings.sql_echo, pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
