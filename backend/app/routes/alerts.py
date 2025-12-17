from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from typing import List
from app.core.database import get_db
from app.models.user import User, UserRole
from app.models.alert import Alert
from app.models.alert_deletion import AlertDeletion
from app.schemas.alert import AlertResponse, AlertCreate, AlertLogResponse
from app.routes.auth import get_current_active_user
from app.core.timezone import now_warsaw

router = APIRouter()


@router.get("/", response_model=List[AlertResponse])
def get_all_alerts(
    skip: int = 0,
    limit: int = 100,
    unread_only: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(Alert)

    if unread_only:
        query = query.filter(Alert.is_read == False)

    if current_user.role != UserRole.ADMIN:
        query = query.filter(
            or_(
                Alert.target_role == current_user.role,
                Alert.target_role == None
            )
        )

    alerts = query.order_by(Alert.created_at.desc()).offset(skip).limit(limit).all()
    return alerts


@router.get("/{alert_id}", response_model=AlertResponse)
def get_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert


@router.patch("/{alert_id}/read", response_model=AlertResponse)
def mark_alert_read(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.is_read = True
    alert.read_at = now_warsaw()
    alert.read_by_user_id = current_user.id
    alert.read_by_email = current_user.email
    db.commit()
    db.refresh(alert)
    return alert


@router.post("/mark-all-read")
def mark_all_alerts_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(Alert).filter(Alert.is_read == False)

    if current_user.role != UserRole.ADMIN:
        query = query.filter(
            or_(
                Alert.target_role == current_user.role,
                Alert.target_role == None
            )
        )

    alerts = query.all()
    count = len(alerts)

    for alert in alerts:
        alert.is_read = True
        alert.read_at = now_warsaw()
        alert.read_by_user_id = current_user.id
        alert.read_by_email = current_user.email

    db.commit()
    return {"message": f"Marked {count} alerts as read"}


@router.delete("/{alert_id}")
def delete_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    deletion_record = AlertDeletion(
        alert_id=alert.id,
        deleted_by_user_id=current_user.id,
        deleted_by_email=current_user.email,
        deleted_at=now_warsaw(),
        alert_title=alert.title,
        alert_message=alert.message,
        alert_level=alert.level.value,
        alert_source=alert.source
    )
    db.add(deletion_record)

    db.delete(alert)
    db.commit()
    return {"message": "Alert deleted successfully"}


@router.get("/logs/history", response_model=List[AlertLogResponse])
def get_alert_logs(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only admins can view alert logs")

    alerts = db.query(Alert).order_by(desc(Alert.created_at)).offset(skip).limit(limit).all()

    deleted_alerts = db.query(AlertDeletion).order_by(desc(AlertDeletion.deleted_at)).offset(skip).limit(limit).all()

    result = []

    for alert in alerts:
        result.append(AlertLogResponse(
            id=alert.id,
            title=alert.title,
            message=alert.message,
            level=alert.level,
            source=alert.source,
            target_role=alert.target_role,
            is_read=alert.is_read,
            read_at=alert.read_at,
            read_by_email=alert.read_by_email,
            created_at=alert.created_at,
            deleted_at=None,
            deleted_by_email=None
        ))

    for deleted in deleted_alerts:
        result.append(AlertLogResponse(
            id=deleted.alert_id,
            title=deleted.alert_title,
            message=deleted.alert_message,
            level=deleted.alert_level,
            source=deleted.alert_source,
            target_role=None,
            is_read=True,
            read_at=None,
            read_by_email=None,
            created_at=deleted.deleted_at,
            deleted_at=deleted.deleted_at,
            deleted_by_email=deleted.deleted_by_email
        ))

    result.sort(key=lambda x: x.created_at, reverse=True)

    return result[:limit]
