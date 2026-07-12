import os
import uuid
import boto3
from typing import List, Optional
from datetime import date, datetime
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.security import get_password_hash, verify_password
from app.models.models import (
    User,
    WellbeingChallenge,
    ActivityLog,
    EmployeeParticipation,
    PeerVerification,
)
from app.repositories.repositories import (
    UserRepository,
    WellbeingChallengeRepository,
    ActivityLogRepository,
    EmployeeParticipationRepository,
    PeerVerificationRepository,
)
from app.exceptions.exceptions import (
    CustomBaseException,
    ResourceNotFoundException,
    UnauthorizedException,
    ForbiddenException,
    DuplicateVerificationException,
    SelfVerificationException,
    InvalidFileUploadException,
    S3FailureException,
    DatabaseException,
)
from app.core.logging import logger

# --- S3 Upload Service ---

class S3Service:
    ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
    MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

    @classmethod
    def validate_file(cls, filename: str, content_type: str, file_size: int):
        if content_type not in cls.ALLOWED_MIME_TYPES:
            raise InvalidFileUploadException(
                message=f"Unsupported file type: {content_type}. Supported types are: {', '.join(cls.ALLOWED_MIME_TYPES)}",
                error_code="INVALID_MIME_TYPE"
            )
        if file_size > cls.MAX_FILE_SIZE:
            raise InvalidFileUploadException(
                message=f"File size exceeds maximum limit of 5MB. Provided: {round(file_size / (1024 * 1024), 2)}MB",
                error_code="FILE_TOO_LARGE"
            )

    @classmethod
    def upload_proof(cls, file_content: bytes, filename: str, content_type: str) -> str:
        # Create a unique filename to prevent namespace collision in S3
        ext = os.path.splitext(filename)[1] or ".jpg"
        unique_filename = f"{uuid.uuid4()}{ext}"

        # Check if AWS credentials and bucket are defined
        aws_configured = all([
            settings.AWS_ACCESS_KEY_ID,
            settings.AWS_SECRET_ACCESS_KEY,
            settings.AWS_BUCKET_NAME
        ])

        if aws_configured:
            try:
                s3_client = boto3.client(
                    "s3",
                    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                    region_name=settings.AWS_REGION
                )
                s3_client.put_object(
                    Bucket=settings.AWS_BUCKET_NAME,
                    Key=unique_filename,
                    Body=file_content,
                    ContentType=content_type,
                )
                url = f"https://{settings.AWS_BUCKET_NAME}.s3.{settings.AWS_REGION}.amazonaws.com/{unique_filename}"
                logger.info("file_uploaded_to_s3", filename=unique_filename, url=url)
                return url
            except Exception as e:
                logger.error("s3_upload_failed", error=str(e))
                raise S3FailureException(
                    message="Failed to upload file to AWS S3",
                    error_code="S3_UPLOAD_ERROR",
                    details={"internal_error": str(e)}
                )
        else:
            # Fallback to local storage (e.g. for developer environment sandbox)
            try:
                upload_dir = "uploads"
                os.makedirs(upload_dir, exist_ok=True)
                file_path = os.path.join(upload_dir, unique_filename)
                with open(file_path, "wb") as f:
                    f.write(file_content)
                url = f"/static/uploads/{unique_filename}"
                logger.info("file_uploaded_locally", filename=unique_filename, url=url)
                return url
            except Exception as e:
                logger.error("local_upload_failed", error=str(e))
                raise InvalidFileUploadException(
                    message="Failed to write file to local disk",
                    error_code="LOCAL_WRITE_ERROR",
                    details={"internal_error": str(e)}
                )


# --- User Service ---

