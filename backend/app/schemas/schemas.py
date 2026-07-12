from typing import Any, List, Optional
from datetime import date, datetime
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field, field_validator

# --- Authentication & User Schemas ---

class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, description="Password must be at least 6 characters")
    full_name: str = Field(..., min_length=1, max_length=255)
    role: str = Field(default="employee", description="Role: admin or employee")

    @field_validator("role")
    @classmethod
    def validate_role(cls, v: str) -> str:
        if v not in ("admin", "employee"):
            raise ValueError("Role must be 'admin' or 'employee'")
        return v

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    user_id: Optional[UUID] = None

class UserOut(BaseModel):
    id: UUID
    email: EmailStr
    full_name: str
    role: str
    points: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# --- Wellbeing Challenge Schemas ---

class WellbeingChallengeCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    description: str = Field(..., min_length=1)
    target_frequency: int = Field(..., gt=0, description="Target frequency must be a positive integer")
    cycle_type: str = Field(default="Weekly", description="Cycle type: Weekly or Monthly")
    status: bool = Field(default=True)

    @field_validator("cycle_type")
    @classmethod
    def validate_cycle_type(cls, v: str) -> str:
        if v not in ("Weekly", "Monthly"):
            raise ValueError("cycle_type must be 'Weekly' or 'Monthly'")
        return v

class WellbeingChallengeUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    description: Optional[str] = None
    target_frequency: Optional[int] = Field(None, gt=0)
    cycle_type: Optional[str] = None
    status: Optional[bool] = None

    @field_validator("cycle_type")
    @classmethod
    def validate_cycle_type(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in ("Weekly", "Monthly"):
            raise ValueError("cycle_type must be 'Weekly' or 'Monthly'")
        return v

class WellbeingChallengeOut(BaseModel):
    id: UUID
    name: str
    description: str
    target_frequency: int
    cycle_type: str
    status: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# --- Activity Log Schemas ---

class ActivityLogCreate(BaseModel):
    challenge_id: UUID
    activity_type: str = Field(..., min_length=1, max_length=100)
    notes: Optional[str] = None
    date_logged: date

    @field_validator("date_logged")
    @classmethod
    def validate_date(cls, v: date) -> date:
        # Do not allow logging activity in the future
        if v > date.today():
            raise ValueError("date_logged cannot be in the future")
        return v

class ActivityLogOut(BaseModel):
    id: UUID
    employee_id: UUID
    challenge_id: UUID
    activity_type: str
    notes: Optional[str] = None
    proof_url: Optional[str] = None
    date_logged: date
    created_at: datetime

    class Config:
        from_attributes = True


# --- Employee Participation Schemas ---

class EmployeeParticipationOut(BaseModel):
    id: UUID
    employee_id: UUID
    activity_id: Optional[UUID] = None
    proof_url: Optional[str] = None
    approval_status: str # "Pending", "Approved", "Rejected"
    points_earned: int
    vouch_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# --- Peer Verification Schemas ---

class PeerVerificationCreate(BaseModel):
    participation_id: UUID
    voucher_employee_id: UUID

class PeerVerificationOut(BaseModel):
    id: UUID
    participation_id: UUID
    voucher_employee_id: UUID
    timestamp: datetime

    class Config:
        from_attributes = True


# --- Dashboard Schemas ---

class VerificationStats(BaseModel):
    vouches_given: int
    vouches_received: int

class DashboardOut(BaseModel):
    total_points: int
    approved_activities: int
    pending_activities: int
    current_weekly_streak: int
    completed_challenges: int
    active_challenges: int
    verification_statistics: VerificationStats


# --- Generic Envelope Response ---

class StandardSuccessResponse(BaseModel):
    success: bool = True
    message: str
    data: Optional[Any] = None
