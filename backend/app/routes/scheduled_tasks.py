from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.user import User, UserRole
from app.models.scheduled_task import ScheduledTask, TaskStatus
from app.schemas.scheduled_task import ScheduledTaskResponse, ScheduledTaskCreate, ScheduledTaskUpdate
from app.routes.auth import get_current_active_user

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
