-- Custom UUID v7 generator function
CREATE OR REPLACE FUNCTION generate_uuid_v7()
RETURNS uuid AS $$
DECLARE
  timestamp_ms bigint;
  bytes bytea;
BEGIN
  timestamp_ms := floor(extract(epoch from clock_timestamp()) * 1000)::bigint;
  bytes := set_byte('\x000000000000'::bytea, 0, ((timestamp_ms >> 40) & 255)::int);
  bytes := set_byte(bytes, 1, ((timestamp_ms >> 32) & 255)::int);
  bytes := set_byte(bytes, 2, ((timestamp_ms >> 24) & 255)::int);
  bytes := set_byte(bytes, 3, ((timestamp_ms >> 16) & 255)::int);
  bytes := set_byte(bytes, 4, ((timestamp_ms >> 8) & 255)::int);
  bytes := set_byte(bytes, 5, (timestamp_ms & 255)::int);
  bytes := bytes || gen_random_bytes(10);
  bytes := set_byte(bytes, 6, (get_byte(bytes, 6) & 15) | 112);
  bytes := set_byte(bytes, 8, (get_byte(bytes, 8) & 63) | 128);
  RETURN encode(bytes, 'hex')::uuid;
END;
$$ LANGUAGE plpgsql VOLATILE;

--> statement-breakpoint
-- Drop existing tables to start clean and avoid conflicts with python backend tables
DROP TABLE IF EXISTS "keystroke_summaries" CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS "typing_tests" CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS "analytics_events" CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS "sessions" CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS "users" CASCADE;

--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT generate_uuid_v7() NOT NULL,
	"email" varchar(255) NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"password_hash" varchar(255),
	"role" varchar(50) DEFAULT 'student' NOT NULL,
	"xp" integer DEFAULT 0 NOT NULL,
	"level" integer DEFAULT 1 NOT NULL,
	"state" varchar(100),
	"district" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

--> statement-breakpoint
CREATE TABLE "typing_tests" (
	"id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"mode" varchar(50) NOT NULL,
	"duration_seconds" integer NOT NULL,
	"gross_wpm" integer,
	"net_wpm" integer,
	"accuracy" integer,
	"total_errors" integer,
	"trust_score" integer DEFAULT 100 NOT NULL,
	"idempotency_key" varchar(255) NOT NULL,
	"created_at" timestamp NOT NULL,
	CONSTRAINT "typing_tests_id_created_at_pk" PRIMARY KEY("id","created_at")
) PARTITION BY RANGE (created_at);

--> statement-breakpoint
CREATE TABLE "analytics_events" (
	"id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"event_data" jsonb,
	"created_at" timestamp NOT NULL,
	CONSTRAINT "analytics_events_id_created_at_pk" PRIMARY KEY("id","created_at")
) PARTITION BY RANGE (created_at);

--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT generate_uuid_v7() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

--> statement-breakpoint
CREATE TABLE "keystroke_summaries" (
	"id" uuid NOT NULL,
	"test_id" uuid NOT NULL,
	"key" varchar(50) NOT NULL,
	"timestamp_ms" integer NOT NULL,
	"duration_ms" integer NOT NULL,
	"is_error" boolean NOT NULL,
	"is_backspace" boolean NOT NULL,
	"cursor_position" integer NOT NULL,
	"expected_char" varchar(10),
	"created_at" timestamp NOT NULL,
	CONSTRAINT "keystroke_summaries_id_created_at_pk" PRIMARY KEY("id","created_at")
) PARTITION BY RANGE (created_at);

-- Create active monthly partitions for May 2026 to Sep 2026
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS typing_tests_2026_05 PARTITION OF typing_tests FOR VALUES FROM ('2026-05-01 00:00:00') TO ('2026-06-01 00:00:00');
CREATE TABLE IF NOT EXISTS typing_tests_2026_06 PARTITION OF typing_tests FOR VALUES FROM ('2026-06-01 00:00:00') TO ('2026-07-01 00:00:00');
CREATE TABLE IF NOT EXISTS typing_tests_2026_07 PARTITION OF typing_tests FOR VALUES FROM ('2026-07-01 00:00:00') TO ('2026-08-01 00:00:00');
CREATE TABLE IF NOT EXISTS typing_tests_2026_08 PARTITION OF typing_tests FOR VALUES FROM ('2026-08-01 00:00:00') TO ('2026-09-01 00:00:00');
CREATE TABLE IF NOT EXISTS typing_tests_2026_09 PARTITION OF typing_tests FOR VALUES FROM ('2026-09-01 00:00:00') TO ('2026-10-01 00:00:00');

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS analytics_events_2026_05 PARTITION OF analytics_events FOR VALUES FROM ('2026-05-01 00:00:00') TO ('2026-06-01 00:00:00');
CREATE TABLE IF NOT EXISTS analytics_events_2026_06 PARTITION OF analytics_events FOR VALUES FROM ('2026-06-01 00:00:00') TO ('2026-07-01 00:00:00');
CREATE TABLE IF NOT EXISTS analytics_events_2026_07 PARTITION OF analytics_events FOR VALUES FROM ('2026-07-01 00:00:00') TO ('2026-08-01 00:00:00');
CREATE TABLE IF NOT EXISTS analytics_events_2026_08 PARTITION OF analytics_events FOR VALUES FROM ('2026-08-01 00:00:00') TO ('2026-09-01 00:00:00');
CREATE TABLE IF NOT EXISTS analytics_events_2026_09 PARTITION OF analytics_events FOR VALUES FROM ('2026-09-01 00:00:00') TO ('2026-10-01 00:00:00');

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS keystroke_summaries_2026_05 PARTITION OF keystroke_summaries FOR VALUES FROM ('2026-05-01 00:00:00') TO ('2026-06-01 00:00:00');
CREATE TABLE IF NOT EXISTS keystroke_summaries_2026_06 PARTITION OF keystroke_summaries FOR VALUES FROM ('2026-06-01 00:00:00') TO ('2026-07-01 00:00:00');
CREATE TABLE IF NOT EXISTS keystroke_summaries_2026_07 PARTITION OF keystroke_summaries FOR VALUES FROM ('2026-07-01 00:00:00') TO ('2026-08-01 00:00:00');
CREATE TABLE IF NOT EXISTS keystroke_summaries_2026_08 PARTITION OF keystroke_summaries FOR VALUES FROM ('2026-08-01 00:00:00') TO ('2026-09-01 00:00:00');
CREATE TABLE IF NOT EXISTS keystroke_summaries_2026_09 PARTITION OF keystroke_summaries FOR VALUES FROM ('2026-09-01 00:00:00') TO ('2026-10-01 00:00:00');

--> statement-breakpoint
ALTER TABLE "typing_tests" ADD CONSTRAINT "typing_tests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;

--> statement-breakpoint
CREATE UNIQUE INDEX "email_idx" ON "users" USING btree ("email");
--> statement-breakpoint
CREATE INDEX "xp_idx" ON "users" USING btree ("xp");
--> statement-breakpoint
CREATE INDEX "state_xp_idx" ON "users" USING btree ("state","xp");
--> statement-breakpoint
CREATE INDEX "user_id_idx" ON "typing_tests" USING btree ("user_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "idempotency_idx" ON "typing_tests" USING btree ("idempotency_key", "created_at");
--> statement-breakpoint
CREATE INDEX "analytics_user_id_idx" ON "analytics_events" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX "session_user_id_idx" ON "sessions" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX "session_token_idx" ON "sessions" USING btree ("token");
--> statement-breakpoint
CREATE INDEX "keystroke_test_id_idx" ON "keystroke_summaries" USING btree ("test_id");