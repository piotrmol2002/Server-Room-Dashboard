from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.scheduled_task import TaskType, TaskStatus


class ScheduledTaskCreate(BaseModel):
    name: str
    description: Optional[str] = None
    task_type: TaskType
    target_server: Optional[str] = None
    scheduled_time: datetime
    is_recurring: bool = False
    recurrence_pattern: Optional[str] = None


class ScheduledTaskUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    scheduled_time: Optional[datetime] = None
    is_recurring: Optional[bool] = None
    recurrence_pattern: Optional[str] = None


class ScheduledTaskResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    task_type: TaskType
    status: TaskStatus
    target_server: Optional[str]
    scheduled_time: datetime
    executed_at: Optional[datetime]
    completed_at: Optional[datetime]
    is_recurring: bool
    recurrence_pattern: Optional[str]
    created_by: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True
