import { router, publicProcedure, protectedProcedure } from '../trpc';
import { z } from 'zod';
import { db } from '../../db/client';
import { sql } from 'drizzle-orm';

/**
 * The board, computed from the attempts themselves.
 *
 * It used to be read from a Redis sorted set and nothing else, so a Redis
 * outage did not degrade the leaderboard — it emptied it, silently and
 * permanently, because nothing ever backfilled the set. Production has been
 * pointed at a Redis that is not there, which means this has been returning an
 * empty array for every visitor.
 *
 * It then decorated those rows from `users.best_wpm`, `users.best_accuracy`
 * and `users.total_tests_taken`, none of which anything writes — the figures
 * live in `user_analytics` and in the attempts table. So even with Redis up,
 * every row would have read "— WPM, 0 tests".
 *
 * Attempts are the source of truth for all of it, and one query over them is
 * both correct and fast enough at this size. Redis can go back to being an
 * accelerator when there is a Redis to accelerate with.
 */

const RowSchema = z.object({
  rank: z.number(),
  userId: z.string(),
  fullName: z.string(),
  state: z.string().nullable(),
  /** Best speed from an attempt that actually cleared its bar. */
  bestWpm: z.number(),
  bestAccuracy: z.number(),
  /** Whether that best was a qualifying attempt. */
  qualified: z.boolean(),
  testsTaken: z.number(),
  xp: z.number(),
  level: z.number(),
});

export type LeaderboardRow = z.infer<typeof RowSchema>;

/**
 * Ranked on the best attempt that cleared, then on the best attempt at all.
 *
 * Ranking on raw speed alone would put a fast, inaccurate typist above someone
 * who actually passed, which is the opposite of what the board is for: the
 * exam is a pass or a fail, and speed only counts once the errors are inside
 * the cap.
 */
const RANKING = sql`
  WITH attempts AS (
    SELECT
      t.user_id,
      COUNT(*)::int                                                   AS tests_taken,
      MAX(t.net_wpm) FILTER (WHERE t.is_qualified)                    AS best_qualified_wpm,
      MAX(t.net_wpm)                                                  AS best_wpm,
      MAX(t.accuracy) FILTER (WHERE t.is_qualified)                   AS best_qualified_acc,
      MAX(t.accuracy)                                                 AS best_acc
    FROM typing_tests t
    WHERE t.mode <> 'lesson'
    GROUP BY t.user_id
  )
  SELECT
    u.id                                                              AS user_id,
    u.full_name,
    u.state,
    u.xp,
    u.level,
    a.tests_taken,
    COALESCE(a.best_qualified_wpm, a.best_wpm, 0)::float              AS best_wpm,
    COALESCE(a.best_qualified_acc, a.best_acc, 0)::float              AS best_accuracy,
    (a.best_qualified_wpm IS NOT NULL)                                AS qualified
  FROM attempts a
  JOIN users u ON u.id = a.user_id
  WHERE u.is_active
`;

/** Cleared attempts first, then speed, then accuracy, then who got there on
 *  fewer attempts. */
const ORDER = sql` ORDER BY qualified DESC, best_wpm DESC, best_accuracy DESC, tests_taken ASC `;

interface RawRow extends Record<string, unknown> {
  user_id: string;
  full_name: string | null;
  state: string | null;
  xp: number | null;
  level: number | null;
  tests_taken: number;
  best_wpm: number;
  best_accuracy: number;
  qualified: boolean;
}

const toRow = (r: RawRow, rank: number): LeaderboardRow => ({
  rank,
  userId: r.user_id,
  // A candidate who has not given a name is still on the board, unnamed.
  fullName: r.full_name?.trim() || 'Anonymous candidate',
  state: r.state,
  bestWpm: Math.round((r.best_wpm ?? 0) * 10) / 10,
  bestAccuracy: Math.round((r.best_accuracy ?? 0) * 10) / 10,
  qualified: Boolean(r.qualified),
  testsTaken: Number(r.tests_taken ?? 0),
  xp: Number(r.xp ?? 0),
  level: Number(r.level ?? 1),
});

/**
 * The board itself, callable from a server component as well as over tRPC.
 *
 * The page used to fetch this from the browser after hydration, which meant a
 * visitor watched an empty card for two seconds on a warm function and
 * thirteen on a cold one — the query itself takes under a millisecond, so all
 * of that was the round trip. Rendering it on the server and caching it
 * removes the wait rather than covering it with a spinner.
 */
export async function readTop(limit = 50, state?: string): Promise<LeaderboardRow[]> {
  const scoped = state ? sql`${RANKING} AND u.state = ${state}` : RANKING;
  const rows = await db.execute<RawRow>(sql`${scoped} ${ORDER} LIMIT ${limit}`);
  const list = (rows as unknown as { rows?: RawRow[] }).rows ?? (rows as unknown as RawRow[]);
  return list.map((r, i) => toRow(r, i + 1));
}

export async function readStates(): Promise<string[]> {
  const rows = await db.execute<{ state: string } & Record<string, unknown>>(sql`
    SELECT DISTINCT u.state
    FROM users u
    JOIN typing_tests t ON t.user_id = u.id AND t.mode <> 'lesson'
    WHERE u.state IS NOT NULL AND u.state <> ''
    ORDER BY u.state
  `);
  const list = (rows as unknown as { rows?: { state: string }[] }).rows ?? (rows as unknown as { state: string }[]);
  return list.map((r) => r.state);
}

export const leaderboardRouter = router({
  /** The top of the board, optionally narrowed to one state. */
  top: publicProcedure
    .input(
      z.object({
        state: z.string().max(100).optional(),
        limit: z.number().min(1).max(100).default(50),
      }),
    )
    .output(z.array(RowSchema))
    .query(({ input }) => readTop(input.limit, input.state)),

  /** Where the signed-in candidate stands, even when that is far below the
   *  page they are looking at. A board you cannot find yourself on is not
   *  much use to the person it is meant to motivate. */
  me: protectedProcedure
    .output(RowSchema.nullable())
    .query(async ({ ctx }) => {
      const rows = await db.execute<RawRow & { rank: number } & Record<string, unknown>>(sql`
        SELECT * FROM (
          SELECT ranked.*, ROW_NUMBER() OVER (${ORDER})::int AS rank
          FROM (${RANKING}) AS ranked
        ) AS numbered
        WHERE user_id = ${ctx.user.id}
      `);
      const list =
        (rows as unknown as { rows?: (RawRow & { rank: number })[] }).rows ??
        (rows as unknown as (RawRow & { rank: number })[]);
      const found = list[0];
      return found ? toRow(found, Number(found.rank)) : null;
    }),

  /** The states with anyone on the board, so the filter offers only what
   *  exists rather than every state in India. */
  states: publicProcedure
    .output(z.array(z.string()))
    .query(() => readStates()),
});
