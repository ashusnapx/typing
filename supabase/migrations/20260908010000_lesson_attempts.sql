-- Record lesson attempts alongside exam attempts.
--
-- Lessons wrote their XP to users.xp and nothing else, so a candidate could
-- finish a dozen drills, earn 139 XP, and still read "Tests taken 0, Avg WPM
-- 0.0" on the dashboard. The work was real; only the record was missing.
--
-- They go in typing_tests under mode = 'lesson' rather than a table of their
-- own, because everything a lesson produces — speed, accuracy, duration,
-- errors, XP — already has a column here. Every exam-facing figure filters
-- mode <> 'lesson' so a two-minute home-row drill can never be averaged into
-- an SSC readiness number.
--
-- `lesson_id` is what typing_tests could not otherwise express: which of the
-- thirty-four drills this was. Without it the dashboard can count attempts but
-- not answer "how far through the course am I", which is the one lesson
-- statistic worth showing.

ALTER TABLE typing_tests ADD COLUMN IF NOT EXISTS lesson_id varchar(100);

-- Reading "which lessons has this user cleared" is the only query this column
-- serves, and it always carries the user.
CREATE INDEX IF NOT EXISTS typing_tests_user_lesson_idx
  ON typing_tests (user_id, lesson_id)
  WHERE lesson_id IS NOT NULL;
