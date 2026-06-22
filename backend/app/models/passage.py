from app.database import Base
from sqlalchemy import Column, String, Integer, Text, Float, Boolean, DateTime, Enum as SAEnum, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from pgvector.sqlalchemy import Vector
import enum
from app.utils.uuid7 import uuid7


class PassageLanguage(str, enum.Enum):
    ENGLISH = "english"
    HINDI = "hindi"


class PassageCategory(str, enum.Enum):
    SSC_CHSL = "ssc_chsl"
    SSC_CGL = "ssc_cgl"
    BANKING = "banking"
    RAILWAY = "railway"
    GENERAL = "general"


class PassageDifficulty(str, enum.Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class Passage(Base):
    __tablename__ = "passages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid7)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    content_hindi = Column(Text, nullable=True)

    language = Column(SAEnum(PassageLanguage, name='passage_language', values_callable=lambda x: [e.value for e in x]), default=PassageLanguage.ENGLISH, nullable=False)
    category = Column(SAEnum(PassageCategory, name='passage_category', values_callable=lambda x: [e.value for e in x]), nullable=False)
    difficulty = Column(SAEnum(PassageDifficulty, name='passage_difficulty', values_callable=lambda x: [e.value for e in x]), default=PassageDifficulty.MEDIUM, nullable=False)

    exact_key_depressions = Column(Integer, nullable=False)
    word_count = Column(Integer, nullable=False)
    estimated_difficulty_score = Column(Float, nullable=True)

    topic = Column(String(255), nullable=True)
    source = Column(String(255), nullable=True)
    ssc_exam_year = Column(String(20), nullable=True)

    readability_score = Column(Float, nullable=True)
    avg_character_frequency = Column(JSON, nullable=True)
    weak_word_density = Column(JSON, nullable=True)

    is_verified = Column(Boolean, default=False, nullable=False)
    verified_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    verified_at = Column(DateTime, nullable=True)

    is_active = Column(Boolean, default=True, nullable=False)
    times_used = Column(Integer, default=0, nullable=False)
    is_exam_length = Column(Boolean, default=False, nullable=False)

    embedding = Column(Vector(1024), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
