from sqlalchemy.orm import Session
from app.models import Server, Environment, ServerStatus, User, UserRole
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

        servers = [
            Server(name=f"Server-{i:02d}", ip_address=f"192.168.1.{100+i}",
                   status=ServerStatus.ONLINE if i % 4 != 0 else ServerStatus.OFFLINE,
                   cpu_usage=30.0 + (i * 5), ram_usage=40.0 + (i * 3),
                   temperature=35.0 + (i * 2), uptime=86400 * i)
            for i in range(1, 13)
        ]

        for server in servers:
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
                email="monitor@serwerownia.pl",
                username="monitor",
                full_name="Monitor User",
                hashed_password=get_password_hash("monitor123"),
                role=UserRole.MONITOR,
                is_active=True
            ),
            User(
                email="technik@serwerownia.pl",
                username="technik",
                full_name="Technik User",
                hashed_password=get_password_hash("technik123"),
                role=UserRole.TECHNIK,
                is_active=True
            ),
        ]

        for user in sample_users:
            db.add(user)

        db.commit()
        print("Database initialized with sample data")
        print("\nDefault users created:")
        print("- admin / admin123 (Admin)")
        print("- operator / operator123 (Operator)")
        print("- monitor / monitor123 (Monitor)")
        print("- technik / technik123 (Technik)")

    except Exception as e:
        print(f"Error initializing database: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    init_db()
