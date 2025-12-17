from sqlalchemy import Column, Integer, String, DateTime, Enum, Boolean, ForeignKey
from sqlalchemy.sql import func
import enum
from app.core.database import Base
from app.models.user import UserRole


class TaskType(str, enum.Enum):
    BACKUP = "backup"
    RESTART = "restart"
    MAINTENANCE = "maintenance"
    DIAGNOSTIC = "diagnostic"
    UPDATE = "update"


class TaskStatus(str, enum.Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class ScheduledTask(Base):
    __tablename__ = "scheduled_tasks"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    task_type = Column(Enum(TaskType), nullable=False)
    status = Column(Enum(TaskStatus), default=TaskStatus.PENDING, nullable=False)
    target_server = Column(String, nullable=True)  # server name or "all"
    scheduled_time = Column(DateTime(timezone=True), nullable=False)
    executed_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    is_recurring = Column(Boolean, default=False)
    recurrence_pattern = Column(String, nullable=True)  # e.g., "daily", "weekly", "monthly"
    assigned_role = Column(Enum(UserRole), nullable=True)  # operator or technician
    created_by = Column(Integer, nullable=True)  # user_id
    completed_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    completed_by_email = Column(String, nullable=True)
    completion_comment = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
