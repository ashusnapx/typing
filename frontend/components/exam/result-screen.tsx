'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Check, X, RotateCcw, ChevronDown } from 'lucide-react';
import { getModeDisplayName } from '@/lib/utils';
import { getExamSpecs } from '@/lib/exam-config';
import {
  postsFor,
  kdphFromWpm,
  MIN_COMPLETION_PCT,
  type CategoryKey,
} from '@/lib/ssc-posts';
import { ROUTES } from '@/lib/config';
import PassageDiffView from './passage-diff';
import { useAuthStore } from '@/store/auth-store';
import { ExamChrome } from './exam-chrome';

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

/** Keys and storage must match components/learn/post-selector.tsx exactly —
 *  they are the same setting, and the app promises the category chosen once
 *  drives every verdict. */
const CATEGORIES: { key: CategoryKey; label: string; specKey: string }[] = [
  { key: 'ur', label: 'UR', specKey: 'errorAllowanceGeneral' },
  { key: 'obcEws', label: 'OBC / EWS', specKey: 'errorAllowanceObcEws' },
  { key: 'scSt', label: 'SC / ST', specKey: 'errorAllowanceScSt' },
];

const CATEGORY_STORAGE_KEY = 'tm-category-v2';

/* ------------------------------------------------------------- sub-parts */

function Metric({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string | number;
  sub?: string;
  tone?: 'ok' | 'err' | 'warn';
}) {
  return (
    <div className="border border-exam-line bg-white px-3 py-2.5 text-center">
      <div
        className={`tnum text-xl font-bold ${
          tone === 'ok'
            ? 'text-exam-ok'
            : tone === 'err'
              ? 'text-exam-err'
              : tone === 'warn'
                ? 'text-exam-hot'
                : 'text-exam-navy'
        }`}
      >
        {value}
      </div>
      <div className="mt-1 text-[10px] font-bold uppercase tracking-wide text-exam-muted">
        {label}
      </div>
      {sub && <div className="tnum mt-0.5 text-[10px] text-exam-muted">{sub}</div>}
    </div>
  );
}

