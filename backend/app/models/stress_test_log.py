from sqlalchemy import Column, Integer, Float, DateTime, String, Boolean, ForeignKey
from sqlalchemy.sql import func
from app.core.database import Base


class StressTestLog(Base):
    __tablename__ = "stress_test_logs"

    id = Column(Integer, primary_key=True, index=True)
    server_id = Column(Integer, ForeignKey("servers.id", ondelete="CASCADE"), nullable=False, index=True)
    
    started_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    duration_seconds = Column(Integer, nullable=False)
    intensity = Column(Float, nullable=False)
    
    started_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    started_by_email = Column(String, nullable=False)
    
    status = Column(String(20), nullable=False, default="running")
    
    baseline_cpu_before = Column(Float, nullable=True)
    baseline_ram_before = Column(Float, nullable=True)
    max_cpu_reached = Column(Float, nullable=True)
    max_ram_reached = Column(Float, nullable=True)
    max_temp_reached = Column(Float, nullable=True)
