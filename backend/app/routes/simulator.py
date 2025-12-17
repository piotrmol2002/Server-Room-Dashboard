from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.routes.auth import get_current_active_user
from app.models import User, Server, UserRole, StressTestLog, ServerBaseline
from app.core.timezone import now_warsaw
from pydantic import BaseModel

router = APIRouter()


class ServerControlRequest(BaseModel):
    online: bool


class LoadBaselineRequest(BaseModel):
    cpu_baseline: float
    ram_baseline: float


class StressTestRequest(BaseModel):
    duration_seconds: int = 60
    intensity: float = 1.0


@router.post("/servers/{server_id}/power", status_code=200)
def control_server_power(
    server_id: int,
    request: ServerControlRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    server = db.query(Server).filter(Server.id == server_id).first()
    if not server:
        raise HTTPException(status_code=404, detail="Server not found")

    new_status = "online" if request.online else "offline"
    server.status = new_status

    if not request.online:
        server.cpu_usage = 0.0
        server.ram_usage = 0.0
        server.uptime = 0

    db.commit()
    db.refresh(server)

    return {
        "message": f"Server {server.name} turned {'on' if request.online else 'off'}",
        "server": {
            "id": server.id,
            "name": server.name,
            "status": server.status
        }
    }


@router.post("/servers/{server_id}/baseline", status_code=200)
def set_load_baseline(
    server_id: int,
    request: LoadBaselineRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if current_user.role not in [UserRole.ADMIN, UserRole.OPERATOR]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )

    server = db.query(Server).filter(Server.id == server_id).first()
    if not server:
        raise HTTPException(status_code=404, detail="Server not found")

    baseline = db.query(ServerBaseline).filter(ServerBaseline.server_id == server_id).first()
    if not baseline:
        baseline = ServerBaseline(
            server_id=server_id,
            cpu_baseline=request.cpu_baseline,
            ram_baseline=request.ram_baseline,
            updated_by_user_id=current_user.id,
            updated_by_email=current_user.email
        )
        db.add(baseline)
    else:
        baseline.cpu_baseline = request.cpu_baseline
        baseline.ram_baseline = request.ram_baseline
        baseline.updated_by_user_id = current_user.id
        baseline.updated_by_email = current_user.email

    db.commit()
    db.refresh(baseline)

    return {
        "message": f"Load baseline set for {server.name}",
        "cpu_baseline": request.cpu_baseline,
        "ram_baseline": request.ram_baseline
    }


@router.post("/servers/{server_id}/stress-test", status_code=200)
def trigger_stress_test(
    server_id: int,
    request: StressTestRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if current_user.role not in [UserRole.ADMIN, UserRole.OPERATOR]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )

    server = db.query(Server).filter(Server.id == server_id).first()
    if not server:
        raise HTTPException(status_code=404, detail="Server not found")

    if server.status != "online":
        raise HTTPException(
            status_code=400,
            detail="Cannot stress test offline server"
        )

    active_test = db.query(StressTestLog).filter(
        StressTestLog.server_id == server_id,
        StressTestLog.status == "running"
    ).first()

    if active_test:
        raise HTTPException(
            status_code=400,
            detail="Stress test already running on this server"
        )

    stress_log = StressTestLog(
        server_id=server_id,
        started_at=now_warsaw(),
        duration_seconds=request.duration_seconds,
        intensity=request.intensity,
        started_by_user_id=current_user.id,
        started_by_email=current_user.email,
        status="running",
        baseline_cpu_before=server.cpu_usage,
        baseline_ram_before=server.ram_usage
    )
    db.add(stress_log)
    db.commit()
    db.refresh(stress_log)

    return {
        "message": f"Stress test initiated for {server.name}",
        "test_id": stress_log.id,
        "duration_seconds": request.duration_seconds,
        "intensity": request.intensity,
        "note": "Worker will execute stress test on next simulation tick"
    }


@router.get("/servers/{server_id}/state")
def get_server_simulation_state(
    server_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    server = db.query(Server).filter(Server.id == server_id).first()
    if not server:
        raise HTTPException(status_code=404, detail="Server not found")

    active_stress_test = db.query(StressTestLog).filter(
        StressTestLog.server_id == server_id,
        StressTestLog.status == "running"
    ).first()

    baseline = db.query(ServerBaseline).filter(ServerBaseline.server_id == server_id).first()

    return {
        "server_id": server.id,
        "name": server.name,
        "status": server.status,
        "current_metrics": {
            "cpu_usage": server.cpu_usage,
            "ram_usage": server.ram_usage,
            "temperature": server.temperature,
            "uptime": server.uptime
        },
        "baseline": {
            "cpu_baseline": baseline.cpu_baseline,
            "ram_baseline": baseline.ram_baseline
        } if baseline else None,
        "active_stress_test": {
            "test_id": active_stress_test.id,
            "started_at": active_stress_test.started_at.isoformat(),
            "duration_seconds": active_stress_test.duration_seconds,
            "intensity": active_stress_test.intensity,
            "started_by": active_stress_test.started_by_email
        } if active_stress_test else None
    }


@router.get("/servers/{server_id}/stress-tests")
def get_stress_test_history(
    server_id: int,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    server = db.query(Server).filter(Server.id == server_id).first()
    if not server:
        raise HTTPException(status_code=404, detail="Server not found")

    tests = db.query(StressTestLog).filter(
        StressTestLog.server_id == server_id
    ).order_by(StressTestLog.started_at.desc()).limit(limit).all()

    return {
        "server_id": server_id,
        "tests": [
            {
                "id": t.id,
                "started_at": t.started_at.isoformat(),
                "completed_at": t.completed_at.isoformat() if t.completed_at else None,
                "duration_seconds": t.duration_seconds,
                "intensity": t.intensity,
                "status": t.status,
                "started_by": t.started_by_email,
                "max_cpu": t.max_cpu_reached,
                "max_ram": t.max_ram_reached,
                "max_temp": t.max_temp_reached
            }
            for t in tests
        ]
    }
