import { pgTable, uuid, varchar, integer, timestamp, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const users = pgTable('users', {
  id: uuid('id').default(sql`generate_uuid_v7()`).primaryKey(),
  email: varchar('email', { length: 255 }).notNull(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  passwordHash: varchar('password_hash', { length: 255 }),
  role: varchar('role', { length: 50 }).default('student').notNull(),
  xp: integer('xp').default(0).notNull(),
  level: integer('level').default(1).notNull(),
  state: varchar('state', { length: 100 }),
  district: varchar('district', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    emailIdx: uniqueIndex('email_idx').on(table.email),
    xpIdx: index('xp_idx').on(table.xp),
    stateXpIdx: index('state_xp_idx').on(table.state, table.xp),
  };
});
