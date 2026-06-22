import re
from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from app.models.passage import PassageLanguage, PassageCategory, PassageDifficulty


def strip_html(value: str) -> str:
    return re.sub(r'<[^>]*>', '', value).strip()


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

    @field_validator("title", "content", "content_hindi", "topic", "source")
    @classmethod
    def sanitize_html(cls, v):
        if v is None:
            return v
        cleaned = strip_html(v)
        if len(cleaned) < len(v.strip()):
            raise ValueError("HTML tags are not allowed in passage content")
        return v


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
    is_exam_length: bool = False
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
