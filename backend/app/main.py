from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base
from app.core.init_data import init_db
from app.routes import (
    auth, users, servers, environment, alerts, scheduled_tasks,
    websocket, simulator, metrics_history, alert_thresholds
)

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Serwerownia API",
    description="API for server room management system",
    version="1.0.0"
)


@app.on_event("startup")
async def startup_event():
    init_db()

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(servers.router, prefix="/api/servers", tags=["Servers"])
app.include_router(environment.router, prefix="/api/environment", tags=["Environment"])
app.include_router(alert_thresholds.router, prefix="/api/alerts", tags=["Alert Thresholds"])
app.include_router(alerts.router, prefix="/api/alerts", tags=["Alerts"])
app.include_router(scheduled_tasks.router, prefix="/api/tasks", tags=["Scheduled Tasks"])
app.include_router(websocket.router, prefix="/ws", tags=["WebSocket"])
app.include_router(simulator.router, prefix="/api/simulator", tags=["Simulator Control"])
app.include_router(metrics_history.router, prefix="/api/metrics", tags=["Metrics History"])


@app.get("/")
async def root():
    return {"message": "Serwerownia API", "status": "running"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
