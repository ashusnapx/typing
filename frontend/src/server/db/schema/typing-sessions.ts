import { pgTable, uuid, varchar, integer, doublePrecision, timestamp, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users';

export const typingSessions = pgTable('typing_sessions', {
  id: uuid('id').default(sql`generate_uuid_v7()`).primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  date: timestamp('date').notNull(),
  totalDurationSeconds: integer('total_duration_seconds').default(0).notNull(),
  testsCount: integer('tests_count').default(0).notNull(),
  avgWpm: doublePrecision('avg_wpm'),
  avgAccuracy: doublePrecision('avg_accuracy'),
  totalCorrections: integer('total_corrections').default(0).notNull(),
  xpEarned: integer('xp_earned').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('typing_sessions_user_id_idx').on(table.userId),
}));
