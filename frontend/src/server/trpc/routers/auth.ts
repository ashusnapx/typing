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
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

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
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

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
});
