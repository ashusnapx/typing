from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.database import get_db
from app.models.user import User
from app.models.test import TypingTest, TestStatus
from app.models.analytics import UserAnalytics
from app.schemas.analytics import QuizPredictionResponse
from app.api.deps import get_current_user
from app.services.analytics import analytics_service
from app.services.qualification_predictor import qualification_predictor
from typing import List

router = APIRouter()


@router.get("/overview", response_model=dict)
async def get_analytics_overview(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    analytics = await analytics_service.get_user_analytics(db, current_user.id)
    if not analytics:
        return {
            "total_tests": 0,
            "avg_wpm": 0,
            "avg_accuracy": 0,
            "best_wpm": 0,
            "best_accuracy": 0,
        }
    return analytics


@router.get("/predictions", response_model=QuizPredictionResponse)
async def get_predictions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(TypingTest)
        .where(TypingTest.user_id == current_user.id, TypingTest.status == TestStatus.COMPLETED)
        .order_by(desc(TypingTest.completed_at))
        .limit(20)
    )
    recent_tests = result.scalars().all()

    tests_data = [
        {"net_wpm": t.net_wpm, "accuracy": t.accuracy, "consistency_score": t.consistency_score}
        for t in recent_tests if t.net_wpm and t.accuracy
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

    return QuizPredictionResponse(
        chsl_qualification_probability=chsl_pred["probability"],
        cgl_dest_qualification_probability=cgl_pred["probability"],
        wpm_trend=wpm_trend,
        accuracy_trend=acc_trend,
        consistency_score=chsl_pred.get("avg_consistency", 50),
        recommendation=self._generate_recommendation(chsl_pred, cgl_pred),
    )


@router.get("/recent-scores", response_model=List[dict])
async def get_recent_scores(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(TypingTest)
        .where(TypingTest.user_id == current_user.id, TypingTest.status == TestStatus.COMPLETED)
        .order_by(desc(TypingTest.completed_at))
        .limit(20)
    )
    tests = result.scalars().all()
    return [
        {
            "id": str(t.id),
            "date": t.completed_at.isoformat() if t.completed_at else None,
            "wpm": t.net_wpm,
            "accuracy": t.accuracy,
            "mode": t.mode.value,
            "qualified": t.is_qualified,
        }
        for t in tests
    ]

    def _generate_recommendation(self, chsl: dict, cgl: dict) -> str:
        if chsl["probability"] >= 90:
            return "You are exam-ready for SSC CHSL! Maintain your current practice routine."
        if chsl["probability"] >= 70:
            return "Close to qualifying! Focus on your weak areas identified in the AI coach feedback."
        if chsl["probability"] >= 50:
            return "Moderate readiness. Increase practice frequency and focus on accuracy."
        return "Need more practice. Focus on building speed and accuracy fundamentals."
