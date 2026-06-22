from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.user import User
from app.schemas.analytics import LeaderboardResponse
from app.api.deps import get_current_user, get_optional_user
from app.services.analytics import analytics_service
from app.core.response_cache import response_cache
from typing import Optional

router = APIRouter()


@router.get("/", response_model=LeaderboardResponse)
async def get_leaderboard(
    scope: str = Query(default="global", regex="^(global|state|district|city|college)$"),
    period: str = Query(default="all_time", regex="^(weekly|monthly|all_time)$"),
    limit: int = Query(default=100, le=500),
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    filters = {}
    if scope == "state" and current_user and current_user.state:
        filters["state"] = current_user.state
    elif scope == "district" and current_user and current_user.district:
        filters["district"] = current_user.district
    elif scope == "city" and current_user and current_user.city:
        filters["city"] = current_user.city
    elif scope == "college" and current_user and current_user.college:
        filters["college"] = current_user.college

    cache_key = response_cache.cache_key("leaderboard", scope, period, str(limit), str(filters))

    async def compute():
        return await analytics_service.get_leaderboard(
            db,
            scope=scope,
            period=period,
            limit=limit,
            user_id=current_user.id if current_user else None,
            **filters,
        )

    return await response_cache.get_or_compute(cache_key, response_cache.TTL_LEADERBOARD, compute)
