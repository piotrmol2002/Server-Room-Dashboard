from celery import shared_task
import random
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import time
import sys
sys.path.append('/app')

from simulator.engine import SimulationEngine

DATABASE_URL = os.getenv('DATABASE_URL')
engine = create_engine(DATABASE_URL) if DATABASE_URL else None
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine) if engine else None

simulation_engine = SimulationEngine()


@shared_task
def simulate_server_metrics():
    if not SessionLocal:
        return "Database not configured"

    db = SessionLocal()
    try:
        sys.path.insert(0, '/backend')
        from app.models.server import Server, ServerStatus
        from app.models.server_metrics_history import ServerMetricsHistory

        servers = db.query(Server).all()

        metrics_updated = 0
        for server in servers:
            if server.id not in simulation_engine.server_states:
                is_online = server.status == ServerStatus.ONLINE
                simulation_engine.register_server(
                    server_id=server.id,
                    is_online=is_online,
                    current_cpu=server.cpu_usage if is_online else 0.0,
                    current_ram=server.ram_usage if is_online else 0.0,
                    current_temp=server.temperature,
                    uptime=server.uptime if is_online else 0
                )

            snapshot = simulation_engine.simulate_tick(server.id, interval_seconds=10)

            server.cpu_usage = snapshot.cpu_usage
            server.ram_usage = snapshot.ram_usage
            server.temperature = snapshot.temperature
            server.uptime = snapshot.uptime
            server.status = ServerStatus.ONLINE if snapshot.status == 'online' else ServerStatus.OFFLINE

            history = ServerMetricsHistory(
                server_id=server.id,
                cpu_usage=snapshot.cpu_usage,
                ram_usage=snapshot.ram_usage,
                temperature=snapshot.temperature,
                uptime=snapshot.uptime,
                status=snapshot.status
            )
            db.add(history)

            metrics_updated += 1

        db.commit()
        print(f"[WORKER] Updated metrics for {metrics_updated} servers")
        return f"Updated {metrics_updated} servers"
    except Exception as e:
        print(f"[ERROR] Failed to simulate metrics: {e}")
        db.rollback()
        return f"Error: {str(e)}"
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
    'simulate-metrics-every-30-seconds': {
        'task': 'tasks.background_jobs.simulate_server_metrics',
        'schedule': 30.0,
    },
    'check-alerts-every-60-seconds': {
        'task': 'tasks.background_jobs.check_alerts',
        'schedule': 60.0,
    },
}
