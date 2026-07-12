from typing import Type, TypeVar, Generic, List, Optional
from uuid import UUID
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from app.database.session import Base
from app.models.models import (
    User,
    WellbeingChallenge,
    ActivityLog,
    EmployeeParticipation,
    PeerVerification,
    StreakRewardLog,
)

ModelType = TypeVar("ModelType", bound=Base)

class BaseRepository(Generic[ModelType]):
    def __init__(self, model: Type[ModelType], db: Session):
        self.model = model
        self.db = db

    def get(self, id: UUID) -> Optional[ModelType]:
        return self.db.get(self.model, id)

    def get_all(self, skip: int = 0, limit: int = 100) -> List[ModelType]:
        stmt = select(self.model).offset(skip).limit(limit)
        return list(self.db.scalars(stmt).all())

    def create(self, obj_in: ModelType) -> ModelType:
        self.db.add(obj_in)
        self.db.flush()
        return obj_in

    def update(self, db_obj: ModelType, update_data: dict) -> ModelType:
        for field, value in update_data.items():
            if hasattr(db_obj, field):
                setattr(db_obj, field, value)
        self.db.add(db_obj)
        self.db.flush()
        return db_obj

    def delete(self, id: UUID) -> bool:
        db_obj = self.get(id)
        if db_obj:
            self.db.delete(db_obj)
            self.db.flush()
            return True
        return False


class UserRepository(BaseRepository[User]):
    def __init__(self, db: Session):
        super().__init__(User, db)

    def get_by_email(self, email: str) -> Optional[User]:
        stmt = select(User).where(User.email == email)
        return self.db.scalars(stmt).first()


class WellbeingChallengeRepository(BaseRepository[WellbeingChallenge]):
    def __init__(self, db: Session):
        super().__init__(WellbeingChallenge, db)

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
        stmt = select(WellbeingChallenge)
        
        # Search filter
        if search:
            stmt = stmt.where(
                WellbeingChallenge.name.ilike(f"%{search}%") | 
                WellbeingChallenge.description.ilike(f"%{search}%")
            )
        
        # Cycle type filter
        if cycle_type:
            stmt = stmt.where(WellbeingChallenge.cycle_type == cycle_type)
            
        # Status filter
        if status is not None:
            stmt = stmt.where(WellbeingChallenge.status == status)

        # Sorting logic
        order_col = getattr(WellbeingChallenge, sort_by, WellbeingChallenge.created_at)
        if sort_order == "desc":
            stmt = stmt.order_by(order_col.desc())
        else:
            stmt = stmt.order_by(order_col.asc())

        stmt = stmt.offset(skip).limit(limit)
        return list(self.db.scalars(stmt).all())


class ActivityLogRepository(BaseRepository[ActivityLog]):
    def __init__(self, db: Session):
        super().__init__(ActivityLog, db)

    def list_by_employee(
        self, 
        employee_id: UUID, 
        skip: int = 0, 
        limit: int = 100,
        challenge_id: Optional[UUID] = None,
        activity_type: Optional[str] = None,
        sort_by: str = "date_logged",
        sort_order: str = "desc"
    ) -> List[ActivityLog]:
        stmt = select(ActivityLog).where(ActivityLog.employee_id == employee_id)
        
        if challenge_id:
            stmt = stmt.where(ActivityLog.challenge_id == challenge_id)
        if activity_type:
            stmt = stmt.where(ActivityLog.activity_type == activity_type)

        order_col = getattr(ActivityLog, sort_by, ActivityLog.date_logged)
        if sort_order == "desc":
            stmt = stmt.order_by(order_col.desc())
        else:
            stmt = stmt.order_by(order_col.asc())

        stmt = stmt.offset(skip).limit(limit)
        return list(self.db.scalars(stmt).all())


class EmployeeParticipationRepository(BaseRepository[EmployeeParticipation]):
    def __init__(self, db: Session):
        super().__init__(EmployeeParticipation, db)

    def get_by_activity(self, activity_id: UUID) -> Optional[EmployeeParticipation]:
        stmt = select(EmployeeParticipation).where(EmployeeParticipation.activity_id == activity_id)
        return self.db.scalars(stmt).first()

    def list_by_employee(self, employee_id: UUID) -> List[EmployeeParticipation]:
        stmt = select(EmployeeParticipation).where(EmployeeParticipation.employee_id == employee_id)
        return list(self.db.scalars(stmt).all())


class PeerVerificationRepository(BaseRepository[PeerVerification]):
    def __init__(self, db: Session):
        super().__init__(PeerVerification, db)

    def get_by_participation_and_voucher(
        self, participation_id: UUID, voucher_employee_id: UUID
    ) -> Optional[PeerVerification]:
        stmt = select(PeerVerification).where(
            PeerVerification.participation_id == participation_id,
            PeerVerification.voucher_employee_id == voucher_employee_id
        )
        return self.db.scalars(stmt).first()

    def count_given(self, employee_id: UUID) -> int:
        stmt = select(func.count(PeerVerification.id)).where(PeerVerification.voucher_employee_id == employee_id)
        return self.db.scalar(stmt) or 0


class StreakRewardLogRepository(BaseRepository[StreakRewardLog]):
    def __init__(self, db: Session):
        super().__init__(StreakRewardLog, db)

    def get_log(self, employee_id: UUID, year: int, week_number: int) -> Optional[StreakRewardLog]:
        stmt = select(StreakRewardLog).where(
            StreakRewardLog.employee_id == employee_id,
            StreakRewardLog.year == year,
            StreakRewardLog.week_number == week_number
        )
        return self.db.scalars(stmt).first()
