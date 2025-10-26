from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.server import ServerStatus


class ServerBase(BaseModel):
    name: str
    ip_address: Optional[str] = None


class ServerCreate(ServerBase):
    pass


class ServerUpdate(BaseModel):
    name: Optional[str] = None
    ip_address: Optional[str] = None
    status: Optional[ServerStatus] = None
    cpu_usage: Optional[float] = None
    ram_usage: Optional[float] = None
    temperature: Optional[float] = None


class ServerResponse(ServerBase):
    id: int
    status: ServerStatus
    cpu_usage: float
    ram_usage: float
    temperature: float
    uptime: int
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True
