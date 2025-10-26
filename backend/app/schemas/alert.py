from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.alert import AlertLevel
from app.models.user import UserRole


class AlertCreate(BaseModel):
    title: str
    message: str
    level: AlertLevel
    source: Optional[str] = None
    target_role: Optional[UserRole] = None


class AlertResponse(BaseModel):
    id: int
    title: str
    message: str
    level: AlertLevel
    source: Optional[str]
    target_role: Optional[UserRole]
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True
