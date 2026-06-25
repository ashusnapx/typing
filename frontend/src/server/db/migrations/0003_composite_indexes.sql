-- Composite index for dashboard/user queries: WHERE user_id = ? ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_typing_tests_user_created
  ON typing_tests (user_id, created_at DESC);

-- Composite index for passage random queries: WHERE category = ? AND difficulty = ? AND is_active = ? AND is_exam_length = ?
CREATE INDEX IF NOT EXISTS idx_passages_random_lookup
  ON passages (category, difficulty, is_active, is_exam_length)
  WHERE is_active = true;

-- Composite index for leaderboard repair: DISTINCT ON (user_id) ORDER BY user_id, net_wpm DESC
CREATE INDEX IF NOT EXISTS idx_typing_tests_user_wpm
  ON typing_tests (user_id, net_wpm DESC);

-- Index for weekly activity queries: WHERE user_id = ? AND created_at >= ?
CREATE INDEX IF NOT EXISTS idx_typing_tests_user_created_activity
  ON typing_tests (user_id, created_at)
  WHERE created_at >= NOW() - INTERVAL '7 days';
