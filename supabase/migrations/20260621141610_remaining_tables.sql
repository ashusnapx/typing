-- User roles enum
CREATE TYPE user_role AS ENUM ('student', 'admin', 'super_admin');

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id VARCHAR(255) UNIQUE,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) UNIQUE,
  full_name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255),
  role user_role NOT NULL DEFAULT 'student',
  state VARCHAR(100),
  district VARCHAR(100),
  city VARCHAR(100),
  college VARCHAR(255),
  xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  streak_days INTEGER NOT NULL DEFAULT 0,
  last_active_date TIMESTAMPTZ,
  is_premium BOOLEAN NOT NULL DEFAULT false,
  premium_expiry TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  total_tests_taken INTEGER NOT NULL DEFAULT 0,
  total_time_spent_seconds INTEGER NOT NULL DEFAULT 0,
  best_wpm DOUBLE PRECISION,
  best_accuracy DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);

-- Test modes enum
CREATE TYPE test_mode AS ENUM ('ssc_chsl', 'ssc_cgl_dest', 'ssc_hindi', 'practice', 'blind', 'mock', 'tcs_ion_replica');
CREATE TYPE test_status AS ENUM ('in_progress', 'completed', 'abandoned');

-- Typing tests table
CREATE TABLE typing_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  passage_id UUID REFERENCES passages(id),
  mode test_mode NOT NULL,
  status test_status NOT NULL DEFAULT 'in_progress',
  duration_seconds INTEGER NOT NULL,
  time_taken_seconds DOUBLE PRECISION,
  time_utilization_percentage DOUBLE PRECISION,
  typed_content TEXT,
  original_content TEXT,
  gross_wpm DOUBLE PRECISION,
  net_wpm DOUBLE PRECISION,
  accuracy DOUBLE PRECISION,
  error_percentage DOUBLE PRECISION,
  key_depression_count INTEGER,
  correct_key_depressions INTEGER,
  incorrect_key_depressions INTEGER,
  omission_errors INTEGER,
  addition_errors INTEGER,
  wrong_word_errors INTEGER,
  substitution_errors INTEGER,
  formatting_errors INTEGER,
  space_errors INTEGER,
  total_errors INTEGER,
  total_words_typed INTEGER,
  total_correct_words INTEGER,
  backspace_count INTEGER,
  pause_count INTEGER,
  total_pause_duration_seconds DOUBLE PRECISION,
  avg_pause_duration DOUBLE PRECISION,
  longest_pause_duration DOUBLE PRECISION,
  typing_rhythm_score DOUBLE PRECISION,
  consistency_score DOUBLE PRECISION,
  is_qualified BOOLEAN,
  qualification_probability DOUBLE PRECISION,
  keystroke_summary JSONB,
  error_zones JSONB,
  weak_words JSONB,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  is_premium BOOLEAN NOT NULL DEFAULT false,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_typing_tests_user_id ON typing_tests(user_id);
CREATE INDEX idx_typing_tests_passage_id ON typing_tests(passage_id);

-- Keystroke events table
CREATE TABLE keystroke_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID NOT NULL REFERENCES typing_tests(id),
  key VARCHAR(10) NOT NULL,
  timestamp_ms INTEGER NOT NULL,
  duration_ms INTEGER,
  is_error BOOLEAN NOT NULL DEFAULT false,
  is_backspace BOOLEAN NOT NULL DEFAULT false,
  cursor_position INTEGER,
  expected_char VARCHAR(10)
);

CREATE INDEX idx_keystroke_events_test_id ON keystroke_events(test_id);

-- Error patterns table
CREATE TABLE error_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  pattern_type VARCHAR(100) NOT NULL,
  pattern_value VARCHAR(255) NOT NULL,
  frequency INTEGER NOT NULL DEFAULT 0,
  last_occurred_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_error_patterns_user_id ON error_patterns(user_id);

-- Typing sessions table
CREATE TABLE typing_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  date TIMESTAMPTZ NOT NULL,
  total_duration_seconds INTEGER NOT NULL DEFAULT 0,
  tests_count INTEGER NOT NULL DEFAULT 0,
  avg_wpm DOUBLE PRECISION,
  avg_accuracy DOUBLE PRECISION,
  total_corrections INTEGER NOT NULL DEFAULT 0,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_typing_sessions_user_id ON typing_sessions(user_id);

-- User analytics table
CREATE TABLE user_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id),
  total_tests INTEGER NOT NULL DEFAULT 0,
  total_time_seconds INTEGER NOT NULL DEFAULT 0,
  avg_wpm DOUBLE PRECISION,
  avg_accuracy DOUBLE PRECISION,
  best_wpm DOUBLE PRECISION,
  best_accuracy DOUBLE PRECISION,
  wpm_trend JSONB,
  accuracy_trend JSONB,
  consistency_score DOUBLE PRECISION,
  weak_words JSONB,
  left_hand_error_rate DOUBLE PRECISION,
  right_hand_error_rate DOUBLE PRECISION,
  shift_key_error_rate DOUBLE PRECISION,
  number_row_error_rate DOUBLE PRECISION,
  common_mistypes JSONB,
  fatigue_start_time INTEGER,
  last_20_test_ids JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_analytics_user_id ON user_analytics(user_id);

-- Subscriptions table
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id),
  plan VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL,
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  auto_renew BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);

-- Payments table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  subscription_id UUID REFERENCES subscriptions(id),
  amount DOUBLE PRECISION NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'INR',
  provider VARCHAR(50) NOT NULL,
  provider_payment_id VARCHAR(255),
  provider_order_id VARCHAR(255),
  status VARCHAR(20) NOT NULL,
  gst_invoice_number VARCHAR(50),
  gst_amount DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_user_id ON payments(user_id);

-- RLS policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE typing_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE keystroke_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE typing_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Users can read/update their own data
CREATE POLICY "Users can read own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Service role can manage users" ON users FOR ALL USING (auth.role() = 'service_role');

-- Users can manage their own tests
CREATE POLICY "Users can manage own tests" ON typing_tests FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage test" ON typing_tests FOR ALL USING (auth.role() = 'service_role');
