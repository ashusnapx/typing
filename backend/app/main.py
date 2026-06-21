import time
import logging
import hashlib

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.v1 import router as v1_router
from app.core.monitoring import setup_monitoring
from app.core.middleware import SecurityHeadersMiddleware, RateLimitMiddleware, RequestValidationMiddleware, CorrelationIDMiddleware, CSRFProtectMiddleware

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("security")

app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    docs_url="/api/docs" if settings.DEBUG else None,
    redoc_url="/api/redoc" if settings.DEBUG else None,
    openapi_url="/api/openapi.json" if settings.DEBUG else None,
)

app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RequestValidationMiddleware)
app.add_middleware(RateLimitMiddleware)
app.add_middleware(CorrelationIDMiddleware)
app.add_middleware(CSRFProtectMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Correlation-ID", "X-Request-ID"],
    expose_headers=["X-Process-Time", "X-Correlation-ID"],
    max_age=600,
)

if settings.OPENTELEMETRY_ENABLED:
    setup_monitoring(app)

app.include_router(v1_router, prefix="/api/v1")


@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response


@app.middleware("http")
async def log_requests(request: Request, call_next):
    response = await call_next(request)
    if response.status_code >= 400:
        raw_ip = request.client.host if request.client else "unknown"
        hashed_ip = hashlib.sha256(raw_ip.encode()).hexdigest()[:16] if raw_ip != "unknown" else "unknown"
        logger.warning(
            "status=%d method=%s path=%s ip_hash=%s",
            response.status_code, request.method, request.url.path,
            hashed_ip
        )
    return response


@app.get("/")
async def root():
    return {
        "message": "Maths Mania - SSC Typing Platform API",
        "version": "1.0.0",
    }
