from sqlalchemy import Column, Integer, String, DateTime, Enum, Boolean, ForeignKey
from sqlalchemy.sql import func
import enum
from app.core.database import Base


class AlertLevel(str, enum.Enum):
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    OPERATOR = "operator"
    TECHNICIAN = "technician"


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    message = Column(String, nullable=False)
    level = Column(Enum(AlertLevel), default=AlertLevel.INFO, nullable=False)
    source = Column(String, nullable=True)
    target_role = Column(Enum(UserRole), nullable=True)
    is_read = Column(Boolean, default=False)
    read_at = Column(DateTime(timezone=True), nullable=True)
    read_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    read_by_email = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
