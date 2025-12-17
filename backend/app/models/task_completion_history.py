from sqlalchemy import Column, Integer, String, DateTime, Date, ForeignKey, Index
from sqlalchemy.sql import func
from app.core.database import Base


class TaskCompletionHistory(Base):
    __tablename__ = "task_completion_history"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("scheduled_tasks.id", ondelete="CASCADE"), nullable=False)
    completed_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    completed_by_email = Column(String, nullable=False)
    completion_comment = Column(String, nullable=True)
    scheduled_date = Column(Date, nullable=False)

    __table_args__ = (
        Index('ix_task_completion_task_date', 'task_id', 'scheduled_date'),
    )
