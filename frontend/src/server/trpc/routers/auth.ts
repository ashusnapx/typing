import { router, publicProcedure, protectedProcedure } from '../trpc';
import { db } from '../../db/client';
import { users } from '../../db/schema/users';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';

export const authRouter = router({
  logout: protectedProcedure
    .input(z.void())
    .output(z.object({ success: z.boolean() }))
    .mutation(async () => {
      return { success: true };
    }),

  getProfile: protectedProcedure
    .input(z.void())
    .output(
      z.object({
        id: z.string(),
        email: z.string(),
        fullName: z.string(),
        role: z.string(),
        xp: z.number(),
        level: z.number(),
        state: z.string().nullable(),
        district: z.string().nullable(),
        createdAt: z.date(),
      })
    )
    .query(async ({ ctx }) => {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1);

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User profile not found.',
        });
      }

      return {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        xp: user.xp,
        level: user.level,
        state: user.state,
        district: user.district,
        createdAt: user.createdAt,
      };
    }),
});
