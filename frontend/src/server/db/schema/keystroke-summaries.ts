import { pgTable, uuid, varchar, integer, boolean, timestamp, index, primaryKey } from 'drizzle-orm/pg-core';
import { typingTests } from './typing-tests';

export const keystrokeSummaries = pgTable('keystroke_summaries', {
  id: uuid('id').notNull(),
  testId: uuid('test_id').notNull(),
  key: varchar('key', { length: 50 }).notNull(),
  timestampMs: integer('timestamp_ms').notNull(),
  durationMs: integer('duration_ms').notNull(),
  isError: boolean('is_error').notNull(),
  isBackspace: boolean('is_backspace').notNull(),
  cursorPosition: integer('cursor_position').notNull(),
  expectedChar: varchar('expected_char', { length: 10 }),
  createdAt: timestamp('created_at').notNull(),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.id, table.createdAt] }),
    testIdIdx: index('keystroke_test_id_idx').on(table.testId),
  };
});
