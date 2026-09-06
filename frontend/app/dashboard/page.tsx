'use client';

import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth-store';
import { useDashboard } from '@/lib/queries';

import Link from 'next/link';
import {
  FileText, Gauge, Target, Zap, TrendingUp, ArrowRight, BarChart3,
  Brain, Timer, CheckCircle2, XCircle, ChevronLeft, ChevronRight,
  Clock, AlertTriangle, ArrowUp, ArrowDown, X,
} from 'lucide-react';
import { getLevelFromXP, getLevelIndex, getLevelProgress, LEVEL_NAMES } from '@/lib/utils';
import { ROUTES, PAGINATION } from '@/lib/config';

/* -------------------------------------------------------------------------- */

/** The CHSL bar every figure on this page is read against. Named once so the
 *  summary tiles and the per-test verdict can never drift apart. */
const CHSL_WPM = 35;
const CHSL_ACC = 95;

/** Qualification odds read very differently at 20% and at 80% — colour the
 *  chip so the shape of the number lands before the number is read. */
function oddsChip(p: number): string {
  if (p >= 70) return 'chip-ok';
  if (p >= 40) return 'chip-glow';
  return 'chip-err';
}

function trendChip(trend: string): string {
  if (trend === 'improving') return 'chip-ok';
  if (trend === 'declining') return 'chip-err';
  return '';
}

/* -------------------------------------------------------------------------- */