function Panel({
  title,
  right,
  children,
}: {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-4 overflow-hidden rounded border-2 border-exam-panel-edge bg-white">
      <header className="flex items-center gap-3 border-b border-exam-panel-edge bg-exam-panel px-5 py-2">
        <h2 className="text-xs font-bold uppercase tracking-wide text-exam-navy">
          {title}
        </h2>
        {right && <div className="ml-auto">{right}</div>}
      </header>
      <div className="px-5 py-4">{children}</div>
    </section>
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
    <div className="border-b border-exam-line last:border-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 py-3 text-left"
      >
        <span className="text-[13px] font-bold text-exam-navy">{title}</span>
        <ChevronDown
          className={`ml-auto h-4 w-4 shrink-0 text-exam-muted transition-transform ${
            open ? 'rotate-180' : ''
          }`}
          strokeWidth={2}
        />
      </button>
      {open && <div className="pb-4">{children}</div>}
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
  // saves re-selecting it after every single test.
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
      : kdphFromWpm(netWpm);

  const speedMet =
    specs?.qualifyingNature === 'speed_wpm'
      ? netWpm >= targetWpm
      : kdph >= (specs?.englishKdph || 8000);
  const errorsMet = errorPct <= errorLimit;
  const completionMet = completion >= MIN_COMPLETION_PCT;
  const qualified = speedMet && errorsMet && completionMet;

  /* Every SSC post judged against this one attempt. This is the answer to the
     question aspirants actually carry — not "did I pass the test I picked",
     but "at this score, which posts am I in the running for?" */
  const { cleared, missed } = useMemo(
    () => postsFor({ netWpm, kdph, errorPct, completionPct: completion }, category),
    [netWpm, kdph, errorPct, completion, category]
  );
  const nextTarget = missed[0] ?? null;

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
    { label: 'Errors', met: errorsMet, you: `${errorPct.toFixed(1)}%`, need: `≤ ${errorLimit}%` },
    {
      label: 'Passage completed',
      met: completionMet,
      you: `${completion}%`,
      need: `≥ ${MIN_COMPLETION_PCT}%`,
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
    <ExamChrome postLabel={getModeDisplayName(mode)}>
      <div className="relative mx-auto w-full max-w-5xl flex-1 px-4 py-4 sm:px-6">
        {/* ─────────────────────────────────────────────────────── verdict */}
        {/* The platform prints its result as a plain banner, and so does this:
            green or red, the figure, and the gap. No slabs, no headline. */}
        <div
          className={`flex flex-wrap items-center gap-x-4 gap-y-2 rounded border-2 px-5 py-4 ${
            qualified
              ? 'border-exam-ok bg-ok-bg'
              : 'border-exam-err bg-err-bg'
          }`}
        >
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
              qualified ? 'bg-exam-ok' : 'bg-exam-err'
            } text-white`}
          >
            {qualified ? (
              <Check className="h-5 w-5" strokeWidth={3} aria-hidden />
            ) : (
              <X className="h-5 w-5" strokeWidth={3} aria-hidden />
            )}
          </span>

          <div className="min-w-0">
            <p
              className={`text-lg font-bold ${
                qualified ? 'text-exam-ok' : 'text-exam-err'
              }`}
            >
              {qualified ? 'Qualified' : 'Not qualified'}
            </p>
            <p className="tnum mt-0.5 text-[13px] text-exam-text">
              {specs?.qualifyingNature === 'speed_wpm'
                ? `${netWpm.toFixed(1)} WPM against ${targetWpm}`
                : `${kdph.toLocaleString('en-IN')} KDPH against ${(specs?.englishKdph || 8000).toLocaleString('en-IN')}`}
              {' · '}
              {errorPct.toFixed(1)}% errors against a {errorLimit}% cap
            </p>
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-3">
            {result.xp_earned > 0 && (
              <span className="tnum rounded bg-exam-chrome px-2 py-1 text-[11px] font-bold text-white">
                +{result.xp_earned} XP
              </span>
            )}
            <div
              role="radiogroup"
              aria-label="Reservation category"
              className="flex overflow-hidden rounded border border-exam-line"
            >
              {CATEGORIES.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  role="radio"
                  aria-checked={category === c.key}
                  onClick={() => chooseCategory(c.key)}
                  className={`px-2.5 py-1 text-[11px] font-bold ${
                    category === c.key
                      ? 'bg-exam-chrome text-white'
                      : 'bg-white text-exam-muted'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ──────────────────────────────────────────── posts at this score */}
        <Panel
          title="Posts this score clears"
          right={
            <span className="tnum text-xs text-exam-muted">
              {cleared.length} of {cleared.length + missed.length}
            </span>
          }
        >
          {cleared.length === 0 ? (
            <p className="text-[13px] text-exam-muted">
              This score does not yet clear any SSC post.{' '}
              {nextTarget && (
                <>
                  The nearest is{' '}
                  <strong className="text-exam-text">
                    {nextTarget.post.shortName}
                  </strong>{' '}
                  — {nextTarget.gapLabel}.
                </>
              )}
            </p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {cleared.map((v) => (
                <li
                  key={v.post.id}
                  className="flex items-center gap-1.5 rounded border border-exam-ok bg-ok-bg px-2.5 py-1 text-[12px] font-bold text-exam-ok"
                >
                  <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={3} aria-hidden />
                  {v.post.shortName}
                  <span className="font-normal text-exam-muted">
                    · {v.post.exam}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {nextTarget && cleared.length > 0 && (
            <p className="mt-3 text-[13px] text-exam-text">
              Next up:{' '}
              <strong>{nextTarget.post.shortName}</strong> ({nextTarget.post.exam})
              — {nextTarget.gapLabel}.
            </p>
          )}

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[34rem] border-collapse text-left text-[12px]">
              <caption className="sr-only">
                Every SSC post judged against this attempt
              </caption>
              <thead>
                <tr>
                  {['Post', 'Exam', 'Requirement', 'You', ''].map((h, i) => (
                    <th
                      key={i}
                      scope="col"
                      className="border border-exam-line bg-exam-panel px-2.5 py-1.5 font-bold text-exam-navy"
                    >
                      {h || <span className="sr-only">Result</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...cleared, ...missed].map((v) => (
                  <tr key={v.post.id}>
                    <th
                      scope="row"
                      className="border border-exam-line px-2.5 py-1.5 text-left font-semibold"
                    >
                      {v.post.shortName}
                      {v.post.disputed && (
                        <span
                          className="ml-1 text-exam-hot"
                          title="Sources disagree on this post's error cap"
                        >
                          *
                        </span>
                      )}
                    </th>
                    <td className="border border-exam-line px-2.5 py-1.5">
                      {v.post.exam}
                    </td>
                    <td className="tnum border border-exam-line px-2.5 py-1.5">
                      {v.requirement}
                    </td>
                    <td
                      className={`tnum border border-exam-line px-2.5 py-1.5 ${
                        v.cleared ? 'text-exam-ok' : 'text-exam-err'
                      }`}
                    >
                      {v.achieved}
                    </td>
                    <td className="border border-exam-line px-2.5 py-1.5 text-center">
                      {v.cleared ? (
                        <span className="inline-flex text-exam-ok">
                          <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />
                          <span className="sr-only">Cleared</span>
                        </span>
                      ) : (
                        <span className="text-exam-err">{v.gapLabel}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {[...cleared, ...missed].some((v) => v.post.disputed) && (
            <p className="mt-2 text-[11px] text-exam-muted">
              * Public sources disagree on this post&rsquo;s error cap. Practise
              to the stricter figure and you clear either way.
            </p>
          )}
        </Panel>

        {/* ─────────────────────────────────────────────── this test's bar */}
        <Panel title={`${getModeDisplayName(mode)} — criteria`}>
          <table className="w-full border-collapse text-left text-[13px]">
            <thead>
              <tr>
                {['Criterion', 'You', 'Required', ''].map((h, i) => (
                  <th
                    key={i}
                    scope="col"
                    className="border border-exam-line bg-exam-panel px-3 py-1.5 font-bold text-exam-navy"
                  >
                    {h || <span className="sr-only">Met</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {criteria.map((c) => (
                <tr key={c.label}>
                  <th
                    scope="row"
                    className="border border-exam-line px-3 py-1.5 text-left font-semibold"
                  >
                    {c.label}
                  </th>
                  <td
                    className={`tnum border border-exam-line px-3 py-1.5 font-bold ${
                      c.met ? 'text-exam-ok' : 'text-exam-err'
                    }`}
                  >
                    {c.you}
                  </td>
                  <td className="tnum border border-exam-line px-3 py-1.5 text-exam-muted">
                    {c.need}
                  </td>
                  <td className="border border-exam-line px-3 py-1.5 text-center">
                    {/* sr-only text rather than aria-label on the icon —
                        labelled SVGs are read inconsistently. */}
                    {c.met ? (
                      <span className="inline-flex text-exam-ok">
                        <Check className="h-4 w-4" strokeWidth={3} aria-hidden />
                        <span className="sr-only">Met</span>
                      </span>
                    ) : (
                      <span className="inline-flex text-exam-err">
                        <X className="h-4 w-4" strokeWidth={3} aria-hidden />
                        <span className="sr-only">Not met</span>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
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

          <div className="mt-2 grid grid-cols-3 gap-2">
            <Metric label="Key depressions" value={result.key_depression_count || 0} />
            <Metric label="Backspaces" value={result.backspace_count || 0} />
            <Metric label="KDPH" value={kdph.toLocaleString('en-IN')} />
          </div>
        </Panel>

        {/* ──────────────────────────────────────────────────── save prompt */}
        {!isAuthenticated && (
          <div className="mt-4 flex flex-wrap items-center gap-4 rounded border-2 border-exam-chrome bg-white px-5 py-4">
            <p className="flex-1 text-[13px]">
              <strong>This result is not saved.</strong> Create a free account to
              keep your history and speed curve.
            </p>
            <Link href="/auth/register" className="exam-btn shrink-0">
              Save my result
            </Link>
          </div>
        )}

        {/* ───────────────────────────────────────────────────────── diff */}
        {typedContent && originalContent && (
          <Panel title="Where you lost marks">
            <ul className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-exam-muted">
              <li className="text-exam-ok">correct</li>
              <li className="text-exam-hot">typo or capitalisation</li>
              <li className="text-exam-err">wrong word</li>
              <li>missed</li>
              <li className="underline decoration-exam-err">extra</li>
            </ul>
            <div className="max-h-[40vh] overflow-auto border border-exam-line bg-exam-panel p-3">
              <PassageDiffView
                original={originalContent}
                typed={typedContent}
                lang={lang}
              />
            </div>
          </Panel>
        )}

        {/* ────────────────────────────────────────────────────── reference */}
        <Panel title="Detail">
          <Disclosure title="Error breakdown by type">
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {breakdown.map((b) => (
                <Metric key={b.label} label={b.label} value={b.value} />
              ))}
            </div>
          </Disclosure>

          {result.feedback && (
            <Disclosure title="Coach feedback">
              <p className="text-[13px] leading-relaxed">{result.feedback}</p>
            </Disclosure>
          )}

          {specs && (
            <Disclosure title="How this was scored">
              <p className="text-[13px] leading-relaxed">{specs.source}</p>
              <p className="mt-2 font-mono text-[12px] text-exam-muted">
                Total errors = full + (half &divide; 2) &nbsp;·&nbsp; Error % =
                (total errors &divide; key depressions) &times; 100
              </p>
              {specs.citations?.length ? (
                <ul className="mt-2 space-y-1">
                  {specs.citations.map((url) => (
                    <li key={url}>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="break-all text-[11px] text-exam-navy underline"
                      >
                        {url}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : null}
            </Disclosure>
          )}
        </Panel>

        {/* ──────────────────────────────────────────────────────── actions */}
        <div className="mt-6 flex flex-col gap-2 pb-10 sm:flex-row sm:justify-end">
          {isAuthenticated && (
            <button
              type="button"
              onClick={() => router.push(ROUTES.dashboard)}
              className="exam-btn exam-btn-secondary"
            >
              Dashboard
            </button>
          )}
          {result.test_id && isAuthenticated && (
            <button
              type="button"
              onClick={() => router.push(`/analysis/${result.test_id}`)}
              className="exam-btn exam-btn-secondary"
            >
              Full report
            </button>
          )}
          <button
            type="button"
            onClick={() => (onRetry ? onRetry() : window.location.reload())}
            className="exam-btn"
          >
            <RotateCcw className="h-4 w-4" strokeWidth={2} aria-hidden />
            Take another test
          </button>
        </div>
      </div>
    </ExamChrome>
  );
}
