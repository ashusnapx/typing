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
    JWT_SECRET: str = "super-secret-jwt-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRY_HOURS: int = 24

    R2_ACCESS_KEY: str = ""
    R2_SECRET_KEY: str = ""
    R2_BUCKET_NAME: str = "maths-mania-passages"
    R2_PUBLIC_URL: str = "https://r2.mathsmania.com"

    VOYAGE_API_KEY: str = ""

    CORS_ORIGINS: List[str] = ["http://localhost:3000", "https://mathsmania.com"]

    PROMETHEUS_METRICS_PORT: int = 9090

    OPENTELEMETRY_ENABLED: bool = True
    OTEL_SERVICE_NAME: str = "mathsmania-backend"
    OTEL_EXPORTER_OTLP_ENDPOINT: str = "http://localhost:4317"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
