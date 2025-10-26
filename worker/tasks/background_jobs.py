from celery import shared_task
import random
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import time
import sys
import redis
import json
sys.path.append('/app')

from simulator.engine import SimulationEngine

DATABASE_URL = os.getenv('DATABASE_URL')
REDIS_URL = os.getenv('REDIS_URL', 'redis://redis:6379')

engine = create_engine(DATABASE_URL) if DATABASE_URL else None
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine) if engine else None

redis_client = redis.from_url(REDIS_URL, decode_responses=True)
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

        servers_data = []
        for server in servers:
            servers_data.append({
                'id': server.id,
                'name': server.name,
                'status': server.status.value,
                'cpu_usage': server.cpu_usage,
                'ram_usage': server.ram_usage,
                'temperature': server.temperature,
                'uptime': server.uptime
            })

        try:
            redis_client.publish('metrics_update', json.dumps({
                'servers': servers_data,
                'timestamp': time.time()
            }))
        except Exception as redis_error:
            print(f"[WARN] Failed to publish to Redis: {redis_error}")

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
        sys.path.insert(0, '/backend')
        from app.models.server import Server, ServerStatus
        from app.models.alert import Alert, AlertLevel
        from app.models.alert_threshold import AlertThreshold
        from app.models.user import UserRole
        from datetime import datetime, timedelta

        thresholds = db.query(AlertThreshold).first()
        if not thresholds:
            print("[WORKER] No alert thresholds configured")
            return "No thresholds configured"

        servers = db.query(Server).filter(Server.status == ServerStatus.ONLINE).all()
        alerts_generated = 0

        for server in servers:
            # CPU
            if server.cpu_usage >= thresholds.cpu_critical_threshold:
                if not _alert_exists(db, server.name, "Critical CPU Usage", minutes=5):
                    alert = Alert(
                        title="Critical CPU Usage",
                        message=f"{server.name} CPU at {server.cpu_usage:.1f}%",
                        level=AlertLevel.CRITICAL,
                        source=server.name,
                        target_role=UserRole.OPERATOR,
                        is_read=False
                    )
                    db.add(alert)
                    alerts_generated += 1

            elif server.cpu_usage >= thresholds.cpu_warning_threshold:
                if not _alert_exists(db, server.name, "High CPU Usage", minutes=5):
                    alert = Alert(
                        title="High CPU Usage",
                        message=f"{server.name} CPU at {server.cpu_usage:.1f}%",
                        level=AlertLevel.WARNING,
                        source=server.name,
                        target_role=UserRole.OPERATOR,
                        is_read=False
                    )
                    db.add(alert)
                    alerts_generated += 1

            # Temperature
            if server.temperature >= thresholds.temperature_critical_threshold:
                if not _alert_exists(db, server.name, "Critical Temperature", minutes=5):
                    alert = Alert(
                        title="Critical Temperature",
                        message=f"{server.name} temperature at {server.temperature:.1f}°C",
                        level=AlertLevel.CRITICAL,
                        source=server.name,
                        target_role=UserRole.TECHNICIAN,
                        is_read=False
                    )
                    db.add(alert)
                    alerts_generated += 1

            elif server.temperature >= thresholds.temperature_warning_threshold:
                if not _alert_exists(db, server.name, "High Temperature", minutes=5):
                    alert = Alert(
                        title="High Temperature",
                        message=f"{server.name} temperature at {server.temperature:.1f}°C",
                        level=AlertLevel.WARNING,
                        source=server.name,
                        target_role=UserRole.TECHNICIAN,
                        is_read=False
                    )
                    db.add(alert)
                    alerts_generated += 1

            # RAM
            if server.ram_usage >= thresholds.ram_critical_threshold:
                if not _alert_exists(db, server.name, "Critical RAM Usage", minutes=5):
                    alert = Alert(
                        title="Critical RAM Usage",
                        message=f"{server.name} RAM at {server.ram_usage:.1f}%",
                        level=AlertLevel.CRITICAL,
                        source=server.name,
                        target_role=UserRole.OPERATOR,
                        is_read=False
                    )
                    db.add(alert)
                    alerts_generated += 1

            elif server.ram_usage >= thresholds.ram_warning_threshold:
                if not _alert_exists(db, server.name, "High RAM Usage", minutes=5):
                    alert = Alert(
                        title="High RAM Usage",
                        message=f"{server.name} RAM at {server.ram_usage:.1f}%",
                        level=AlertLevel.WARNING,
                        source=server.name,
                        target_role=UserRole.OPERATOR,
                        is_read=False
                    )
                    db.add(alert)
                    alerts_generated += 1

        db.commit()
        print(f"[WORKER] Generated {alerts_generated} new alerts")
        return f"Generated {alerts_generated} alerts"
    except Exception as e:
        print(f"[ERROR] Failed to check alerts: {e}")
        db.rollback()
        return f"Error: {str(e)}"
    finally:
        db.close()


def _alert_exists(db, source: str, title: str, minutes: int = 5):
    from app.models.alert import Alert
    from datetime import datetime, timedelta

    cutoff = datetime.utcnow() - timedelta(minutes=minutes)
    existing = db.query(Alert).filter(
        Alert.source == source,
        Alert.title == title,
        Alert.created_at >= cutoff,
        Alert.is_read == False
    ).first()
    return existing is not None


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