class UserService:
    def __init__(self, db: Session):
        self.db = db
        self.user_repo = UserRepository(db)

    def register(self, email: str, password: str, full_name: str, role: str = "employee") -> User:
        existing = self.user_repo.get_by_email(email)
        if existing:
            raise DuplicateVerificationException(
                message=f"User with email {email} already registered",
                error_code="EMAIL_ALREADY_EXISTS"
            )
        
        hashed_password = get_password_hash(password)
        user = User(
            email=email,
            hashed_password=hashed_password,
            full_name=full_name,
            role=role,
            points=0,
            is_active=True
        )
        created = self.user_repo.create(user)
        self.db.commit()
        return created

    def authenticate(self, email: str, password: str) -> User:
        user = self.user_repo.get_by_email(email)
        if not user or not verify_password(password, user.hashed_password):
            raise UnauthorizedException(
                message="Invalid email or password",
                error_code="INVALID_CREDENTIALS"
            )
        if not user.is_active:
            raise UnauthorizedException(
                message="User account is inactive",
                error_code="INACTIVE_USER"
            )
        return user

    def get_user(self, user_id: uuid.UUID) -> User:
        user = self.user_repo.get(user_id)
        if not user:
            raise ResourceNotFoundException(
                message="User not found",
                error_code="USER_NOT_FOUND"
            )
        return user


# --- Challenge Service ---

class ChallengeService:
    def __init__(self, db: Session):
        self.db = db
        self.challenge_repo = WellbeingChallengeRepository(db)

    def create_challenge(
        self, 
        name: str, 
        description: str, 
        target_frequency: int, 
        cycle_type: str = "Weekly", 
        status: bool = True
    ) -> WellbeingChallenge:
        challenge = WellbeingChallenge(
            name=name,
            description=description,
            target_frequency=target_frequency,
            cycle_type=cycle_type,
            status=status
        )
        created = self.challenge_repo.create(challenge)
        self.db.commit()
        return created

    def get_challenge(self, challenge_id: uuid.UUID) -> WellbeingChallenge:
        challenge = self.challenge_repo.get(challenge_id)
        if not challenge:
            raise ResourceNotFoundException(
                message="Wellbeing challenge not found",
                error_code="CHALLENGE_NOT_FOUND"
            )
        return challenge

    def update_challenge(self, challenge_id: uuid.UUID, update_data: dict) -> WellbeingChallenge:
        challenge = self.get_challenge(challenge_id)
        updated = self.challenge_repo.update(challenge, update_data)
        self.db.commit()
        return updated

    def delete_challenge(self, challenge_id: uuid.UUID) -> bool:
        success = self.challenge_repo.delete(challenge_id)
        if not success:
            raise ResourceNotFoundException(
                message="Wellbeing challenge not found",
                error_code="CHALLENGE_NOT_FOUND"
            )
        self.db.commit()
        return True

    def list_challenges(
        self, 
        skip: int = 0, 
        limit: int = 100, 
        search: Optional[str] = None, 
        cycle_type: Optional[str] = None, 
        status: Optional[bool] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc"
    ) -> List[WellbeingChallenge]:
        return self.challenge_repo.list_challenges(
            skip=skip,
            limit=limit,
            search=search,
            cycle_type=cycle_type,
            status=status,
            sort_by=sort_by,
            sort_order=sort_order
        )


# --- Activity Service ---

