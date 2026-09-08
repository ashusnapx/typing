/**
 * Every mode an attempt can be stored under.
 *
 * `typing_tests.mode` is a Postgres enum, so this list and the database's
 * `test_mode` type have to agree exactly — when they drifted, three exam
 * routes existed in the app that no attempt could actually be saved against,
 * and the failure only showed up as a 500 at submission time. Declared once as
 * a runtime array so the union, the Zod input and the Drizzle column can all
 * derive from the same source instead of being retyped in three places.
 *
 * Adding one here means adding it to the enum too — see
 * supabase/migrations/20260908020000_test_mode_values.sql.
 */
export const TEST_MODES = [
  'ssc_chsl',
  'ssc_chsl_deo',
  'ssc_chsl_deo_grade_a',
  'ssc_cgl_dest',
  'ssc_cgl_cpt',
  'ssc_hindi',
  'practice',
  'blind',
  'mock',
  'tcs_ion_replica',
  'lesson',
] as const;

export type TestMode = (typeof TEST_MODES)[number];

export type TestStatus = 'in_progress' | 'completed' | 'abandoned';

export type PassageCategory = 'ssc_chsl' | 'ssc_cgl' | 'banking' | 'railway' | 'general';

export type PassageDifficulty = 'easy' | 'medium' | 'hard';

export type PassageLanguage = 'english' | 'hindi';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'student' | 'admin' | 'super_admin';
  state?: string;
  district?: string;
  city?: string;
  college?: string;
  xp: number;
  level: number;
  streak_days: number;
  is_premium: boolean;
  total_tests_taken: number;
  best_wpm?: number;
  best_accuracy?: number;
  created_at: string;
}

export interface Passage {
  id: string;
  title: string;
  content: string;
  language: PassageLanguage;
  category: PassageCategory;
  difficulty: PassageDifficulty;
  exact_key_depressions: number;
  word_count: number;
  topic?: string;
  is_verified: boolean;
}

export interface KeystrokeEvent {
  key: string;
  timestamp_ms: number;
  duration_ms: number;
  is_error: boolean;
  is_backspace: boolean;
  cursor_position?: number;
  expected_char?: string;
}

export interface TestResult {
  test_id: string;
  mode: TestMode;
  gross_wpm: number;
  net_wpm: number;
  accuracy: number;
  error_percentage: number;
  key_depression_count: number;
  total_errors: number;
  omission_errors: number;
  addition_errors: number;
  wrong_word_errors: number;
  substitution_errors: number;
  formatting_errors: number;
  space_errors: number;
  time_taken_seconds: number;
  time_utilization_percentage: number;
  backspace_count: number;
  pause_count: number;
  total_pause_duration_seconds: number;
  typing_rhythm_score?: number;
  consistency_score?: number;
  is_qualified?: boolean;
  qualification_probability?: number;
  xp_earned: number;
  weak_words?: string[];
  error_zones?: Record<string, any>;
  feedback?: string;
}

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  full_name: string;
  college?: string;
  state?: string;
  city?: string;
  best_wpm: number;
  best_accuracy: number;
  tests_taken: number;
  xp: number;
}

export interface AICoachFeedback {
  test_id: string;
  overall_score: number;
  strengths: string[];
  weaknesses: string[];
  detailed_feedback: string;
  daily_drills: {
    name: string;
    description: string;
    duration_minutes: number;
    type: string;
  }[];
  weak_word_exercises: string[];
  fatigue_analysis?: {
    fatigue_detected: boolean;
    fatigue_start_seconds?: number;
    speed_decline_percentage?: number;
  };
}

export interface QuizPrediction {
  chsl_qualification_probability: number;
  cgl_dest_qualification_probability: number;
  wpm_trend: string;
  accuracy_trend: string;
  consistency_score: number;
}
