from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.user import User, UserRole
from app.models.server import Server
from app.schemas.server import ServerResponse, ServerCreate, ServerUpdate
from app.routes.auth import get_current_active_user

router = APIRouter()


def can_modify_servers(current_user: User = Depends(get_current_active_user)) -> User:
    if current_user.role not in [UserRole.ADMIN, UserRole.OPERATOR]:
        raise HTTPException(
            status_code=403,
            detail="Only admins and operators can modify servers"
        )
    return current_user


@router.get("/", response_model=List[ServerResponse])
def get_all_servers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    servers = db.query(Server).order_by(Server.id).all()
    return servers


@router.get("/{server_id}", response_model=ServerResponse)
def get_server(
    server_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    server = db.query(Server).filter(Server.id == server_id).first()
    if not server:
        raise HTTPException(status_code=404, detail="Server not found")
    return server


@router.post("/", response_model=ServerResponse)
def create_server(
    server_data: ServerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(can_modify_servers)
):
    server = Server(**server_data.dict())
    db.add(server)
    db.commit()
    db.refresh(server)
    return server


@router.patch("/{server_id}", response_model=ServerResponse)
def update_server(
    server_id: int,
    server_data: ServerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(can_modify_servers)
):
    server = db.query(Server).filter(Server.id == server_id).first()
    if not server:
        raise HTTPException(status_code=404, detail="Server not found")

    update_data = server_data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(server, key, value)

    db.commit()
    db.refresh(server)
    return server


@router.delete("/{server_id}")
def delete_server(
    server_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(can_modify_servers)
):
    server = db.query(Server).filter(Server.id == server_id).first()
    if not server:
        raise HTTPException(status_code=404, detail="Server not found")

    db.delete(server)
    db.commit()
    return {"message": "Server deleted successfully"}


@router.post("/{server_id}/restart")
def restart_server(
    server_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(can_modify_servers)
):
    server = db.query(Server).filter(Server.id == server_id).first()
    if not server:
        raise HTTPException(status_code=404, detail="Server not found")

    server.uptime = 0
    db.commit()

    return {"message": f"Server {server.name} restart initiated"}
