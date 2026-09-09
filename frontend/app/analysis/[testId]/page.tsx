'use client';

import { useMemo, useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTestResult, useTestReplay } from '@/lib/queries';
import { getExamBar, isHindiMode } from '@/lib/exam-config';
import { summariseAttempt } from '@/lib/attempt-summary';
import { buildPlan } from '@/lib/analysis-plan';
import type { Hesitation } from '@/lib/keystroke-summary';
import { diagnose } from '@/lib/exam-diagnosis';
import { getModeDisplayName } from '@/lib/utils';
import { FullPageLoader } from '@/components/ui/loading-logo';
import PassageDiffView, { formatMs } from '@/components/exam/passage-diff';
import { MistakeBreakdown, formatCost } from '@/components/exam/mistake-breakdown';
import { NextSteps } from '@/components/exam/next-steps';
import { ArrowLeft, Check, X, AlertTriangle } from 'lucide-react';

/** The same four the result screen offers, and the same storage key, so a
 *  candidate picks their category once. */
const CATEGORIES = [
  { key: 'ur' as const, label: 'UR' },
  { key: 'obcEws' as const, label: 'OBC / EWS' },
  { key: 'scSt' as const, label: 'SC / ST' },
  { key: 'pwbd' as const, label: 'PwBD' },
];
type CategoryKey = (typeof CATEGORIES)[number]['key'];
// The same key the result screen writes, so the category a candidate picks
// after a test is still theirs when they open the report on it.
const CATEGORY_STORAGE_KEY = 'tm-category-v2';

/** A bar with the mark on it, because "35 needed, you did 31" is the whole
 *  exam and a candidate should not have to work it out from two numbers.
 *
 *  `blocking` outlines the one that actually cost the attempt. With two bars
 *  side by side a candidate reads both and concludes nothing; marking the one
 *  standing between them and the post is the entire job of this panel. */
