import os
import sys
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Prepend the parent directory of tests/ (backend/) to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database.base import Base
from app.dependencies.dependencies import get_db
from app.main import app
from app.core.security import get_password_hash, create_access_token
from app.models.models import User, WellbeingChallenge

# Database URL for independent test executions (in-memory SQLite)
DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Hook up SQLite foreign key validation triggers
@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


@pytest.fixture(name="db", scope="function")
def db_fixture():
    """Initializes tables on a clean in-memory database and tears them down after the test."""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(name="client", scope="function")
def client_fixture(db):
    """Generates a FastAPI TestClient with the database dependency overridden."""
    def override_get_db():
        try:
            yield db
        finally:
            pass
            
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture(name="test_admin")
def test_admin_fixture(db):
    """Seeds a mock admin user for authorization tests."""
    admin = User(
        email="admin@ecosphere.com",
        hashed_password=get_password_hash("adminpass123"),
        full_name="System Admin",
        role="admin",
        points=100,
        is_active=True
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    return admin


@pytest.fixture(name="test_employee")
def test_employee_fixture(db):
    """Seeds a mock employee user for general business flow testing."""
    employee = User(
        email="employee@ecosphere.com",
        hashed_password=get_password_hash("emppass123"),
        full_name="John Doe",
        role="employee",
        points=0,
        is_active=True
    )
    db.add(employee)
    db.commit()
    db.refresh(employee)
    return employee


@pytest.fixture(name="admin_headers")
def admin_headers_fixture(test_admin):
    """Generates request headers loaded with an admin credentials JWT token."""
    token = create_access_token(subject=test_admin.id)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(name="employee_headers")
def employee_headers_fixture(test_employee):
    """Generates request headers loaded with an employee credentials JWT token."""
    token = create_access_token(subject=test_employee.id)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(name="test_challenge")
def test_challenge_fixture(db):
    """Seeds a sample WellbeingChallenge for activities and voucher verifications."""
    challenge = WellbeingChallenge(
        name="Daily Steps Challenge",
        description="Walk at least 10,000 steps every day.",
        target_frequency=5,
        cycle_type="Weekly",
        status=True
    )
    db.add(challenge)
    db.commit()
    db.refresh(challenge)
    return challenge
