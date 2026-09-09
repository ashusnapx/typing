import { readTop, readStates } from '@/src/server/trpc/routers/leaderboard';
import { Board } from '@/components/leaderboard/board';

/* Rebuilt at most once a minute, and served from the cache in between.
 *
 * The board is the same for everyone and changes only when somebody finishes a
 * test, so there is nothing to gain from computing it per visitor — and a great
 * deal to lose: the query runs in under a millisecond, but fetching it from the
 * browser cost two seconds warm and thirteen cold, all of it round trip. */
export const revalidate = 60;

export default async function LeaderboardPage() {
  const [rows, states] = await Promise.all([readTop(50), readStates()]);
  return <Board rows={rows} states={states} />;
}
