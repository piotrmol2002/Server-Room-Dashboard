from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date
from app.models.scheduled_task import TaskType, TaskStatus
from app.models.user import UserRole


class ScheduledTaskCreate(BaseModel):
    name: str
    description: Optional[str] = None
    task_type: TaskType
    target_server: Optional[str] = None
    scheduled_time: datetime
    is_recurring: bool = False
    recurrence_pattern: Optional[str] = None
    recurrence_days: Optional[int] = None
    assigned_role: Optional[UserRole] = None


class ScheduledTaskUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    scheduled_time: Optional[datetime] = None
    is_recurring: Optional[bool] = None
    recurrence_pattern: Optional[str] = None
    recurrence_days: Optional[int] = None
    assigned_role: Optional[UserRole] = None


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
    recurrence_days: Optional[int]
    assigned_role: Optional[UserRole]
    created_by: Optional[int]
    completed_by_email: Optional[str]
    completion_comment: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class TaskCompleteRequest(BaseModel):
    comment: Optional[str] = None


class TaskCompletionHistoryResponse(BaseModel):
    id: int
    task_id: int
    completed_at: datetime
    completed_by_email: str
    completion_comment: Optional[str]
    scheduled_date: date

    class Config:
        from_attributes = True
