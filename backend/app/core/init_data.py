from sqlalchemy.orm import Session
from app.models import (
    Server, Environment, ServerStatus, User, UserRole,
    AlertThreshold, Alert, AlertLevel
)
from app.core.security import get_password_hash
from app.core.database import SessionLocal


def init_db():
    db: Session = SessionLocal()

    try:
        existing_servers = db.query(Server).first()
        if existing_servers:
            print("Database already initialized")
            return

        env = Environment(
            room_temperature=22.0,
            humidity=45.0,
            ac_status=True,
            ac_target_temp=20.0,
            ups_battery=100.0,
            ups_on_battery=False,
            power_consumption=5.5
        )
        db.add(env)

        servers = []
        for i in range(1, 13):
            is_online = i % 4 != 0
            server = Server(
                name=f"Server-{i:02d}",
                ip_address=f"192.168.1.{100+i}",
                status=ServerStatus.ONLINE if is_online else ServerStatus.OFFLINE,
                cpu_usage=30.0 + (i * 5) if is_online else 0.0,
                ram_usage=40.0 + (i * 3) if is_online else 0.0,
                temperature=35.0 + (i * 2) if is_online else 22.0,
                uptime=86400 * i if is_online else 0
            )
            servers.append(server)
            db.add(server)

        admin_user = User(
            email="admin@serwerownia.pl",
            username="admin",
            full_name="Administrator",
            hashed_password=get_password_hash("admin123"),
            role=UserRole.ADMIN,
            is_active=True
        )
        db.add(admin_user)

        sample_users = [
            User(
                email="operator@serwerownia.pl",
                username="operator",
                full_name="Operator User",
                hashed_password=get_password_hash("operator123"),
                role=UserRole.OPERATOR,
                is_active=True
            ),
            User(
                email="technician@serwerownia.pl",
                username="tech",
                full_name="Technician User",
                hashed_password=get_password_hash("tech123"),
                role=UserRole.TECHNICIAN,
                is_active=True
            ),
        ]

        for user in sample_users:
            db.add(user)

        thresholds = AlertThreshold(
            cpu_warning_threshold=85.0,
            cpu_critical_threshold=95.0,
            temperature_warning_threshold=70.0,
            temperature_critical_threshold=80.0,
            ram_warning_threshold=85.0,
            ram_critical_threshold=95.0,
            updated_by="system"
        )
        db.add(thresholds)

        sample_alerts = [
            Alert(
                title="High Temperature Detected",
                message="Server-11 temperature reached 77°C",
                level=AlertLevel.WARNING,
                source="Server-11",
                target_role=UserRole.TECHNICIAN,
                is_read=False
            ),
            Alert(
                title="High CPU Usage",
                message="Server-07 CPU usage at 88%",
                level=AlertLevel.WARNING,
                source="Server-07",
                target_role=UserRole.OPERATOR,
                is_read=False
            ),
            Alert(
                title="System Status",
                message="All systems operational",
                level=AlertLevel.INFO,
                source="System",
                target_role=None,
                is_read=False
            ),
        ]

        for alert in sample_alerts:
            db.add(alert)

        db.commit()
        print("Database initialized with sample data")
        print("\nDefault users created:")
        print("- admin / admin123 (Admin)")
        print("- operator / operator123 (Operator)")
        print("- tech / tech123 (Technician)")

    except Exception as e:
        print(f"Error initializing database: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    init_db()
