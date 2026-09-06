'use client';

import { useCallback, useEffect, useId, useState } from 'react';
import { ChevronDown, Info, Accessibility } from 'lucide-react';
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

  // The visible "Your category" label doubles as the radiogroup's name, so the
  // group announces the same thing a sighted user reads.
  const categoryLabelId = useId();

  const grouped = [
    { exam: 'CHSL' as const, posts: SSC_POSTS.filter((p) => p.exam === 'CHSL') },
    { exam: 'CGL' as const, posts: SSC_POSTS.filter((p) => p.exam === 'CGL') },
  ];

  return (
    <section className="card overflow-hidden">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b-2 border-vast bg-dawn px-5 py-4">
        <h2 className="text-2xl">Your target</h2>
        <p className="text-sm text-vast/60">
          Every target and verdict in the app follows from this
        </p>
      </div>

      <div className="grid gap-6 p-5 sm:grid-cols-2 sm:p-6">
        <label className="block">
          <span className="mb-2 block text-base font-medium">
            Which post did you apply for?
          </span>
          <div className="relative">
            <select
              value={post.id}
              onChange={(e) => onPostChange(e.target.value)}
              className="field appearance-none pr-10"
            >
              {grouped.map((g) => (
                <optgroup key={g.exam} label={`SSC ${g.exam}`}>
                  {g.posts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.shortName} — {p.name}
                    </option>
                  ))}
                </optgroup>
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
        </label>

        <div>
          <span id={categoryLabelId} className="mb-2 block text-base font-medium">
            Your category
          </span>
          <div
            role="radiogroup"
            aria-labelledby={categoryLabelId}
            className="segment flex-wrap"
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
                className="h-4 w-4 cursor-pointer accent-vast"
              />
              <Accessibility className="h-4 w-4" strokeWidth={1.8} />
              Eligible for a scribe (+
              <span className="tnum">{post.compensatoryMinutes}</span> min)
            </label>
          )}
        </div>
      </div>

      {/* The resulting bar, stated plainly. */}
      <dl className="grid grid-cols-3 border-t-2 border-vast bg-lumen">
        <div className="px-4 py-4 sm:px-5">
          <dt className="eyebrow">Speed needed</dt>
          <dd className="tnum mt-2 font-display text-2xl sm:text-3xl">
            {speed.label}
          </dd>
        </div>
        <div className="border-l-2 border-vast/10 px-4 py-4 sm:px-5">
          <dt className="eyebrow">{scribe ? 'With extra time' : 'Duration'}</dt>
          <dd className="tnum mt-2 font-display text-2xl sm:text-3xl">
            {totalMinutes} min
          </dd>
        </div>
        <div className="border-l-2 border-vast/10 px-4 py-4 sm:px-5">
          <dt className="eyebrow">Max errors</dt>
          {/* A cap of 7% or tighter is the one that catches people out, so it
              is coloured as the alert it is. */}
          <dd
            className={`tnum mt-2 font-display text-2xl sm:text-3xl ${
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
