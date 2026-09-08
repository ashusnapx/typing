-- Teach `test_mode` the modes the app now offers.
--
-- `typing_tests.mode` is a Postgres enum, not the varchar the Drizzle schema
-- declares — so the type system never caught that four modes the app can
-- produce have no value here. Three are the post-wise exam variants added with
-- the Eduquity work: a candidate could sit an SSC CHSL DEO test, finish it, and
-- have the submission fail on an enum violation. The fourth is 'lesson', which
-- is how lesson attempts are now recorded so the dashboard can show that the
-- work happened.
--
-- ADD VALUE IF NOT EXISTS is idempotent, and each runs as its own statement:
-- adding an enum value cannot share a transaction with a use of that value.

ALTER TYPE test_mode ADD VALUE IF NOT EXISTS 'ssc_chsl_deo';
ALTER TYPE test_mode ADD VALUE IF NOT EXISTS 'ssc_chsl_deo_grade_a';
ALTER TYPE test_mode ADD VALUE IF NOT EXISTS 'ssc_cgl_cpt';
ALTER TYPE test_mode ADD VALUE IF NOT EXISTS 'lesson';
