# Import all models to ensure they are registered with the metadata 
# before importing Base in Alembic/scripts.
from app.database.session import Base
from app.models.models import (
    User,
    WellbeingChallenge,
    ActivityLog,
    EmployeeParticipation,
    PeerVerification,
    StreakRewardLog,
)
