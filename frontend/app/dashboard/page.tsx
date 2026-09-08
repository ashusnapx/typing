'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth-store';
import { useDashboard } from '@/lib/queries';

import Link from 'next/link';
import {
  ArrowRight, ArrowUp, ArrowDown, Check, X, AlertTriangle, Zap,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import { getLevelFromXP, getLevelIndex, getLevelProgress, LEVEL_NAMES, getModeDisplayName } from '@/lib/utils';
import { ROUTES, PAGINATION } from '@/lib/config';
import {
  postsFor, kdphFromWpm, practiceHrefFor, CATEGORY_LABELS, type CategoryKey,
} from '@/lib/ssc-posts';

/* -------------------------------------------------------------------------- */

const CATEGORY_STORAGE_KEY = 'tm-category-v2';
const CATEGORY_KEYS: CategoryKey[] = ['ur', 'obcEws', 'scSt'];

/* -------------------------------------------------------------------------- */

function Skeleton() {
  return (
    <div
      className="mx-auto w-full max-w-content px-5 py-10 sm:px-8 sm:py-14"
      role="status"
      aria-label="Loading dashboard"
    >
      <div aria-hidden="true">
        <div className="skeleton h-10 w-64 max-w-full" />
        <div className="skeleton mt-8 h-52 w-full rounded-2xl" />
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-24 rounded-2xl" />
          ))}
        </div>
        <div className="skeleton mt-6 h-64 w-full rounded-2xl" />
      </div>
    </div>
  );
}

/** Sparkline for a short numeric series. `tone` is a text-colour utility, not a
 *  raw colour — the line draws with `currentColor`, which keeps every chart on
 *  the token palette instead of a hardcoded hex. */
