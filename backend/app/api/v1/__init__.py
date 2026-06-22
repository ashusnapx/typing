from fastapi import APIRouter
from app.api.v1 import auth, users, passages, tests, analytics, leaderboard, admin, subscription, ai_coach, dashboard
from app.config import settings
from app.database import verify_db_connection
from app.core.cache import cache as cache_service
import time

router = APIRouter()


@router.get("/health")
async def health_check():
    db_ok = await verify_db_connection()
    redis_ok = await cache_service.ping()

    status = "healthy" if (db_ok and redis_ok) else ("degraded" if db_ok else "unhealthy")

    return {
        "status": status,
        "service": settings.APP_NAME,
        "version": "1.0.0",
        "timestamp": time.time(),
        "checks": {
            "database": "ok" if db_ok else "failed",
            "redis": "ok" if redis_ok else "failed",
        },
    }


@router.get("/ready")
async def readiness_check():
    db_ok = await verify_db_connection()
    if not db_ok:
        return {"status": "not_ready", "database": "failed"}, 503
    return {"status": "ready", "database": "ok"}


@router.get("/live")
async def liveness_check():
    return {"status": "alive"}


router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
router.include_router(users.router, prefix="/users", tags=["Users"])
router.include_router(passages.router, prefix="/passages", tags=["Passages"])
router.include_router(tests.router, prefix="/tests", tags=["Tests"])
router.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
router.include_router(leaderboard.router, prefix="/leaderboard", tags=["Leaderboard"])
router.include_router(admin.router, prefix="/admin", tags=["Admin"])
router.include_router(subscription.router, prefix="/subscription", tags=["Subscription"])
router.include_router(ai_coach.router, prefix="/coach", tags=["AI Coach"])
router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
