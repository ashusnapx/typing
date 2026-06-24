import { pgTable, uuid, varchar, jsonb, timestamp, index, primaryKey } from 'drizzle-orm/pg-core';
import { users } from './users';

export const analyticsEvents = pgTable('analytics_events', {
  id: uuid('id').notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  eventType: varchar('event_type', { length: 100 }).notNull(),
  eventData: jsonb('event_data'),
  createdAt: timestamp('created_at').notNull(),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.id, table.createdAt] }),
    userIdIdx: index('analytics_user_id_idx').on(table.userId),
  };
});
