from sqlalchemy import select, func
from app.models.test import TypingTest
from app.models.user import User


class LeaderboardService:
    async def get_leaderboard(self, db, scope="global", period="all_time", limit=100, **filters):
        from app.services.analytics import analytics_service
        return await analytics_service.get_leaderboard(db, scope, period, limit, **filters)

    async def get_user_rank(self, db, user_id, scope="global"):
        from app.services.analytics import analytics_service
        result = await analytics_service.get_leaderboard(db, scope, "all_time", 1000, user_id=user_id)
        return result.get("user_rank")


leaderboard_service = LeaderboardService()
