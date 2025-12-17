from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import date
from app.core.database import get_db
from app.core.timezone import now_warsaw
from app.models.user import User, UserRole
from app.models.scheduled_task import ScheduledTask, TaskStatus, TaskType
from app.models.task_completion_history import TaskCompletionHistory
from app.schemas.scheduled_task import (
    ScheduledTaskResponse, ScheduledTaskCreate, ScheduledTaskUpdate,
    TaskCompleteRequest, TaskCompletionHistoryResponse
)
from app.routes.auth import get_current_active_user

OPERATOR_TASK_TYPES = [TaskType.BACKUP, TaskType.RESTART, TaskType.UPDATE]
TECHNICIAN_TASK_TYPES = [TaskType.MAINTENANCE, TaskType.DIAGNOSTIC]

router = APIRouter()


def can_modify_tasks(current_user: User = Depends(get_current_active_user)) -> User:
    if current_user.role not in [UserRole.ADMIN, UserRole.OPERATOR, UserRole.TECHNICIAN]:
        raise HTTPException(
            status_code=403,
            detail="Only admins, operators, and technicians can modify tasks"
        )
    return current_user


@router.get("/", response_model=List[ScheduledTaskResponse])
def get_all_tasks(
    skip: int = 0,
    limit: int = 100,
    status: TaskStatus = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(ScheduledTask)
    if status:
        query = query.filter(ScheduledTask.status == status)

    if current_user.role == UserRole.OPERATOR:
        query = query.filter(ScheduledTask.assigned_role == UserRole.OPERATOR)
    elif current_user.role == UserRole.TECHNICIAN:
        query = query.filter(ScheduledTask.assigned_role == UserRole.TECHNICIAN)

    tasks = query.order_by(ScheduledTask.scheduled_time).offset(skip).limit(limit).all()
    return tasks


@router.get("/{task_id}", response_model=ScheduledTaskResponse)
def get_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    task = db.query(ScheduledTask).filter(ScheduledTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.post("/", response_model=ScheduledTaskResponse)
def create_task(
    task_data: ScheduledTaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(can_modify_tasks)
):
    if task_data.assigned_role and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=403,
            detail="Only admins can assign tasks to roles"
        )

    if task_data.assigned_role:
        if task_data.assigned_role == UserRole.OPERATOR and task_data.task_type not in OPERATOR_TASK_TYPES:
            raise HTTPException(
                status_code=400,
                detail=f"Task type {task_data.task_type} cannot be assigned to OPERATOR. Valid types: backup, restart, update"
            )
        if task_data.assigned_role == UserRole.TECHNICIAN and task_data.task_type not in TECHNICIAN_TASK_TYPES:
            raise HTTPException(
                status_code=400,
                detail=f"Task type {task_data.task_type} cannot be assigned to TECHNICIAN. Valid types: maintenance, diagnostic"
            )

    task = ScheduledTask(**task_data.dict(), created_by=current_user.id)
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.patch("/{task_id}", response_model=ScheduledTaskResponse)
def update_task(
    task_id: int,
    task_data: ScheduledTaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(can_modify_tasks)
):
    task = db.query(ScheduledTask).filter(ScheduledTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    update_data = task_data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(task, key, value)

    db.commit()
    db.refresh(task)
    return task


@router.delete("/{task_id}")
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(can_modify_tasks)
):
    task = db.query(ScheduledTask).filter(ScheduledTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    db.delete(task)
    db.commit()
    return {"message": "Task deleted successfully"}


@router.post("/{task_id}/execute")
def execute_task_now(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(can_modify_tasks)
):
    task = db.query(ScheduledTask).filter(ScheduledTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    task.status = TaskStatus.RUNNING
    db.commit()

    return {"message": f"Task {task.name} execution started"}


@router.post("/{task_id}/complete", response_model=ScheduledTaskResponse)
def complete_task(
    task_id: int,
    request: TaskCompleteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(can_modify_tasks)
):
    task = db.query(ScheduledTask).filter(ScheduledTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if task.assigned_role and current_user.role != UserRole.ADMIN:
        if task.assigned_role != current_user.role:
            raise HTTPException(
                status_code=403,
                detail="You can only complete tasks assigned to your role"
            )

    today = now_warsaw().date()

    if task.is_recurring:
        existing_completion = db.query(TaskCompletionHistory).filter(
            TaskCompletionHistory.task_id == task_id,
            TaskCompletionHistory.scheduled_date == today
        ).first()

        if existing_completion:
            raise HTTPException(
                status_code=400,
                detail="This recurring task has already been completed today"
            )

        completion_record = TaskCompletionHistory(
            task_id=task_id,
            completed_at=now_warsaw(),
            completed_by_user_id=current_user.id,
            completed_by_email=current_user.email,
            completion_comment=request.comment,
            scheduled_date=today
        )
        db.add(completion_record)
    else:
        task.status = TaskStatus.COMPLETED
        task.completed_at = now_warsaw()

    task.completed_by_user_id = current_user.id
    task.completed_by_email = current_user.email
    task.completion_comment = request.comment

    db.commit()
    db.refresh(task)
    return task


@router.get("/{task_id}/history", response_model=List[TaskCompletionHistoryResponse])
def get_task_history(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    task = db.query(ScheduledTask).filter(ScheduledTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    history = db.query(TaskCompletionHistory).filter(
        TaskCompletionHistory.task_id == task_id
    ).order_by(TaskCompletionHistory.completed_at.desc()).all()

    return history


@router.get("/{task_id}/can-complete-today")
def can_complete_today(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    task = db.query(ScheduledTask).filter(ScheduledTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if not task.is_recurring:
        return {"can_complete": task.status != TaskStatus.COMPLETED}

    today = now_warsaw().date()
    existing_completion = db.query(TaskCompletionHistory).filter(
        TaskCompletionHistory.task_id == task_id,
        TaskCompletionHistory.scheduled_date == today
    ).first()

    return {"can_complete": existing_completion is None}
