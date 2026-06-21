from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime
from uuid import UUID


class QuizPredictionResponse(BaseModel):
    chsl_qualification_probability: float
    cgl_dest_qualification_probability: float
    wpm_trend: str
    accuracy_trend: str
    consistency_score: float
    recommendation: str


class LeaderboardEntry(BaseModel):
    rank: int
    user_id: UUID
    full_name: str
    college: Optional[str]
    state: Optional[str]
    city: Optional[str]
    best_wpm: float
    best_accuracy: float
    tests_taken: int
    xp: int


class LeaderboardResponse(BaseModel):
    entries: List[LeaderboardEntry]
    user_rank: Optional[int]
    total_users: int


class AICoachFeedback(BaseModel):
    test_id: UUID
    overall_score: float
    strengths: List[str]
    weaknesses: List[str]
    detailed_feedback: str
    daily_drills: List[Dict]
    weak_word_exercises: List[str]
    speed_exercises: List[Dict]
    accuracy_exercises: List[Dict]
    fatigue_analysis: Optional[Dict]
    practice_passage_suggestion: Optional[str]
    predicted_improvement: Optional[Dict]


class TypingReplayResponse(BaseModel):
    test_id: UUID
    events: List[Dict]
    original_content: str
    typed_content: str
    total_duration_ms: int
    mistake_highlights: List[Dict]
    pause_markers: List[Dict]
    correction_markers: List[Dict]
