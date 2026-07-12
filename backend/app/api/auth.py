from fastapi import APIRouter, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.dependencies.dependencies import get_db, get_current_user
from app.schemas.schemas import UserRegister, UserOut, Token
from app.services.services import UserService
from app.core.security import create_access_token
from app.models.models import User

router = APIRouter(prefix="/api/social/auth", tags=["Authentication"])

@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register_user(user_in: UserRegister, db: Session = Depends(get_db)):
    """Registers a new platform user."""
    user_service = UserService(db)
    return user_service.register(
        email=user_in.email,
        password=user_in.password,
        full_name=user_in.full_name,
        role=user_in.role
    )

@router.post("/token", response_model=Token)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(), 
    db: Session = Depends(get_db)
):
    """Authenticates credentials and returns a JWT access token."""
    user_service = UserService(db)
    user = user_service.authenticate(email=form_data.username, password=form_data.password)
    access_token = create_access_token(subject=user.id)
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserOut)
def read_users_me(current_user: User = Depends(get_current_user)):
    """Retrieves identity of the logged-in user."""
    return current_user
