from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.alert import AlertLevel


class AlertCreate(BaseModel):
    title: str
    message: str
    level: AlertLevel
    source: Optional[str] = None


class AlertResponse(BaseModel):
    id: int
    title: str
    message: str
    level: AlertLevel
    source: Optional[str]
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True
