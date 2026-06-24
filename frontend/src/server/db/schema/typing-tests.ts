import { pgTable, uuid, varchar, integer, timestamp, index, uniqueIndex, primaryKey } from 'drizzle-orm/pg-core';
import { users } from './users';

export const typingTests = pgTable('typing_tests', {
  id: uuid('id').notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  mode: varchar('mode', { length: 50 }).notNull(),
  durationSeconds: integer('duration_seconds').notNull(),
  grossWpm: integer('gross_wpm'),
  netWpm: integer('net_wpm'),
  accuracy: integer('accuracy'),
  totalErrors: integer('total_errors'),
  trustScore: integer('trust_score').default(100).notNull(),
  idempotencyKey: varchar('idempotency_key', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').notNull(),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.id, table.createdAt] }),
    userIdIdx: index('user_id_idx').on(table.userId),
    idempotencyIdx: uniqueIndex('idempotency_idx').on(table.idempotencyKey),
  };
});
