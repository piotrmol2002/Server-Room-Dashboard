from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Enum
from sqlalchemy.sql import func
import enum
from app.core.database import Base


class ServerStatus(str, enum.Enum):
    ONLINE = "online"
    OFFLINE = "offline"
    MAINTENANCE = "maintenance"
    ERROR = "error"


class Server(Base):
    __tablename__ = "servers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    ip_address = Column(String, nullable=True)
    status = Column(Enum(ServerStatus), default=ServerStatus.OFFLINE, nullable=False)
    cpu_usage = Column(Float, default=0.0)  # percentage
    ram_usage = Column(Float, default=0.0)  # percentage
    temperature = Column(Float, default=25.0)  # celsius
    uptime = Column(Integer, default=0)  # seconds
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
