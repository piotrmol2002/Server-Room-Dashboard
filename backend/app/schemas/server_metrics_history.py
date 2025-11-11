from pydantic import BaseModel, field_serializer
from datetime import datetime
from app.core.timezone import to_warsaw


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

    @field_serializer('timestamp')
    def serialize_timestamp(self, dt: datetime, _info):
        warsaw_dt = to_warsaw(dt)
        return warsaw_dt.isoformat()

    class Config:
        from_attributes = True
