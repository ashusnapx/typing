import time
import logging
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, update, func
from app.database import get_db
from app.models.user import User
from app.models.test import TypingTest, TestMode, TestStatus, KeystrokeEvent
from app.models.passage import Passage
from app.models.analytics import UserAnalytics
from app.schemas.test import (
    StartTestRequest,
    StartTestResponse,
    SubmitTestRequest,
    DirectSubmitRequest,
    TestResultResponse,
    TestHistoryItem,
    KeystrokeReplay,
)
from app.api.deps import get_current_user
from app.services.error_engine import error_engine
from app.services.typing_engine import typing_engine
from app.services.qualification_predictor import qualification_predictor
from app.services.ai_coach import ai_coach
from app.services.analytics import analytics_service
from app.services.passage_service import passage_service
from typing import List, Optional
from uuid import UUID
from app.utils.uuid7 import uuid7
from datetime import datetime
from app.core.cache import cache
from app.core.response_cache import response_cache

logger = logging.getLogger("tests")

router = APIRouter()


def _calculate_xp(wpm: float, accuracy: float, mode: TestMode) -> int:
    base_xp = 10
    wpm_bonus = max(0, int((wpm - 10) * 1.5))
    accuracy_bonus = max(0, int((accuracy - 70) * 2))
    target_bonus = 25 if accuracy >= 95 and wpm >= 30 else 0
    mode_multiplier = 1.5 if mode in (TestMode.MOCK, TestMode.TCS_ION_REPLICA) else 1.0
    return int((base_xp + wpm_bonus + accuracy_bonus + target_bonus) * mode_multiplier)


