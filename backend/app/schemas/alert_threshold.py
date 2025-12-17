from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class AlertThresholdResponse(BaseModel):
    id: int
    cpu_warning_threshold: float
    cpu_critical_threshold: float
    temperature_warning_threshold: float
    temperature_critical_threshold: float
    ram_warning_threshold: float
    ram_critical_threshold: float
    humidity_warning_threshold: float
    humidity_critical_threshold: float
    updated_at: Optional[datetime]
    updated_by: Optional[str]

    class Config:
        from_attributes = True


class AlertThresholdUpdate(BaseModel):
    cpu_warning_threshold: Optional[float] = None
    cpu_critical_threshold: Optional[float] = None
    temperature_warning_threshold: Optional[float] = None
    temperature_critical_threshold: Optional[float] = None
    ram_warning_threshold: Optional[float] = None
    ram_critical_threshold: Optional[float] = None
    humidity_warning_threshold: Optional[float] = None
    humidity_critical_threshold: Optional[float] = None
