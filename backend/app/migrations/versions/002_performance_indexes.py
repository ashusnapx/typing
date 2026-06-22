"""add performance indexes

Revision ID: 002
Revises: 001
Create Date: 2026-06-22
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy import text

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # typing_tests: composite index for history queries (user_id + status + completed_at)
    op.create_index(
        "ix_typing_tests_user_status_completed",
        "typing_tests",
        ["user_id", "status", "completed_at"],
        postgresql_where=text("status = 'completed'"),
    )
    # typing_tests: passage_id FK index (missing)
    op.create_index("ix_typing_tests_passage_id", "typing_tests", ["passage_id"])
    # typing_tests: completed_at for recency sorting
    op.create_index("ix_typing_tests_completed_at", "typing_tests", ["completed_at"])
    # typing_tests: started_at for active test lookups
    op.create_index("ix_typing_tests_started_at", "typing_tests", ["started_at"])

    # keystroke_events: composite for replay ORDER BY
    op.create_index(
        "ix_keystroke_events_test_timestamp",
        "keystroke_events",
        ["test_id", "timestamp_ms"],
    )

    # users: leaderboard sort + filter indexes
    op.create_index("ix_users_xp", "users", ["xp"])
    op.create_index("ix_users_xp_desc", "users", [sa.text("xp DESC")])
    op.create_index("ix_users_state", "users", ["state"])
    op.create_index("ix_users_district", "users", ["district"])
    op.create_index("ix_users_city", "users", ["city"])
    op.create_index("ix_users_college", "users", ["college"])
    op.create_index("ix_users_is_active", "users", ["is_active"])
    op.create_index("ix_users_last_active", "users", ["last_active_date"])
    # composite for scoped leaderboard queries
    op.create_index(
        "ix_users_state_xp",
        "users",
        ["state", "xp"],
        postgresql_where=text("state IS NOT NULL AND is_active = true"),
    )
    op.create_index(
        "ix_users_district_xp",
        "users",
        ["district", "xp"],
        postgresql_where=text("district IS NOT NULL AND is_active = true"),
    )

    # passages: filter columns for random-pick and listing queries
    op.create_index("ix_passages_category", "passages", ["category"])
    op.create_index("ix_passages_difficulty", "passages", ["difficulty"])
    op.create_index("ix_passages_language", "passages", ["language"])
    op.create_index("ix_passages_is_active", "passages", ["is_active"])
    # composite for random-pick WHERE clause (language + category + difficulty + is_active)
    op.create_index(
        "ix_passages_pick",
        "passages",
        ["language", "category", "difficulty", "is_active"],
    )
    # index for times_used counter updates
    op.create_index("ix_passages_times_used", "passages", ["times_used"])

    # pgvector HNSW index for semantic search on embeddings
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_passages_embedding ON passages "
        "USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 200)"
    )

    # user_analytics: composite for dashboard overview
    op.create_index("ix_user_analytics_updated", "user_analytics", ["updated_at"])

    # payments: composite for payment history (user_id + created_at)
    op.create_index(
        "ix_payments_user_created",
        "payments",
        ["user_id", "created_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_typing_tests_user_status_completed")
    op.drop_index("ix_typing_tests_passage_id")
    op.drop_index("ix_typing_tests_completed_at")
    op.drop_index("ix_typing_tests_started_at")
    op.drop_index("ix_keystroke_events_test_timestamp")
    op.drop_index("ix_users_xp")
    op.drop_index("ix_users_xp_desc")
    op.drop_index("ix_users_state")
    op.drop_index("ix_users_district")
    op.drop_index("ix_users_city")
    op.drop_index("ix_users_college")
    op.drop_index("ix_users_is_active")
    op.drop_index("ix_users_last_active")
    op.drop_index("ix_users_state_xp")
    op.drop_index("ix_users_district_xp")
    op.drop_index("ix_passages_category")
    op.drop_index("ix_passages_difficulty")
    op.drop_index("ix_passages_language")
    op.drop_index("ix_passages_is_active")
    op.drop_index("ix_passages_pick")
    op.drop_index("ix_passages_times_used")
    op.drop_index("ix_passages_embedding", if_exists=True)
    op.drop_index("ix_user_analytics_updated")
    op.drop_index("ix_payments_user_created")
