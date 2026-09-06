-- Delete profiles that have no auth user (test rows, or users removed before
-- the FK existed).
DELETE FROM public.users u
WHERE NOT EXISTS (SELECT 1 FROM auth.users a WHERE a.id = u.id);

-- Tie the profile's lifetime to the auth user's.
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_id_fkey;
ALTER TABLE public.users
  ADD CONSTRAINT users_id_fkey
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
