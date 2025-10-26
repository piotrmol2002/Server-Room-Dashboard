from pydantic import BaseModel
from datetime import datetime


class ServerMetricsHistoryBase(BaseModel):
    server_id: int
    cpu_usage: float
    ram_usage: float
    temperature: float
    uptime: int
    status: str


class ServerMetricsHistoryCreate(ServerMetricsHistoryBase):
    pass


class ServerMetricsHistoryResponse(ServerMetricsHistoryBase):
    id: int
    timestamp: datetime

    class Config:
        from_attributes = True
