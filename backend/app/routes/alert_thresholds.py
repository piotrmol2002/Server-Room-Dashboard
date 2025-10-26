from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel
from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models import AlertThreshold, User, UserRole

router = APIRouter()


class AlertThresholdUpdate(BaseModel):
    cpu_warning_threshold: Optional[float] = None
    cpu_critical_threshold: Optional[float] = None
    temperature_warning_threshold: Optional[float] = None
    temperature_critical_threshold: Optional[float] = None
    ram_warning_threshold: Optional[float] = None
    ram_critical_threshold: Optional[float] = None


class AlertThresholdResponse(BaseModel):
    id: int
    cpu_warning_threshold: float
    cpu_critical_threshold: float
    temperature_warning_threshold: float
    temperature_critical_threshold: float
    ram_warning_threshold: float
    ram_critical_threshold: float
    updated_by: Optional[str]

    class Config:
        from_attributes = True


@router.get("/thresholds", response_model=AlertThresholdResponse)
def get_alert_thresholds(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    thresholds = db.query(AlertThreshold).first()

    if not thresholds:
        thresholds = AlertThreshold()
        db.add(thresholds)
        db.commit()
        db.refresh(thresholds)

    return thresholds


@router.put("/thresholds", response_model=AlertThresholdResponse)
def update_alert_thresholds(
    updates: AlertThresholdUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only admins can update thresholds")

    thresholds = db.query(AlertThreshold).first()

    if not thresholds:
        thresholds = AlertThreshold()
        db.add(thresholds)

    update_data = updates.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(thresholds, field, value)

    thresholds.updated_by = current_user.email

    db.commit()
    db.refresh(thresholds)

    return thresholds
