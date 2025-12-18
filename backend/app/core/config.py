from pydantic_settings import BaseSettings
from typing import Optional
import os

os.environ['TZ'] = 'Europe/Warsaw'


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://serwerownia:serwerownia123@postgres:5432/serwerownia"
    REDIS_URL: str = "redis://redis:6379"
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    BACKEND_CORS_ORIGINS: list = ["http://localhost:5173"]
    TIMEZONE: str = "Europe/Warsaw"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
