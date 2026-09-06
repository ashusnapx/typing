'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Check,
  X,
  RotateCcw,
  ArrowRight,
  ChevronDown,
  Sparkles,
  Save,
} from 'lucide-react';
import { getModeDisplayName } from '@/lib/utils';
import { getExamSpecs } from '@/lib/exam-config';
import { ROUTES } from '@/lib/config';
import PassageDiffView from './passage-diff';
import { useAuthStore } from '@/store/auth-store';

/* ------------------------------------------------------------------ types */

interface ResultScreenProps {
  result: any;
  mode: string;
  lang?: 'english' | 'hindi';
  wpmTarget?: number;
  router: any;
  originalContent: string;
  typedContent: string;
  onRetry?: () => void;
}

type CategoryKey = 'ur' | 'obcEws' | 'scSt';

/** Keys and storage must match components/learn/post-selector.tsx exactly —
 *  they are the same setting, and the app promises the post/category chosen
 *  once drives every verdict. */
const CATEGORIES: { key: CategoryKey; label: string; specKey: string }[] = [
  { key: 'ur', label: 'UR', specKey: 'errorAllowanceGeneral' },
  { key: 'obcEws', label: 'OBC / EWS', specKey: 'errorAllowanceObcEws' },
  { key: 'scSt', label: 'SC / ST', specKey: 'errorAllowanceScSt' },
];

const CATEGORY_STORAGE_KEY = 'tm-category-v2';

/* ------------------------------------------------------------- sub-parts */

/** A single figure. `quiet` drops the ink border for the second-tier numbers,
 *  so the four that decide the verdict stay the loudest things on the page. */
function Metric({
  label,
  value,
  sub,
  tone,
  quiet,
}: {
  label: string;
  value: string | number;
  sub?: string;
  tone?: 'ok' | 'err' | 'warn';
  quiet?: boolean;
}) {
  return (
    <div className={quiet ? 'card-flat px-4 py-3.5' : 'card px-4 py-4'}>
      <div
        className={`tnum font-display leading-none ${
          quiet ? 'text-2xl' : 'text-3xl'
        } ${
          tone === 'ok'
            ? 'text-ok'
            : tone === 'err'
              ? 'text-err'
              : tone === 'warn'
                ? 'text-warn'
                : ''
        }`}
      >
        {value}
      </div>
      <div className="eyebrow mt-2.5">{label}</div>
      {sub && <div className="tnum mt-1 text-xs text-vast/50">{sub}</div>}
    </div>
  );
}

