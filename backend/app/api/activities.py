import uuid
from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, Query, status, File, Form, UploadFile
from sqlalchemy.orm import Session
from app.dependencies.dependencies import get_db, require_employee
from app.schemas.schemas import ActivityLogOut
from app.services.services import ActivityService, S3Service
from app.models.models import User
from app.exceptions.exceptions import InvalidFileUploadException

router = APIRouter(prefix="/api/social/activity", tags=["Activities"])

@router.post("", response_model=ActivityLogOut, status_code=status.HTTP_201_CREATED)
async def log_activity(
    challenge_id: uuid.UUID = Form(...),
    activity_type: str = Form(...),
    notes: Optional[str] = Form(None),
    date_logged: str = Form(...),
    proof_image: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_employee)
):
    """Logs a Wellbeing Challenge activity with a proof image upload."""
    # Parse date
    try:
        parsed_date = date.fromisoformat(date_logged)
    except ValueError:
        raise InvalidFileUploadException(
            message="Invalid date format for 'date_logged'. Expected YYYY-MM-DD format.",
            error_code="INVALID_DATE_FORMAT"
        )

    # Validate date is not in the future
    if parsed_date > date.today():
        raise InvalidFileUploadException(
            message="Logged date cannot be in the future",
            error_code="FUTURE_DATE_FORBIDDEN"
        )

    # Read and validate proof image
    file_bytes = await proof_image.read()
    file_size = len(file_bytes)
    
    # Run validations
    S3Service.validate_file(
        filename=proof_image.filename or "proof.jpg",
        content_type=proof_image.content_type or "image/jpeg",
        file_size=file_size
    )

    # Upload to S3 or local fallback
    proof_url = S3Service.upload_proof(
        file_content=file_bytes,
        filename=proof_image.filename or "proof.jpg",
        content_type=proof_image.content_type or "image/jpeg"
    )

    # Save details to the DB
    activity_service = ActivityService(db)
    return activity_service.log_activity(
        employee_id=current_user.id,
        challenge_id=challenge_id,
        activity_type=activity_type,
        notes=notes,
        proof_url=proof_url,
        date_logged=parsed_date
    )

@router.get("/history", response_model=List[ActivityLogOut])
def get_activity_history(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1),
    challenge_id: Optional[uuid.UUID] = Query(None),
    activity_type: Optional[str] = Query(None),
    sort_by: str = Query("date_logged"),
    sort_order: str = Query("desc"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_employee)
):
    """Retrieves activity history for the logged-in employee."""
    activity_service = ActivityService(db)
    return activity_service.get_activity_history(
        employee_id=current_user.id,
        skip=skip,
        limit=limit,
        challenge_id=challenge_id,
        activity_type=activity_type,
        sort_by=sort_by,
        sort_order=sort_order
    )
