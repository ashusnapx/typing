from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.database import get_db
from app.models.user import User
from app.models.test import TypingTest, TestStatus
from app.api.deps import get_current_user
from app.services.analytics import analytics_service
from app.services.qualification_predictor import qualification_predictor
from app.core.response_cache import response_cache

router = APIRouter()


def _generate_recommendation(chsl: dict, cgl: dict) -> str:
    if chsl["probability"] >= 90:
        return "You are exam-ready for SSC CHSL! Maintain your current practice routine."
    if chsl["probability"] >= 70:
        return "Close to qualifying! Focus on your weak areas identified in the AI coach feedback."
    if chsl["probability"] >= 50:
        return "Moderate readiness. Increase practice frequency and focus on accuracy."
    return "Need more practice. Focus on building speed and accuracy fundamentals."


@router.get("", response_model=dict)
async def get_dashboard(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    cache_key = response_cache.cache_key("dashboard", str(current_user.id))

    async def compute():
        overview = await analytics_service.get_user_analytics(db, current_user.id)
        if not overview:
            overview = {
                "total_tests": 0,
                "avg_wpm": 0,
                "avg_accuracy": 0,
                "best_wpm": 0,
                "best_accuracy": 0,
            }

        result = await db.execute(
            select(TypingTest)
            .where(TypingTest.user_id == current_user.id, TypingTest.status == TestStatus.COMPLETED)
            .order_by(desc(TypingTest.completed_at))
            .limit(20)
        )
        recent = result.scalars().all()

        tests_data = [
            {"net_wpm": t.net_wpm, "accuracy": t.accuracy, "consistency_score": t.consistency_score}
            for t in recent if t.net_wpm and t.accuracy
        ]

        chsl_pred = qualification_predictor.predict_chsl_qualification(tests_data)
        cgl_pred = qualification_predictor.predict_cgl_dest_qualification(tests_data)

        wpms = [t.get("net_wpm", 0) for t in tests_data if t.get("net_wpm")]
        accs = [t.get("accuracy", 0) for t in tests_data if t.get("accuracy")]

        wpm_trend = "stable"
        acc_trend = "stable"
        if len(wpms) >= 3:
            if wpms[-1] > wpms[0] * 1.05:
                wpm_trend = "improving"
            elif wpms[-1] < wpms[0] * 0.95:
                wpm_trend = "declining"
        if len(accs) >= 3:
            if accs[-1] > accs[0] * 1.02:
                acc_trend = "improving"
            elif accs[-1] < accs[0] * 0.98:
                acc_trend = "declining"

        recent_scores = [
            {
                "id": str(t.id),
                "date": t.completed_at.isoformat() if t.completed_at else None,
                "wpm": t.net_wpm,
                "gross_wpm": t.gross_wpm,
                "accuracy": t.accuracy,
                "mode": t.mode.value,
                "qualified": t.is_qualified,
                "duration": t.duration_seconds,
                "total_errors": t.total_errors,
                "backspace_count": t.backspace_count,
                "consistency_score": t.consistency_score,
                "xp_earned": t.xp_earned,
                "key_depression_count": t.key_depression_count,
            }
            for t in recent
        ]

        recent_avg_wpm = sum(wpms) / len(wpms) if wpms else 0
        recent_avg_accuracy = sum(accs) / len(accs) if accs else 0

        chsl_wpm_target = 35
        chsl_acc_target = 95
        wpm_gap = max(0, chsl_wpm_target - recent_avg_wpm)
        acc_gap = max(0, chsl_acc_target - recent_avg_accuracy)

        return {
            "overview": overview,
            "predictions": {
                "chsl_qualification_probability": chsl_pred["probability"],
                "cgl_dest_qualification_probability": cgl_pred["probability"],
                "wpm_trend": wpm_trend,
                "accuracy_trend": acc_trend,
                "consistency_score": chsl_pred.get("avg_consistency", 50),
                "recommendation": _generate_recommendation(chsl_pred, cgl_pred),
                "recent_avg_wpm": round(recent_avg_wpm, 1),
                "recent_avg_accuracy": round(recent_avg_accuracy, 1),
                "wpm_gap": round(wpm_gap, 1),
                "acc_gap": round(acc_gap, 1),
                "chsl_wpm_target": chsl_wpm_target,
                "chsl_acc_target": chsl_acc_target,
                "tests_analyzed": len(tests_data),
                "wpm_series": [round(w, 1) for w in wpms[-10:]],
                "accuracy_series": [round(a, 1) for a in accs[-10:]],
            },
            "recent_scores": recent_scores,
        }

    return await response_cache.get_or_compute(cache_key, response_cache.TTL_DASHBOARD, compute)
