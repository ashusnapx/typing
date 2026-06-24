import { pgTable, uuid, varchar, integer, doublePrecision, boolean, timestamp, jsonb, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const users = pgTable('users', {
  id: uuid('id').default(sql`generate_uuid_v7()`).primaryKey(),
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  passwordHash: varchar('password_hash', { length: 255 }),
  role: varchar('role', { length: 50 }).default('student').notNull(),
  state: varchar('state', { length: 100 }),
  district: varchar('district', { length: 100 }),
  city: varchar('city', { length: 100 }),
  college: varchar('college', { length: 255 }),
  xp: integer('xp').default(0).notNull(),
  level: integer('level').default(1).notNull(),
  streakDays: integer('streak_days').default(0).notNull(),
  lastActiveDate: timestamp('last_active_date'),
  isPremium: boolean('is_premium').default(false).notNull(),
  premiumExpiry: timestamp('premium_expiry'),
  isActive: boolean('is_active').default(true).notNull(),
  isVerified: boolean('is_verified').default(false).notNull(),
  totalTestsTaken: integer('total_tests_taken').default(0).notNull(),
  totalTimeSpentSeconds: integer('total_time_spent_seconds').default(0).notNull(),
  bestWpm: doublePrecision('best_wpm'),
  bestAccuracy: doublePrecision('best_accuracy'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    emailIdx: uniqueIndex('email_idx').on(table.email),
    xpIdx: index('xp_idx').on(table.xp),
    stateXpIdx: index('state_xp_idx').on(table.state, table.xp),
  };
});
