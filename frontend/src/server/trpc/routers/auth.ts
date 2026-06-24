import { router, publicProcedure, protectedProcedure } from '../trpc';
import { loginSchema, registerSchema } from '@/lib/schemas';
import { db } from '../../db/client';
import { users } from '../../db/schema/users';
import { sessions } from '../../db/schema/sessions';
import { eq } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export const authRouter = router({
  login: publicProcedure
    .input(loginSchema)
    .output(
      z.object({
        token: z.string(),
        user: z.object({
          id: z.string(),
          email: z.string(),
          fullName: z.string(),
          role: z.string(),
        }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Find user
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);

      if (!user) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid email or password.',
        });
      }

      // Verify password using bcryptjs
      if (!user.passwordHash) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid email or password.',
        });
      }
      const passwordMatch = bcrypt.compareSync(input.password, user.passwordHash);
      if (!passwordMatch) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid email or password.',
        });
      }

      // Create session token
      const token = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

      await db.insert(sessions).values({
        userId: user.id,
        token,
        expiresAt,
      });

      return {
        token,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
        },
      };
    }),

  register: publicProcedure
    .input(registerSchema)
    .output(
      z.object({
        token: z.string(),
        user: z.object({
          id: z.string(),
          email: z.string(),
          fullName: z.string(),
          role: z.string(),
        }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Check if email taken
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);

      if (existingUser) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Email is already registered.',
        });
      }

      const salt = bcrypt.genSaltSync(12);
      const passwordHash = bcrypt.hashSync(input.password, salt);

      const [newUser] = await db
        .insert(users)
        .values({
          email: input.email,
          fullName: input.full_name,
          passwordHash,
        })
        .returning();

      // Create session token
      const token = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

      await db.insert(sessions).values({
        userId: newUser.id,
        token,
        expiresAt,
      });

      return {
        token,
        user: {
          id: newUser.id,
          email: newUser.email,
          fullName: newUser.fullName,
          role: newUser.role,
        },
      };
    }),

  logout: protectedProcedure
    .input(z.void())
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ ctx }) => {
      await db.delete(sessions).where(eq(sessions.id, ctx.session.id));
      return { success: true };
    }),

  changePassword: protectedProcedure
    .input(z.object({
      currentPassword: z.string().min(1),
      newPassword: z.string().min(6).max(128),
    }))
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1);

      if (!user || !user.passwordHash) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid credentials.' });
      }

      if (!bcrypt.compareSync(input.currentPassword, user.passwordHash)) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Current password is incorrect.' });
      }

      const salt = bcrypt.genSaltSync(12);
      const newHash = bcrypt.hashSync(input.newPassword, salt);

      await db
        .update(users)
        .set({ passwordHash: newHash, updatedAt: new Date() })
        .where(eq(users.id, ctx.user.id));

      return { success: true };
    }),

  refreshSession: publicProcedure
    .input(z.object({ token: z.string(), userId: z.string().optional() }))
    .output(z.object({ token: z.string(), expiresAt: z.date() }))
    .mutation(async ({ input }) => {
      const [session] = await db
        .select()
        .from(sessions)
        .where(eq(sessions.token, input.token))
        .limit(1);

      if (!session) {
        // Session row doesn't exist (DB reset or expired cleanup).
        // If we have a userId, re-create it to avoid force-logout.
        if (input.userId) {
          const [user] = await db
            .select()
            .from(users)
            .where(eq(users.id, input.userId))
            .limit(1);
          if (user) {
            const newToken = crypto.randomUUID();
            const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
            await db.insert(sessions).values({
              userId: user.id,
              token: newToken,
              expiresAt,
            });
            return { token: newToken, expiresAt };
          }
        }
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Session expired or invalid.' });
      }

      const newToken = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

      await db
        .update(sessions)
        .set({ token: newToken, expiresAt, updatedAt: new Date() })
        .where(eq(sessions.id, session.id));

      return { token: newToken, expiresAt };
    }),

  logoutAll: protectedProcedure
    .input(z.void())
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ ctx }) => {
      await db
        .delete(sessions)
        .where(eq(sessions.userId, ctx.user.id));
      return { success: true };
    }),

  me: protectedProcedure
    .input(z.void())
    .query(async ({ ctx }) => {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1);

      if (!user) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found.' });
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
