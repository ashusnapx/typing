from fastapi import FastAPI
from prometheus_client import Counter, Histogram, Gauge, generate_latest
from fastapi.responses import Response
import time
from typing import Callable

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
    async def metrics():
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
            exporter = OTLPSpanExporter(endpoint="http://localhost:4317", insecure=True)
            processor = BatchSpanProcessor(exporter)
            provider.add_span_processor(processor)
            trace.set_tracer_provider(provider)
            FastAPIInstrumentor.instrument_app(app)
