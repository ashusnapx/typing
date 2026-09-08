-- Candidate identity fields: phone and father's name.
--
-- Every SSC application form asks for both, and the platform now collects them
-- at sign-up so a result sheet can carry the same identity the candidate
-- applied under. `phone` already existed on the table and was never populated;
-- `father_name` is new.
--
-- Both are nullable. Accounts created before this migration have neither, and
-- the app asks for them on the next sign-in rather than locking anyone out of
-- a row that was valid when it was written.

ALTER TABLE users ADD COLUMN IF NOT EXISTS father_name varchar(255);

-- Carry the new fields through from the auth user's metadata, which is where
-- /api/auth/signup puts them when it creates the account with the service role.
--
-- COALESCE(NULLIF(TRIM(...), ''), NULL) so an empty string in metadata lands as
-- NULL — the app treats "missing" as "ask for it", and '' would silently pass
-- as answered.
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, phone, father_name, is_verified)
  VALUES (
    NEW.id,
    NEW.email,
    -- Fall back to the local-part of the email so full_name is never null.
    COALESCE(
      NULLIF(TRIM(NEW.raw_user_meta_data ->> 'full_name'), ''),
      NULLIF(TRIM(NEW.raw_user_meta_data ->> 'name'), ''),
      SPLIT_PART(NEW.email, '@', 1)
    ),
    NULLIF(TRIM(NEW.raw_user_meta_data ->> 'phone'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data ->> 'father_name'), ''),
    NEW.email_confirmed_at IS NOT NULL
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        -- Never overwrite an answer the candidate has already given.
        phone = COALESCE(public.users.phone, EXCLUDED.phone),
        father_name = COALESCE(public.users.father_name, EXCLUDED.father_name);

  RETURN NEW;
END;
$$;
