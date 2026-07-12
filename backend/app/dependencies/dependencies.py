import uuid
from typing import Generator, List
from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.database.session import SessionLocal
from app.core.security import decode_token
from app.repositories.repositories import UserRepository
from app.exceptions.exceptions import UnauthorizedException, ForbiddenException
from app.models.models import User

# The OAuth2 security flow scheme pointing to our login endpoint
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/social/auth/token")

def get_db() -> Generator[Session, None, None]:
    """Yields a database session scoped to the request lifecycle."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    """Extracts and validates the current active user from the JWT token."""
    payload = decode_token(token)
    if not payload:
        raise UnauthorizedException(
            message="Could not validate credentials",
            error_code="INVALID_TOKEN"
        )
    
    user_id_str = payload.get("sub")
    if not user_id_str:
        raise UnauthorizedException(
            message="Token is missing sub claim identifier",
            error_code="MALFORMED_TOKEN"
        )
        
    try:
        user_uuid = uuid.UUID(user_id_str)
    except ValueError:
        raise UnauthorizedException(
            message="Token contains an invalid user identifier layout",
            error_code="INVALID_IDENTITY"
        )
        
    user_repo = UserRepository(db)
    user = user_repo.get(user_uuid)
    if not user:
        raise UnauthorizedException(
            message="User associated with token no longer exists",
            error_code="USER_NOT_FOUND"
        )
    if not user.is_active:
        raise UnauthorizedException(
            message="User account is currently deactivated",
            error_code="INACTIVE_USER"
        )
    return user


class RoleChecker:
    """Enforces role restrictions on endpoints."""
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in self.allowed_roles:
            raise ForbiddenException(
                message=f"Forbidden. Access requires one of the roles: {', '.join(self.allowed_roles)}",
                error_code="INSUFFICIENT_PERMISSIONS"
            )
        return current_user

# Predefined role dependencies
require_admin = RoleChecker(["admin"])
require_employee = RoleChecker(["admin", "employee"])
