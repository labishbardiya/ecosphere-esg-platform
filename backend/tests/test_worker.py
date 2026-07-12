import pytest
from datetime import date, timedelta
from app.models.models import User, ActivityLog, EmployeeParticipation, StreakRewardLog
from app.workers.tasks import weekly_streak_reward_task
from app.database.session import SessionLocal
from app.dependencies.dependencies import get_db

# Override the database session inside the tasks execution to use our test in-memory SQLite database
@pytest.fixture(autouse=True)
def override_celery_db(db):
    """
    Overrides the SessionLocal inside the tasks file to point to 
    the active test session. The close method is patched to prevent 
    the task from prematurely closing the session during testing.
    """
    import app.workers.tasks
    original_session = app.workers.tasks.SessionLocal
    original_close = db.close
    db.close = lambda: None
    app.workers.tasks.SessionLocal = lambda: db
    yield
    db.close = original_close
    app.workers.tasks.SessionLocal = original_session

def test_weekly_streak_reward_task_success(db, test_employee, test_challenge):
    today = date.today()
    # Seed 5 distinct activity logging dates for the test employee within the current week
    # e.g., today, today-1, today-2, today-3, today-4
    for i in range(5):
        log_date = today - timedelta(days=i)
        log = ActivityLog(
            employee_id=test_employee.id,
            challenge_id=test_challenge.id,
            activity_type="Steps",
            date_logged=log_date
        )
        db.add(log)
    db.commit()

    # Verify initial state
    db.refresh(test_employee)
    assert test_employee.points == 0

    # Run the worker task synchronously
    result = weekly_streak_reward_task()
    assert result["rewards_issued"] == 1

    # Verify reward database state
    db.refresh(test_employee)
    assert test_employee.points == 50

    # Ensure EmployeeParticipation is created
    participation = db.query(EmployeeParticipation).filter_by(
        employee_id=test_employee.id,
        activity_id=None,
        approval_status="Approved",
        points_earned=50
    ).first()
    assert participation is not None

    # Ensure StreakRewardLog exists
    year, week, _ = today.isocalendar()
    streak_log = db.query(StreakRewardLog).filter_by(
        employee_id=test_employee.id,
        year=year,
        week_number=week
    ).first()
    assert streak_log is not None

    # Run task again: should not issue duplicate reward (idempotency check)
    result_second_run = weekly_streak_reward_task()
    assert result_second_run["rewards_issued"] == 0
    
    db.refresh(test_employee)
    assert test_employee.points == 50 # remains 50, not 100!

def test_weekly_streak_reward_insufficient_days_no_reward(db, test_employee, test_challenge):
    today = date.today()
    # Seed only 4 distinct activity dates (which is less than the required 5)
    for i in range(4):
        log_date = today - timedelta(days=i)
        log = ActivityLog(
            employee_id=test_employee.id,
            challenge_id=test_challenge.id,
            activity_type="Steps",
            date_logged=log_date
        )
        db.add(log)
    db.commit()

    # Run the worker task
    result = weekly_streak_reward_task()
    assert result["rewards_issued"] == 0

    db.refresh(test_employee)
    assert test_employee.points == 0
