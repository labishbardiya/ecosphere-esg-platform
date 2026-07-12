import uuid
from datetime import date, datetime
from typing import List, Optional
from sqlalchemy import String, Integer, Boolean, Text, ForeignKey, Date, DateTime, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.session import Base

class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(50), default="employee", nullable=False) # e.g. "admin", "employee"
    points: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        onupdate=func.now(), 
        nullable=False
    )

    # Relationships
    activity_logs: Mapped[List["ActivityLog"]] = relationship("ActivityLog", back_populates="employee", cascade="all, delete-orphan")
    participations: Mapped[List["EmployeeParticipation"]] = relationship("EmployeeParticipation", back_populates="employee", cascade="all, delete-orphan")
    verifications_given: Mapped[List["PeerVerification"]] = relationship("PeerVerification", back_populates="voucher", cascade="all, delete-orphan")
    streak_rewards: Mapped[List["StreakRewardLog"]] = relationship("StreakRewardLog", back_populates="employee", cascade="all, delete-orphan")


class WellbeingChallenge(Base):
    __tablename__ = "wellbeing_challenges"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    target_frequency: Mapped[int] = mapped_column(Integer, nullable=False)
    cycle_type: Mapped[str] = mapped_column(String(50), default="Weekly", nullable=False) # "Weekly", "Monthly"
    status: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False) # active or inactive
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        onupdate=func.now(), 
        nullable=False
    )

    # Relationships
    activity_logs: Mapped[List["ActivityLog"]] = relationship("ActivityLog", back_populates="challenge", cascade="all, delete-orphan")


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    employee_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    challenge_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("wellbeing_challenges.id", ondelete="CASCADE"), nullable=False, index=True)
    activity_type: Mapped[str] = mapped_column(String(100), nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    proof_url: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    date_logged: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    employee: Mapped["User"] = relationship("User", back_populates="activity_logs")
    challenge: Mapped["WellbeingChallenge"] = relationship("WellbeingChallenge", back_populates="activity_logs")
    participation: Mapped[Optional["EmployeeParticipation"]] = relationship("EmployeeParticipation", back_populates="activity", uselist=False, cascade="all, delete-orphan")


class EmployeeParticipation(Base):
    __tablename__ = "employee_participations"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    employee_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    activity_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("activity_logs.id", ondelete="SET NULL"), nullable=True, index=True)
    proof_url: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    approval_status: Mapped[str] = mapped_column(String(50), default="Pending", nullable=False, index=True) # "Pending", "Approved", "Rejected"
    points_earned: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    vouch_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        onupdate=func.now(), 
        nullable=False
    )

    # Relationships
    employee: Mapped["User"] = relationship("User", back_populates="participations")
    activity: Mapped[Optional["ActivityLog"]] = relationship("ActivityLog", back_populates="participation")
    verifications: Mapped[List["PeerVerification"]] = relationship("PeerVerification", back_populates="participation", cascade="all, delete-orphan")


class PeerVerification(Base):
    __tablename__ = "peer_verifications"
    __table_args__ = (
        UniqueConstraint("participation_id", "voucher_employee_id", name="uq_participation_voucher"),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    participation_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("employee_participations.id", ondelete="CASCADE"), nullable=False, index=True)
    voucher_employee_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    participation: Mapped["EmployeeParticipation"] = relationship("EmployeeParticipation", back_populates="verifications")
    voucher: Mapped["User"] = relationship("User", back_populates="verifications_given")


class StreakRewardLog(Base):
    __tablename__ = "streak_reward_logs"
    __table_args__ = (
        UniqueConstraint("employee_id", "year", "week_number", name="uq_employee_streak_week"),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    employee_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    week_number: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    employee: Mapped["User"] = relationship("User", back_populates="streak_rewards")
