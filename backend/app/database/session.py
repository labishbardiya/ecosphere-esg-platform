from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.core.config import settings

# Build engine kwargs based on the database backend
_connect_args: dict = {}
_engine_kwargs: dict = {}

if settings.DATABASE_URL.startswith("sqlite"):
    # SQLite requires check_same_thread=False for FastAPI's threaded request model
    # and does not support connection pooling parameters
    _connect_args = {"check_same_thread": False}
else:
    # PostgreSQL production-ready connection pool configuration
    _engine_kwargs = {
        "pool_pre_ping": True,
        "pool_size": 20,
        "max_overflow": 10,
    }

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=_connect_args,
    **_engine_kwargs,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Base(DeclarativeBase):
    pass
