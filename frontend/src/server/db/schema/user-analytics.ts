import { pgTable, uuid, integer, doublePrecision, jsonb, timestamp, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users';

export const userAnalytics = pgTable('user_analytics', {
  id: uuid('id').default(sql`generate_uuid_v7()`).primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  totalTests: integer('total_tests').default(0).notNull(),
  totalTimeSeconds: integer('total_time_seconds').default(0).notNull(),
  avgWpm: doublePrecision('avg_wpm'),
  avgAccuracy: doublePrecision('avg_accuracy'),
  bestWpm: doublePrecision('best_wpm'),
  bestAccuracy: doublePrecision('best_accuracy'),
  wpmTrend: jsonb('wpm_trend'),
  accuracyTrend: jsonb('accuracy_trend'),
  consistencyScore: doublePrecision('consistency_score'),
  weakWords: jsonb('weak_words'),
  leftHandErrorRate: doublePrecision('left_hand_error_rate'),
  rightHandErrorRate: doublePrecision('right_hand_error_rate'),
  shiftKeyErrorRate: doublePrecision('shift_key_error_rate'),
  numberRowErrorRate: doublePrecision('number_row_error_rate'),
  commonMistypes: jsonb('common_mistypes'),
  fatigueStartTime: integer('fatigue_start_time'),
  last20TestIds: jsonb('last_20_test_ids'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('user_analytics_user_id_idx').on(table.userId),
}));
