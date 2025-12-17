from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User, UserRole
from app.models.environment import Environment
from app.schemas.environment import EnvironmentResponse, EnvironmentUpdate
from app.routes.auth import get_current_active_user

router = APIRouter()


def can_modify_environment(current_user: User = Depends(get_current_active_user)) -> User:
    if current_user.role not in [UserRole.ADMIN, UserRole.OPERATOR, UserRole.TECHNICIAN]:
        raise HTTPException(
            status_code=403,
            detail="Only admins, operators and technicians can modify environment settings"
        )
    return current_user


@router.get("/", response_model=EnvironmentResponse)
def get_environment(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    env = db.query(Environment).first()
    if not env:
        env = Environment()
        db.add(env)
        db.commit()
        db.refresh(env)
    return env


@router.patch("/", response_model=EnvironmentResponse)
def update_environment(
    env_data: EnvironmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(can_modify_environment)
):
    env = db.query(Environment).first()
    if not env:
        env = Environment()
        db.add(env)

    update_data = env_data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(env, key, value)

    db.commit()
    db.refresh(env)
    return env
