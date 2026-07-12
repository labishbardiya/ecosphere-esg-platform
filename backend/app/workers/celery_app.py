from celery import Celery
from celery.schedules import crontab
from app.core.config import settings

# Initialize Celery app with Redis broker and backend
celery_app = Celery(
    "ecosphere_tasks",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)

# Configure Celery Beat schedule: Every Sunday at 11:59 PM
celery_app.conf.beat_schedule = {
    "run-weekly-streak-reward-engine": {
        "task": "app.workers.tasks.weekly_streak_reward_task",
        "schedule": crontab(minute=59, hour=23, day_of_week="sun"),
    }
}

# Import tasks module
celery_app.autodiscover_tasks(["app.workers"])