function MiniChart({ data, tone }: { data: number[]; tone: string }) {
  const values = [...data];
  if (values.length < 2) return null;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const w = 180;
  const h = 28;
  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - ((v - min) / range) * (h - 4) - 2;
      return `${x},${y}`;
    })
    .join(' ');
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className={`h-7 w-full ${tone}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

function Figure({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string | number;
  sub?: React.ReactNode;
  tone?: 'ok' | 'err';
}) {
  return (
    <div className="card flex flex-col p-4">
      <span className="eyebrow">{label}</span>
      <span
        className={`tnum mt-2 font-display text-3xl leading-none ${
          tone === 'ok' ? 'text-ok' : tone === 'err' ? 'text-err' : ''
        }`}
      >
        {value}
      </span>
      {sub && <span className="mt-auto pt-2 text-sm text-vast/50">{sub}</span>}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

export default function DashboardPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [showXPModal, setShowXPModal] = useState(false);
  const [page, setPage] = useState(0);
  const [category, setCategory] = useState<CategoryKey>('ur');
  const perPage = PAGINATION.dashboardPerPage;

  useEffect(() => {
    const handler = () => queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    window.addEventListener('dashboard-invalidate', handler);
    return () => window.removeEventListener('dashboard-invalidate', handler);
  }, [queryClient]);

  // The same setting the result screen writes. Chosen once, honoured everywhere.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CATEGORY_STORAGE_KEY) as CategoryKey | null;
      if (saved && CATEGORY_KEYS.includes(saved)) setCategory(saved);
    } catch {
      /* private mode */
    }
  }, []);

  const chooseCategory = (key: CategoryKey) => {
    setCategory(key);
    try {
      localStorage.setItem(CATEGORY_STORAGE_KEY, key);
    } catch {
      /* private mode */
    }
  };

  const { data, isLoading, isError, refetch } = useDashboard();

  const analytics = data?.overview;
  const predictions = data?.predictions;
  const recentTests = data?.recent_scores || [];

  const recentWpm = predictions?.recent_avg_wpm ?? 0;
  const recentAcc = predictions?.recent_avg_accuracy ?? 0;

  /* The whole page in one calculation: every SSC post judged against the last
     ten attempts. Aspirants do not get to choose their post, so "am I ready
     for CHSL?" is the wrong question — "which posts does this pace already
     clear, and what is the nearest one I don't?" is the one they can act on. */
  const standing = useMemo(
    () =>
      postsFor(
        {
          netWpm: recentWpm,
          kdph: kdphFromWpm(recentWpm),
          errorPct: Math.max(0, 100 - recentAcc),
        },
        category
      ),
    [recentWpm, recentAcc, category]
  );
  const nextTarget = standing.missed[0] ?? null;

  /** How close the next post is, as a fraction of its own bar. */
  const nextProgress = nextTarget
    ? nextTarget.post.measure === 'wpm'
      ? Math.min(100, (recentWpm / (nextTarget.post.wpmEnglish ?? 35)) * 100)
      : Math.min(100, (kdphFromWpm(recentWpm) / (nextTarget.post.kdph ?? 8000)) * 100)
    : 100;

  if (!user || (isLoading && !data)) return <Skeleton />;

  if (isError && !data) {
    return (
      <div className="mx-auto flex w-full max-w-content items-center justify-center px-5 py-24 sm:px-8">
        <div className="card mx-auto max-w-md p-8 text-center">
          <AlertTriangle className="mx-auto mb-4 h-10 w-10 text-flare" strokeWidth={2} />
          <h2 className="text-3xl">Could not load your dashboard</h2>
          <button onClick={() => refetch()} className="btn btn-primary btn-md mt-6">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const totalTests = analytics?.total_tests || 0;
  const hasHistory = totalTests > 0;

  return (
    <div className="mx-auto w-full max-w-content px-5 py-10 sm:px-8 sm:py-14">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-4xl sm:text-5xl">
          Hey, <em>{user.full_name}</em>
        </h1>

        <div
          role="radiogroup"
          aria-label="Reservation category"
          className="segment"
        >
          {CATEGORY_KEYS.map((k) => (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={category === k}
              data-active={category === k}
              onClick={() => chooseCategory(k)}
              className="segment-item"
            >
              {CATEGORY_LABELS[k]}
            </button>
          ))}
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════ standing */}
      {!hasHistory ? (
        <section className="card mt-8 p-6 sm:p-8">
          <h2 className="text-3xl">Take one test to see where you stand</h2>
          <p className="mt-3 max-w-md text-base text-vast/60">
            One attempt is enough to tell you which SSC posts your current speed
            already clears.
          </p>
          <Link href={ROUTES.examChsl} className="btn btn-primary btn-lg mt-6">
            Start a test
            <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
          </Link>
        </section>
      ) : (
        <section className="mt-8" aria-labelledby="standing-heading" data-reveal>
          <h2 id="standing-heading" className="sr-only">
            Where you stand
          </h2>

          <div className="card overflow-hidden">
            {/* --------------------------------------------- cleared posts */}
            <div className="border-b-2 border-vast/10 p-5 sm:p-6">
              <p className="eyebrow">
                At {recentWpm.toFixed(0)} WPM and {recentAcc.toFixed(0)}%
                accuracy you clear
              </p>

              {standing.cleared.length === 0 ? (
                <p className="mt-3 text-lg text-vast/60">
                  No post yet — your nearest is below.
                </p>
              ) : (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {standing.cleared.map((v) => (
                    <li key={v.post.id} className="chip chip-ok">
                      <Check className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
                      {v.post.shortName}
                      <span className="font-normal opacity-60">{v.post.exam}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* ----------------------------------------------- next target */}
            {nextTarget ? (
              <div className="bg-dawn p-5 sm:p-6">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="eyebrow">Next post in reach</p>
                    <p className="mt-2 text-3xl">
                      {nextTarget.post.shortName}
                      <span className="ml-2 text-lg text-vast/50">
                        {nextTarget.post.exam}
                      </span>
                    </p>
                  </div>
                  <Link
                    href={practiceHrefFor(nextTarget.post)}
                    className="btn btn-ink btn-md shrink-0"
                  >
                    Practise this bar
                    <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
                  </Link>
                </div>

                <div className="mt-5">
                  <div className="tnum flex items-baseline justify-between gap-2 text-sm">
                    <span className="text-vast/60">{nextTarget.gapLabel}</span>
                    <span className="font-semibold">
                      {nextTarget.achieved.split(' · ')[0]}
                      <span className="font-normal text-vast/40">
                        {' '}
                        / {nextTarget.requirement.split(' · ')[0]}
                      </span>
                    </span>
                  </div>
                  <div
                    className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-lumen-dark"
                    role="progressbar"
                    aria-valuenow={Math.round(nextProgress)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Progress towards ${nextTarget.post.shortName}`}
                  >
                    <div
                      className="h-full rounded-full bg-fathom transition-[width] duration-500"
                      style={{ width: `${nextProgress}%` }}
                    />
                  </div>
                  {!nextTarget.errorsMet && (
                    <p className="mt-2 text-sm text-err">
                      Accuracy is the blocker here, not speed.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-ok-bg p-5 sm:p-6">
                <p className="text-2xl">
                  You clear every SSC post at this pace. Hold it steady.
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════ figures */}
      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Figure
          label="Avg WPM"
          value={analytics?.avg_wpm?.toFixed(1) ?? '0'}
          sub={
            predictions?.wpm_series && predictions.wpm_series.length >= 2 ? (
              <MiniChart data={predictions.wpm_series} tone="text-fathom" />
            ) : (
              `Best ${analytics?.best_wpm?.toFixed(0) ?? 0}`
            )
          }
        />
        <Figure
          label="Avg accuracy"
          value={`${analytics?.avg_accuracy?.toFixed(1) ?? 0}%`}
          sub={
            predictions?.accuracy_series &&
            predictions.accuracy_series.length >= 2 ? (
              <MiniChart data={predictions.accuracy_series} tone="text-flare" />
            ) : (
              `Best ${analytics?.best_accuracy?.toFixed(0) ?? 0}%`
            )
          }
        />
        <Figure
          label="Tests taken"
          value={totalTests}
          sub={
            predictions?.wpm_trend && predictions.wpm_trend !== 'stable' ? (
              <span
                className={`chip capitalize ${
                  predictions.wpm_trend === 'improving' ? 'chip-ok' : 'chip-err'
                }`}
              >
                {predictions.wpm_trend === 'improving' ? (
                  <ArrowUp className="h-3 w-3" strokeWidth={2.5} />
                ) : (
                  <ArrowDown className="h-3 w-3" strokeWidth={2.5} />
                )}
                {predictions.wpm_trend}
              </span>
            ) : (
              'All modes'
            )
          }
        />
        <button
          type="button"
          onClick={() => setShowXPModal(true)}
          aria-haspopup="dialog"
          aria-expanded={showXPModal}
          className="card group flex flex-col p-4 text-left transition-transform duration-200 ease-spring hover:-translate-y-1"
        >
          <span className="eyebrow flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
            {getLevelFromXP(user.xp)}
          </span>
          <span className="tnum mt-2 font-display text-3xl leading-none">
            {user.xp}
          </span>
          <span className="mt-auto flex items-center gap-1.5 pt-2 text-sm text-vast/50 transition-colors group-hover:text-vast">
            XP breakdown
            <ArrowRight
              className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1"
              strokeWidth={2.2}
            />
          </span>
        </button>
      </div>

      {/* ════════════════════════════════════════════════════════ recent tests */}
      {hasHistory && (
        <section className="mt-10" aria-labelledby="recent-heading" data-reveal>
          <h2 id="recent-heading" className="text-3xl">
            Recent tests
          </h2>

          <div className="card mt-4 overflow-hidden">
            <ul className="divide-y-2 divide-vast/10">
              {recentTests
                .slice(page * perPage, (page + 1) * perPage)
                .map((test: any) => (
                  <li key={test.id}>
                    <Link
                      href={`/analysis/${test.id}`}
                      className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5 transition-colors hover:bg-dawn/25"
                    >
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                          test.qualified ? 'bg-ok text-cream' : 'bg-err text-cream'
                        }`}
                      >
                        {test.qualified ? (
                          <Check className="h-4 w-4" strokeWidth={3} aria-hidden />
                        ) : (
                          <X className="h-4 w-4" strokeWidth={3} aria-hidden />
                        )}
                        <span className="sr-only">
                          {test.qualified ? 'Qualified' : 'Not qualified'}
                        </span>
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-base font-semibold">
                          {getModeDisplayName(test.mode)}
                        </span>
                        <span className="tnum block text-sm text-vast/50">
                          {test.date ? new Date(test.date).toLocaleDateString() : ''}
                        </span>
                      </span>

                      <span className="tnum shrink-0 text-right">
                        <span className="block text-base font-semibold">
                          {test.wpm?.toFixed(1)} WPM
                        </span>
                        <span
                          className={`block text-sm ${
                            (test.accuracy ?? 0) >= 95 ? 'text-ok' : 'text-vast/50'
                          }`}
                        >
                          {test.accuracy?.toFixed(1)}% · {test.total_errors ?? 0} err
                        </span>
                      </span>

                      <ArrowRight
                        className="h-4 w-4 shrink-0 text-vast/30"
                        strokeWidth={2.2}
                        aria-hidden
                      />
                    </Link>
                  </li>
                ))}
            </ul>

            {recentTests.length > perPage && (
              <div className="flex items-center justify-between gap-3 border-t-2 border-vast/10 px-5 py-3">
                <p className="tnum text-sm text-vast/50">
                  {page * perPage + 1}–
                  {Math.min((page + 1) * perPage, recentTests.length)} of{' '}
                  {recentTests.length}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    aria-label="Previous page"
                    className="btn btn-outline btn-sm w-9 px-0"
                  >
                    <ChevronLeft className="h-4 w-4" strokeWidth={2.5} />
                  </button>
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={(page + 1) * perPage >= recentTests.length}
                    aria-label="Next page"
                    className="btn btn-outline btn-sm w-9 px-0"
                  >
                    <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════ XP detail */}
      {showXPModal && (() => {
        const xp = user.xp || 0;
        const rankIdx = getLevelIndex(xp);
        const progress = getLevelProgress(xp);
        const xpBreakdown: { source: string; xp: number; tests: number }[] =
          (data as any)?.xpBreakdown || [];
        const lessonXp: number =
          (data as any)?.lessonXp ??
          Math.max(0, xp - xpBreakdown.reduce((s, r) => s + r.xp, 0));

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-vast/50 p-4"
            onClick={() => setShowXPModal(false)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="xp-modal-title"
              className="card relative max-h-[85vh] w-full max-w-md overflow-y-auto p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowXPModal(false)}
                aria-label="Close XP breakdown"
                className="btn btn-outline btn-sm absolute right-4 top-4 w-9 px-0"
              >
                <X className="h-4 w-4" strokeWidth={2.5} />
              </button>

              <h2 id="xp-modal-title" className="pr-12 text-3xl">
                {getLevelFromXP(xp)}
              </h2>
              <p className="tnum mt-1 text-sm text-vast/60">
                {xp.toLocaleString()} XP
              </p>

              {progress.next && (
                <div className="mt-5">
                  <div className="tnum flex items-baseline justify-between gap-2 text-sm">
                    <span className="text-vast/60">Next: {progress.next}</span>
                    <span className="font-semibold">
                      {Math.ceil(progress.nextXp - xp)} to go
                    </span>
                  </div>
                  <div
                    className="mt-2 h-3 w-full overflow-hidden rounded-full border-2 border-vast bg-lumen-dark"
                    role="progressbar"
                    aria-valuenow={Math.round(progress.progress)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Progress to ${progress.next}`}
                  >
                    <div
                      className="h-full bg-glow transition-[width] duration-500"
                      style={{ width: `${progress.progress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="mt-6 space-y-1.5">
                {lessonXp > 0 && (
                  <div className="card-flat flex items-center justify-between gap-3 px-3 py-2">
                    <span className="text-sm text-vast/70">Lessons</span>
                    <span className="tnum text-sm font-semibold">{lessonXp} XP</span>
                  </div>
                )}
                {xpBreakdown
                  .filter((r) => r.xp > 0)
                  .map((r) => (
                    <div
                      key={r.source}
                      className="card-flat flex items-center justify-between gap-3 px-3 py-2"
                    >
                      <span className="text-sm text-vast/70">
                        {getModeDisplayName(r.source)}
                      </span>
                      <span className="tnum text-sm font-semibold">{r.xp} XP</span>
                    </div>
                  ))}
                {lessonXp === 0 && xpBreakdown.every((r) => r.xp === 0) && (
                  <p className="py-2 text-sm text-vast/50">No XP yet</p>
                )}
              </div>

              <ul className="mt-6 space-y-1 border-t-2 border-vast/10 pt-5">
                {LEVEL_NAMES.map((l, i) => {
                  const unlocked = xp >= l.minXp;
                  return (
                    <li
                      key={l.name}
                      aria-current={i === rankIdx ? 'true' : undefined}
                      className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm ${
                        i === rankIdx
                          ? 'border-2 border-vast bg-dawn font-semibold'
                          : unlocked
                            ? 'text-vast/70'
                            : 'text-vast/35'
                      }`}
                    >
                      <span>{l.name}</span>
                      <span className="tnum text-xs">
                        {l.minXp === 0 ? 'Start' : `${l.minXp.toLocaleString()} XP`}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
