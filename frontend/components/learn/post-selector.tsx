'use client';

import { useCallback, useEffect, useId, useState } from 'react';
import { Info, Accessibility } from 'lucide-react';
import {
  SSC_POSTS,
  CATEGORY_LABELS,
  errorCapFor,
  speedFor,
  getPost,
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

/**
 * The post each exam is set against.
 *
 * A candidate applies for CHSL or CGL. Which post they are allotted is decided
 * long after the skill test, so asking them to pick one up front was asking a
 * question they cannot answer — and a "by score" tab that named the posts a
 * speed already clears was the same question backwards. Both are gone. The
 * exam sets the bar, and which posts a score actually clears is worked out
 * from the attempt afterwards, on the result screen, where it is a fact rather
 * than a guess.
 */
const EXAM_POST: Record<Exam, string> = {
  CHSL: 'chsl_ldc_jsa',
  CGL: 'cgl_tax_assistant',
};

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
  const cap = errorCapFor(post, category);
  const speed = speedFor(post, 'english');
  const totalMinutes =
    post.durationMinutes + (scribe ? post.compensatoryMinutes : 0);

  // The visible labels double as each group's accessible name, so the group
  // announces the same thing a sighted user reads.
  const categoryLabelId = useId();
  const examLabelId = useId();
  // The exam follows whatever post is selected, so the two can never disagree.
  const exam = post.exam;

  const chooseExam = (next: Exam) => {
    if (next === exam) return;
    onPostChange(EXAM_POST[next]);
  };

  return (
    <section className="card overflow-hidden">
      <div className="border-b-2 border-vast bg-lumen-dark px-5 py-4">
        <h2 className="text-2xl">Your target</h2>
      </div>

      <div className="grid gap-6 p-5 sm:grid-cols-2 sm:p-6">
        <div className="min-w-0">
          <span id={examLabelId} className="mb-2 block text-base font-medium">
            Which exam are you sitting?
          </span>
          <div role="radiogroup" aria-labelledby={examLabelId} className="segment">
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
        </div>

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