function Skeleton() {
  return (
    <div
      className="mx-auto w-full max-w-content px-5 py-10 sm:px-8 sm:py-14"
      role="status"
      aria-label="Loading dashboard"
    >
      <div aria-hidden="true">
        {/* Header */}
        <div className="mb-10">
          <div className="skeleton h-3.5 w-24" />
          <div className="skeleton mt-4 h-12 w-72 max-w-full" />
          <div className="skeleton mt-3 h-5 w-64 max-w-full" />
        </div>

        {/* Summary tiles */}
        <div className="mb-10 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="card p-5">
              <div className="skeleton h-3.5 w-20" />
              <div className="skeleton mt-4 h-9 w-24" />
              <div className="skeleton mt-4 h-5 w-16" />
            </div>
          ))}
        </div>

        {/* Performance summary */}
        <div className="mb-10">
          <div className="skeleton mb-4 h-8 w-56" />
          <div className="card space-y-4 p-5 sm:p-6">
            {[0, 1].map((i) => (
              <div key={i} className="card-flat p-4">
                <div className="flex items-center justify-between">
                  <div className="skeleton h-6 w-40" />
                  <div className="skeleton h-6 w-28" />
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {[0, 1].map((j) => (
                    <div key={j}>
                      <div className="skeleton h-4 w-full" />
                      <div className="skeleton mt-2 h-2.5 w-full rounded-full" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div className="grid gap-3 sm:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="card-flat p-4 text-center">
                  <div className="skeleton mx-auto h-3.5 w-20" />
                  <div className="skeleton mx-auto mt-3 h-7 w-16" />
                  <div className="skeleton mx-auto mt-3 h-3 w-24" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="mb-10">
          <div className="skeleton mb-4 h-8 w-40" />
          <div className="grid gap-4 sm:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="card p-5">
                <div className="flex items-center gap-3">
                  <div className="skeleton h-10 w-10" />
                  <div className="skeleton h-7 w-32" />
                </div>
                <div className="skeleton mt-4 h-5 w-40 max-w-full" />
                <div className="skeleton mt-5 h-4 w-12" />
              </div>
            ))}
          </div>
        </div>

        {/* Recent tests */}
        <div>
          <div className="skeleton mb-4 h-8 w-44" />
          <div className="card divide-y-2 divide-vast/10 overflow-hidden">
            {[0, 1, 2].map((i) => (
              <div key={i} className="px-5 py-4">
                <div className="flex items-center justify-between">
                  <div className="skeleton h-5 w-40" />
                  <div className="skeleton h-6 w-24" />
                </div>
                <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
                  {[0, 1, 2, 3, 4, 5].map((j) => (
                    <div key={j} className="skeleton h-11" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [showXPModal, setShowXPModal] = useState(false);
  const [page, setPage] = useState(0);
  const perPage = PAGINATION.dashboardPerPage;

  useEffect(() => {
    const handler = () => queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    window.addEventListener('dashboard-invalidate', handler);
    return () => window.removeEventListener('dashboard-invalidate', handler);
  }, [queryClient]);

  const { data, isLoading, isError, refetch } = useDashboard();

  if (!user || isLoading) return <Skeleton />;

  if (isError) {
    return (
      <div className="mx-auto flex w-full max-w-content items-center justify-center px-5 py-24 sm:px-8">
        <div className="card mx-auto max-w-md p-8 text-center">
          <AlertTriangle className="mx-auto mb-4 h-10 w-10 text-flare" strokeWidth={2} />
          <h2 className="text-3xl">Could not load your dashboard</h2>
          <p className="mt-3 text-base text-vast/60">
            Check your connection and try again.
          </p>
          <button onClick={() => refetch()} className="btn btn-primary btn-md mt-6">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const analytics = data?.overview;
  const predictions = data?.predictions;
  const recentTests = data?.recent_scores || [];

  /* Progress toward each target, clamped. Computed once so the bar width and
     its aria-valuenow can never disagree. */
  const chslWpmPct = predictions?.chsl_wpm_target
    ? Math.min(100, ((predictions.recent_avg_wpm || 0) / predictions.chsl_wpm_target) * 100)
    : 0;
  const chslAccPct = predictions?.chsl_acc_target
    ? Math.min(100, ((predictions.recent_avg_accuracy || 0) / predictions.chsl_acc_target) * 100)
    : 0;
  const cglAccPct = Math.min(100, ((predictions?.recent_avg_accuracy || 0) / 95) * 100);

  const avgWpm = analytics?.avg_wpm ?? 0;
  const avgAcc = analytics?.avg_accuracy ?? 0;

  return (
    <div className="mx-auto w-full max-w-content px-5 py-10 sm:px-8 sm:py-14">
      <header className="mb-10">
        <p className="eyebrow">Dashboard</p>
        <h1 className="mt-3 text-4xl sm:text-5xl">
          Hey, <em>{user.full_name}</em>
        </h1>
        <p className="mt-4 text-lg text-vast/60">
          Track your SSC typing preparation
        </p>
      </header>

      {/* ═════════════════════════════════════════════ summary — four figures */}
      {/* The whole page in four numbers, before any detail. Each carries its
          own verdict, so the state is legible without reading the figure. */}
      <div className="mb-12 grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="card flex flex-col p-5">
          <div className="flex items-start justify-between gap-2">
            <span className="eyebrow">Tests taken</span>
            <FileText className="h-4 w-4 shrink-0 text-vast/40" strokeWidth={2} />
          </div>
          <div className="tnum mt-3 font-display text-3xl leading-none sm:text-4xl">
            {analytics?.total_tests || 0}
          </div>
          <p className="mt-auto pt-3 text-sm text-vast/50">All modes</p>
        </div>

        <div className="card flex flex-col p-5">
          <div className="flex items-start justify-between gap-2">
            <span className="eyebrow">Avg WPM</span>
            <Gauge className="h-4 w-4 shrink-0 text-vast/40" strokeWidth={2} />
          </div>
          <div className="tnum mt-3 font-display text-3xl leading-none sm:text-4xl">
            {analytics?.avg_wpm?.toFixed(1) || 0}
          </div>
          <div className="mt-auto pt-3">
            <span className={`chip ${avgWpm >= CHSL_WPM ? 'chip-ok' : ''}`}>
              {avgWpm >= CHSL_WPM ? 'At the bar' : `Bar ${CHSL_WPM}`}
            </span>
          </div>
        </div>

        <div className="card flex flex-col p-5">
          <div className="flex items-start justify-between gap-2">
            <span className="eyebrow">Avg accuracy</span>
            <Target className="h-4 w-4 shrink-0 text-vast/40" strokeWidth={2} />
          </div>
          <div className="tnum mt-3 font-display text-3xl leading-none sm:text-4xl">
            {`${analytics?.avg_accuracy?.toFixed(1) || 0}%`}
          </div>
          <div className="mt-auto pt-3">
            <span className={`chip ${avgAcc >= CHSL_ACC ? 'chip-ok' : ''}`}>
              {avgAcc >= CHSL_ACC ? 'At the bar' : `Bar ${CHSL_ACC}%`}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowXPModal(true)}
          aria-haspopup="dialog"
          aria-expanded={showXPModal}
          className="card group flex flex-col p-5 text-left transition-transform duration-200 ease-spring hover:-translate-y-1"
        >
          <div className="flex items-start justify-between gap-2">
            <span className="eyebrow">{getLevelFromXP(user.xp)}</span>
            <Zap className="h-4 w-4 shrink-0 text-vast/40" strokeWidth={2} />
          </div>
          <div className="tnum mt-3 font-display text-3xl leading-none sm:text-4xl">
            {user.xp}
          </div>
          <span className="mt-auto flex items-center gap-1.5 pt-3 text-sm text-vast/50 transition-colors group-hover:text-vast">
            XP breakdown
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" strokeWidth={2.2} />
          </span>
        </button>
      </div>

      {/* ═══════════════════════════════════════ performance — targets & trend */}
      {predictions && (
        <section className="mb-12" aria-labelledby="perf-heading" data-reveal>
          <div className="mb-4 flex items-center gap-2.5">
            <TrendingUp className="h-5 w-5" strokeWidth={2} />
            <h2 id="perf-heading" className="text-3xl">
              Performance summary
            </h2>
          </div>

          <div className="card space-y-4 p-5 sm:p-6">
            {predictions.chsl_wpm_target ? (
              <div className="card-flat p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-xl">SSC CHSL</h3>
                  <span className={`chip ${oddsChip(predictions.chsl_qualification_probability)}`}>
                    Odds
                    <span className="tnum">{predictions.chsl_qualification_probability}%</span>
                  </span>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <div className="flex items-baseline justify-between gap-2 text-sm">
                      <span className="text-vast/60">Net WPM</span>
                      <span className="tnum font-semibold">
                        {predictions.recent_avg_wpm || 0}
                        <span className="font-normal text-vast/40"> / {predictions.chsl_wpm_target}</span>
                      </span>
                    </div>
                    <div
                      className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-lumen-dark"
                      role="progressbar"
                      aria-valuenow={Math.round(chslWpmPct)}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label="Net WPM against the CHSL target"
                    >
                      <div
                        className={`h-full rounded-full transition-[width] duration-500 ${
                          (predictions.recent_avg_wpm || 0) >= predictions.chsl_wpm_target
                            ? 'bg-ok'
                            : 'bg-fathom'
                        }`}
                        style={{ width: `${chslWpmPct}%` }}
                      />
                    </div>
                    {predictions.wpm_gap > 0 && (
                      <p className="tnum mt-1.5 flex items-center gap-1 text-xs text-err">
                        <ArrowUp className="h-3 w-3" strokeWidth={2.5} />
                        Need +{predictions.wpm_gap} WPM more
                      </p>
                    )}
                  </div>

                  <div>
                    <div className="flex items-baseline justify-between gap-2 text-sm">
                      <span className="text-vast/60">Accuracy</span>
                      <span className="tnum font-semibold">
                        {predictions.recent_avg_accuracy || 0}%
                        <span className="font-normal text-vast/40"> / {predictions.chsl_acc_target}%</span>
                      </span>
                    </div>
                    <div
                      className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-lumen-dark"
                      role="progressbar"
                      aria-valuenow={Math.round(chslAccPct)}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label="Accuracy against the CHSL target"
                    >
                      <div
                        className={`h-full rounded-full transition-[width] duration-500 ${
                          (predictions.recent_avg_accuracy || 0) >= predictions.chsl_acc_target
                            ? 'bg-ok'
                            : 'bg-fathom'
                        }`}
                        style={{ width: `${chslAccPct}%` }}
                      />
                    </div>
                    {predictions.acc_gap > 0 && (
                      <p className="tnum mt-1.5 flex items-center gap-1 text-xs text-err">
                        <ArrowUp className="h-3 w-3" strokeWidth={2.5} />
                        Need +{predictions.acc_gap}% accuracy more
                      </p>
                    )}
                  </div>
                </div>

                {predictions.wpm_series && predictions.wpm_series.length >= 2 && (
                  <div className="mt-4 border-t border-vast/10 pt-3">
                    <MiniChart data={predictions.wpm_series} tone="text-fathom" label="WPM" />
                  </div>
                )}
              </div>
            ) : null}

            <div className="card-flat p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-xl">SSC CGL DEST</h3>
                <span className={`chip ${oddsChip(predictions.cgl_dest_qualification_probability)}`}>
                  Odds
                  <span className="tnum">{predictions.cgl_dest_qualification_probability}%</span>
                </span>
              </div>

              <div className="mt-4">
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="text-vast/60">Accuracy (CGL focus)</span>
                  <span className="tnum font-semibold">
                    {predictions.recent_avg_accuracy || 0}%
                    <span className="font-normal text-vast/40"> / 95%</span>
                  </span>
                </div>
                <div
                  className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-lumen-dark"
                  role="progressbar"
                  aria-valuenow={Math.round(cglAccPct)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Accuracy against the CGL DEST target"
                >
                  <div
                    className={`h-full rounded-full transition-[width] duration-500 ${
                      (predictions.recent_avg_accuracy || 0) >= 95 ? 'bg-ok' : 'bg-err'
                    }`}
                    style={{ width: `${cglAccPct}%` }}
                  />
                </div>
              </div>

              {predictions.accuracy_series && predictions.accuracy_series.length >= 2 && (
                <div className="mt-4 border-t border-vast/10 pt-3">
                  <MiniChart data={predictions.accuracy_series} tone="text-flare" label="Accuracy %" />
                </div>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="card-flat p-4 text-center">
                <p className="eyebrow">Consistency</p>
                <p className="tnum mt-2 font-display text-3xl leading-none">
                  {predictions.consistency_score?.toFixed(0) || '-'}%
                </p>
                <p className="tnum mt-2 text-xs text-vast/50">
                  {predictions.tests_analyzed || 0} tests analysed
                </p>
              </div>

              <div className="card-flat p-4 text-center">
                <p className="eyebrow">WPM trend</p>
                <p className="mt-2">
                  <span className={`chip capitalize ${trendChip(predictions.wpm_trend)}`}>
                    {predictions.wpm_trend === 'improving' ? (
                      <ArrowUp className="h-3.5 w-3.5" strokeWidth={2.5} />
                    ) : predictions.wpm_trend === 'declining' ? (
                      <ArrowDown className="h-3.5 w-3.5" strokeWidth={2.5} />
                    ) : null}
                    {predictions.wpm_trend}
                  </span>
                </p>
                <p className="tnum mt-2 text-xs text-vast/50">
                  Last {Math.min(predictions.wpm_series?.length || 0, 10)} tests
                </p>
              </div>

              <div className="card-flat p-4 text-center">
                <p className="eyebrow">Accuracy trend</p>
                <p className="mt-2">
                  <span className={`chip capitalize ${trendChip(predictions.accuracy_trend)}`}>
                    {predictions.accuracy_trend === 'improving' ? (
                      <ArrowUp className="h-3.5 w-3.5" strokeWidth={2.5} />
                    ) : predictions.accuracy_trend === 'declining' ? (
                      <ArrowDown className="h-3.5 w-3.5" strokeWidth={2.5} />
                    ) : null}
                    {predictions.accuracy_trend}
                  </span>
                </p>
                <p className="tnum mt-2 text-xs text-vast/50">
                  Last {Math.min(predictions.accuracy_series?.length || 0, 10)} tests
                </p>
              </div>
            </div>

            {predictions.recommendation && (
              <div className="card-flat p-4">
                <p className="eyebrow">Tip</p>
                <p className="mt-2 text-base leading-relaxed text-vast/70">
                  {predictions.recommendation}
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════ quick actions */}
      <section className="mb-12" aria-labelledby="actions-heading" data-reveal>
        <h2 id="actions-heading" className="mb-4 text-3xl">
          Start a test
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { href: ROUTES.examChsl, title: 'SSC CHSL Practice', desc: '10 min, 35 WPM target', icon: <Target className="h-5 w-5" strokeWidth={2} /> },
            { href: ROUTES.examMock, title: 'Mock Test', desc: 'Full exam simulation', icon: <Timer className="h-5 w-5" strokeWidth={2} /> },
            { href: '/coach', title: 'AI Coach', desc: 'Personalized feedback', icon: <Brain className="h-5 w-5" strokeWidth={2} /> },
          ].map((action) => (
            <Link
              key={action.title}
              href={action.href}
              className="card group flex flex-col p-5 transition-transform duration-200 ease-spring hover:-translate-y-1"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-2 border-vast bg-dawn">
                  {action.icon}
                </span>
                <h3 className="text-2xl">{action.title}</h3>
              </div>
              <p className="mt-3 flex-1 text-base text-vast/60">{action.desc}</p>
              <span className="mt-5 flex items-center gap-1.5 border-t-2 border-vast/10 pt-3 text-sm text-vast/50 transition-colors group-hover:text-vast">
                Go
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" strokeWidth={2.2} />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════ recent tests */}
      <section aria-labelledby="recent-heading" data-reveal>
        <div className="mb-4 flex items-center gap-2.5">
          <BarChart3 className="h-5 w-5" strokeWidth={2} />
          <h2 id="recent-heading" className="text-3xl">
            Recent tests
          </h2>
        </div>

        <div className="card overflow-hidden">
          {recentTests.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-base text-vast/60">No tests yet.</p>
              <Link href={ROUTES.examChsl} className="btn btn-primary btn-md mt-5">
                Take your first test
                <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
              </Link>
            </div>
          ) : (
            <ul className="divide-y-2 divide-vast/10">
              {recentTests.slice(page * perPage, (page + 1) * perPage).map((test: any, idx: number) => (
                <li key={test.id}>
                  <Link
                    href={`/analysis/${test.id}`}
                    className="block px-5 py-4 transition-colors hover:bg-dawn/25"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="text-base font-semibold">
                          {test.mode?.replace(/_/g, ' ').toUpperCase()}
                        </span>
                        <span className="tnum text-sm text-vast/50">
                          {test.date ? new Date(test.date).toLocaleDateString() : ''}
                        </span>
                        {test.duration ? (
                          <span className="tnum flex items-center gap-1 text-sm text-vast/50">
                            <Clock className="h-3.5 w-3.5" strokeWidth={2} />
                            {test.duration}s
                          </span>
                        ) : null}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`chip ${test.qualified ? 'chip-ok' : 'chip-err'}`}>
                          {test.qualified ? (
                            <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.5} />
                          ) : (
                            <XCircle className="h-3.5 w-3.5" strokeWidth={2.5} />
                          )}
                          {test.qualified ? 'Qualified' : 'Not qualified'}
                        </span>
                        {test.xp_earned > 0 && (
                          <span className="chip chip-glow tnum">+{test.xp_earned} XP</span>
                        )}
                      </div>
                    </div>

                    <dl className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
                      <div className="rounded-lg border border-vast/10 bg-lumen px-2 py-1.5 text-center">
                        <dt className="text-xs text-vast/50">Net WPM</dt>
                        <dd className="tnum text-base font-semibold">{test.wpm?.toFixed(1)}</dd>
                      </div>
                      <div className="rounded-lg border border-vast/10 bg-lumen px-2 py-1.5 text-center">
                        <dt className="text-xs text-vast/50">Gross WPM</dt>
                        <dd className="tnum text-base font-semibold">{test.gross_wpm?.toFixed(1) || '-'}</dd>
                      </div>
                      <div className="rounded-lg border border-vast/10 bg-lumen px-2 py-1.5 text-center">
                        <dt className="text-xs text-vast/50">Accuracy</dt>
                        <dd className="tnum text-base font-semibold">{test.accuracy?.toFixed(1)}%</dd>
                      </div>
                      <div className="rounded-lg border border-vast/10 bg-lumen px-2 py-1.5 text-center">
                        <dt className="text-xs text-vast/50">Errors</dt>
                        <dd
                          className={`tnum text-base font-semibold ${
                            (test.total_errors ?? 0) > 0 ? 'text-err' : ''
                          }`}
                        >
                          {test.total_errors ?? '-'}
                        </dd>
                      </div>
                      <div className="hidden rounded-lg border border-vast/10 bg-lumen px-2 py-1.5 text-center sm:block">
                        <dt className="text-xs text-vast/50">Backspaces</dt>
                        <dd className="tnum text-base font-semibold text-vast/70">
                          {test.backspace_count ?? '-'}
                        </dd>
                      </div>
                      <div className="hidden rounded-lg border border-vast/10 bg-lumen px-2 py-1.5 text-center sm:block">
                        <dt className="text-xs text-vast/50">Consistency</dt>
                        <dd className="tnum text-base font-semibold text-vast/70">
                          {test.consistency_score ? `${test.consistency_score.toFixed(0)}%` : '-'}
                        </dd>
                      </div>
                    </dl>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {test.wpm >= CHSL_WPM && test.accuracy >= CHSL_ACC ? (
                        <span className="chip chip-ok">
                          <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.5} />
                          Qualifies SSC CHSL
                        </span>
                      ) : (
                        <span className="chip tnum">
                          <AlertTriangle className="h-3.5 w-3.5" strokeWidth={2.2} />
                          {test.wpm < CHSL_WPM ? `${CHSL_WPM - Math.floor(test.wpm)} WPM short` : ''}
                          {test.wpm < CHSL_WPM && test.accuracy < CHSL_ACC ? ' + ' : ''}
                          {test.accuracy < CHSL_ACC
                            ? `${(CHSL_ACC - (test.accuracy || 0)).toFixed(1)}% accuracy short`
                            : ''}
                        </span>
                      )}
                      {idx > 0 && test.wpm && (() => {
                        const prevWPM = recentTests.slice(page * perPage, (page + 1) * perPage)[idx - 1]?.wpm;
                        if (!prevWPM || prevWPM === test.wpm) return null;
                        const improved = test.wpm > prevWPM;
                        return (
                          <span className={`chip tnum ${improved ? 'chip-ok' : 'chip-err'}`}>
                            {improved ? (
                              <ArrowUp className="h-3 w-3" strokeWidth={2.5} />
                            ) : (
                              <ArrowDown className="h-3 w-3" strokeWidth={2.5} />
                            )}
                            {Math.abs(test.wpm - prevWPM).toFixed(1)}
                          </span>
                        );
                      })()}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {recentTests.length > perPage && (
            <div className="flex items-center justify-between gap-3 border-t-2 border-vast/10 px-5 py-3">
              <p className="tnum text-sm text-vast/50">
                Showing {page * perPage + 1}–{Math.min((page + 1) * perPage, recentTests.length)} of{' '}
                {recentTests.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  aria-label="Previous page"
                  className="btn btn-outline btn-sm w-9 px-0"
                >
                  <ChevronLeft className="h-4 w-4" strokeWidth={2.5} />
                </button>
                <button
                  onClick={() => setPage(p => p + 1)}
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

      {/* ═══════════════════════════════════════════════════════════ XP detail */}
      {showXPModal && user && (() => {
        const xp = user.xp || 0;
        const rank = getLevelFromXP(xp);
        const rankIdx = getLevelIndex(xp);
        const progress = getLevelProgress(xp);
        const totalTests = analytics?.total_tests || 0;
        const recentXpTotal = recentTests.slice(0, 10).reduce((s: number, t: any) => s + (t.xp_earned || 0), 0);
        const avgXpPerTest = totalTests > 0 ? Math.round(xp / totalTests) : 0;
        const xpBreakdown: { source: string; xp: number; tests: number }[] = (data as any)?.xpBreakdown || [];
        const lessonXp: number = (data as any)?.lessonXp ?? Math.max(0, xp - xpBreakdown.reduce((s, r) => s + r.xp, 0));
        const modeLabels: Record<string, string> = {
          ssc_chsl: 'SSC CHSL',
          ssc_cgl_dest: 'SSC CGL DEST',
          ssc_cgl: 'SSC CGL',
          practice: 'Practice',
          blind: 'Blind Typing',
          lesson: 'Lessons',
        };
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-vast/50 p-4"
            onClick={() => setShowXPModal(false)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="xp-modal-title"
              className="card relative max-h-[90vh] w-full max-w-lg overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6">
                <button
                  onClick={() => setShowXPModal(false)}
                  aria-label="Close XP breakdown"
                  className="btn btn-outline btn-sm absolute right-4 top-4 w-9 px-0"
                >
                  <X className="h-4 w-4" strokeWidth={2.5} />
                </button>

                <div className="flex items-center gap-4 pr-12">
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-vast bg-glow">
                    <Zap className="h-6 w-6" strokeWidth={2.2} />
                  </span>
                  <div>
                    <h2 id="xp-modal-title" className="text-3xl">{rank}</h2>
                    <p className="tnum mt-1 text-sm text-vast/60">
                      {xp.toLocaleString()} total XP
                    </p>
                  </div>
                </div>

                {progress.next && (
                  <div className="mt-6">
                    <div className="flex items-baseline justify-between gap-2 text-sm">
                      <span className="text-vast/60">Next: {progress.next}</span>
                      <span className="tnum font-semibold">
                        {xp - progress.currentXp} / {progress.nextXp - progress.currentXp} XP
                      </span>
                    </div>
                    <div
                      className="mt-2 h-6 w-full overflow-hidden rounded-full border-2 border-vast bg-lumen-dark"
                      role="progressbar"
                      aria-valuenow={Math.round(progress.progress)}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`Progress to ${progress.next}`}
                    >
                      <div
                        className="flex h-full items-center justify-end bg-glow pr-2 transition-[width] duration-500"
                        style={{ width: `${progress.progress}%` }}
                      >
                        {progress.progress > 15 && (
                          <span className="tnum text-xs font-semibold">
                            {progress.progress.toFixed(0)}%
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="tnum mt-2 text-xs text-vast/50">
                      {Math.ceil(progress.nextXp - xp)} more XP to reach {progress.next}
                    </p>
                  </div>
                )}

                <div className="mt-6 grid grid-cols-3 gap-3">
                  <div className="card-flat p-3 text-center">
                    <p className="tnum font-display text-2xl leading-none">{totalTests}</p>
                    <p className="mt-2 text-xs text-vast/50">Tests taken</p>
                  </div>
                  <div className="card-flat p-3 text-center">
                    <p className="tnum font-display text-2xl leading-none">{avgXpPerTest}</p>
                    <p className="mt-2 text-xs text-vast/50">Avg XP / test</p>
                  </div>
                  <div className="card-flat p-3 text-center">
                    <p className="tnum font-display text-2xl leading-none text-ok">+{recentXpTotal}</p>
                    <p className="mt-2 text-xs text-vast/50">Last 10 tests XP</p>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="text-xl">XP breakdown</h3>
                  <div className="mt-3 space-y-1.5">
                    {lessonXp > 0 && (
                      <div className="card-flat flex items-center justify-between gap-3 px-3 py-2">
                        <span className="text-sm text-vast/70">Learn Typing (Lessons)</span>
                        <span className="tnum text-sm font-semibold">{lessonXp} XP</span>
                      </div>
                    )}
                    {xpBreakdown.filter(r => r.xp > 0).map((r) => (
                      <div key={r.source} className="card-flat flex items-center justify-between gap-3 px-3 py-2">
                        <span className="text-sm text-vast/70">{modeLabels[r.source] || r.source}</span>
                        <span className="tnum text-sm font-semibold">{r.xp} XP</span>
                      </div>
                    ))}
                    {lessonXp === 0 && xpBreakdown.every(r => r.xp === 0) && (
                      <p className="py-2 text-sm text-vast/50">No XP earned yet</p>
                    )}
                  </div>
                </div>

                <div className="mt-6 border-t-2 border-vast/10 pt-5">
                  <h3 className="text-xl">Rank progression</h3>
                  <ul className="mt-3 space-y-1.5">
                    {LEVEL_NAMES.map((l, i) => {
                      const unlocked = xp >= l.minXp;
                      const isCurrent = i === rankIdx;
                      return (
                        <li
                          key={l.name}
                          aria-current={isCurrent ? 'true' : undefined}
                          className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 ${
                            isCurrent
                              ? 'border-2 border-vast bg-dawn'
                              : unlocked
                                ? 'border border-vast/15 bg-ok-bg'
                                : 'border border-vast/10 bg-lumen'
                          }`}
                        >
                          <span className="flex items-center gap-2.5">
                            <span
                              className={`tnum flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                                unlocked ? 'bg-ok text-cream' : 'bg-lumen-dark text-vast/40'
                              }`}
                            >
                              {unlocked ? '✓' : i + 1}
                            </span>
                            <span className={`text-sm ${unlocked ? 'font-semibold' : 'text-vast/40'}`}>
                              {l.name}
                            </span>
                          </span>
                          <span className={`tnum text-xs ${unlocked ? 'text-vast/60' : 'text-vast/30'}`}>
                            {l.minXp === 0 ? 'Start' : `${l.minXp.toLocaleString()} XP`}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

/**
 * Sparkline for a short numeric series.
 *
 * `tone` is a text-colour utility rather than a raw colour: the line and its
 * end dots draw with `currentColor`, which keeps every chart colour on the
 * token palette instead of a hardcoded hex.
 */
function MiniChart({ data, tone, label }: { data: number[]; tone: string; label: string }) {
  const values = [...data].reverse();
  if (values.length < 2) return null;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const w = 180;
  const h = 32;
  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x},${y}`;
  }).join(' ');
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className="text-vast/50">{label} trend (recent {values.length})</span>
        <span className="tnum font-semibold">{values[values.length - 1].toFixed(1)}</span>
      </div>
      {/* The label and latest value above already state everything the line
          encodes, so the chart itself is decorative to a screen reader. */}
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className={`mt-1 h-8 w-full ${tone}`}
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
        {values.length >= 2 && (
          <>
            <circle
              cx={points.split(' ')[0].split(',')[0]}
              cy={points.split(' ')[0].split(',')[1]}
              r="2.5"
              fill="currentColor"
              opacity="0.45"
            />
            <circle
              cx={points.split(' ')[values.length - 1].split(',')[0]}
              cy={points.split(' ')[values.length - 1].split(',')[1]}
              r="3"
              fill="currentColor"
            />
          </>
        )}
      </svg>
    </div>
  );
}
