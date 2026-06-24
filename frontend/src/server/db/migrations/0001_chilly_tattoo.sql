CREATE TABLE "passages" (
	"id" uuid PRIMARY KEY DEFAULT generate_uuid_v7() NOT NULL,
	"title" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"content_hindi" text,
	"language" varchar(20) DEFAULT 'english' NOT NULL,
	"category" varchar(50) NOT NULL,
	"difficulty" varchar(20) DEFAULT 'medium' NOT NULL,
	"exact_key_depressions" integer NOT NULL,
	"word_count" integer NOT NULL,
	"estimated_difficulty_score" double precision,
	"topic" varchar(255),
	"source" varchar(255),
	"ssc_exam_year" varchar(20),
	"readability_score" double precision,
	"avg_character_frequency" jsonb,
	"weak_word_density" jsonb,
	"is_verified" boolean DEFAULT false NOT NULL,
	"verified_by" uuid,
	"verified_at" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"times_used" integer DEFAULT 0 NOT NULL,
	"is_exam_length" boolean DEFAULT false NOT NULL,
	"embedding" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT generate_uuid_v7() NOT NULL,
	"user_id" uuid NOT NULL,
	"subscription_id" uuid,
	"amount" double precision NOT NULL,
	"currency" varchar(10) DEFAULT 'INR' NOT NULL,
	"provider" varchar(50) NOT NULL,
	"provider_payment_id" varchar(255),
	"provider_order_id" varchar(255),
	"status" varchar(20) NOT NULL,
	"gst_invoice_number" varchar(50),
	"gst_amount" double precision,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT generate_uuid_v7() NOT NULL,
	"user_id" uuid NOT NULL,
	"plan" varchar(50) NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp,
	"auto_renew" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "error_patterns" (
	"id" uuid PRIMARY KEY DEFAULT generate_uuid_v7() NOT NULL,
	"user_id" uuid NOT NULL,
	"pattern_type" varchar(100) NOT NULL,
	"pattern_value" varchar(255) NOT NULL,
	"frequency" integer DEFAULT 0 NOT NULL,
	"last_occurred_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "typing_sessions" (
	"id" uuid PRIMARY KEY DEFAULT generate_uuid_v7() NOT NULL,
	"user_id" uuid NOT NULL,
	"date" timestamp NOT NULL,
	"total_duration_seconds" integer DEFAULT 0 NOT NULL,
	"tests_count" integer DEFAULT 0 NOT NULL,
	"avg_wpm" double precision,
	"avg_accuracy" double precision,
	"total_corrections" integer DEFAULT 0 NOT NULL,
	"xp_earned" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_analytics" (
	"id" uuid PRIMARY KEY DEFAULT generate_uuid_v7() NOT NULL,
	"user_id" uuid NOT NULL,
	"total_tests" integer DEFAULT 0 NOT NULL,
	"total_time_seconds" integer DEFAULT 0 NOT NULL,
	"avg_wpm" double precision,
	"avg_accuracy" double precision,
	"best_wpm" double precision,
	"best_accuracy" double precision,
	"wpm_trend" jsonb,
	"accuracy_trend" jsonb,
	"consistency_score" double precision,
	"weak_words" jsonb,
	"left_hand_error_rate" double precision,
	"right_hand_error_rate" double precision,
	"shift_key_error_rate" double precision,
	"number_row_error_rate" double precision,
	"common_mistypes" jsonb,
	"fatigue_start_time" integer,
	"last_20_test_ids" jsonb,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP INDEX "idempotency_idx";--> statement-breakpoint
ALTER TABLE "typing_tests" ALTER COLUMN "gross_wpm" SET DATA TYPE double precision;--> statement-breakpoint
ALTER TABLE "typing_tests" ALTER COLUMN "net_wpm" SET DATA TYPE double precision;--> statement-breakpoint
ALTER TABLE "typing_tests" ALTER COLUMN "accuracy" SET DATA TYPE double precision;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "clerk_id" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "phone" varchar(20);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password_changed_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password_history" jsonb;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "failed_login_attempts" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "locked_until" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "city" varchar(100);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "college" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "streak_days" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_active_date" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_premium" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "premium_expiry" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "total_tests_taken" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "total_time_spent_seconds" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "best_wpm" double precision;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "best_accuracy" double precision;--> statement-breakpoint
ALTER TABLE "typing_tests" ADD COLUMN "passage_id" uuid;--> statement-breakpoint
ALTER TABLE "typing_tests" ADD COLUMN "status" varchar(20) DEFAULT 'completed' NOT NULL;--> statement-breakpoint
ALTER TABLE "typing_tests" ADD COLUMN "time_taken_seconds" double precision;--> statement-breakpoint
ALTER TABLE "typing_tests" ADD COLUMN "time_utilization_percentage" double precision;--> statement-breakpoint
ALTER TABLE "typing_tests" ADD COLUMN "typed_content" text;--> statement-breakpoint
ALTER TABLE "typing_tests" ADD COLUMN "original_content" text;--> statement-breakpoint
ALTER TABLE "typing_tests" ADD COLUMN "error_percentage" double precision;--> statement-breakpoint
ALTER TABLE "typing_tests" ADD COLUMN "key_depression_count" integer;--> statement-breakpoint
ALTER TABLE "typing_tests" ADD COLUMN "correct_key_depressions" integer;--> statement-breakpoint
ALTER TABLE "typing_tests" ADD COLUMN "incorrect_key_depressions" integer;--> statement-breakpoint
ALTER TABLE "typing_tests" ADD COLUMN "omission_errors" integer;--> statement-breakpoint
ALTER TABLE "typing_tests" ADD COLUMN "addition_errors" integer;--> statement-breakpoint
ALTER TABLE "typing_tests" ADD COLUMN "wrong_word_errors" integer;--> statement-breakpoint
ALTER TABLE "typing_tests" ADD COLUMN "substitution_errors" integer;--> statement-breakpoint
ALTER TABLE "typing_tests" ADD COLUMN "formatting_errors" integer;--> statement-breakpoint
ALTER TABLE "typing_tests" ADD COLUMN "space_errors" integer;--> statement-breakpoint
ALTER TABLE "typing_tests" ADD COLUMN "full_mistakes" integer;--> statement-breakpoint
ALTER TABLE "typing_tests" ADD COLUMN "half_mistakes" integer;--> statement-breakpoint
ALTER TABLE "typing_tests" ADD COLUMN "total_words_typed" integer;--> statement-breakpoint
ALTER TABLE "typing_tests" ADD COLUMN "total_correct_words" integer;--> statement-breakpoint
ALTER TABLE "typing_tests" ADD COLUMN "backspace_count" integer;--> statement-breakpoint
ALTER TABLE "typing_tests" ADD COLUMN "pause_count" integer;--> statement-breakpoint
ALTER TABLE "typing_tests" ADD COLUMN "total_pause_duration_seconds" double precision;--> statement-breakpoint
ALTER TABLE "typing_tests" ADD COLUMN "avg_pause_duration" double precision;--> statement-breakpoint
ALTER TABLE "typing_tests" ADD COLUMN "longest_pause_duration" double precision;--> statement-breakpoint
ALTER TABLE "typing_tests" ADD COLUMN "typing_rhythm_score" double precision;--> statement-breakpoint
ALTER TABLE "typing_tests" ADD COLUMN "consistency_score" double precision;--> statement-breakpoint
ALTER TABLE "typing_tests" ADD COLUMN "is_qualified" boolean;--> statement-breakpoint
ALTER TABLE "typing_tests" ADD COLUMN "qualification_probability" double precision;--> statement-breakpoint
ALTER TABLE "typing_tests" ADD COLUMN "keystroke_summary" jsonb;--> statement-breakpoint
ALTER TABLE "typing_tests" ADD COLUMN "error_zones" jsonb;--> statement-breakpoint
ALTER TABLE "typing_tests" ADD COLUMN "weak_words" jsonb;--> statement-breakpoint
ALTER TABLE "typing_tests" ADD COLUMN "xp_earned" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "typing_tests" ADD COLUMN "is_premium" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "typing_tests" ADD COLUMN "started_at" timestamp;--> statement-breakpoint
ALTER TABLE "typing_tests" ADD COLUMN "completed_at" timestamp;--> statement-breakpoint
ALTER TABLE "passages" ADD CONSTRAINT "passages_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "error_patterns" ADD CONSTRAINT "error_patterns_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "typing_sessions" ADD CONSTRAINT "typing_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_analytics" ADD CONSTRAINT "user_analytics_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "passage_category_idx" ON "passages" USING btree ("category");--> statement-breakpoint
CREATE INDEX "passage_language_idx" ON "passages" USING btree ("language");--> statement-breakpoint
CREATE INDEX "passage_active_idx" ON "passages" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "payment_user_id_idx" ON "payments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sub_user_id_idx" ON "subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "error_patterns_user_id_idx" ON "error_patterns" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "typing_sessions_user_id_idx" ON "typing_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_analytics_user_id_idx" ON "user_analytics" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "clerk_id_idx" ON "users" USING btree ("clerk_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idempotency_idx" ON "typing_tests" USING btree ("idempotency_key","created_at");