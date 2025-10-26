from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models import User, Server, UserRole
from pydantic import BaseModel
from typing import Optional
import httpx

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
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in [UserRole.ADMIN, UserRole.OPERATOR]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )

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
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in [UserRole.ADMIN, UserRole.OPERATOR]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )

    server = db.query(Server).filter(Server.id == server_id).first()
    if not server:
        raise HTTPException(status_code=404, detail="Server not found")

    return {
        "message": f"Load baseline set for {server.name}",
        "cpu_baseline": request.cpu_baseline,
        "ram_baseline": request.ram_baseline,
        "note": "Worker will apply this on next simulation tick"
    }


@router.post("/servers/{server_id}/stress-test", status_code=200)
def trigger_stress_test(
    server_id: int,
    request: StressTestRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
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

    return {
        "message": f"Stress test initiated for {server.name}",
        "duration_seconds": request.duration_seconds,
        "intensity": request.intensity,
        "note": "Worker will execute stress test on next simulation tick"
    }


@router.get("/servers/{server_id}/state")
def get_server_simulation_state(
    server_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    server = db.query(Server).filter(Server.id == server_id).first()
    if not server:
        raise HTTPException(status_code=404, detail="Server not found")

    return {
        "server_id": server.id,
        "name": server.name,
        "status": server.status,
        "current_metrics": {
            "cpu_usage": server.cpu_usage,
            "ram_usage": server.ram_usage,
            "temperature": server.temperature,
            "uptime": server.uptime
        }
    }
