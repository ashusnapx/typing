from pydantic import field_validator
from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    APP_NAME: str = "Maths Mania - SSC Typing Platform"
    DEBUG: bool = False

    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/mathsmania"
    DATABASE_URL_SYNC: str = "postgresql://postgres:postgres@localhost:5432/mathsmania"
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_CLUSTER_NODES: List[str] = ["redis-node-0:6379", "redis-node-1:6379"]

    KAFKA_BOOTSTRAP_SERVERS: str = "localhost:9092"
    KAFKA_TYPING_EVENTS_TOPIC: str = "typing-events"
    KAFKA_ANALYTICS_TOPIC: str = "typing-analytics"

    CLERK_SECRET_KEY: str = ""
    CLERK_PUBLISHABLE_KEY: str = ""
    JWT_SECRET: str = ""
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRY_HOURS: int = 2
    JWT_REFRESH_EXPIRY_DAYS: int = 7

    R2_ACCESS_KEY: str = ""
    R2_SECRET_KEY: str = ""
    R2_BUCKET_NAME: str = "maths-mania-passages"
    R2_PUBLIC_URL: str = "https://r2.mathsmania.com"

    VOYAGE_API_KEY: str = ""

    CORS_ORIGINS: List[str] = ["http://localhost:3000", "https://mathsmania.com"]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            return [x.strip() for x in v.split(",")]
        return v

    PROMETHEUS_METRICS_PORT: int = 9090

    OPENTELEMETRY_ENABLED: bool = True
    OTEL_SERVICE_NAME: str = "mathsmania-backend"
    OTEL_EXPORTER_OTLP_ENDPOINT: str = "http://localhost:4317"

    @field_validator("JWT_SECRET", mode="after")
    @classmethod
    def validate_jwt_secret(cls, v):
        if not v or len(v) < 32:
            secret = os.environ.get("JWT_SECRET")
            if not secret or len(secret) < 32:
                raise ValueError(
                    "JWT_SECRET must be at least 32 characters long and set via environment variable. "
                    "Generate one with: python -c \"import secrets; print(secrets.token_hex(32))\""
                )
        return v

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
