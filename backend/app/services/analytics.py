from typing import List, Dict, Optional
from datetime import datetime, timedelta
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.test import TypingTest
from app.models.analytics import UserAnalytics
from app.models.user import User
from uuid import UUID


class AnalyticsService:
    async def get_user_analytics(self, db: AsyncSession, user_id: UUID) -> Optional[Dict]:
        result = await db.execute(
            select(UserAnalytics).where(UserAnalytics.user_id == user_id)
        )
        analytics = result.scalar_one_or_none()
        if not analytics:
            return None
        return {
            "total_tests": analytics.total_tests,
            "total_time_seconds": analytics.total_time_seconds,
            "avg_wpm": analytics.avg_wpm,
            "avg_accuracy": analytics.avg_accuracy,
            "best_wpm": analytics.best_wpm,
            "best_accuracy": analytics.best_accuracy,
            "consistency_score": analytics.consistency_score,
            "weak_words": analytics.weak_words,
            "left_hand_error_rate": analytics.left_hand_error_rate,
            "right_hand_error_rate": analytics.right_hand_error_rate,
            "shift_key_error_rate": analytics.shift_key_error_rate,
            "number_row_error_rate": analytics.number_row_error_rate,
            "common_mistypes": analytics.common_mistypes,
            "fatigue_start_time": analytics.fatigue_start_time,
            "wpm_trend": analytics.wpm_trend,
            "accuracy_trend": analytics.accuracy_trend,
        }

    async def update_user_analytics(self, db: AsyncSession, user_id: UUID, test_result: TypingTest):
        result = await db.execute(
            select(UserAnalytics).where(UserAnalytics.user_id == user_id)
        )
        analytics = result.scalar_one_or_none()

        if not analytics:
            analytics = UserAnalytics(user_id=user_id)
            db.add(analytics)

        analytics.total_tests += 1
        analytics.total_time_seconds += int(test_result.time_taken_seconds or 0)

        if test_result.net_wpm:
            if analytics.avg_wpm:
                analytics.avg_wpm = (analytics.avg_wpm * (analytics.total_tests - 1) + test_result.net_wpm) / analytics.total_tests
            else:
                analytics.avg_wpm = test_result.net_wpm

        if test_result.accuracy:
            if analytics.avg_accuracy:
                analytics.avg_accuracy = (analytics.avg_accuracy * (analytics.total_tests - 1) + test_result.accuracy) / analytics.total_tests
            else:
                analytics.avg_accuracy = test_result.accuracy

        if test_result.net_wpm and (not analytics.best_wpm or test_result.net_wpm > analytics.best_wpm):
            analytics.best_wpm = test_result.net_wpm

        if test_result.accuracy and (not analytics.best_accuracy or test_result.accuracy > analytics.best_accuracy):
            analytics.best_accuracy = test_result.accuracy

        if test_result.consistency_score:
            if analytics.consistency_score:
                analytics.consistency_score = (analytics.consistency_score * (analytics.total_tests - 1) + test_result.consistency_score) / analytics.total_tests
            else:
                analytics.consistency_score = test_result.consistency_score

        if test_result.weak_words:
            existing_weak = analytics.weak_words or []
            new_weak = test_result.weak_words
            combined = existing_weak + new_weak
            word_counts = {}
            for w in combined:
                if isinstance(w, str):
                    word_counts[w] = word_counts.get(w, 0) + 1
            sorted_words = sorted(word_counts.items(), key=lambda x: -x[1])
            analytics.weak_words = [w for w, _ in sorted_words[:50]]

        last_20 = analytics.last_20_test_ids or []
        last_20.append(str(test_result.id))
        analytics.last_20_test_ids = last_20[-20:]

        wpm_trend = analytics.wpm_trend or []
        if test_result.net_wpm:
            wpm_trend.append({"test_id": str(test_result.id), "wpm": test_result.net_wpm, "date": datetime.utcnow().isoformat()})
            analytics.wpm_trend = wpm_trend[-50:]

        accuracy_trend = analytics.accuracy_trend or []
        if test_result.accuracy:
            accuracy_trend.append({"test_id": str(test_result.id), "accuracy": test_result.accuracy, "date": datetime.utcnow().isoformat()})
            analytics.accuracy_trend = accuracy_trend[-50:]

        await db.flush()

    async def get_leaderboard(
        self,
        db: AsyncSession,
        scope: str = "global",
        period: str = "all_time",
        limit: int = 100,
        user_id: Optional[UUID] = None,
        state: Optional[str] = None,
        district: Optional[str] = None,
        city: Optional[str] = None,
        college: Optional[str] = None,
    ) -> Dict:
        query = (
            select(User)
            .where(User.is_active == True)
            .order_by(User.xp.desc())
            .limit(limit)
        )

        if state:
            query = select(User).where(User.state == state, User.is_active == True).order_by(User.xp.desc()).limit(limit)
        if district:
            query = select(User).where(User.district == district, User.is_active == True).order_by(User.xp.desc()).limit(limit)
        if city:
            query = select(User).where(User.city == city, User.is_active == True).order_by(User.xp.desc()).limit(limit)
        if college:
            query = select(User).where(User.college == college, User.is_active == True).order_by(User.xp.desc()).limit(limit)

        result = await db.execute(query)
        users = result.scalars().all()

        entries = []
        user_rank = None
        for idx, user in enumerate(users):
            rank = idx + 1
            entries.append({
                "rank": rank,
                "user_id": str(user.id),
                "full_name": user.full_name,
                "college": user.college,
                "state": user.state,
                "city": user.city,
                "best_wpm": user.best_wpm or 0,
                "best_accuracy": user.best_accuracy or 0,
                "tests_taken": user.total_tests_taken,
                "xp": user.xp,
            })
            if user_id and user.id == user_id:
                user_rank = rank

        return {
            "entries": entries,
            "user_rank": user_rank,
            "total_users": len(users),
        }


analytics_service = AnalyticsService()