function BarRow({
  label,
  youLabel,
  needLabel,
  fraction,
  met,
  note,
  blocking = false,
}: {
  label: string;
  youLabel: string;
  needLabel: string;
  fraction: number;
  met: boolean;
  note: string;
  blocking?: boolean;
}) {
  const pct = Math.max(0, Math.min(100, fraction * 100));
  return (
    <div className={blocking ? '-mx-2 border-2 border-vast bg-accent-soft px-2 py-3' : 'py-3'}>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-sm font-bold">{label}</span>
        <span className={`chip ${met ? 'chip-ok' : 'chip-err'} text-[11px]`}>
          {met ? 'met' : 'not met'}
        </span>
        {blocking && (
          <span className="text-[11px] font-bold uppercase tracking-wide">Fix this first</span>
        )}
        <span className="tnum ml-auto text-sm">
          <strong>{youLabel}</strong>
          <span className="text-vast/50"> / {needLabel} needed</span>
        </span>
      </div>
      <div
        className="mt-2 h-2.5 w-full border-2 border-vast/20 bg-lumen"
        role="img"
        aria-label={`${youLabel} of ${needLabel} needed`}
      >
        <div
          className={`h-full ${met ? 'bg-vast' : 'bg-accent'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1.5 text-[13px] text-vast/60">{note}</p>
    </div>
  );
}

export default function AnalysisPage() {
  const params = useParams();
  const router = useRouter();
  const testId = params.testId as string;

  const { data: testData, isLoading, error } = useTestResult(testId);
  const { data: replay } = useTestReplay(testId);

  const [category, setCategory] = useState<CategoryKey>('ur');
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

  const originalContent = testData?.original_content || replay?.original_content || '';
  const typedContent = testData?.typed_content || replay?.typed_content || '';

  // The same call the scoring uses, so nothing on this page can contradict the
  // marks beside it.
  const diagnosis = useMemo(
    () => diagnose(originalContent, typedContent),
    [originalContent, typedContent],
  );

  /* Worked out when the attempt was submitted and stored with it, rather than
     replayed from a few thousand keystroke rows to derive the same dozen
     numbers. Attempts saved before that simply have no panel. */
  const hesitations = replay?.summary?.hesitations ?? [];

  if (isLoading) return <FullPageLoader />;

  if (error || !testData) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md items-center px-4">
        <div className="card w-full p-8 text-center">
          <AlertTriangle className="mx-auto mb-4 h-10 w-10 text-err" strokeWidth={2.5} />
          <h1 className="text-xl font-bold">We could not find that test</h1>
          <p className="mt-2 text-sm text-vast/60">
            {error instanceof Error ? error.message : 'The link may be wrong, or the attempt may have been removed.'}
          </p>
          <Link href="/dashboard" className="btn btn-ink btn-md mt-6 inline-flex">
            Back to dashboard
          </Link>
        </div>
      </main>
    );
  }

  const mode = testData.mode || '';
  const bar = getExamBar(mode, category);
  const netWpm = testData.ssc_net_wpm ?? testData.net_wpm ?? 0;
  const errorPct = testData.ssc_error_percentage ?? 0;
  const kd = testData.key_depression_count ?? 0;
  const seconds = testData.time_taken_seconds || testData.duration_seconds || 0;
  const summary = summariseAttempt(
    {
      mode,
      isQualified: testData.is_qualified === true,
      netWpm,
      errorPercentage: errorPct,
      keyDepressions: kd,
      secondsTyped: seconds,
    },
    category,
  );
  const { qualified, speedMet, errorsMet, kdph, errorCap } = summary;

  const typedWords = typedContent.trim() ? typedContent.trim().split(/\s+/).length : 0;
  const passageWords = originalContent.trim() ? originalContent.trim().split(/\s+/).length : 0;

  const grossWords = kd / 5;
  /* The marks that were actually taken off, as stored with the attempt — the
     same figure the error percentage, the verdict and the dashboard all rest
     on. The breakdown below explains where they went; it must not quietly
     total to something else. */
  const mistakes =
    (testData.full_mistakes ?? 0) + (testData.half_mistakes ?? 0) / 2 ||
    diagnosis.totalMistakes;

  const dateStr = testData.date || testData.completed_at || '';

  const plan = buildPlan({
    qualified,
    speedMet,
    errorsMet,
    nature: summary.nature,
    netWpm,
    speedTarget: summary.speedTarget,
    kdph,
    kdphTarget: summary.kdphTarget,
    errorPct,
    errorCap,
    findings: diagnosis.findings,
    wordsUnreached: diagnosis.wordsUnreached,
    hesitationCount: hesitations.length,
  });

  const categoryLabel = CATEGORIES.find((c) => c.key === category)!.label;

  return (
    /* Wider than a column of prose, because the numbers and the evidence for
       them belong beside each other. Read top to bottom this page was seven
       full-width panels of scrolling, and the two bars that decide everything
       had scrolled away by the time a candidate reached the mistakes that
       caused them. */
    <main className="mx-auto max-w-6xl px-4 py-6">
      <button
        onClick={() => router.back()}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-vast/50 transition-colors hover:text-vast"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={2.5} /> Back
      </button>

      {/* ──────────────────────────────────────────────── the verdict, once */}
      <section className="card mb-5 p-5 sm:p-6">
        <div className="flex flex-wrap items-start gap-x-4 gap-y-3">
          <span
            /* Ink for a pass, the accent for a fail: with one accent colour
               the difference has to be fill against fill, not green against
               red — both of those now resolve to the same ink. */
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-vast ${
              qualified ? 'bg-vast text-white' : 'bg-accent text-vast'
            }`}
          >
            {qualified ? <Check className="h-6 w-6" strokeWidth={3} /> : <X className="h-6 w-6" strokeWidth={3} />}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold sm:text-2xl">
              {qualified ? 'Qualified' : 'Not qualified'}
            </h1>
            <p className="mt-1 text-sm text-vast/70">{summary.verdict}</p>
            <p className="mt-1 text-[13px] text-vast/45">
              {getModeDisplayName(mode)}
              {dateStr
                ? ` · ${new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`
                : ''}
              {seconds ? ` · ${Math.round(seconds)}s typing` : ''}
            </p>
          </div>

          {/* The category changes the error limit, and nothing else. Beside
              the verdict rather than under it, so the panel it governs is the
              next thing on the screen. */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[13px] text-vast/55">Your category:</span>
            <div className="segment" role="tablist" aria-label="Category">
              {CATEGORIES.map((c) => (
                <button
                  key={c.key}
                  onClick={() => chooseCategory(c.key)}
                  aria-selected={category === c.key}
                  role="tab"
                  className="segment-item"
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-12">
        {/* ─────────────────────────── left: where you stand, always in view */}
        <aside className="lg:col-span-5 lg:sticky lg:top-6 lg:self-start">
          <section className="card p-5 sm:p-6">
            <h2 className="text-base font-bold">Where you stand</h2>
            <p className="mt-1 text-[13px] text-vast/55">
              Both have to be met. Being fast does not buy you a pass on mistakes.
            </p>

            <div className="mt-2 divide-y-2 divide-vast/10">
              {bar?.nature === 'kdph' ? (
                <BarRow
                  label="Speed"
                  youLabel={`${kdph.toLocaleString('en-IN')} KDPH`}
                  needLabel={`${bar.kdph.toLocaleString('en-IN')}`}
                  fraction={kdph / bar.kdph}
                  met={speedMet}
                  blocking={!speedMet}
                  note={`Key depressions per hour, after mistakes are taken off. You typed ${kd.toLocaleString('en-IN')} in ${Math.round(seconds)} seconds.`}
                />
              ) : (
                <BarRow
                  label="Speed"
                  youLabel={`${netWpm.toFixed(1)} WPM`}
                  needLabel={`${bar?.speedWpm ?? 35} WPM`}
                  fraction={netWpm / (bar?.speedWpm ?? 35)}
                  met={speedMet}
                  blocking={!speedMet}
                  note={`Five key depressions count as one word${
                    bar?.language === 'hindi' ? '. The Hindi paper qualifies at 30, not 35' : ''
                  }. You typed ${kd.toLocaleString('en-IN')} depressions in ${Math.round(seconds)} seconds.`}
                />
              )}

              <BarRow
                label="Mistakes"
                youLabel={`${errorPct.toFixed(2)}%`}
                needLabel={`${errorCap}% or less`}
                fraction={errorCap / Math.max(errorPct, errorCap)}
                met={errorsMet}
                blocking={!errorsMet}
                note={`${formatCost(mistakes)} across ${Math.round(grossWords)} words. The limit is ${errorCap}% for ${categoryLabel} candidates for this post.`}
              />

              {/* How much of the passage was reached. Not a requirement, and
                  labelled as such — a candidate who ran out of time used to
                  read this as a third failure. */}
              <div className="py-3">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="text-sm font-bold">How far you got</span>
                  <span className="chip text-[11px]">not a requirement</span>
                  <span className="tnum ml-auto text-sm">
                    <strong>{typedWords}</strong>
                    <span className="text-vast/50"> / {passageWords} words</span>
                  </span>
                </div>
                <div className="mt-2 h-2.5 w-full border-2 border-vast/20 bg-lumen">
                  <div
                    className="h-full bg-vast"
                    style={{ width: `${passageWords ? Math.min(100, (typedWords / passageWords) * 100) : 0}%` }}
                  />
                </div>
                <p className="mt-1.5 text-[13px] text-vast/60">
                  The passage after that is not marked against you — there is no
                  rule that says you must finish, only that you must be fast
                  enough.
                </p>
              </div>
            </div>

            {/* How the number was reached, in one line, because a candidate who
                cannot see where it came from cannot trust it. Folded away: it
                answers a question, and a candidate who is not asking it should
                not have to scroll past the answer. */}
            <details className="mt-4 border-t-2 border-vast/10 pt-3">
              <summary className="cursor-pointer text-[13px] font-bold">
                How this was worked out
              </summary>
              <p className="mt-2 text-[13px] leading-relaxed text-vast/60">
                {kd.toLocaleString('en-IN')} key depressions ÷ 5 ={' '}
                {grossWords.toFixed(1)} words, minus {formatCost(mistakes)} ={' '}
                {(grossWords - mistakes).toFixed(1)} net words, over{' '}
                {(seconds / 60).toFixed(1)} minutes ={' '}
                <strong>{netWpm.toFixed(1)} WPM</strong>. A full mistake counts
                1, a half mistake counts 0.5.{' '}
                <Link href="/marking-scheme" className="underline">
                  See every rule with examples
                </Link>
                .
              </p>
            </details>
          </section>
        </aside>

        {/* ────────────────────────── right: the evidence, in order of damage */}
        <div className="lg:col-span-7">
          <section className="card p-5 sm:p-6">
            <div className="flex flex-wrap items-baseline gap-x-3">
              <h2 className="text-base font-bold">What cost you marks</h2>
              <span className="tnum ml-auto text-sm text-vast/55">
                {formatCost(mistakes)}
              </span>
            </div>

            {diagnosis.findings.length === 0 ? (
              <p className="mt-2 text-sm text-vast/60">
                Nothing was marked wrong in what you typed. {typedWords < passageWords
                  ? 'You ran out of time before the end of the passage — speed is the only thing left to work on.'
                  : 'A clean attempt.'}
              </p>
            ) : (
              <>
                <p className="mt-1 mb-3 text-[13px] text-vast/55">
                  Biggest first. Each one links to the drill that fixes it.
                </p>
                <MistakeBreakdown findings={diagnosis.findings} />
              </>
            )}
          </section>

          <section className="card mt-5">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b-2 border-vast/15 px-5 py-4">
              <h2 className="text-base font-bold">Your passage, word by word</h2>
              {/* Named by what the page actually paints. The legend used to
                  say green, orange and red — three colours this palette does
                  not have, all of which now resolve to the same near-black,
                  so it described a picture nobody could see. */}
              <span className="ml-auto text-[12px] text-vast/50">
                <span className="bg-accent-soft px-1 underline decoration-2">shaded</span> half
                mistake · <span className="bg-accent px-1">filled</span> full mistake ·{' '}
                <span className="text-vast/35 line-through">struck</span> skipped ·{' '}
                <span className="text-vast/25">faded</span> not reached
              </span>
            </div>
            <div className="px-5 py-4">
              {typedContent && originalContent ? (
                <PassageDiffView
                  original={originalContent}
                  typed={typedContent}
                  lang={isHindiMode(mode) ? 'hindi' : 'english'}
                />
              ) : (
                <p className="py-4 text-center text-sm text-vast/40">
                  The passage for this attempt was not saved.
                </p>
              )}
            </div>
          </section>

          {hesitations.length > 0 && (
            <section className="card mt-5 p-5 sm:p-6">
              <h2 className="text-base font-bold">Where you hesitated</h2>
              <p className="mt-1 mb-3 text-[13px] text-vast/55">
                You stopped for more than a moment before these words. A pause is
                not a mistake, but it is where your speed goes.
              </p>
              <ul className="divide-y-2 divide-vast/10">
                {hesitations.slice(0, 8).map((w: Hesitation, i: number) => (
                  <li key={i} className="flex items-center justify-between py-2">
                    <span className="text-sm">{w.word}</span>
                    <span className="tnum text-sm text-vast/55">
                      {formatMs(w.pauseMs)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>

      {/* ─────────────────── and the only part that changes the next attempt */}
      <NextSteps
        plan={plan}
        testId={testId}
        retakeHref={`/exam/${isHindiMode(mode) ? 'hindi' : ''}`}
      />

      {bar && (
        <p className="mt-5 mb-10 text-[12px] leading-relaxed text-vast/45">
          Speed and error limits from {bar.spec.source}.{' '}
          {bar.spec.citations.map((url, i) => (
            <span key={i}>
              <a href={url} target="_blank" rel="noopener noreferrer" className="underline">
                {url.replace(/^https?:\/\//, '').slice(0, 48)}…
              </a>
              {i < bar.spec.citations.length - 1 ? ' · ' : ''}
            </span>
          ))}
        </p>
      )}
    </main>
  );
}