@router.post("/start", response_model=StartTestResponse)
async def start_test(
    data: StartTestRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    passage = None
    if data.passage_id:
        passage = await passage_service.get_passage(db, data.passage_id)
        if not passage:
            raise HTTPException(status_code=404, detail="Passage not found")
    else:
        passage = await passage_service.get_random_passage(db)
        if not passage:
            raise HTTPException(status_code=404, detail="No passage available")

    premium_modes = {TestMode.MOCK, TestMode.TCS_ION_REPLICA}
    if data.mode in premium_modes and not current_user.is_premium:
        raise HTTPException(status_code=402, detail="Premium subscription required for this mode")

    test = TypingTest(
        id=uuid7(),
        user_id=current_user.id,
        passage_id=passage.id,
        mode=data.mode,
        status=TestStatus.IN_PROGRESS,
        duration_seconds=data.duration_seconds,
        original_content=passage.content,
        started_at=datetime.utcnow(),
    )
    db.add(test)
    await db.flush()

    typing_engine.create_session(str(test.id), passage.content, data.duration_seconds)

    return StartTestResponse(
        test_id=test.id,
        passage={
            "id": str(passage.id),
            "title": passage.title,
            "content": passage.content,
            "language": passage.language.value,
            "word_count": passage.word_count,
            "exact_key_depressions": passage.exact_key_depressions,
        },
        mode=data.mode,
        duration_seconds=data.duration_seconds,
        started_at=test.started_at,
    )


@router.post("/{test_id}/submit", response_model=TestResultResponse)
async def submit_test(
    test_id: UUID,
    data: SubmitTestRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    submit_lock_key = f"submit:{test_id}"
    lock_acquired = await cache.setnx(submit_lock_key, "1", ttl=30)
    if not lock_acquired:
        raise HTTPException(status_code=429, detail="Test submission in progress")

    try:
        result = await db.execute(
            select(TypingTest).where(TypingTest.id == test_id, TypingTest.user_id == current_user.id)
        )
        test = result.scalar_one_or_none()
        if not test:
            raise HTTPException(status_code=404, detail="Test not found")

        if test.status == TestStatus.COMPLETED:
            raise HTTPException(status_code=400, detail="Test already submitted")

        if data.time_taken_seconds > test.duration_seconds:
            raise HTTPException(status_code=400, detail="Time taken cannot exceed total duration")
        if data.time_taken_seconds < 10:
            raise HTTPException(status_code=400, detail="Test time too short")

        premium_modes = {TestMode.MOCK, TestMode.TCS_ION_REPLICA}
        if test.mode in premium_modes and not current_user.is_premium:
            raise HTTPException(status_code=402, detail="Premium subscription required for this mode")

        test.typed_content = data.typed_content
        test.time_taken_seconds = data.time_taken_seconds
        test.status = TestStatus.COMPLETED
        test.completed_at = datetime.utcnow()

        error_report = error_engine.evaluate(
            original=test.original_content or "",
            typed=data.typed_content,
            duration_seconds=data.time_taken_seconds,
            mode=test.mode.value,
        )

        test.gross_wpm = error_report.gross_wpm
        test.net_wpm = error_report.net_wpm
        test.accuracy = error_report.accuracy
        test.error_percentage = error_report.error_percentage
        test.key_depression_count = error_report.key_depression_count
        test.correct_key_depressions = error_report.correct_key_depressions
        test.incorrect_key_depressions = error_report.incorrect_key_depressions
        test.omission_errors = error_report.omission_errors
        test.addition_errors = error_report.addition_errors
        test.wrong_word_errors = error_report.wrong_word_errors
        test.substitution_errors = error_report.substitution_errors
        test.formatting_errors = error_report.formatting_errors
        test.space_errors = error_report.space_errors
        test.total_errors = error_report.total_errors
        test.total_words_typed = error_report.total_words_typed
        test.total_correct_words = error_report.total_correct_words
        test.full_mistakes = error_report.full_mistakes
        test.half_mistakes = error_report.half_mistakes

        metrics = typing_engine.compute_metrics(str(test_id), data.typed_content, test.original_content or "", data.time_taken_seconds)

        test.backspace_count = metrics.backspace_count
        test.pause_count = metrics.pause_count
        test.total_pause_duration_seconds = metrics.total_pause_duration
        test.avg_pause_duration = metrics.avg_pause_duration
        test.longest_pause_duration = metrics.longest_pause_duration
        test.time_utilization_percentage = metrics.time_utilization_percentage
        test.consistency_score = metrics.consistency_score
        test.typing_rhythm_score = metrics.typing_rhythm_score
        test.weak_words = metrics.weak_words
        test.error_zones = metrics.error_zones

        test.is_qualified = error_engine.is_qualified(
            error_report.net_wpm, error_report.accuracy, test.mode.value
        )

        xp = _calculate_xp(error_report.net_wpm, error_report.accuracy, test.mode)
        test.xp_earned = xp

        total_xp = current_user.xp + xp
        level_thresholds = [0, 250, 750, 2000, 4500, 7500, 11000, 16000]
        new_level = 1
        for i in range(len(level_thresholds) - 1, -1, -1):
            if total_xp >= level_thresholds[i]:
                new_level = i + 1
                break

        await db.execute(
            update(User)
            .where(User.id == current_user.id)
            .values(
                xp=total_xp,
                level=new_level,
                total_tests_taken=User.total_tests_taken + 1,
                total_time_spent_seconds=User.total_time_spent_seconds + int(data.time_taken_seconds),
                best_wpm=func.greatest(func.coalesce(User.best_wpm, 0), error_report.net_wpm),
                best_accuracy=func.greatest(func.coalesce(User.best_accuracy, 0), error_report.accuracy),
            )
        )

        await passage_service.increment_usage(db, test.passage_id)
        await analytics_service.update_user_analytics(db, current_user.id, test)

        recent_tests_result = await db.execute(
            select(TypingTest)
            .where(TypingTest.user_id == current_user.id, TypingTest.status == TestStatus.COMPLETED)
            .order_by(desc(TypingTest.completed_at))
            .limit(20)
        )
        recent_tests = recent_tests_result.scalars().all()
        recent_tests_data = [
            {"net_wpm": t.net_wpm, "accuracy": t.accuracy, "consistency_score": t.consistency_score}
            for t in recent_tests
        ]

        prediction = qualification_predictor.predict_chsl_qualification(recent_tests_data)
        test.qualification_probability = prediction["probability"]

        coach_feedback = ai_coach.generate_feedback(
            test_data={
                "accuracy": test.accuracy,
                "net_wpm": test.net_wpm,
                "backspace_count": test.backspace_count,
                "pause_count": test.pause_count,
                "total_pause_duration_seconds": test.total_pause_duration_seconds,
                "time_taken_seconds": test.time_taken_seconds,
                "weak_words": test.weak_words,
                "consistency_score": test.consistency_score,
                "space_errors": test.space_errors,
                "typed_content": test.typed_content,
                "original_content": test.original_content,
            },
            recent_tests=recent_tests_data,
        )

        for event_data in data.keystroke_events:
            ke = KeystrokeEvent(
                id=uuid7(),
                test_id=test.id,
                key=event_data.get("key", ""),
                timestamp_ms=event_data.get("timestamp_ms", 0),
                duration_ms=event_data.get("duration_ms", 0),
                is_error=event_data.get("is_error", False),
                is_backspace=event_data.get("is_backspace", False),
                cursor_position=event_data.get("cursor_position"),
                expected_char=event_data.get("expected_char"),
            )
            db.add(ke)

        await db.flush()

        user_cache_key = response_cache.cache_key("dashboard", str(current_user.id))
        await response_cache.invalidate(user_cache_key)

        return TestResultResponse(
            test_id=test.id,
            mode=test.mode,
            gross_wpm=test.gross_wpm or 0,
            net_wpm=test.net_wpm or 0,
            accuracy=test.accuracy or 0,
            error_percentage=test.error_percentage or 0,
            ssc_net_wpm=error_report.ssc_net_wpm,
            ssc_accuracy=error_report.ssc_accuracy,
            ssc_error_percentage=error_report.ssc_error_percentage,
            full_mistakes=error_report.full_mistakes,
            half_mistakes=error_report.half_mistakes,
            key_depression_count=test.key_depression_count or 0,
            total_errors=test.total_errors or 0,
            omission_errors=test.omission_errors or 0,
            addition_errors=test.addition_errors or 0,
            wrong_word_errors=test.wrong_word_errors or 0,
            substitution_errors=test.substitution_errors or 0,
            formatting_errors=test.formatting_errors or 0,
            space_errors=test.space_errors or 0,
            time_taken_seconds=test.time_taken_seconds or 0,
            time_utilization_percentage=test.time_utilization_percentage or 0,
            backspace_count=test.backspace_count or 0,
            pause_count=test.pause_count or 0,
            total_pause_duration_seconds=test.total_pause_duration_seconds or 0,
            typing_rhythm_score=test.typing_rhythm_score,
            consistency_score=test.consistency_score,
            is_qualified=test.is_qualified,
            qualification_probability=test.qualification_probability,
            xp_earned=xp,
            weak_words=test.weak_words,
            error_zones=test.error_zones,
            feedback=coach_feedback.detailed_feedback,
        )
    except HTTPException:
        raise
    except Exception:
        logger.exception("Test submission failed unexpectedly")
        raise HTTPException(status_code=500, detail="Submission failed. Please try again.")
    finally:
        try:
            await cache.delete(submit_lock_key)
        except Exception:
            pass


@router.post("/direct-submit", response_model=TestResultResponse)
async def direct_submit(
    data: DirectSubmitRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    passage = await passage_service.get_passage(db, data.passage_id)
    if not passage:
        raise HTTPException(status_code=404, detail="Passage not found")

    if data.time_taken_seconds > data.duration_seconds:
        raise HTTPException(status_code=400, detail="Time taken cannot exceed total duration")
    if data.time_taken_seconds < 10:
        raise HTTPException(status_code=400, detail="Test time too short")

    premium_modes = {TestMode.MOCK, TestMode.TCS_ION_REPLICA}
    if data.mode in premium_modes and not current_user.is_premium:
        raise HTTPException(status_code=402, detail="Premium subscription required for this mode")

    test = TypingTest(
        id=uuid7(),
        user_id=current_user.id,
        passage_id=passage.id,
        mode=data.mode,
        status=TestStatus.COMPLETED,
        duration_seconds=data.duration_seconds,
        original_content=passage.content,
        typed_content=data.typed_content,
        time_taken_seconds=data.time_taken_seconds,
        started_at=datetime.utcnow(),
        completed_at=datetime.utcnow(),
    )
    db.add(test)
    await db.flush()

    error_report = error_engine.evaluate(
        original=passage.content,
        typed=data.typed_content,
        duration_seconds=data.time_taken_seconds,
        mode=data.mode.value,
    )

    test.gross_wpm = error_report.gross_wpm
    test.net_wpm = error_report.net_wpm
    test.accuracy = error_report.accuracy
    test.error_percentage = error_report.error_percentage
    test.key_depression_count = error_report.key_depression_count
    test.correct_key_depressions = error_report.correct_key_depressions
    test.incorrect_key_depressions = error_report.incorrect_key_depressions
    test.omission_errors = error_report.omission_errors
    test.addition_errors = error_report.addition_errors
    test.wrong_word_errors = error_report.wrong_word_errors
    test.substitution_errors = error_report.substitution_errors
    test.formatting_errors = error_report.formatting_errors
    test.space_errors = error_report.space_errors
    test.total_errors = error_report.total_errors
    test.total_words_typed = error_report.total_words_typed
    test.total_correct_words = error_report.total_correct_words

    typing_engine.create_session(str(test.id), passage.content, data.duration_seconds)
    metrics = typing_engine.compute_metrics(str(test.id), data.typed_content, passage.content, data.time_taken_seconds)

    test.backspace_count = metrics.backspace_count
    test.pause_count = metrics.pause_count
    test.total_pause_duration_seconds = metrics.total_pause_duration
    test.avg_pause_duration = metrics.avg_pause_duration
    test.longest_pause_duration = metrics.longest_pause_duration
    test.time_utilization_percentage = metrics.time_utilization_percentage
    test.consistency_score = metrics.consistency_score
    test.typing_rhythm_score = metrics.typing_rhythm_score
    test.weak_words = metrics.weak_words
    test.error_zones = metrics.error_zones

    test.is_qualified = error_engine.is_qualified(
        error_report.net_wpm, error_report.accuracy, test.mode.value
    )

    xp = _calculate_xp(error_report.net_wpm, error_report.accuracy, test.mode)
    test.xp_earned = xp

    total_xp = current_user.xp + xp
    level_thresholds = [0, 250, 750, 2000, 4500, 7500, 11000, 16000]
    new_level = 1
    for i in range(len(level_thresholds) - 1, -1, -1):
        if total_xp >= level_thresholds[i]:
            new_level = i + 1
            break

    await db.execute(
        update(User)
        .where(User.id == current_user.id)
        .values(
            xp=total_xp,
            level=new_level,
            total_tests_taken=User.total_tests_taken + 1,
            total_time_spent_seconds=User.total_time_spent_seconds + int(data.time_taken_seconds),
            best_wpm=func.greatest(func.coalesce(User.best_wpm, 0), error_report.net_wpm),
            best_accuracy=func.greatest(func.coalesce(User.best_accuracy, 0), error_report.accuracy),
        )
    )

    await passage_service.increment_usage(db, test.passage_id)
    await analytics_service.update_user_analytics(db, current_user.id, test)

    recent_tests_result = await db.execute(
        select(TypingTest)
        .where(TypingTest.user_id == current_user.id, TypingTest.status == TestStatus.COMPLETED)
        .order_by(desc(TypingTest.completed_at))
        .limit(20)
    )
    recent_tests = recent_tests_result.scalars().all()
    recent_tests_data = [
        {"net_wpm": t.net_wpm, "accuracy": t.accuracy, "consistency_score": t.consistency_score}
        for t in recent_tests
    ]

    prediction = qualification_predictor.predict_chsl_qualification(recent_tests_data)
    test.qualification_probability = prediction["probability"]

    coach_feedback = ai_coach.generate_feedback(
        test_data={
            "accuracy": test.accuracy,
            "net_wpm": test.net_wpm,
            "backspace_count": test.backspace_count,
            "pause_count": test.pause_count,
            "total_pause_duration_seconds": test.total_pause_duration_seconds,
            "time_taken_seconds": test.time_taken_seconds,
            "weak_words": test.weak_words,
            "consistency_score": test.consistency_score,
            "space_errors": test.space_errors,
            "typed_content": test.typed_content,
            "original_content": test.original_content,
        },
        recent_tests=recent_tests_data,
    )

    for event_data in data.keystroke_events:
        ke = KeystrokeEvent(
            id=uuid7(),
            test_id=test.id,
            key=event_data.get("key", ""),
            timestamp_ms=event_data.get("timestamp_ms", 0),
            duration_ms=event_data.get("duration_ms", 0),
            is_error=event_data.get("is_error", False),
            is_backspace=event_data.get("is_backspace", False),
            cursor_position=event_data.get("cursor_position"),
            expected_char=event_data.get("expected_char"),
        )
        db.add(ke)

    await db.flush()

    user_cache_key = response_cache.cache_key("dashboard", str(current_user.id))
    await response_cache.invalidate(user_cache_key)

    return TestResultResponse(
        test_id=test.id,
        mode=test.mode,
        gross_wpm=test.gross_wpm or 0,
        net_wpm=test.net_wpm or 0,
        accuracy=test.accuracy or 0,
        error_percentage=test.error_percentage or 0,
        ssc_net_wpm=error_report.ssc_net_wpm,
        ssc_accuracy=error_report.ssc_accuracy,
        ssc_error_percentage=error_report.ssc_error_percentage,
        full_mistakes=error_report.full_mistakes,
        half_mistakes=error_report.half_mistakes,
        key_depression_count=test.key_depression_count or 0,
        total_errors=test.total_errors or 0,
        omission_errors=test.omission_errors or 0,
        addition_errors=test.addition_errors or 0,
        wrong_word_errors=test.wrong_word_errors or 0,
        substitution_errors=test.substitution_errors or 0,
        formatting_errors=test.formatting_errors or 0,
        space_errors=test.space_errors or 0,
        time_taken_seconds=test.time_taken_seconds or 0,
        time_utilization_percentage=test.time_utilization_percentage or 0,
        backspace_count=test.backspace_count or 0,
        pause_count=test.pause_count or 0,
        total_pause_duration_seconds=test.total_pause_duration_seconds or 0,
        typing_rhythm_score=test.typing_rhythm_score,
        consistency_score=test.consistency_score,
        is_qualified=test.is_qualified,
        qualification_probability=test.qualification_probability,
        xp_earned=xp,
        weak_words=test.weak_words,
        error_zones=test.error_zones,
    )


@router.get("/history", response_model=List[TestHistoryItem])
async def get_test_history(
    limit: int = Query(default=20, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(TypingTest)
        .where(TypingTest.user_id == current_user.id, TypingTest.status == TestStatus.COMPLETED)
        .order_by(desc(TypingTest.completed_at))
        .offset(offset)
        .limit(limit)
    )
    return result.scalars().all()


@router.get("/{test_id}/replay", response_model=KeystrokeReplay)
async def get_test_replay(
    test_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(TypingTest).where(TypingTest.id == test_id, TypingTest.user_id == current_user.id)
    )
    test = result.scalar_one_or_none()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")

    events_result = await db.execute(
        select(KeystrokeEvent).where(KeystrokeEvent.test_id == test_id).order_by(KeystrokeEvent.timestamp_ms)
    )
    events = events_result.scalars().all()

    return KeystrokeReplay(
        events=[{"key": e.key, "timestamp_ms": e.timestamp_ms, "duration_ms": e.duration_ms, "is_error": e.is_error, "is_backspace": e.is_backspace} for e in events],
        original_content=test.original_content or "",
        typed_content=test.typed_content or "",
        total_duration_ms=int((test.time_taken_seconds or 0) * 1000),
    )


@router.get("/{test_id}", response_model=TestResultResponse)
async def get_test_result(
    test_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(TypingTest).where(TypingTest.id == test_id, TypingTest.user_id == current_user.id)
    )
    test = result.scalar_one_or_none()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")

    return TestResultResponse(
        test_id=test.id,
        mode=test.mode,
        gross_wpm=test.gross_wpm or 0,
        net_wpm=test.net_wpm or 0,
        accuracy=test.accuracy or 0,
        error_percentage=test.error_percentage or 0,
        key_depression_count=test.key_depression_count or 0,
        full_mistakes=test.full_mistakes or 0,
        half_mistakes=test.half_mistakes or 0,
        total_errors=test.total_errors or 0,
        omission_errors=test.omission_errors or 0,
        addition_errors=test.addition_errors or 0,
        wrong_word_errors=test.wrong_word_errors or 0,
        substitution_errors=test.substitution_errors or 0,
        formatting_errors=test.formatting_errors or 0,
        space_errors=test.space_errors or 0,
        time_taken_seconds=test.time_taken_seconds or 0,
        time_utilization_percentage=test.time_utilization_percentage or 0,
        backspace_count=test.backspace_count or 0,
        pause_count=test.pause_count or 0,
        total_pause_duration_seconds=test.total_pause_duration_seconds or 0,
        typing_rhythm_score=test.typing_rhythm_score,
        consistency_score=test.consistency_score,
        is_qualified=test.is_qualified,
        qualification_probability=test.qualification_probability,
        xp_earned=test.xp_earned,
        weak_words=test.weak_words,
        error_zones=test.error_zones,
    )
