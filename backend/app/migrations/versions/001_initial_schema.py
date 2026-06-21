"""initial schema

Revision ID: 001
Revises:
Create Date: 2026-06-21
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from pgvector.sqlalchemy import Vector

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("clerk_id", sa.String(255), nullable=True),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("phone", sa.String(20), nullable=True),
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column("role", sa.Enum("student", "admin", "super_admin", name="userrole"), nullable=False),
        sa.Column("state", sa.String(100), nullable=True),
        sa.Column("district", sa.String(100), nullable=True),
        sa.Column("city", sa.String(100), nullable=True),
        sa.Column("college", sa.String(255), nullable=True),
        sa.Column("xp", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("level", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("streak_days", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("last_active_date", sa.DateTime(), nullable=True),
        sa.Column("is_premium", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("premium_expiry", sa.DateTime(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("is_verified", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("total_tests_taken", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("total_time_spent_seconds", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("best_wpm", sa.Float(), nullable=True),
        sa.Column("best_accuracy", sa.Float(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("clerk_id"),
        sa.UniqueConstraint("email"),
        sa.UniqueConstraint("phone"),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"])

    op.create_table(
        "passages",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("content_hindi", sa.Text(), nullable=True),
        sa.Column("language", sa.Enum("english", "hindi", name="passagelanguage"), nullable=False),
        sa.Column("category", sa.Enum("ssc_chsl", "ssc_cgl", "banking", "railway", "general", name="passagecategory"), nullable=False),
        sa.Column("difficulty", sa.Enum("easy", "medium", "hard", name="passagedifficulty"), nullable=False),
        sa.Column("exact_key_depressions", sa.Integer(), nullable=False),
        sa.Column("word_count", sa.Integer(), nullable=False),
        sa.Column("estimated_difficulty_score", sa.Float(), nullable=True),
        sa.Column("topic", sa.String(255), nullable=True),
        sa.Column("source", sa.String(255), nullable=True),
        sa.Column("ssc_exam_year", sa.String(20), nullable=True),
        sa.Column("readability_score", sa.Float(), nullable=True),
        sa.Column("avg_character_frequency", sa.JSON(), nullable=True),
        sa.Column("weak_word_density", sa.JSON(), nullable=True),
        sa.Column("is_verified", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("verified_by", sa.UUID(), nullable=True),
        sa.Column("verified_at", sa.DateTime(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("times_used", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("embedding", Vector(1024), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["verified_by"], ["users.id"]),
    )

    op.create_table(
        "typing_tests",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("passage_id", sa.UUID(), nullable=True),
        sa.Column("mode", sa.Enum("ssc_chsl", "ssc_cgl_dest", "ssc_hindi", "practice", "blind", "mock", "tcs_ion_replica", name="testmode"), nullable=False),
        sa.Column("status", sa.Enum("in_progress", "completed", "abandoned", name="teststatus"), nullable=False),
        sa.Column("duration_seconds", sa.Integer(), nullable=False),
        sa.Column("time_taken_seconds", sa.Float(), nullable=True),
        sa.Column("time_utilization_percentage", sa.Float(), nullable=True),
        sa.Column("typed_content", sa.Text(), nullable=True),
        sa.Column("original_content", sa.Text(), nullable=True),
        sa.Column("gross_wpm", sa.Float(), nullable=True),
        sa.Column("net_wpm", sa.Float(), nullable=True),
        sa.Column("accuracy", sa.Float(), nullable=True),
        sa.Column("error_percentage", sa.Float(), nullable=True),
        sa.Column("key_depression_count", sa.Integer(), nullable=True),
        sa.Column("correct_key_depressions", sa.Integer(), nullable=True),
        sa.Column("incorrect_key_depressions", sa.Integer(), nullable=True),
        sa.Column("omission_errors", sa.Integer(), nullable=True),
        sa.Column("addition_errors", sa.Integer(), nullable=True),
        sa.Column("wrong_word_errors", sa.Integer(), nullable=True),
        sa.Column("substitution_errors", sa.Integer(), nullable=True),
        sa.Column("formatting_errors", sa.Integer(), nullable=True),
        sa.Column("space_errors", sa.Integer(), nullable=True),
        sa.Column("total_errors", sa.Integer(), nullable=True),
        sa.Column("total_words_typed", sa.Integer(), nullable=True),
        sa.Column("total_correct_words", sa.Integer(), nullable=True),
        sa.Column("backspace_count", sa.Integer(), nullable=True),
        sa.Column("pause_count", sa.Integer(), nullable=True),
        sa.Column("total_pause_duration_seconds", sa.Float(), nullable=True),
        sa.Column("avg_pause_duration", sa.Float(), nullable=True),
        sa.Column("longest_pause_duration", sa.Float(), nullable=True),
        sa.Column("typing_rhythm_score", sa.Float(), nullable=True),
        sa.Column("consistency_score", sa.Float(), nullable=True),
        sa.Column("is_qualified", sa.Boolean(), nullable=True),
        sa.Column("qualification_probability", sa.Float(), nullable=True),
        sa.Column("keystroke_summary", sa.JSON(), nullable=True),
        sa.Column("error_zones", sa.JSON(), nullable=True),
        sa.Column("weak_words", sa.JSON(), nullable=True),
        sa.Column("xp_earned", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_premium", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["passage_id"], ["passages.id"]),
    )
    op.create_index(op.f("ix_typing_tests_user_id"), "typing_tests", ["user_id"])

    op.create_table(
        "keystroke_events",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("test_id", sa.UUID(), nullable=False),
        sa.Column("key", sa.String(10), nullable=False),
        sa.Column("timestamp_ms", sa.Integer(), nullable=False),
        sa.Column("duration_ms", sa.Integer(), nullable=True),
        sa.Column("is_error", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("is_backspace", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("cursor_position", sa.Integer(), nullable=True),
        sa.Column("expected_char", sa.String(10), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["test_id"], ["typing_tests.id"]),
    )
    op.create_index(op.f("ix_keystroke_events_test_id"), "keystroke_events", ["test_id"])

    op.create_table(
        "error_patterns",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("pattern_type", sa.String(100), nullable=False),
        sa.Column("pattern_value", sa.String(255), nullable=False),
        sa.Column("frequency", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("last_occurred_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
    )
    op.create_index(op.f("ix_error_patterns_user_id"), "error_patterns", ["user_id"])

    op.create_table(
        "typing_sessions",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("date", sa.DateTime(), nullable=False),
        sa.Column("total_duration_seconds", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("tests_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("avg_wpm", sa.Float(), nullable=True),
        sa.Column("avg_accuracy", sa.Float(), nullable=True),
        sa.Column("total_corrections", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("xp_earned", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
    )
    op.create_index(op.f("ix_typing_sessions_user_id"), "typing_sessions", ["user_id"])

    op.create_table(
        "user_analytics",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("total_tests", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("total_time_seconds", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("avg_wpm", sa.Float(), nullable=True),
        sa.Column("avg_accuracy", sa.Float(), nullable=True),
        sa.Column("best_wpm", sa.Float(), nullable=True),
        sa.Column("best_accuracy", sa.Float(), nullable=True),
        sa.Column("wpm_trend", sa.JSON(), nullable=True),
        sa.Column("accuracy_trend", sa.JSON(), nullable=True),
        sa.Column("consistency_score", sa.Float(), nullable=True),
        sa.Column("weak_words", sa.JSON(), nullable=True),
        sa.Column("left_hand_error_rate", sa.Float(), nullable=True),
        sa.Column("right_hand_error_rate", sa.Float(), nullable=True),
        sa.Column("shift_key_error_rate", sa.Float(), nullable=True),
        sa.Column("number_row_error_rate", sa.Float(), nullable=True),
        sa.Column("common_mistypes", sa.JSON(), nullable=True),
        sa.Column("fatigue_start_time", sa.Integer(), nullable=True),
        sa.Column("last_20_test_ids", sa.JSON(), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.UniqueConstraint("user_id"),
    )
    op.create_index(op.f("ix_user_analytics_user_id"), "user_analytics", ["user_id"])

    op.create_table(
        "subscriptions",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("plan", sa.String(50), nullable=False),
        sa.Column("status", sa.String(20), nullable=False),
        sa.Column("start_date", sa.DateTime(), nullable=False),
        sa.Column("end_date", sa.DateTime(), nullable=True),
        sa.Column("auto_renew", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.UniqueConstraint("user_id"),
    )
    op.create_index(op.f("ix_subscriptions_user_id"), "subscriptions", ["user_id"])

    op.create_table(
        "payments",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("subscription_id", sa.UUID(), nullable=True),
        sa.Column("amount", sa.Float(), nullable=False),
        sa.Column("currency", sa.String(10), nullable=False, server_default="INR"),
        sa.Column("provider", sa.String(50), nullable=False),
        sa.Column("provider_payment_id", sa.String(255), nullable=True),
        sa.Column("provider_order_id", sa.String(255), nullable=True),
        sa.Column("status", sa.String(20), nullable=False),
        sa.Column("gst_invoice_number", sa.String(50), nullable=True),
        sa.Column("gst_amount", sa.Float(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["subscription_id"], ["subscriptions.id"]),
    )
    op.create_index(op.f("ix_payments_user_id"), "payments", ["user_id"])


def downgrade() -> None:
    op.drop_table("payments")
    op.drop_table("subscriptions")
    op.drop_table("user_analytics")
    op.drop_table("typing_sessions")
    op.drop_table("error_patterns")
    op.drop_table("keystroke_events")
    op.drop_table("typing_tests")
    op.drop_table("passages")
    op.drop_table("users")

    op.execute("DROP TYPE IF EXISTS userrole")
    op.execute("DROP TYPE IF EXISTS passagelanguage")
    op.execute("DROP TYPE IF EXISTS passagecategory")
    op.execute("DROP TYPE IF EXISTS passagedifficulty")
    op.execute("DROP TYPE IF EXISTS testmode")
    op.execute("DROP TYPE IF EXISTS teststatus")
