from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime
from uuid import UUID
from app.models.test import TestMode


class StartTestRequest(BaseModel):
    mode: TestMode
    passage_id: Optional[UUID] = None
    duration_seconds: int


class StartTestResponse(BaseModel):
    test_id: UUID
    passage: Dict
    mode: TestMode
    duration_seconds: int
    started_at: datetime


class SubmitTestRequest(BaseModel):
    typed_content: str
    keystroke_events: List[Dict]
    time_taken_seconds: float


class DirectSubmitRequest(BaseModel):
    mode: TestMode
    passage_id: UUID
    duration_seconds: int
    typed_content: str
    keystroke_events: List[Dict]
    time_taken_seconds: float


class TestResultResponse(BaseModel):
    test_id: UUID
    mode: TestMode
    gross_wpm: float
    net_wpm: float
    accuracy: float
    error_percentage: float

    ssc_net_wpm: float = 0.0
    ssc_accuracy: float = 0.0
    ssc_error_percentage: float = 0.0
    full_mistakes: int = 0
    half_mistakes: int = 0

    key_depression_count: int
    total_errors: int
    omission_errors: int
    addition_errors: int
    wrong_word_errors: int
    substitution_errors: int
    formatting_errors: int
    space_errors: int

    time_taken_seconds: float
    time_utilization_percentage: float

    backspace_count: int
    pause_count: int
    total_pause_duration_seconds: float

    typing_rhythm_score: Optional[float]
    consistency_score: Optional[float]

    is_qualified: Optional[bool]
    qualification_probability: Optional[float]

    xp_earned: int
    weak_words: Optional[List[str]]
    error_zones: Optional[Dict]
    feedback: Optional[str]

    class Config:
        from_attributes = True


class TestHistoryItem(BaseModel):
    id: UUID
    mode: TestMode
    gross_wpm: float
    net_wpm: float
    accuracy: float
    total_errors: int
    duration_seconds: int
    is_qualified: Optional[bool]
    xp_earned: int
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True


class KeystrokeReplay(BaseModel):
    events: List[Dict]
    original_content: str
    typed_content: str
    total_duration_ms: int
