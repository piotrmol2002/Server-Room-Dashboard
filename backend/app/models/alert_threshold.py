from sqlalchemy import Column, Integer, Float, DateTime, String
from sqlalchemy.sql import func
from app.core.database import Base


class AlertThreshold(Base):
    __tablename__ = "alert_thresholds"

    id = Column(Integer, primary_key=True, index=True)

    # CPU
    cpu_warning_threshold = Column(Float, default=85.0, nullable=False)
    cpu_critical_threshold = Column(Float, default=95.0, nullable=False)

    # Temperature
    temperature_warning_threshold = Column(Float, default=70.0, nullable=False)
    temperature_critical_threshold = Column(Float, default=80.0, nullable=False)

    # RAM
    ram_warning_threshold = Column(Float, default=85.0, nullable=False)
    ram_critical_threshold = Column(Float, default=95.0, nullable=False)

    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    updated_by = Column(String, nullable=True)