function Disclosure({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-vast/5"
      >
        <span className="text-base font-semibold">{title}</span>
        <ChevronDown
          className={`ml-auto h-4 w-4 shrink-0 text-vast/40 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
          strokeWidth={2}
        />
      </button>
      {open && <div className="border-t-2 border-vast/10 p-5">{children}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ main */

export function ResultScreen({
  result,
  mode,
  lang = 'english',
  wpmTarget,
  router,
  originalContent,
  typedContent,
  onRetry,
}: ResultScreenProps) {
  const { isAuthenticated } = useAuthStore();
  const [category, setCategory] = useState<CategoryKey>('ur');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // A candidate's category never changes between attempts, so remembering it
  // saves them re-selecting it after every single test.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CATEGORY_STORAGE_KEY) as CategoryKey | null;
      if (saved && CATEGORIES.some((c) => c.key === saved)) setCategory(saved);
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

  const specs = getExamSpecs(mode);
  const netWpm = result.ssc_net_wpm || result.net_wpm || 0;
  const accuracy = result.ssc_accuracy || result.accuracy || 0;
  const fullMistakes = result.full_mistakes ?? 0;
  const halfMistakes = result.half_mistakes ?? 0;
  const errorPct = result.ssc_error_percentage ?? 100 - accuracy;
  const targetWpm = wpmTarget || specs?.englishSpeedWpm || 35;

  const completion = useMemo(() => {
    const typedWords = typedContent?.trim() ? typedContent.trim().split(/\s+/).length : 0;
    const originalWords = originalContent?.trim()
      ? originalContent.trim().split(/\s+/).length
      : 1;
    return Math.min(100, Math.round((typedWords / originalWords) * 100));
  }, [typedContent, originalContent]);

  const errorLimit =
    (specs?.[
      CATEGORIES.find((c) => c.key === category)!.specKey as keyof typeof specs
    ] as number) ?? 20;

  const kdph =
    result.key_depression_count && result.time_taken_seconds
      ? Math.round((result.key_depression_count / result.time_taken_seconds) * 3600)
      : 0;

  const speedMet =
    specs?.qualifyingNature === 'speed_wpm'
      ? netWpm >= targetWpm
      : kdph >= (specs?.englishKdph || 8000);
  const errorsMet = errorPct <= errorLimit;
  const completionMet = completion >= 50;
  const qualified = speedMet && errorsMet && completionMet;

  /** The one line that matters. Says how far off, not just that you failed. */
  const verdictDetail = (() => {
    if (qualified) {
      return specs?.qualifyingNature === 'speed_wpm'
        ? `${netWpm.toFixed(1)} WPM against a ${targetWpm} WPM bar, with ${errorPct.toFixed(1)}% errors inside the ${errorLimit}% allowance.`
        : `${kdph.toLocaleString('en-IN')} KDPH against ${(specs?.englishKdph || 8000).toLocaleString('en-IN')}, with ${errorPct.toFixed(1)}% errors inside the ${errorLimit}% allowance.`;
    }
    const gaps: string[] = [];
    if (!speedMet) {
      gaps.push(
        specs?.qualifyingNature === 'speed_wpm'
          ? `${(targetWpm - netWpm).toFixed(1)} WPM short of ${targetWpm}`
          : `${((specs?.englishKdph || 8000) - kdph).toLocaleString('en-IN')} KDPH short`
      );
    }
    if (!errorsMet) {
      gaps.push(`${(errorPct - errorLimit).toFixed(1)} points over the ${errorLimit}% error limit`);
    }
    if (!completionMet) {
      gaps.push(`only ${completion}% of the passage typed (50% minimum)`);
    }
    return `You were ${gaps.join(', and ')}.`;
  })();

  const criteria = [
    {
      label: specs?.qualifyingNature === 'speed_wpm' ? 'Speed' : 'Key depressions',
      met: speedMet,
      you:
        specs?.qualifyingNature === 'speed_wpm'
          ? `${netWpm.toFixed(1)} WPM`
          : `${kdph.toLocaleString('en-IN')} KDPH`,
      need:
        specs?.qualifyingNature === 'speed_wpm'
          ? `${targetWpm} WPM`
          : `${(specs?.englishKdph || 8000).toLocaleString('en-IN')} KDPH`,
    },
    {
      label: 'Errors',
      met: errorsMet,
      you: `${errorPct.toFixed(1)}%`,
      need: `≤ ${errorLimit}%`,
    },
    {
      label: 'Passage completed',
      met: completionMet,
      you: `${completion}%`,
      need: '≥ 50%',
    },
  ];

  const breakdown = [
    { label: 'Omission', value: result.omission_errors || 0 },
    { label: 'Addition', value: result.addition_errors || 0 },
    { label: 'Substitution', value: result.substitution_errors || 0 },
    { label: 'Wrong word', value: result.wrong_word_errors || 0 },
    { label: 'Spacing', value: result.space_errors || 0 },
    {
      label: 'Consistency',
      value: result.consistency_score ? `${result.consistency_score.toFixed(0)}%` : '—',
    },
  ];

  return (
    <>
      {/* ═══════════════════════════════════════════════════════════ verdict */}
      {/* Pass and fail get opposite grounds — a saturated green slab against a
          pale coral wash — so the outcome lands before a word is read. */}
      <section
        className={
          qualified ? 'on-dark slab slab-green !py-14 sm:!py-20' : 'slab bg-err-bg !py-14 sm:!py-20'
        }
      >
        <div className="mx-auto w-full max-w-3xl px-5 animate-rise sm:px-8">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 ${
                qualified ? 'border-lumen text-lumen' : 'border-err bg-lumen text-err'
              }`}
            >
              {qualified ? (
                <Check className="h-5 w-5" strokeWidth={2.5} aria-hidden />
              ) : (
                <X className="h-5 w-5" strokeWidth={2.5} aria-hidden />
              )}
            </span>

            <p className="eyebrow">
              {getModeDisplayName(mode)} ·{' '}
              <span className="tnum">
                {Math.round(result.time_taken_seconds || 0)}s
              </span>{' '}
              ·{' '}
              <span lang={lang === 'hindi' ? 'hi' : undefined}>
                {lang === 'hindi' ? 'हिंदी' : 'English'}
              </span>
            </p>

            {result.xp_earned > 0 && (
              <span className="chip chip-glow ml-auto shrink-0">
                <Sparkles className="h-3 w-3" strokeWidth={2.5} aria-hidden />
                <span className="tnum">+{result.xp_earned} XP</span>
              </span>
            )}
          </div>

          <h1
            className={`mt-7 text-5xl sm:text-7xl lg:text-8xl ${
              qualified ? '' : 'text-err'
            }`}
          >
            {qualified ? (
              <>
                You would <em>qualify</em>
              </>
            ) : (
              <>
                Not qualified <em>yet</em>
              </>
            )}
          </h1>

          <p
            className={`mt-7 max-w-xl text-lg sm:text-xl ${
              qualified ? 'text-lumen/75' : 'text-vast/70'
            }`}
          >
            {verdictDetail}
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════ the evidence — cream slab over */}
      <section className="slab slab-cream !py-12 sm:!py-16">
        <div className="mx-auto w-full max-w-3xl px-5 sm:px-8">
          {/* ------------------------------------------------------ category */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
            <span className="eyebrow">Your category</span>
            <div
              role="radiogroup"
              aria-label="Reservation category"
              className="segment"
            >
              {CATEGORIES.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  role="radio"
                  aria-checked={category === c.key}
                  data-active={category === c.key}
                  onClick={() => chooseCategory(c.key)}
                  className="segment-item"
                >
                  {c.label}
                </button>
              ))}
            </div>
            <span className="text-sm text-vast/50">Changes your error allowance</span>
          </div>

          {/* ------------------------------------------------------ criteria */}
          <div className="card mt-6 overflow-hidden">
            <table className="w-full text-left">
              <caption className="sr-only">Qualification criteria</caption>
              <thead>
                <tr className="border-b-2 border-vast bg-lumen">
                  <th scope="col" className="eyebrow px-4 py-3 sm:px-5">
                    Criterion
                  </th>
                  <th scope="col" className="eyebrow px-3 py-3 text-right">
                    You
                  </th>
                  <th scope="col" className="eyebrow px-3 py-3 text-right">
                    Required
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    <span className="sr-only">Met</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {criteria.map((c) => (
                  <tr key={c.label} className="border-b border-vast/10 last:border-0">
                    <th
                      scope="row"
                      className="px-4 py-3.5 text-base font-medium sm:px-5"
                    >
                      {c.label}
                    </th>
                    <td
                      className={`tnum px-3 py-3.5 text-right text-base font-semibold ${
                        c.met ? 'text-ok' : 'text-err'
                      }`}
                    >
                      {c.you}
                    </td>
                    <td className="tnum px-3 py-3.5 text-right text-base text-vast/50">
                      {c.need}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {/* sr-only text rather than aria-label on the icon —
                          labelled SVGs are read inconsistently. */}
                      {c.met ? (
                        <span className="inline-flex text-ok">
                          <Check className="h-4 w-4" strokeWidth={2.5} aria-hidden />
                          <span className="sr-only">Met</span>
                        </span>
                      ) : (
                        <span className="inline-flex text-err">
                          <X className="h-4 w-4" strokeWidth={2.5} aria-hidden />
                          <span className="sr-only">Not met</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ------------------------------------------------------- metrics */}
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Metric
              label="Net WPM"
              value={netWpm.toFixed(1)}
              sub={`target ${targetWpm}`}
              tone={netWpm >= targetWpm ? 'ok' : 'err'}
            />
            <Metric
              label="Accuracy"
              value={`${accuracy.toFixed(1)}%`}
              tone={accuracy >= 95 ? 'ok' : accuracy >= 90 ? 'warn' : 'err'}
            />
            <Metric
              label="Full mistakes"
              value={fullMistakes}
              sub="1 error each"
              tone={fullMistakes > 0 ? 'err' : 'ok'}
            />
            <Metric
              label="Half mistakes"
              value={halfMistakes}
              sub="0.5 each"
              tone={halfMistakes > 0 ? 'warn' : 'ok'}
            />
          </div>

          <div className="mt-3 grid grid-cols-3 gap-3">
            <Metric
              label="Key depressions"
              value={result.key_depression_count || 0}
              quiet
            />
            <Metric label="Backspaces" value={result.backspace_count || 0} quiet />
            <Metric label="Error rate" value={`${errorPct.toFixed(1)}%`} quiet />
          </div>

          {/* --------------------------------------------------- save prompt */}
          {!isAuthenticated && (
            <div className="mt-10 flex flex-col gap-5 rounded-2xl border-2 border-vast bg-dawn p-6 sm:flex-row sm:items-center sm:p-7">
              <div className="flex-1">
                <h2 className="text-3xl">This result isn&apos;t saved</h2>
                <p className="mt-3 max-w-md text-base text-vast/70">
                  Create a free account to keep your history, track your speed
                  curve and get the full mistake report.
                </p>
              </div>
              <Link href="/auth/register" className="btn btn-ink btn-lg shrink-0">
                <Save className="h-4 w-4" strokeWidth={2} aria-hidden />
                Save my result
              </Link>
            </div>
          )}

          {/* ------------------------------------------------------ feedback */}
          {result.feedback && (
            <div className="card mt-6 border-l-8 border-l-glow p-5 sm:p-6">
              <p className="eyebrow">Coach</p>
              <p className="mt-3 text-base leading-relaxed text-vast/70">
                {result.feedback}
              </p>
            </div>
          )}

          {/* ---------------------------------------------------------- diff */}
          {typedContent && originalContent && (
            <section className="mt-10">
              <h2 className="text-3xl sm:text-4xl">Where you lost marks</h2>
              <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-vast/50">
                <li className="text-ok">correct</li>
                <li className="text-warn">typo or capitalisation</li>
                <li className="text-err">wrong word</li>
                <li>missed</li>
                <li className="underline decoration-err">extra</li>
              </ul>
              <div className="card mt-4 overflow-x-auto p-4">
                <PassageDiffView
                  original={originalContent}
                  typed={typedContent}
                  lang={lang}
                />
              </div>
            </section>
          )}

          {/* ----------------------------------------------------- breakdown */}
          <div className="mt-6 space-y-3">
            <Disclosure title="Error breakdown by type">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {breakdown.map((b) => (
                  <div key={b.label} className="card-flat px-3 py-3 text-center">
                    <div className="tnum font-display text-2xl leading-none">
                      {b.value}
                    </div>
                    <div className="eyebrow mt-2">{b.label}</div>
                  </div>
                ))}
              </div>
            </Disclosure>

            {specs && (
              <Disclosure title="How this was scored">
                <p className="text-base leading-relaxed text-vast/70">
                  {specs.source}. Error allowance varies by post — LDC/JSA uses 7%
                  (UR) and 10% (reserved); DEO and DEST use 20%, 25% and 30%.
                </p>
                <div className="mt-4 rounded-lg border border-vast/15 bg-lumen-dark p-4 font-mono text-xs leading-relaxed">
                  Total errors = full + (half ÷ 2)
                  <br />
                  Error % = (total errors ÷ key depressions) × 100
                </div>
                {specs.citations?.length ? (
                  <ul className="mt-4 space-y-1.5">
                    {specs.citations.map((url) => (
                      <li key={url}>
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="break-all text-xs text-fathom underline underline-offset-2"
                        >
                          {url}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </Disclosure>
            )}
          </div>

          {/* ------------------------------------------------------- actions */}
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => (onRetry ? onRetry() : window.location.reload())}
              className="btn btn-primary btn-lg flex-1"
            >
              <RotateCcw className="h-4 w-4" strokeWidth={2} aria-hidden />
              Take another test
            </button>
            {result.test_id && isAuthenticated && (
              <button
                type="button"
                onClick={() => router.push(`/analysis/${result.test_id}`)}
                className="btn btn-outline btn-lg flex-1"
              >
                Full report
                <ArrowRight className="h-4 w-4" strokeWidth={2} aria-hidden />
              </button>
            )}
            {isAuthenticated && (
              <button
                type="button"
                onClick={() => router.push(ROUTES.dashboard)}
                className="btn btn-ghost btn-lg"
              >
                Dashboard
              </button>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
