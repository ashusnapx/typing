-- Close the deny-all gap left by RLS.
--
-- The original schema enabled row level security on six tables but never added
-- a policy to any of them. RLS with no policy denies everything, so analytics,
-- keystroke capture, sessions and billing reads were failing silently — no
-- error, just empty results. Each table gets the owner policy it should have
-- had.

-- Owned directly by a user. -------------------------------------------------
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'error_patterns', 'typing_sessions', 'user_analytics'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', t || '_own', t);
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)',
      t || '_own', t
    );
  END LOOP;
END $$;

-- Billing: readable by the owner, but only writable by the service role, which
-- bypasses RLS. A client must never be able to grant itself a subscription.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['subscriptions', 'payments'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', t || '_read_own', t);
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR SELECT USING (auth.uid() = user_id)',
      t || '_read_own', t
    );
  END LOOP;
END $$;

-- Keystrokes hang off a test rather than a user, so ownership is inherited.
DROP POLICY IF EXISTS keystroke_events_own ON keystroke_events;
CREATE POLICY keystroke_events_own ON keystroke_events
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM typing_tests t
      WHERE t.id = keystroke_events.test_id AND t.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM typing_tests t
      WHERE t.id = keystroke_events.test_id AND t.user_id = auth.uid()
    )
  );

-- The subquery above runs per row on insert, so the lookup needs an index.
CREATE INDEX IF NOT EXISTS idx_keystroke_events_test_id
  ON keystroke_events(test_id);
