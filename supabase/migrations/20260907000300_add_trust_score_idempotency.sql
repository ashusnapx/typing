-- Columns the drizzle schema selects on every typing_tests read/write.
-- They were added to the app schema without a matching migration, so any
-- database created from migrations alone is missing them and user.dashboard
-- fails with "Failed query ... from typing_tests".
ALTER TABLE typing_tests
  ADD COLUMN IF NOT EXISTS trust_score INTEGER NOT NULL DEFAULT 100;

ALTER TABLE typing_tests
  ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(255) NOT NULL DEFAULT gen_random_uuid()::text;

CREATE UNIQUE INDEX IF NOT EXISTS idempotency_idx
  ON typing_tests (idempotency_key, created_at);
