from sqlalchemy import Column, Integer, Float, DateTime, String, ForeignKey
from sqlalchemy.sql import func
from app.core.database import Base


class ServerBaseline(Base):
    __tablename__ = "server_baselines"

    id = Column(Integer, primary_key=True, index=True)
    server_id = Column(Integer, ForeignKey("servers.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)

    cpu_baseline = Column(Float, nullable=False, default=30.0)
    ram_baseline = Column(Float, nullable=False, default=40.0)

    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())
    updated_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    updated_by_email = Column(String, nullable=True)
