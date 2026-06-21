from app.database import Base
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, JSON, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid


class ErrorPattern(Base):
    __tablename__ = "error_patterns"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    pattern_type = Column(String(100), nullable=False)
    pattern_value = Column(String(255), nullable=False)
    frequency = Column(Integer, default=0, nullable=False)
    last_occurred_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class TypingSession(Base):
    __tablename__ = "typing_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    date = Column(DateTime, nullable=False)
    total_duration_seconds = Column(Integer, default=0, nullable=False)
    tests_count = Column(Integer, default=0, nullable=False)
    avg_wpm = Column(Float, nullable=True)
    avg_accuracy = Column(Float, nullable=True)
    total_corrections = Column(Integer, default=0, nullable=False)
    xp_earned = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class UserAnalytics(Base):
    __tablename__ = "user_analytics"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, unique=True, index=True)
    total_tests = Column(Integer, default=0, nullable=False)
    total_time_seconds = Column(Integer, default=0, nullable=False)
    avg_wpm = Column(Float, nullable=True)
    avg_accuracy = Column(Float, nullable=True)
    best_wpm = Column(Float, nullable=True)
    best_accuracy = Column(Float, nullable=True)
    wpm_trend = Column(JSON, nullable=True)
    accuracy_trend = Column(JSON, nullable=True)
    consistency_score = Column(Float, nullable=True)
    weak_words = Column(JSON, nullable=True)
    left_hand_error_rate = Column(Float, nullable=True)
    right_hand_error_rate = Column(Float, nullable=True)
    shift_key_error_rate = Column(Float, nullable=True)
    number_row_error_rate = Column(Float, nullable=True)
    common_mistypes = Column(JSON, nullable=True)
    fatigue_start_time = Column(Integer, nullable=True)
    last_20_test_ids = Column(JSON, nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
