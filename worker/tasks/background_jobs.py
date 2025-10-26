from celery import shared_task
import random
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import time

DATABASE_URL = os.getenv('DATABASE_URL')
engine = create_engine(DATABASE_URL) if DATABASE_URL else None
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine) if engine else None


@shared_task
def simulate_server_metrics():
    if not SessionLocal:
        return "Database not configured"

    db = SessionLocal()
    try:
        print(f"[WORKER] Simulating server metrics update at {time.time()}")
        return "Server metrics updated"
    finally:
        db.close()


@shared_task
def check_alerts():
    if not SessionLocal:
        return "Database not configured"

    db = SessionLocal()
    try:
        print(f"[WORKER] Checking for alert conditions at {time.time()}")
        return "Alerts checked"
    finally:
        db.close()


@shared_task
def execute_scheduled_task(task_id: int):
    if not SessionLocal:
        return "Database not configured"

    db = SessionLocal()
    try:
        print(f"[WORKER] Executing scheduled task {task_id} at {time.time()}")
        return f"Task {task_id} executed successfully"
    finally:
        db.close()


@shared_task
def generate_random_events():
    print(f"[WORKER] Generating random events at {time.time()}")

    events = [
        "Server-03 went offline",
        "Temperature spike in Server-07",
        "UPS battery at 50%",
        "Backup completed successfully",
        "Server-05 restarted"
    ]

    event = random.choice(events)
    print(f"[EVENT] {event}")

    return event


from celery.schedules import crontab
from tasks.celery_app import celery_app

celery_app.conf.beat_schedule = {
    'simulate-metrics-every-10-seconds': {
        'task': 'tasks.background_jobs.simulate_server_metrics',
        'schedule': 10.0,
    },
    'check-alerts-every-30-seconds': {
        'task': 'tasks.background_jobs.check_alerts',
        'schedule': 30.0,
    },
    'generate-events-every-20-seconds': {
        'task': 'tasks.background_jobs.generate_random_events',
        'schedule': 20.0,
    },
}
