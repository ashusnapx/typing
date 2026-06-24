import { router, protectedProcedure } from '../trpc';
import { z } from 'zod';
import { db } from '../../db/client';
import { subscriptions, payments } from '../../db/schema/subscriptions';
import { eq, desc } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

export const subscriptionRouter = router({
  current: protectedProcedure
    .input(z.void())
    .query(async ({ ctx }) => {
      const [sub] = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, ctx.user.id))
        .orderBy(desc(subscriptions.createdAt))
        .limit(1);

      if (!sub) {
        return { plan: 'free', status: 'active' };
      }

      const isExpired = sub.endDate && new Date() > sub.endDate;
      return {
        id: sub.id,
        plan: sub.plan,
        status: isExpired ? 'expired' : sub.status,
        startDate: sub.startDate,
        endDate: sub.endDate,
        autoRenew: sub.autoRenew,
      };
    }),

  paymentHistory: protectedProcedure
    .input(z.void())
    .query(async ({ ctx }) => {
      return db
        .select()
        .from(payments)
        .where(eq(payments.userId, ctx.user.id))
        .orderBy(desc(payments.createdAt))
        .limit(20);
    }),

  cancel: protectedProcedure
    .input(z.void())
    .mutation(async ({ ctx }) => {
      const [sub] = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, ctx.user.id))
        .limit(1);

      if (!sub) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'No active subscription found.' });
      }

      await db
        .update(subscriptions)
        .set({ status: 'cancelled', autoRenew: false, updatedAt: new Date() })
        .where(eq(subscriptions.id, sub.id));

      return { success: true };
    }),
});
