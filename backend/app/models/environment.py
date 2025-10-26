from sqlalchemy import Column, Integer, Float, Boolean, DateTime
from sqlalchemy.sql import func
from app.core.database import Base


class Environment(Base):
    __tablename__ = "environment"

    id = Column(Integer, primary_key=True, index=True)
    room_temperature = Column(Float, default=22.0)  # celsius
    humidity = Column(Float, default=45.0)  # percentage
    ac_status = Column(Boolean, default=True)  # air conditioning on/off
    ac_target_temp = Column(Float, default=20.0)  # target temperature
    ups_battery = Column(Float, default=100.0)  # percentage
    ups_on_battery = Column(Boolean, default=False)  # is UPS running on battery
    power_consumption = Column(Float, default=0.0)  # kW
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
