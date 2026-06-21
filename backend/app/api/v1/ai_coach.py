from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.database import get_db
from app.models.user import User
from app.models.test import TypingTest, TestStatus
from app.schemas.analytics import AICoachFeedback, TypingReplayResponse
from app.api.deps import get_current_user
from app.services.ai_coach import ai_coach
from app.services.typing_engine import typing_engine
from uuid import UUID
from typing import List

router = APIRouter()


@router.get("/feedback/{test_id}", response_model=AICoachFeedback)
async def get_ai_feedback(
    test_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(TypingTest).where(
            TypingTest.id == test_id,
            TypingTest.user_id == current_user.id,
            TypingTest.status == TestStatus.COMPLETED,
        )
    )
    test = result.scalar_one_or_none()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")

    recent_result = await db.execute(
        select(TypingTest)
        .where(TypingTest.user_id == current_user.id, TypingTest.status == TestStatus.COMPLETED)
        .order_by(desc(TypingTest.completed_at))
        .limit(20)
    )
    recent_tests = recent_result.scalars().all()
    recent_tests_data = [
        {"net_wpm": t.net_wpm, "accuracy": t.accuracy, "consistency_score": t.consistency_score}
        for t in recent_tests if t.net_wpm and t.accuracy
    ]

    feedback = ai_coach.generate_feedback(
        test_data={
            "accuracy": test.accuracy or 0,
            "net_wpm": test.net_wpm or 0,
            "backspace_count": test.backspace_count or 0,
            "pause_count": test.pause_count or 0,
            "total_pause_duration_seconds": test.total_pause_duration_seconds or 0,
            "time_taken_seconds": test.time_taken_seconds or 0,
            "weak_words": test.weak_words or [],
            "consistency_score": test.consistency_score or 50,
            "space_errors": test.space_errors or 0,
            "typed_content": test.typed_content or "",
            "original_content": test.original_content or "",
        },
        recent_tests=recent_tests_data,
    )

    return AICoachFeedback(
        test_id=test.id,
        overall_score=feedback.overall_score,
        strengths=feedback.strengths,
        weaknesses=feedback.weaknesses,
        detailed_feedback=feedback.detailed_feedback,
        daily_drills=feedback.daily_drills,
        weak_word_exercises=feedback.weak_word_exercises,
        speed_exercises=feedback.speed_exercises,
        accuracy_exercises=feedback.accuracy_exercises,
        fatigue_analysis=feedback.fatigue_analysis,
        practice_passage_suggestion=feedback.practice_passage_suggestion,
        predicted_improvement=feedback.predicted_improvement,
    )


@router.get("/weak-words", response_model=List[str])
async def get_weak_words(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from app.models.analytics import UserAnalytics
    result = await db.execute(
        select(UserAnalytics).where(UserAnalytics.user_id == current_user.id)
    )
    analytics = result.scalar_one_or_none()
    return analytics.weak_words or [] if analytics else []


@router.post("/practice-passage", response_model=dict)
async def generate_practice_passage(
    weak_words: List[str] = Query(default=[]),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from app.models.passage import Passage
    import random

    if weak_words:
        result = await db.execute(
            select(Passage).where(Passage.is_active == True)
        )
        all_passages = result.scalars().all()
        scored = []
        for p in all_passages:
            score = sum(1 for w in weak_words if w.lower() in p.content.lower())
            if score > 0:
                scored.append((score, p))
        if scored:
            scored.sort(key=lambda x: -x[0])
            passage = scored[0][1]
            return {
                "passage_id": str(passage.id),
                "title": passage.title,
                "content": passage.content,
                "relevance_score": scored[0][0],
            }

    result = await db.execute(
        select(Passage).where(Passage.is_active == True).order_by(func.random()).limit(1)
    )
    passage = result.scalar_one_or_none()
    if not passage:
        raise HTTPException(status_code=404, detail="No passage available")
    return {
        "passage_id": str(passage.id),
        "title": passage.title,
        "content": passage.content,
    }


@router.get("/replay/{test_id}", response_model=TypingReplayResponse)
async def get_typing_replay(
    test_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from app.models.test import KeystrokeEvent

    result = await db.execute(
        select(TypingTest).where(
            TypingTest.id == test_id,
            TypingTest.user_id == current_user.id,
            TypingTest.status == TestStatus.COMPLETED,
        )
    )
    test = result.scalar_one_or_none()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")

    events_result = await db.execute(
        select(KeystrokeEvent)
        .where(KeystrokeEvent.test_id == test_id)
        .order_by(KeystrokeEvent.timestamp_ms)
    )
    events = events_result.scalars().all()

    events_data = [
        {
            "key": e.key,
            "timestamp_ms": e.timestamp_ms,
            "duration_ms": e.duration_ms,
            "is_error": e.is_error,
            "is_backspace": e.is_backspace,
            "cursor_position": e.cursor_position,
        }
        for e in events
    ]

    mistake_highlights = [e for e in events_data if e["is_error"]]
    pause_markers = []
    correction_markers = [e for e in events_data if e["is_backspace"]]

    for i in range(1, len(events_data)):
        gap = events_data[i]["timestamp_ms"] - events_data[i - 1]["timestamp_ms"]
        if gap > 2000:
            pause_markers.append({
                "start_ms": events_data[i - 1]["timestamp_ms"],
                "end_ms": events_data[i]["timestamp_ms"],
                "duration_ms": gap,
            })

    return TypingReplayResponse(
        test_id=test.id,
        events=events_data,
        original_content=test.original_content or "",
        typed_content=test.typed_content or "",
        total_duration_ms=int((test.time_taken_seconds or 0) * 1000),
        mistake_highlights=mistake_highlights[:50],
        pause_markers=pause_markers[:50],
        correction_markers=correction_markers[:50],
    )
