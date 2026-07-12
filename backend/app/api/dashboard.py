import uuid
from datetime import date, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from app.dependencies.dependencies import get_db, require_employee
from app.schemas.schemas import DashboardOut, VerificationStats
from app.models.models import (
    User,
    WellbeingChallenge,
    ActivityLog,
    EmployeeParticipation,
    PeerVerification,
)
from app.exceptions.exceptions import ForbiddenException, ResourceNotFoundException

router = APIRouter(prefix="/api/social/dashboard", tags=["Dashboard"])

def calculate_weekly_streak(db: Session, employee_id: uuid.UUID) -> int:
    """
    Calculates the current weekly streak of an employee.
    A streak is defined as consecutive weeks (ending in the current week 
    or the previous week) where the employee had >= 5 distinct activity logging days.
    """
    stmt = (
        select(ActivityLog.date_logged)
        .where(ActivityLog.employee_id == employee_id)
        .distinct()
        .order_by(ActivityLog.date_logged.desc())
    )
    dates = db.scalars(stmt).all()
    
    if not dates:
        return 0
        
    # Group dates by ISO week: (year, week_number) -> set of dates
    weeks_activity = {}
    for d in dates:
        year, week, _ = d.isocalendar()
        weeks_activity[(year, week)] = weeks_activity.get((year, week), set())
        weeks_activity[(year, week)].add(d)
        
    # Current date and current ISO week
    today = date.today()
    curr_yr, curr_wk, _ = today.isocalendar()
    
    # Check current week logged days
    curr_week_days = len(weeks_activity.get((curr_yr, curr_wk), set()))
    
    streak = 0
    # Determine the starting week for streak calculation
    if curr_week_days >= 5:
        # Current week is active and has met the 5-day streak requirement
        target_yr, target_wk = curr_yr, curr_wk
    else:
        # Current week does not have 5 days yet. Check if previous week met it
        prev_date = today - timedelta(days=7)
        prev_yr, prev_wk, _ = prev_date.isocalendar()
        if len(weeks_activity.get((prev_yr, prev_wk), set())) >= 5:
            # Streak is active, starting check from the previous week
            target_yr, target_wk = prev_yr, prev_wk
        else:
            # Previous week also failed; streak is broken
            return 0
            
    # Trace backwards week by week
    check_date = date.fromisocalendar(target_yr, target_wk, 1) # Start checking from Monday of target week
    while True:
        y, w, _ = check_date.isocalendar()
        days_logged = len(weeks_activity.get((y, w), set()))
        if days_logged >= 5:
            streak += 1
            check_date -= timedelta(days=7) # Go back one week
        else:
            break
            
    return streak

@router.get("/{employee_id}", response_model=DashboardOut)
def get_dashboard_stats(
    employee_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_employee)
):
    """Retrieves ESG Social wellbeing stats for the specified employee."""
    # Security: Employees can only read their own dashboard, Admins can read anyone's
    if current_user.role != "admin" and current_user.id != employee_id:
        raise ForbiddenException(
            message="You are not authorized to view this employee's dashboard.",
            error_code="DASHBOARD_ACCESS_DENIED"
        )

    # Verify target employee exists
    user_repo = db.get(User, employee_id)
    if not user_repo:
        raise ResourceNotFoundException(
            message="Target employee not found",
            error_code="EMPLOYEE_NOT_FOUND"
        )

    # 1. Total Points
    total_points = user_repo.points

    # 2. Approved Activities
    stmt_approved = (
        select(func.count(EmployeeParticipation.id))
        .where(
            EmployeeParticipation.employee_id == employee_id,
            EmployeeParticipation.approval_status == "Approved",
            EmployeeParticipation.activity_id.is_not(None)
        )
    )
    approved_activities = db.scalar(stmt_approved) or 0

    # 3. Pending Activities
    stmt_pending = (
        select(func.count(EmployeeParticipation.id))
        .where(
            EmployeeParticipation.employee_id == employee_id,
            EmployeeParticipation.approval_status == "Pending",
            EmployeeParticipation.activity_id.is_not(None)
        )
    )
    pending_activities = db.scalar(stmt_pending) or 0

    # 4. Weekly Streak
    streak = calculate_weekly_streak(db, employee_id)

    # 5. Completed / Active Challenges
    # Query all challenges joined with this employee's approved participations
    stmt_challenges = (
        select(WellbeingChallenge, func.count(EmployeeParticipation.id))
        .join(ActivityLog, ActivityLog.challenge_id == WellbeingChallenge.id)
        .join(EmployeeParticipation, EmployeeParticipation.activity_id == ActivityLog.id)
        .where(EmployeeParticipation.employee_id == employee_id)
        .where(EmployeeParticipation.approval_status == "Approved")
        .group_by(WellbeingChallenge.id)
    )
    challenge_stats = db.execute(stmt_challenges).all()
    
    completed_challenges = 0
    completed_challenge_ids = set()
    for challenge, count in challenge_stats:
        if count >= challenge.target_frequency:
            completed_challenges += 1
            completed_challenge_ids.add(challenge.id)

    # Active challenges: challenges the user has logged activities for (regardless of approval status),
    # but has not yet met the completed criteria
    stmt_active_challenges = (
        select(WellbeingChallenge.id)
        .join(ActivityLog, ActivityLog.challenge_id == WellbeingChallenge.id)
        .where(ActivityLog.employee_id == employee_id)
        .distinct()
    )
    all_touched_ids = set(db.scalars(stmt_active_challenges).all())
    active_challenges = len(all_touched_ids - completed_challenge_ids)

    # 6. Verification Statistics
    # Vouches Given
    stmt_v_given = (
        select(func.count(PeerVerification.id))
        .where(PeerVerification.voucher_employee_id == employee_id)
    )
    vouches_given = db.scalar(stmt_v_given) or 0

    # Vouches Received
    stmt_v_received = (
        select(func.sum(EmployeeParticipation.vouch_count))
        .where(EmployeeParticipation.employee_id == employee_id)
    )
    vouches_received = db.scalar(stmt_v_received) or 0

    return DashboardOut(
        total_points=total_points,
        approved_activities=approved_activities,
        pending_activities=pending_activities,
        current_weekly_streak=streak,
        completed_challenges=completed_challenges,
        active_challenges=active_challenges,
        verification_statistics=VerificationStats(
            vouches_given=vouches_given,
            vouches_received=vouches_received
        )
    )
