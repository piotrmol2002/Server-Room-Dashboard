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
from core.timezone import now_warsaw

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
        from app.models.stress_test_log import StressTestLog
        from app.models.server_baseline import ServerBaseline

        from app.models.environment import Environment

        servers = db.query(Server).order_by(Server.id).all()
        baselines = {b.server_id: b for b in db.query(ServerBaseline).all()}
        environment = db.query(Environment).first()

        running_tests = db.query(StressTestLog).filter(
            StressTestLog.status == "running"
        ).all()

        for test in running_tests:
            elapsed = (now_warsaw() - test.started_at).total_seconds()

            if elapsed >= test.duration_seconds:
                test.status = "completed"
                test.completed_at = now_warsaw()

                if test.server_id in simulation_engine.server_states:
                    state = simulation_engine.server_states[test.server_id]
                    test.max_cpu_reached = state.cpu_current
                    test.max_ram_reached = state.ram_current
                    test.max_temp_reached = state.temperature_current

                db.commit()
                print(f"[STRESS TEST] Completed test {test.id} for server {test.server_id}")
            else:
                if test.server_id not in [e.server_id for e in simulation_engine.pending_events if e.event_type == 'stress_test']:
                    simulation_engine.trigger_stress_test(
                        test.server_id,
                        test.duration_seconds,
                        test.intensity
                    )
                    print(f"[STRESS TEST] Activated test {test.id} for server {test.server_id}")

        metrics_updated = 0
        for server in servers:
            is_online = server.status == ServerStatus.ONLINE

            if server.id not in simulation_engine.server_states:
                simulation_engine.register_server(
                    server_id=server.id,
                    is_online=is_online,
                    current_cpu=server.cpu_usage if is_online else 0.0,
                    current_ram=server.ram_usage if is_online else 0.0,
                    current_temp=server.temperature,
                    uptime=server.uptime if is_online else 0
                )
            else:
                simulation_engine.set_server_status(server.id, is_online)

            if server.id in baselines:
                baseline = baselines[server.id]
                simulation_engine.set_load_baseline(server.id, baseline.cpu_baseline, baseline.ram_baseline)

            snapshot = simulation_engine.simulate_tick(server.id, interval_seconds=10)

            server.cpu_usage = snapshot.cpu_usage
            server.ram_usage = snapshot.ram_usage
            server.temperature = snapshot.temperature
            server.uptime = snapshot.uptime
            server.status = ServerStatus.ONLINE if snapshot.status == 'online' else ServerStatus.OFFLINE

            history = ServerMetricsHistory(
                server_id=server.id,
                timestamp=now_warsaw(),
                cpu_usage=snapshot.cpu_usage,
                ram_usage=snapshot.ram_usage,
                temperature=snapshot.temperature,
                uptime=snapshot.uptime,
                status=snapshot.status
            )
            db.add(history)

            metrics_updated += 1

        if environment:
            base_power = 2.5
            if environment.ac_status:
                base_power += 0.0

            server_power = 0.0
            for server in servers:
                if server.status == ServerStatus.ONLINE:
                    server_power += 0.3 + (server.cpu_usage / 100 * 0.5) + (server.ram_usage / 100 * 0.3)

            environment.power_consumption = round(base_power + server_power, 2)

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

        from app.models.environment import Environment

        thresholds = db.query(AlertThreshold).first()
        if not thresholds:
            print("[WORKER] No alert thresholds configured")
            return "No thresholds configured"

        servers = db.query(Server).filter(Server.status == ServerStatus.ONLINE).all()
        environment = db.query(Environment).first()
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

        if environment:
            if environment.humidity >= thresholds.humidity_critical_threshold:
                if not _alert_exists(db, "Environment", "Critical Humidity", minutes=5):
                    alert = Alert(
                        title="Critical Humidity",
                        message=f"Room humidity at {environment.humidity:.1f}%",
                        level=AlertLevel.CRITICAL,
                        source="Environment",
                        target_role=UserRole.TECHNICIAN,
                        is_read=False
                    )
                    db.add(alert)
                    alerts_generated += 1

            elif environment.humidity >= thresholds.humidity_warning_threshold:
                if not _alert_exists(db, "Environment", "High Humidity", minutes=5):
                    alert = Alert(
                        title="High Humidity",
                        message=f"Room humidity at {environment.humidity:.1f}%",
                        level=AlertLevel.WARNING,
                        source="Environment",
                        target_role=UserRole.TECHNICIAN,
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
    from datetime import timedelta

    cutoff = now_warsaw() - timedelta(minutes=minutes)
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


@shared_task
def cleanup_old_metrics():
    if not SessionLocal:
        return "Database not configured"

    db = SessionLocal()
    try:
        sys.path.insert(0, '/backend')
        from app.models.server_metrics_history import ServerMetricsHistory
        from datetime import timedelta

        cutoff_date = now_warsaw() - timedelta(days=30)

        deleted_count = db.query(ServerMetricsHistory).filter(
            ServerMetricsHistory.timestamp < cutoff_date
        ).delete()

        db.commit()
        print(f"[WORKER] Deleted {deleted_count} old metrics (older than 30 days)")
        return f"Deleted {deleted_count} old metrics"
    except Exception as e:
        print(f"[ERROR] Failed to cleanup old metrics: {e}")
        db.rollback()
        return f"Error: {str(e)}"
    finally:
        db.close()




@shared_task
def check_recurring_tasks():
    if not SessionLocal:
        return "Database not configured"

    db = SessionLocal()
    try:
        sys.path.insert(0, '/backend')
        from app.models.scheduled_task import ScheduledTask, TaskStatus
        from datetime import timedelta

        now = now_warsaw()
        tasks_updated = 0

        recurring_tasks = db.query(ScheduledTask).filter(
            ScheduledTask.is_recurring == True,
            ScheduledTask.recurrence_days.isnot(None)
        ).all()

        for task in recurring_tasks:
            if task.scheduled_time <= now:
                if task.status == TaskStatus.COMPLETED:
                    task.status = TaskStatus.PENDING
                    task.completed_at = None
                    task.completed_by_user_id = None
                    task.completed_by_email = None
                    task.completion_comment = None
                    tasks_updated += 1
                    print(f"[WORKER] Reset recurring task {task.id} to pending (new period)")
                elif task.status == TaskStatus.PENDING:
                    task.status = TaskStatus.OVERDUE
                    tasks_updated += 1
                    print(f"[WORKER] Marked task {task.id} as overdue")

        db.commit()
        print(f"[WORKER] Updated {tasks_updated} recurring tasks")
        return f"Updated {tasks_updated} recurring tasks"
    except Exception as e:
        print(f"[ERROR] Failed to check recurring tasks: {e}")
        db.rollback()
        return f"Error: {str(e)}"
    finally:
        db.close()

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
    'cleanup-old-metrics-daily': {
        'task': 'tasks.background_jobs.cleanup_old_metrics',
        'schedule': crontab(hour=2, minute=0),
    },
}
