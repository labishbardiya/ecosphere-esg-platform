import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.dependencies.dependencies import get_db, require_admin, require_employee
from app.schemas.schemas import (
    WellbeingChallengeCreate,
    WellbeingChallengeUpdate,
    WellbeingChallengeOut,
    StandardSuccessResponse,
)
from app.services.services import ChallengeService
from app.models.models import User

router = APIRouter(prefix="/api/social/challenges", tags=["Challenges"])

@router.post("", response_model=WellbeingChallengeOut, status_code=status.HTTP_201_CREATED)
def create_challenge(
    challenge_in: WellbeingChallengeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Creates a new wellbeing challenge (Admin Only)."""
    challenge_service = ChallengeService(db)
    return challenge_service.create_challenge(
        name=challenge_in.name,
        description=challenge_in.description,
        target_frequency=challenge_in.target_frequency,
        cycle_type=challenge_in.cycle_type,
        status=challenge_in.status
    )

@router.get("", response_model=List[WellbeingChallengeOut])
def list_challenges(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1),
    search: Optional[str] = Query(None),
    cycle_type: Optional[str] = Query(None),
    status: Optional[bool] = Query(None),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_employee)
):
    """Lists all wellbeing challenges with filters, search, sorting and pagination."""
    challenge_service = ChallengeService(db)
    return challenge_service.list_challenges(
        skip=skip,
        limit=limit,
        search=search,
        cycle_type=cycle_type,
        status=status,
        sort_by=sort_by,
        sort_order=sort_order
    )

@router.get("/{id}", response_model=WellbeingChallengeOut)
def get_challenge(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_employee)
):
    """Retrieves a single wellbeing challenge detail."""
    challenge_service = ChallengeService(db)
    return challenge_service.get_challenge(id)

@router.put("/{id}", response_model=WellbeingChallengeOut)
def update_challenge(
    id: uuid.UUID,
    challenge_in: WellbeingChallengeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Updates an existing wellbeing challenge (Admin Only)."""
    challenge_service = ChallengeService(db)
    update_dict = challenge_in.model_dump(exclude_unset=True)
    return challenge_service.update_challenge(id, update_dict)

@router.delete("/{id}", response_model=StandardSuccessResponse)
def delete_challenge(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Deletes a wellbeing challenge (Admin Only)."""
    challenge_service = ChallengeService(db)
    challenge_service.delete_challenge(id)
    return {"success": True, "message": "Challenge deleted successfully"}
