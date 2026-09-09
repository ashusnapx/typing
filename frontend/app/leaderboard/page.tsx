import { readTop, readStates, type LeaderboardRow } from '@/src/server/trpc/routers/leaderboard';
import { Board } from '@/components/leaderboard/board';

/* Rebuilt at most once a minute, and served from the cache in between.
 *
 * The board is the same for everyone and changes only when somebody finishes a
 * test, so there is nothing to gain from computing it per visitor — and a great
 * deal to lose: the query runs in under a millisecond, but fetching it from the
 * browser cost two seconds warm and thirteen cold, all of it round trip. */
export const revalidate = 60;

/**
 * A board nobody can read is worth less than a deploy that does not ship.
 *
 * Prerendering this page reads the database, so an unreachable database failed
 * the whole build — which is exactly what happened in CI, where DATABASE_URL
 * points at a Postgres that only exists in the test job. The same would have
 * taken production down on any deploy that happened to land during a database
 * hiccup, and taken every other page with it.
 *
 * So a build with no database behind it ships an empty board and fills it on
 * the next revalidation, a minute later. Where the database is reachable — as
 * it is on Vercel — the rows are baked into the HTML as before.
 */
async function readOrEmpty(): Promise<{ rows: LeaderboardRow[]; states: string[] }> {
  try {
    const [rows, states] = await Promise.all([readTop(50), readStates()]);
    return { rows, states };
  } catch (error) {
    console.warn(
      '[leaderboard] prerendering without data; the next revalidation will fill it.',
      error instanceof Error ? error.message : error,
    );
    return { rows: [], states: [] };
  }
}

export default async function LeaderboardPage() {
  const { rows, states } = await readOrEmpty();
  return <Board rows={rows} states={states} />;
}
