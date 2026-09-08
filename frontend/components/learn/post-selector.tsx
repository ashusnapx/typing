'use client';

import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { ChevronDown, Info, Accessibility, Check } from 'lucide-react';
import {
  SSC_POSTS,
  CATEGORY_LABELS,
  errorCapFor,
  speedFor,
  getPost,
  postsFor,
  kdphFromWpm,
  type SscPost,
  type CategoryKey,
} from '@/lib/ssc-posts';

const POST_KEY = 'tm-post';
const CATEGORY_KEY = 'tm-category-v2';
const SCRIBE_KEY = 'tm-scribe';

/** The candidate's post and category drive every target in the app, so they
 *  are stored once and read everywhere rather than re-asked per test. */
export function useSelectedPost() {
  const [postId, setPostId] = useState<string>('chsl_ldc_jsa');
  const [category, setCategoryState] = useState<CategoryKey>('ur');
  const [scribe, setScribeState] = useState(false);

  useEffect(() => {
    try {
      const p = localStorage.getItem(POST_KEY);
      if (p && getPost(p)) setPostId(p);
      const c = localStorage.getItem(CATEGORY_KEY) as CategoryKey | null;
      if (c && c in CATEGORY_LABELS) setCategoryState(c);
      setScribeState(localStorage.getItem(SCRIBE_KEY) === '1');
    } catch {
      /* private mode — defaults stand */
    }
  }, []);

  const persist = (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* private mode */
    }
  };

  const setPost = useCallback((id: string) => {
    setPostId(id);
    persist(POST_KEY, id);
  }, []);

  const setCategory = useCallback((c: CategoryKey) => {
    setCategoryState(c);
    persist(CATEGORY_KEY, c);
  }, []);

  const setScribe = useCallback((v: boolean) => {
    setScribeState(v);
    persist(SCRIBE_KEY, v ? '1' : '0');
  }, []);

  return {
    post: getPost(postId) ?? SSC_POSTS[0],
    category,
    scribe,
    setPost,
    setCategory,
    setScribe,
  };
}

const CATEGORIES: CategoryKey[] = ['ur', 'obcEws', 'scSt', 'pwbd'];
const EXAMS = ['CHSL', 'CGL'] as const;
type Exam = (typeof EXAMS)[number];

/** Two ways in, because aspirants arrive in two states.
 *
 *  Most know their exam but not the post they will be allotted — so the exam
 *  is asked first and the post list narrows to it. The rest only know what
 *  they can currently type, so "by score" runs the same comparison backwards
 *  and names the posts that speed already clears. */
type Mode = 'post' | 'score';

