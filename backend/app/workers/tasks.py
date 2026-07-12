from datetime import date, timedelta
from celery.utils.log import get_task_logger
from app.workers.celery_app import celery_app
from app.database.session import SessionLocal
from app.models.models import User, ActivityLog, EmployeeParticipation, StreakRewardLog
from sqlalchemy import select, func

logger = get_task_logger(__name__)

@celery_app.task(name="app.workers.tasks.weekly_streak_reward_task")
def weekly_streak_reward_task():
    """
    Scans activity logs from the previous 7 days (Monday through Sunday),
    groups by employee, and rewards employees who logged activities on 
    5 or more distinct days with 50 points and a weekly streak participation record.
    """
    logger.info("Starting Weekly Streak Reward Engine execution...")
    
    db = SessionLocal()
    try:
        today = date.today()
        # Retrieve the current ISO year and week number
        year, week_number, _ = today.isocalendar()
        
        # Calculate search window: Monday through Sunday (the current 7 days)
        start_date = today - timedelta(days=6)
        end_date = today
        
        logger.info(
            f"Scanning ActivityLogs between {start_date} and {end_date} (Year: {year}, Week: {week_number})"
        )
        
        # SQL aggregate: Count of distinct date_logged for each employee within the window
        stmt = (
            select(ActivityLog.employee_id, func.count(func.distinct(ActivityLog.date_logged)))
            .where(ActivityLog.date_logged >= start_date)
            .where(ActivityLog.date_logged <= end_date)
            .group_by(ActivityLog.employee_id)
        )
        results = db.execute(stmt).all()
        
        rewards_issued = 0
        for employee_id, distinct_days in results:
            if distinct_days >= 5:
                # Verify user hasn't already been rewarded for this week to maintain idempotency
                stmt_check = select(StreakRewardLog).where(
                    StreakRewardLog.employee_id == employee_id,
                    StreakRewardLog.year == year,
                    StreakRewardLog.week_number == week_number
                )
                existing = db.scalars(stmt_check).first()
                
                if existing:
                    logger.info(
                        f"Employee {employee_id} already received streak reward for Year {year} Week {week_number}. Skipping."
                    )
                    continue
                
                # Award points transactionally
                try:
                    # 1. Write Reward Log
                    reward_log = StreakRewardLog(
                        employee_id=employee_id,
                        year=year,
                        week_number=week_number
                    )
                    db.add(reward_log)
                    
                    # 2. Write Approved Employee Participation (activity_id is Null since it is streak-based)
                    participation = EmployeeParticipation(
                        employee_id=employee_id,
                        activity_id=None,
                        proof_url=None,
                        approval_status="Approved",
                        points_earned=50,
                        vouch_count=0
                    )
                    db.add(participation)
                    
                    # 3. Add points to User account
                    employee = db.get(User, employee_id)
                    if employee:
                        employee.points += 50
                        
                    db.commit()
                    rewards_issued += 1
                    logger.info(
                        f"Awarded 50 streak points to employee {employee_id} (days logged: {distinct_days})"
                    )
                except Exception as ex:
                    db.rollback()
                    logger.error(
                        f"Failed to issue streak reward transaction for employee {employee_id}: {str(ex)}"
                    )
                    
        logger.info(f"Weekly Streak Reward Engine completed. Total rewards issued: {rewards_issued}")
        return {"rewards_issued": rewards_issued}
    except Exception as e:
        logger.error(f"Weekly Streak Reward Engine failed: {str(e)}")
        raise e
    finally:
        db.close()
