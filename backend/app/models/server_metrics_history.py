from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey, String
from sqlalchemy.sql import func
from app.core.database import Base


class ServerMetricsHistory(Base):
    __tablename__ = "server_metrics_history"

    id = Column(Integer, primary_key=True, index=True)
    server_id = Column(Integer, ForeignKey("servers.id", ondelete="CASCADE"), nullable=False, index=True)
    timestamp = Column(DateTime, nullable=False, default=func.now(), index=True)

    cpu_usage = Column(Float, nullable=False, default=0.0)
    ram_usage = Column(Float, nullable=False, default=0.0)
    temperature = Column(Float, nullable=False, default=22.0)
    uptime = Column(Integer, nullable=False, default=0)
    status = Column(String(20), nullable=False, default="offline")
