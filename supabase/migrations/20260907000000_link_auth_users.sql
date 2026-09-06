-- Link application users to Supabase Auth.
--
-- The `users` table was created with its own generated UUID and no relationship
-- to `auth.users`. Every sign-in therefore had to look a profile up by email
-- and, if it was missing, create one from the client — which is why the auth
-- store carried several layers of fallback for "the profile might not exist
-- yet". This makes the row appear atomically with the auth user instead.
--
-- Existing rows are matched on email where possible; anything unmatched keeps
-- its old id and simply has no auth user, which is correct for seed data.

-- 1. Adopt auth.users ids for any existing rows that share an email. -----------
UPDATE users u
SET id = a.id
FROM auth.users a
WHERE a.email = u.email
  AND u.id <> a.id
  AND NOT EXISTS (SELECT 1 FROM users u2 WHERE u2.id = a.id);

-- 2. Drop columns that belonged to the previous auth scheme. -------------------
ALTER TABLE users DROP COLUMN IF EXISTS clerk_id;
ALTER TABLE users DROP COLUMN IF EXISTS password_hash;

-- 3. Create the profile row whenever an auth user is created. -----------------
-- SECURITY DEFINER so it can write to public.users from the auth schema's
-- trigger context. search_path is pinned to defeat search-path hijacking.
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, is_verified)
  VALUES (
    NEW.id,
    NEW.email,
    -- Fall back to the local-part of the email so full_name is never null.
    COALESCE(
      NULLIF(TRIM(NEW.raw_user_meta_data ->> 'full_name'), ''),
      NULLIF(TRIM(NEW.raw_user_meta_data ->> 'name'), ''),
      SPLIT_PART(NEW.email, '@', 1)
    ),
    NEW.email_confirmed_at IS NOT NULL
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- 4. Backfill profiles for auth users that predate the trigger. ---------------
INSERT INTO public.users (id, email, full_name, is_verified)
SELECT
  a.id,
  a.email,
  COALESCE(
    NULLIF(TRIM(a.raw_user_meta_data ->> 'full_name'), ''),
    SPLIT_PART(a.email, '@', 1)
  ),
  a.email_confirmed_at IS NOT NULL
FROM auth.users a
WHERE a.email IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- 5. Row level security: a user sees and edits only their own row. ------------
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS users_select_own ON users;
CREATE POLICY users_select_own ON users
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS users_update_own ON users;
CREATE POLICY users_update_own ON users
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Inserts happen through the SECURITY DEFINER trigger above, so no INSERT
-- policy is granted to clients.

-- 6. Passages are public reference data — readable by anyone, including guests
--    taking a test without an account.
ALTER TABLE passages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS passages_public_read ON passages;
CREATE POLICY passages_public_read ON passages
  FOR SELECT USING (true);

-- 7. A user's own attempts. ---------------------------------------------------
ALTER TABLE typing_tests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tests_own ON typing_tests;
CREATE POLICY tests_own ON typing_tests
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
