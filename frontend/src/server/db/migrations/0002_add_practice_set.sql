ALTER TABLE "passages" ADD COLUMN IF NOT EXISTS "practice_set" integer;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "passage_practice_set_idx" ON "passages" USING btree ("practice_set");
