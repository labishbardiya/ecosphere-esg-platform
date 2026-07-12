from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.dependencies.dependencies import get_db, require_employee
from app.schemas.schemas import PeerVerificationCreate, PeerVerificationOut
from app.services.services import VerificationService
from app.models.models import User
from app.exceptions.exceptions import ForbiddenException

router = APIRouter(prefix="/api/social/vouch", tags=["Peer Verification"])

@router.post("", response_model=PeerVerificationOut, status_code=status.HTTP_201_CREATED)
def submit_vouch(
    vouch_in: PeerVerificationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_employee)
):
    """Submits a peer verification (vouch) for a challenge participation."""
    # Security constraint: A user can only vouch under their own user profile ID
    if current_user.id != vouch_in.voucher_employee_id:
        raise ForbiddenException(
            message="You can only submit a vouch using your own user identity.",
            error_code="IDENTITY_MISMATCH"
        )
        
    verification_service = VerificationService(db)
    return verification_service.vouch(
        participation_id=vouch_in.participation_id,
        voucher_employee_id=vouch_in.voucher_employee_id
    )
