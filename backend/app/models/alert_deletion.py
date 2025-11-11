from sqlalchemy import Column, Integer, DateTime, ForeignKey, String
from sqlalchemy.sql import func
from app.core.database import Base


class AlertDeletion(Base):
    __tablename__ = "alert_deletions"

    id = Column(Integer, primary_key=True, index=True)
    alert_id = Column(Integer, nullable=False, index=True)
    deleted_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    deleted_by_email = Column(String, nullable=False)
    deleted_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    
    alert_title = Column(String, nullable=False)
    alert_message = Column(String, nullable=False)
    alert_level = Column(String(20), nullable=False)
    alert_source = Column(String, nullable=True)