class ActivityService:
    def __init__(self, db: Session):
        self.db = db
        self.activity_repo = ActivityLogRepository(db)
        self.participation_repo = EmployeeParticipationRepository(db)
        self.challenge_repo = WellbeingChallengeRepository(db)

    def log_activity(
        self,
        employee_id: uuid.UUID,
        challenge_id: uuid.UUID,
        activity_type: str,
        notes: Optional[str] = None,
        proof_url: Optional[str] = None,
        date_logged: Optional[date] = None
    ) -> ActivityLog:
        # Verify challenge exists and is active
        challenge = self.challenge_repo.get(challenge_id)
        if not challenge:
            raise ResourceNotFoundException(
                message="Wellbeing challenge not found",
                error_code="CHALLENGE_NOT_FOUND"
            )
        if not challenge.status:
            raise ForbiddenException(
                message="Wellbeing challenge is currently inactive",
                error_code="CHALLENGE_INACTIVE"
            )

        if not date_logged:
            date_logged = date.today()

        try:
            # Create Activity Log
            activity = ActivityLog(
                employee_id=employee_id,
                challenge_id=challenge_id,
                activity_type=activity_type,
                notes=notes,
                proof_url=proof_url,
                date_logged=date_logged
            )
            self.db.add(activity)
            self.db.flush() # Generates the UUID for activity.id

            # Create Employee Participation linked to the Activity Log
            participation = EmployeeParticipation(
                employee_id=employee_id,
                activity_id=activity.id,
                proof_url=proof_url,
                approval_status="Pending",
                points_earned=0,
                vouch_count=0
            )
            self.db.add(participation)
            self.db.commit()
            
            logger.info("activity_logged", employee_id=str(employee_id), activity_id=str(activity.id))
            return activity
        except Exception as e:
            self.db.rollback()
            logger.error("log_activity_transaction_failed", error=str(e))
            raise DatabaseException(
                message="Failed to log activity and create participation",
                error_code="LOG_ACTIVITY_ERROR",
                details={"internal_error": str(e)}
            )

    def get_activity_history(
        self,
        employee_id: uuid.UUID,
        skip: int = 0,
        limit: int = 100,
        challenge_id: Optional[uuid.UUID] = None,
        activity_type: Optional[str] = None,
        sort_by: str = "date_logged",
        sort_order: str = "desc"
    ) -> List[ActivityLog]:
        return self.activity_repo.list_by_employee(
            employee_id=employee_id,
            skip=skip,
            limit=limit,
            challenge_id=challenge_id,
            activity_type=activity_type,
            sort_by=sort_by,
            sort_order=sort_order
        )


# --- Peer Verification (Vouching) Service ---

class VerificationService:
    def __init__(self, db: Session):
        self.db = db
        self.participation_repo = EmployeeParticipationRepository(db)
        self.verification_repo = PeerVerificationRepository(db)
        self.user_repo = UserRepository(db)

    def vouch(self, participation_id: uuid.UUID, voucher_employee_id: uuid.UUID) -> PeerVerification:
        # Check participation exists
        participation = self.participation_repo.get(participation_id)
        if not participation:
            raise ResourceNotFoundException(
                message="Employee participation record not found",
                error_code="PARTICIPATION_NOT_FOUND"
            )

        # Prevent self-verification
        if participation.employee_id == voucher_employee_id:
            raise SelfVerificationException(
                message="You cannot verify your own participation",
                error_code="SELF_VERIFICATION"
            )

        # Check for duplicate verification
        existing = self.verification_repo.get_by_participation_and_voucher(
            participation_id=participation_id,
            voucher_employee_id=voucher_employee_id
        )
        if existing:
            raise DuplicateVerificationException(
                message="You have already verified this participation",
                error_code="DUPLICATE_VERIFICATION"
            )

        try:
            # Create Peer Verification
            verification = PeerVerification(
                participation_id=participation_id,
                voucher_employee_id=voucher_employee_id
            )
            self.db.add(verification)
            
            # Increment vouch_count
            participation.vouch_count += 1
            
            # Award points and approve if vouch_count >= 3
            if participation.vouch_count >= 3 and participation.approval_status != "Approved":
                participation.approval_status = "Approved"
                points_to_award = 10
                participation.points_earned = points_to_award
                
                # Fetch employee and credit points to their profile
                employee = self.user_repo.get(participation.employee_id)
                if employee:
                    employee.points += points_to_award
                    
                logger.info(
                    "participation_approved_by_votes",
                    participation_id=str(participation_id),
                    employee_id=str(participation.employee_id),
                    points_awarded=points_to_award
                )

            self.db.commit()
            logger.info(
                "vouch_submitted",
                participation_id=str(participation_id),
                voucher_employee_id=str(voucher_employee_id),
                new_vouch_count=participation.vouch_count
            )
            return verification
        except Exception as e:
            self.db.rollback()
            logger.error("vouch_transaction_failed", error=str(e))
            if isinstance(e, CustomBaseException):
                raise e
            raise DatabaseException(
                message="Failed to submit vouch due to database transaction error",
                error_code="VOUCH_TRANSACTION_ERROR",
                details={"internal_error": str(e)}
            )
