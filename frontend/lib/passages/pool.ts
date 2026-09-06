/**
 * Passage selection, shared by server and client.
 *
 * The whole corpus is 79 rows and about 71 kB — smaller than one photo — and
 * the database answers a filtered query in 1.4 ms. None of the slowness was
 * ever the data. It was the shape of the fetch: the browser ran the query
 * after hydration, `select('*')` pulled twenty full passages to use one, and a
 * miss on `practice_set` triggered a recursive second and sometimes third
 * round trip, each one a fresh network hop before the test could start.
 *
 * So the pool is fetched once on the server, cached, and handed to the client
 * as a prop. Picking a passage is then a synchronous array filter with no
 * network at all, which is why the loading phase disappears.
 */

export interface PoolPassage {
  id: string;
  title: string;
  content: string;
  language: 'english' | 'hindi';
  category: string | null;
  difficulty: string | null;
  practice_set: number | null;
  is_exam_length: boolean | null;
  exact_key_depressions: number | null;
  word_count: number | null;
}

export interface PickOptions {
  category?: string;
  language?: string;
  practiceSet?: number;
  /** Only passages long enough to be a real exam passage. */
  examLength?: boolean;
}

/** Narrowing steps, most specific first. Each is dropped in turn until
 *  something matches, which reproduces the old recursive fallback chain
 *  without any of its round trips. */
function candidates(pool: PoolPassage[], opts: PickOptions): PoolPassage[] {
  const language = opts.language ?? 'english';
  const base = pool.filter((p) => p.language === language);

  const filters: Array<(p: PoolPassage) => boolean> = [];
  if (opts.category) filters.push((p) => p.category === opts.category);
  if (opts.examLength) filters.push((p) => p.is_exam_length === true);
  if (opts.practiceSet != null)
    filters.push((p) => p.practice_set === opts.practiceSet);

  // Try every filter, then relax them one at a time from the least important
  // (practice set) back to the most (category).
  for (let drop = 0; drop <= filters.length; drop++) {
    const active = filters.slice(0, filters.length - drop);
    const matched = base.filter((p) => active.every((f) => f(p)));
    if (matched.length) return matched;
  }

  return base.length ? base : pool;
}

/**
 * Pick one passage.
 *
 * `seed` makes the choice deterministic where that matters — a server render
 * and the client hydration that follows it must agree, or React tears down the
 * markup and the passage visibly swaps. Omit it to get a fresh random pick,
 * which is what "retry" wants.
 */
export function pickPassage(
  pool: PoolPassage[],
  opts: PickOptions = {},
  seed?: number
): PoolPassage | null {
  const matched = candidates(pool, opts);
  if (!matched.length) return null;
  const index =
    seed == null
      ? Math.floor(Math.random() * matched.length)
      : Math.abs(seed) % matched.length;
  return matched[index];
}

/** The columns the app actually reads. Selecting `*` shipped author notes,
 *  sources and timestamps on every row for no reason. */
export const POOL_COLUMNS =
  'id, title, content, language, category, difficulty, practice_set, is_exam_length, exact_key_depressions, word_count';
