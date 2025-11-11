from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc
from app.core.database import get_db
from app.routes.auth import get_current_active_user
from app.models import User, ServerMetricsHistory, Server
from app.schemas.server_metrics_history import ServerMetricsHistoryResponse
from app.core.timezone import now_warsaw
from datetime import timedelta
from typing import List, Optional

router = APIRouter()


@router.get("/servers/{server_id}/history", response_model=List[ServerMetricsHistoryResponse])
def get_server_metrics_history(
    server_id: int,
    hours: float = Query(default=1, ge=0.1, le=168),
    limit: int = Query(default=100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    server = db.query(Server).filter(Server.id == server_id).first()
    if not server:
        raise HTTPException(status_code=404, detail="Server not found")

    time_threshold = now_warsaw() - timedelta(hours=hours)

    history = db.query(ServerMetricsHistory).filter(
        and_(
            ServerMetricsHistory.server_id == server_id,
            ServerMetricsHistory.timestamp >= time_threshold
        )
    ).order_by(desc(ServerMetricsHistory.timestamp)).limit(limit).all()

    return history


@router.get("/servers/{server_id}/history/latest", response_model=ServerMetricsHistoryResponse)
def get_latest_metrics(
    server_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    server = db.query(Server).filter(Server.id == server_id).first()
    if not server:
        raise HTTPException(status_code=404, detail="Server not found")

    latest = db.query(ServerMetricsHistory).filter(
        ServerMetricsHistory.server_id == server_id
    ).order_by(desc(ServerMetricsHistory.timestamp)).first()

    if not latest:
        raise HTTPException(status_code=404, detail="No metrics history found")

    return latest


@router.delete("/servers/{server_id}/history")
def clear_server_metrics_history(
    server_id: int,
    older_than_hours: Optional[int] = Query(default=None, ge=1),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    from app.models import UserRole

    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    server = db.query(Server).filter(Server.id == server_id).first()
    if not server:
        raise HTTPException(status_code=404, detail="Server not found")

    if older_than_hours:
        time_threshold = now_warsaw() - timedelta(hours=older_than_hours)
        deleted_count = db.query(ServerMetricsHistory).filter(
            and_(
                ServerMetricsHistory.server_id == server_id,
                ServerMetricsHistory.timestamp < time_threshold
            )
        ).delete()
    else:
        deleted_count = db.query(ServerMetricsHistory).filter(
            ServerMetricsHistory.server_id == server_id
        ).delete()

    db.commit()

    return {
        "message": f"Deleted {deleted_count} history records for server {server.name}",
        "deleted_count": deleted_count
    }
