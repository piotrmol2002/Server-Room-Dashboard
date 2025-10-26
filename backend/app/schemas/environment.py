from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class EnvironmentUpdate(BaseModel):
    room_temperature: Optional[float] = None
    humidity: Optional[float] = None
    ac_status: Optional[bool] = None
    ac_target_temp: Optional[float] = None
    ups_battery: Optional[float] = None
    ups_on_battery: Optional[bool] = None
    power_consumption: Optional[float] = None


class EnvironmentResponse(BaseModel):
    id: int
    room_temperature: float
    humidity: float
    ac_status: bool
    ac_target_temp: float
    ups_battery: float
    ups_on_battery: bool
    power_consumption: float
    updated_at: datetime

    class Config:
        from_attributes = True
