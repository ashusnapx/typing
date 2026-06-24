import { pgTable, uuid, varchar, integer, doublePrecision, boolean, timestamp, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users';

export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').default(sql`generate_uuid_v7()`).primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  plan: varchar('plan', { length: 50 }).notNull(),
  status: varchar('status', { length: 20 }).default('active').notNull(),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date'),
  autoRenew: boolean('auto_renew').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('sub_user_id_idx').on(table.userId),
}));

export const payments = pgTable('payments', {
  id: uuid('id').default(sql`generate_uuid_v7()`).primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  subscriptionId: uuid('subscription_id').references(() => subscriptions.id),
  amount: doublePrecision('amount').notNull(),
  currency: varchar('currency', { length: 10 }).default('INR').notNull(),
  provider: varchar('provider', { length: 50 }).notNull(),
  providerPaymentId: varchar('provider_payment_id', { length: 255 }),
  providerOrderId: varchar('provider_order_id', { length: 255 }),
  status: varchar('status', { length: 20 }).notNull(),
  gstInvoiceNumber: varchar('gst_invoice_number', { length: 50 }),
  gstAmount: doublePrecision('gst_amount'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('payment_user_id_idx').on(table.userId),
}));
