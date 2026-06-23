from app.database import Base
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Enum as SAEnum, ForeignKey, JSON, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import enum
from app.utils.uuid7 import uuid7


class TestMode(str, enum.Enum):
    SSC_CHSL = "ssc_chsl"
    SSC_CGL_DEST = "ssc_cgl_dest"
    SSC_HINDI = "ssc_hindi"
    PRACTICE = "practice"
    BLIND = "blind"
    MOCK = "mock"
    TCS_ION_REPLICA = "tcs_ion_replica"


class TestStatus(str, enum.Enum):
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    ABANDONED = "abandoned"


class TypingTest(Base):
    __tablename__ = "typing_tests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid7)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    passage_id = Column(UUID(as_uuid=True), ForeignKey("passages.id"), nullable=True)

    mode = Column(SAEnum(TestMode, name='test_mode', values_callable=lambda x: [e.value for e in x]), nullable=False)
    status = Column(SAEnum(TestStatus, name='test_status', values_callable=lambda x: [e.value for e in x]), default=TestStatus.IN_PROGRESS, nullable=False)

    duration_seconds = Column(Integer, nullable=False)
    time_taken_seconds = Column(Float, nullable=True)
    time_utilization_percentage = Column(Float, nullable=True)

    typed_content = Column(Text, nullable=True)
    original_content = Column(Text, nullable=True)

    gross_wpm = Column(Float, nullable=True)
    net_wpm = Column(Float, nullable=True)
    accuracy = Column(Float, nullable=True)
    error_percentage = Column(Float, nullable=True)
    key_depression_count = Column(Integer, nullable=True)
    correct_key_depressions = Column(Integer, nullable=True)
    incorrect_key_depressions = Column(Integer, nullable=True)

    omission_errors = Column(Integer, nullable=True)
    addition_errors = Column(Integer, nullable=True)
    wrong_word_errors = Column(Integer, nullable=True)
    substitution_errors = Column(Integer, nullable=True)
    formatting_errors = Column(Integer, nullable=True)
    space_errors = Column(Integer, nullable=True)

    full_mistakes = Column(Integer, nullable=True)
    half_mistakes = Column(Integer, nullable=True)

    total_errors = Column(Integer, nullable=True)
    total_words_typed = Column(Integer, nullable=True)
    total_correct_words = Column(Integer, nullable=True)

    backspace_count = Column(Integer, nullable=True)
    pause_count = Column(Integer, nullable=True)
    total_pause_duration_seconds = Column(Float, nullable=True)
    avg_pause_duration = Column(Float, nullable=True)
    longest_pause_duration = Column(Float, nullable=True)

    typing_rhythm_score = Column(Float, nullable=True)
    consistency_score = Column(Float, nullable=True)

    is_qualified = Column(Boolean, nullable=True)
    qualification_probability = Column(Float, nullable=True)

    keystroke_summary = Column(JSON, nullable=True)
    error_zones = Column(JSON, nullable=True)
    weak_words = Column(JSON, nullable=True)

    xp_earned = Column(Integer, default=0, nullable=False)
    is_premium = Column(Boolean, default=False, nullable=False)

    started_at = Column(DateTime(timezone=True), nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class KeystrokeEvent(Base):
    __tablename__ = "keystroke_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid7)
    test_id = Column(UUID(as_uuid=True), ForeignKey("typing_tests.id"), nullable=False, index=True)
    key = Column(String(10), nullable=False)
    timestamp_ms = Column(Integer, nullable=False)
    duration_ms = Column(Integer, nullable=True)
    is_error = Column(Boolean, default=False, nullable=False)
    is_backspace = Column(Boolean, default=False, nullable=False)
    cursor_position = Column(Integer, nullable=True)
    expected_char = Column(String(10), nullable=True)