export function PostSelector({
  post,
  category,
  scribe = false,
  onPostChange,
  onCategoryChange,
  onScribeChange,
}: {
  post: SscPost;
  category: CategoryKey;
  scribe?: boolean;
  onPostChange: (id: string) => void;
  onCategoryChange: (c: CategoryKey) => void;
  onScribeChange?: (v: boolean) => void;
}) {
  const [mode, setMode] = useState<Mode>('post');
  const [wpm, setWpm] = useState(30);
  const [accuracy, setAccuracy] = useState(95);

  const cap = errorCapFor(post, category);
  const speed = speedFor(post, 'english');
  const totalMinutes =
    post.durationMinutes + (scribe ? post.compensatoryMinutes : 0);

  // The visible labels double as each group's accessible name, so the group
  // announces the same thing a sighted user reads.
  const categoryLabelId = useId();
  const examLabelId = useId();
  const postLabelId = useId();

  // The exam follows whatever post is selected, so switching exams and
  // switching posts can never disagree.
  const exam = post.exam;
  const postsInExam = useMemo(
    () => SSC_POSTS.filter((p) => p.exam === exam),
    [exam]
  );

  const chooseExam = (next: Exam) => {
    if (next === exam) return;
    // Land on that exam's first post rather than an empty select.
    const first = SSC_POSTS.find((p) => p.exam === next);
    if (first) onPostChange(first.id);
  };

  const standing = useMemo(
    () =>
      postsFor(
        {
          netWpm: wpm,
          kdph: kdphFromWpm(wpm),
          errorPct: Math.max(0, 100 - accuracy),
        },
        category
      ),
    [wpm, accuracy, category]
  );

  return (
    <section className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-b-2 border-vast bg-dawn px-5 py-4">
        <h2 className="text-2xl">Your target</h2>
        <div role="tablist" aria-label="How to set your target" className="segment">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'post'}
            data-active={mode === 'post'}
            onClick={() => setMode('post')}
            className="segment-item text-sm"
          >
            By post
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'score'}
            data-active={mode === 'score'}
            onClick={() => setMode('score')}
            className="segment-item text-sm"
          >
            By score
          </button>
        </div>
      </div>

      <div className="grid gap-6 p-5 sm:grid-cols-2 sm:p-6">
        {mode === 'post' ? (
          <div className="min-w-0">
            <span id={examLabelId} className="mb-2 block text-base font-medium">
              Which exam are you sitting?
            </span>
            <div
              role="radiogroup"
              aria-labelledby={examLabelId}
              className="segment"
            >
              {EXAMS.map((e) => (
                <button
                  key={e}
                  type="button"
                  role="radio"
                  aria-checked={exam === e}
                  data-active={exam === e}
                  onClick={() => chooseExam(e)}
                  className="segment-item text-sm"
                >
                  SSC {e}
                </button>
              ))}
            </div>

            <label htmlFor={postLabelId} className="mb-2 mt-5 block text-base font-medium">
              Post applied for
            </label>
            <div className="relative">
              <select
                id={postLabelId}
                value={post.id}
                onChange={(e) => onPostChange(e.target.value)}
                className="field appearance-none pr-10"
              >
                {postsInExam.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.shortName} — {p.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-vast/50"
                strokeWidth={2}
              />
            </div>
            {post.department && (
              <span className="mt-2 block text-sm text-vast/50">
                {post.department}
              </span>
            )}
          </div>
        ) : (
          <div className="min-w-0">
            <span className="mb-2 block text-base font-medium">
              What can you type today?
            </span>
            <div className="flex gap-3">
              <label className="min-w-0 flex-1 text-sm text-vast/60">
                Net WPM
                <input
                  type="number"
                  min={0}
                  max={120}
                  value={wpm}
                  onChange={(e) =>
                    setWpm(Math.max(0, Math.min(120, Number(e.target.value) || 0)))
                  }
                  className="field tnum mt-1"
                />
              </label>
              <label className="min-w-0 flex-1 text-sm text-vast/60">
                Accuracy %
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={accuracy}
                  onChange={(e) =>
                    setAccuracy(Math.max(0, Math.min(100, Number(e.target.value) || 0)))
                  }
                  className="field tnum mt-1"
                />
              </label>
            </div>

            <p className="mt-4 text-sm text-vast/60">
              {standing.cleared.length === 0
                ? 'That score clears no SSC post yet.'
                : 'Clears — tap one to make it your target:'}
            </p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {standing.cleared.map((v) => (
                <li key={v.post.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onPostChange(v.post.id);
                      setMode('post');
                    }}
                    className="chip chip-ok"
                  >
                    <Check className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
                    {v.post.shortName}
                  </button>
                </li>
              ))}
            </ul>
            {standing.missed[0] && (
              <p className="mt-3 text-sm text-vast/50">
                Nearest miss: {standing.missed[0].post.shortName} —{' '}
                {standing.missed[0].gapLabel}.
              </p>
            )}
          </div>
        )}

        <div className="min-w-0">
          <span id={categoryLabelId} className="mb-2 block text-base font-medium">
            Your category
          </span>
          <div
            role="radiogroup"
            aria-labelledby={categoryLabelId}
            className="segment segment-grid"
          >
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={category === c}
                data-active={category === c}
                onClick={() => onCategoryChange(c)}
                className="segment-item text-sm"
              >
                {CATEGORY_LABELS[c]}
              </button>
            ))}
          </div>

          {onScribeChange && (
            <label className="mt-4 flex cursor-pointer items-center gap-2.5 text-base text-vast/70">
              <input
                type="checkbox"
                checked={scribe}
                onChange={(e) => onScribeChange(e.target.checked)}
                className="h-4 w-4 shrink-0 cursor-pointer accent-vast"
              />
              <Accessibility className="h-4 w-4 shrink-0" strokeWidth={1.8} />
              <span>
                Eligible for a scribe{' '}
                <span className="tnum whitespace-nowrap">
                  (+{post.compensatoryMinutes} min)
                </span>
              </span>
            </label>
          )}
        </div>
      </div>

      {/* The resulting bar, stated plainly. Stacked on a phone: "8,000 KDPH"
          in a third of 390px wraps mid-figure. */}
      <dl className="grid grid-cols-1 border-t-2 border-vast bg-lumen sm:grid-cols-3">
        <div className="flex items-baseline justify-between gap-3 px-5 py-3 sm:block sm:py-4">
          <dt className="eyebrow">Speed needed</dt>
          <dd className="tnum font-display text-2xl sm:mt-2 sm:text-3xl">
            {speed.label}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-3 border-t-2 border-vast/10 px-5 py-3 sm:block sm:border-l-2 sm:border-t-0 sm:py-4">
          <dt className="eyebrow">{scribe ? 'With extra time' : 'Duration'}</dt>
          <dd className="tnum font-display text-2xl sm:mt-2 sm:text-3xl">
            {totalMinutes} min
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-3 border-t-2 border-vast/10 px-5 py-3 sm:block sm:border-l-2 sm:border-t-0 sm:py-4">
          <dt className="eyebrow">Max errors</dt>
          {/* A cap of 7% or tighter is the one that catches people out, so it
              is coloured as the alert it is. */}
          <dd
            className={`tnum font-display text-2xl sm:mt-2 sm:text-3xl ${
              cap <= 7 ? 'text-err' : ''
            }`}
          >
            {cap}%
          </dd>
        </div>
      </dl>

      {(post.notes || post.disputed) && (
        <div className="flex gap-3 border-t-2 border-vast/10 bg-lumen px-5 py-4">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-vast/40" strokeWidth={2} />
          <p className="text-sm leading-relaxed text-vast/60">
            {post.notes}
            {post.disputed && (
              <>
                {' '}
                <span className="text-warn">
                  Sources disagree on this post — we show the stricter reading in
                  the mock so you are never caught short.
                </span>
              </>
            )}
            <span className="mt-1.5 block text-vast/40">{post.citation}</span>
          </p>
        </div>
      )}
    </section>
  );
}
