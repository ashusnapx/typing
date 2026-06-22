import os
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from prometheus_client import Counter, Histogram, Gauge, generate_latest
from fastapi.responses import Response
import time
import secrets
from typing import Callable
from app.config import settings

security = HTTPBasic(auto_error=False)

http_requests_total = Counter(
    "http_requests_total",
    "Total HTTP requests",
    ["method", "endpoint", "status"],
)

http_request_duration = Histogram(
    "http_request_duration_seconds",
    "HTTP request duration in seconds",
    ["method", "endpoint"],
)

active_users = Gauge("active_users", "Currently active users")
active_tests = Gauge("active_tests", "Currently active typing tests")
total_errors = Counter("total_errors", "Total typing errors tracked")
tests_completed = Counter("tests_completed", "Total tests completed")


MONITORING_USER = "metrics"
MONITORING_PASS = os.environ.get("METRICS_PASSWORD", "")


def verify_metrics_access(credentials: HTTPBasicCredentials = Depends(security)):
    if settings.DEBUG and not MONITORING_PASS:
        return True
    if not credentials:
        raise HTTPException(status_code=401, detail="Authentication required")
    if not secrets.compare_digest(credentials.username, MONITORING_USER):
        raise HTTPException(status_code=403, detail="Access denied")
    if not MONITORING_PASS or not secrets.compare_digest(credentials.password, MONITORING_PASS):
        raise HTTPException(status_code=403, detail="Access denied")
    return True


def setup_monitoring(app: FastAPI):
    @app.middleware("http")
    async def monitor_requests(request, call_next):
        start_time = time.time()
        response = await call_next(request)
        duration = time.time() - start_time

        http_requests_total.labels(
            method=request.method,
            endpoint=request.url.path,
            status=response.status_code,
        ).inc()

        http_request_duration.labels(
            method=request.method,
            endpoint=request.url.path,
        ).observe(duration)

        return response

    @app.get("/metrics")
    async def metrics(_: bool = Depends(verify_metrics_access)):
        return Response(content=generate_latest(), media_type="text/plain")

    @app.on_event("startup")
    async def startup_event():
        from opentelemetry import trace
        from opentelemetry.sdk.trace import TracerProvider
        from opentelemetry.sdk.resources import Resource
        from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
        from opentelemetry.sdk.trace.export import BatchSpanProcessor
        from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor

        if app.extra.get("otel_enabled", True):
            resource = Resource.create({"service.name": app.title})
            provider = TracerProvider(resource=resource)
            exporter = OTLPSpanExporter(endpoint="http://localhost:4317", insecure=False)
            processor = BatchSpanProcessor(exporter)
            provider.add_span_processor(processor)
            trace.set_tracer_provider(provider)
            FastAPIInstrumentor.instrument_app(app)
