import time
import uuid
import logging
import secrets
from typing import Callable
from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.config import settings
from app.core.security import security_store, hash_ip
from app.core.audit import audit_api_abuse

logger = logging.getLogger("security")

CSRF_COOKIE = "csrf_token"
CSRF_HEADER = "X-CSRF-Token"
CSRF_SENSITIVE_PATHS = ["/api/v1/auth/refresh", "/api/v1/auth/logout"]


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        try:
            response = await call_next(request)
        except Exception as e:
            logger.exception("Unhandled error %s %s: %s", request.method, request.url.path, e)
            response = JSONResponse(status_code=500, content={"detail": "Internal server error"})
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "0"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload"
        return response


class RateLimitMiddleware(BaseHTTPMiddleware):
    AUTH_PATHS = ["/api/v1/auth/login", "/api/v1/auth/register"]
    GENERAL_LIMIT = 1000
    GENERAL_WINDOW = 3600
    AUTH_LIMIT = 10
    AUTH_WINDOW = 60

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        client_ip = hash_ip(request.client.host if request.client else "unknown")
        path = request.url.path

        if any(path.startswith(p) for p in self.AUTH_PATHS):
            allowed, retry_after = await security_store.check_rate(
                client_ip, path,
                max_attempts=self.AUTH_LIMIT,
                window_seconds=self.AUTH_WINDOW,
                lockout_minutes=15
            )
            if not allowed:
                audit_api_abuse(client_ip, path)
                return JSONResponse(
                    status_code=429,
                    content={"detail": "Too many requests. Please try again later."},
                    headers={"Retry-After": str(retry_after)},
                )
        elif path.startswith("/api/v1/"):
            allowed, retry_after = await security_store.check_rate(
                client_ip, f"api:{request.method}:{path.split('/')[3] if len(path.split('/')) > 3 else 'other'}",
                max_attempts=self.GENERAL_LIMIT,
                window_seconds=self.GENERAL_WINDOW,
                lockout_minutes=0
            )
            if not allowed:
                return JSONResponse(
                    status_code=429,
                    content={"detail": "Rate limit exceeded. Please slow down."},
                    headers={"Retry-After": "3600"},
                )

        response = await call_next(request)
        return response


class RequestValidationMiddleware(BaseHTTPMiddleware):
    MAX_BODY_SIZE = 1024 * 1024

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > self.MAX_BODY_SIZE:
            return JSONResponse(status_code=413, content={"detail": "Request too large"})

        if request.method in ("POST", "PUT", "PATCH"):
            content_type = request.headers.get("content-type", "")
            if "application/json" not in content_type and "multipart/form-data" not in content_type:
                if content_length and int(content_length) > 0:
                    return JSONResponse(status_code=415, content={"detail": "Unsupported content type"})

        return await call_next(request)


class CorrelationIDMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        correlation_id = request.headers.get("X-Correlation-ID", "")
        if not correlation_id:
            correlation_id = str(uuid.uuid4())
        response = await call_next(request)
        response.headers["X-Correlation-ID"] = correlation_id
        return response


class CSRFProtectMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        path = request.url.path

        if request.method in ("POST", "PUT", "PATCH", "DELETE") and any(path.startswith(p) for p in CSRF_SENSITIVE_PATHS):
            auth_header = request.headers.get("Authorization", "")
            if not auth_header.startswith("Bearer "):
                csrf_cookie = request.cookies.get(CSRF_COOKIE)
                csrf_header = request.headers.get(CSRF_HEADER)
                if not csrf_cookie or not csrf_header or not secrets.compare_digest(csrf_cookie, csrf_header):
                    return JSONResponse(
                        status_code=403,
                        content={"detail": "CSRF validation failed"},
                    )

        response: Response = await call_next(request)

        if path.startswith("/api/v1/auth/") and request.method == "POST":
            if request.url.path not in ("/api/v1/auth/logout", "/api/v1/auth/logout-all"):
                if not request.cookies.get(CSRF_COOKIE):
                    token = secrets.token_hex(32)
                    response.set_cookie(
                        key=CSRF_COOKIE,
                        value=token,
                        max_age=86400,
                        secure=True,
                        samesite="strict",
                        path="/",
                    )

        return response
