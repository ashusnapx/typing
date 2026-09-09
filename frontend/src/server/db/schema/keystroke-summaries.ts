import { pgTable, uuid, varchar, integer, boolean, index } from 'drizzle-orm/pg-core';
import { typingTests } from './typing-tests';

/**
 * Every keystroke of an attempt, for the replay and the hesitation report.
 *
 * This described a table called `keystroke_summaries`, partitioned on a
 * `created_at` that was part of its primary key — a design that was never
 * migrated and never existed. The table the database actually has is
 * `keystroke_events`, with these exact columns, its own primary key, a foreign
 * key to the attempt and an index on it.
 *
 * So every submission carrying keystrokes — which is every real one, since the
 * engine records them and the client sends them — inserted into a relation
 * that was not there, rolled the whole transaction back and returned a 500.
 * The candidate lost the attempt they had just sat, and the table has nought
 * rows to show for it.
 */
export const keystrokeSummaries = pgTable('keystroke_events', {
  id: uuid('id').primaryKey(),
  testId: uuid('test_id')
    .notNull()
    .references(() => typingTests.id, { onDelete: 'cascade' }),
  key: varchar('key', { length: 50 }).notNull(),
  timestampMs: integer('timestamp_ms').notNull(),
  durationMs: integer('duration_ms').notNull(),
  isError: boolean('is_error').notNull(),
  isBackspace: boolean('is_backspace').notNull(),
  cursorPosition: integer('cursor_position').notNull(),
  expectedChar: varchar('expected_char', { length: 10 }),
}, (table) => ({
  testIdIdx: index('idx_keystroke_events_test_id').on(table.testId),
}));
