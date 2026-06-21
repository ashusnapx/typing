from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from app.models.passage import PassageLanguage, PassageCategory, PassageDifficulty


class PassageCreate(BaseModel):
    title: str
    content: str
    content_hindi: Optional[str] = None
    language: PassageLanguage = PassageLanguage.ENGLISH
    category: PassageCategory
    difficulty: PassageDifficulty = PassageDifficulty.MEDIUM
    exact_key_depressions: int
    word_count: int
    estimated_difficulty_score: Optional[float] = None
    topic: Optional[str] = None
    source: Optional[str] = None
    ssc_exam_year: Optional[str] = None


class PassageResponse(BaseModel):
    id: UUID
    title: str
    content: str
    language: PassageLanguage
    category: PassageCategory
    difficulty: PassageDifficulty
    exact_key_depressions: int
    word_count: int
    topic: Optional[str]
    is_verified: bool
    created_at: datetime

    class Config:
        from_attributes = True


class PassageListResponse(BaseModel):
    id: UUID
    title: str
    language: PassageLanguage
    category: PassageCategory
    difficulty: PassageDifficulty
    exact_key_depressions: int
    word_count: int
    topic: Optional[str]
    is_verified: bool
    times_used: int

    class Config:
        from_attributes = True
