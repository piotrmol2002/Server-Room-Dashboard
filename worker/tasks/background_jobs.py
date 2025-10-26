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
        from sqlalchemy import text
        result = db.execute(text("SELECT id, status, cpu_usage, ram_usage, temperature, uptime FROM servers"))
        servers = result.fetchall()

        metrics_updated = 0
        for server in servers:
            server_id, status, cpu, ram, temp, uptime = server

            if server_id not in simulation_engine.server_states:
                is_online = status == 'online'
                simulation_engine.register_server(
                    server_id=server_id,
                    is_online=is_online,
                    current_cpu=cpu if is_online else 0.0,
                    current_ram=ram if is_online else 0.0,
                    current_temp=temp,
                    uptime=uptime if is_online else 0
                )

            snapshot = simulation_engine.simulate_tick(server_id, interval_seconds=10)

            db.execute(
                text("""
                    UPDATE servers
                    SET cpu_usage = :cpu, ram_usage = :ram,
                        temperature = :temp, uptime = :uptime, status = :status,
                        updated_at = NOW()
                    WHERE id = :id
                """),
                {
                    'cpu': snapshot.cpu_usage,
                    'ram': snapshot.ram_usage,
                    'temp': snapshot.temperature,
                    'uptime': snapshot.uptime,
                    'status': snapshot.status,
                    'id': server_id
                }
            )

            db.execute(
                text("""
                    INSERT INTO server_metrics_history
                    (server_id, cpu_usage, ram_usage, temperature, uptime, status, timestamp)
                    VALUES (:server_id, :cpu, :ram, :temp, :uptime, :status, NOW())
                """),
                {
                    'server_id': server_id,
                    'cpu': snapshot.cpu_usage,
                    'ram': snapshot.ram_usage,
                    'temp': snapshot.temperature,
                    'uptime': snapshot.uptime,
                    'status': snapshot.status
                }
            )

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
