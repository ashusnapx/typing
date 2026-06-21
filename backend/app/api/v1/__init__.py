from fastapi import APIRouter
from app.api.v1 import auth, users, passages, tests, analytics, leaderboard, admin, subscription, ai_coach

router = APIRouter()

router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
router.include_router(users.router, prefix="/users", tags=["Users"])
router.include_router(passages.router, prefix="/passages", tags=["Passages"])
router.include_router(tests.router, prefix="/tests", tags=["Tests"])
router.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
router.include_router(leaderboard.router, prefix="/leaderboard", tags=["Leaderboard"])
router.include_router(admin.router, prefix="/admin", tags=["Admin"])
router.include_router(subscription.router, prefix="/subscription", tags=["Subscription"])
router.include_router(ai_coach.router, prefix="/coach", tags=["AI Coach"])
