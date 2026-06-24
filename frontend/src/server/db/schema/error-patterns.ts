import { pgTable, uuid, varchar, integer, timestamp, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users';

export const errorPatterns = pgTable('error_patterns', {
  id: uuid('id').default(sql`generate_uuid_v7()`).primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  patternType: varchar('pattern_type', { length: 100 }).notNull(),
  patternValue: varchar('pattern_value', { length: 255 }).notNull(),
  frequency: integer('frequency').default(0).notNull(),
  lastOccurredAt: timestamp('last_occurred_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('error_patterns_user_id_idx').on(table.userId),
}));
