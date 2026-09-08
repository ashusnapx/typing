'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getModeDisplayName } from '@/lib/utils';
import { getExamSpecs, FULL_MISTAKES, HALF_MISTAKES } from '@/lib/exam-config';
import { TestMode } from '@/types';
import { PracticeSet } from '@/lib/practice-sets';
import { ExamChrome, ExamTimeBox, clock } from './exam-chrome';

interface ExamInstructionsProps {
  mode: TestMode;
  durationSeconds: number;
  wpmTarget?: number;
  lang?: 'english' | 'hindi';
  onBegin: () => void;
  /** Passage sets for this exam. Empty for modes that have none. */
  sets?: PracticeSet[];
  selectedSet?: PracticeSet;
  onSelectSet?: (set: PracticeSet) => void;
  agreed: boolean;
  onAgreedChange: (agreed: boolean) => void;
}

/** Modes that reproduce exam conditions keep the declaration checkbox — the
 *  ritual is part of what is being rehearsed. Practice and lessons skip it. */
export function requiresDeclaration(mode: string): boolean {
  return FORMAL_MODES.has(mode);
}

const FORMAL_MODES = new Set([
  'ssc_chsl',
  'ssc_chsl_deo',
  'ssc_chsl_deo_grade_a',
  'ssc_cgl_dest',
  'ssc_cgl_cpt',
  'ssc_hindi',
  'mock',
  'tcs_ion_replica',
]);

/* ---------------------------------------------------------------- helpers */

function Section({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-exam-line py-4 first:pt-0 last:border-0">
      <h2 className="text-[13px] font-bold uppercase tracking-wide text-exam-navy">
        {n}. {title}
      </h2>
      <div className="mt-2 leading-relaxed text-exam-text">{children}</div>
    </section>
  );
}

/** The platform prints its reference material in bordered grey tables, not in
 *  prose. Same here — a candidate scanning for their own category finds a row,
 *  not a sentence. */
function Table({
  head,
  rows,
}: {
  head: string[];
  rows: (string | React.ReactNode)[][];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[26rem] border-collapse text-left text-[13px]">
        <thead>
          <tr>
            {head.map((h) => (
              <th
                key={h}
                scope="col"
                className="border border-exam-line bg-exam-panel px-3 py-1.5 font-bold text-exam-navy"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((cell, j) => (
                <td
                  key={j}
                  className={`border border-exam-line px-3 py-1.5 ${
                    j === 0 ? 'font-semibold' : 'tnum'
                  }`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------------------------------------------------- main */

export function ExamInstructions({
  mode,
  durationSeconds,
  wpmTarget,
  lang = 'english',
  onBegin,
  sets = [],
  selectedSet,
  onSelectSet,
  agreed,
  onAgreedChange,
}: ExamInstructionsProps) {
  const router = useRouter();
  const specs = getExamSpecs(mode);
  const declarationNeeded = requiresDeclaration(mode);
  const examTitle = getModeDisplayName(mode);
  const minutes = Math.round(durationSeconds / 60);
  const backspaceAllowed = specs ? specs.backspaceAllowed : true;

  const speedLabel =
    specs?.qualifyingNature === 'speed_wpm'
      ? `${lang === 'hindi' ? (specs.hindiSpeedWpm ?? specs.englishSpeedWpm) : specs.englishSpeedWpm} WPM`
      : specs
        ? `${specs.englishKdph.toLocaleString('en-IN')} KDPH`
        : wpmTarget
          ? `${wpmTarget} WPM`
          : '—';

  // Hindi, mock and the replica have no spec row of their own, so allowances
  // fall back to the DEST defaults rather than disappearing — a screen that
  // asks for a declaration must show the standard it is asking you to accept.
  const allowance = {
    general: specs?.errorAllowanceGeneral ?? 20,
    obcEws: specs?.errorAllowanceObcEws ?? 25,
    scSt: specs?.errorAllowanceScSt ?? 30,
  };

  const canBegin = agreed && (sets.length === 0 || !!selectedSet);

  // Enter begins the test, the same muscle memory the rest of the app uses.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || !canBegin) return;
      // Enter belongs to whatever control has focus first. Only claim it when
      // focus is sitting on the page itself.
      const target = e.target instanceof HTMLElement ? e.target : null;
      if (target?.closest('a, button, input, select, textarea')) return;
      e.preventDefault();
      onBegin();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [canBegin, onBegin]);

  return (
    <ExamChrome postLabel={examTitle}>
      <div className="relative mx-auto w-full max-w-5xl flex-1 px-4 py-4 sm:px-6">
        <div className="rounded border-2 border-exam-panel-edge bg-white">
          {/* ------------------------------------------------------ header */}
          <div className="flex flex-wrap items-center gap-3 border-b border-exam-panel-edge bg-exam-panel px-5 py-2.5">
            <h1 className="text-sm font-bold uppercase tracking-wide text-exam-navy">
              General instructions
            </h1>
            <div className="ml-auto">
              <ExamTimeBox label="Duration" value={clock(durationSeconds)} />
            </div>
          </div>

          <div className="px-5 py-4">
            <Section n={1} title="Test pattern and qualifying criteria">
              <Table
                head={['Item', 'This test']}
                rows={[
                  ['Post / subject', examTitle],
                  ['Medium', lang === 'hindi' ? 'हिंदी' : 'English'],
                  ['Duration', `${minutes} minutes`],
                  ['Qualifying speed', speedLabel],
                  [
                    'Passage length',
                    specs
                      ? `${specs.passageKeyDepressions[0].toLocaleString('en-IN')}–${specs.passageKeyDepressions[1].toLocaleString('en-IN')} key depressions`
                      : '≈2,000 key depressions',
                  ],
                  ['Backspace', backspaceAllowed ? 'Allowed' : 'Disabled'],
                  ['Nature', 'Qualifying only — adds no marks to your merit'],
                ]}
              />
            </Section>

            <Section n={2} title="Maximum permissible errors">
              <Table
                head={['Category', 'Error limit']}
                rows={[
                  ['UR', `${allowance.general}%`],
                  ['OBC / EWS', `${allowance.obcEws}%`],
                  ['SC / ST', `${allowance.scSt}%`],
                ]}
              />
              <p className="mt-2 font-mono text-[12px] text-exam-muted">
                Total errors = full + (half &divide; 2) &nbsp;·&nbsp; Error % =
                (total errors &divide; key depressions) &times; 100
              </p>
            </Section>

            <Section n={3} title="Full mistakes — 1 error each">
              <ul className="ml-5 list-disc space-y-0.5">
                {FULL_MISTAKES.map((m, i) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
            </Section>

            <Section n={4} title="Half mistakes — 0.5 error each">
              <ul className="ml-5 list-disc space-y-0.5">
                {HALF_MISTAKES.map((m, i) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
            </Section>

            <Section n={5} title="How the test runs">
              <ul className="ml-5 list-disc space-y-0.5">
                <li>
                  A countdown timer in the top right shows the time remaining.
                  The test submits itself when it reaches zero.
                </li>
                <li>
                  Read the passage in the upper panel and type it into the box
                  below it.
                </li>
                <li>
                  Use the <strong>Tab key</strong> to start a paragraph. Manual
                  spaces count as a half mistake.
                </li>
                <li>Exactly one space after punctuation.</li>
                <li>
                  {backspaceAllowed
                    ? 'Backspace is allowed, but every correction costs time.'
                    : 'Backspace is disabled. A mistake stays on the page.'}
                </li>
                <li>
                  Do not retype the passage once finished. Use the remaining
                  time to revise.
                </li>
                <li>
                  Copy, paste and cut are disabled, and tab switches are logged.
                </li>
              </ul>
            </Section>

            {sets.length > 0 && (
              <Section n={6} title="Select your passage set">
                <div className="flex flex-wrap items-center gap-2">
                  <label
                    htmlFor="passage-set"
                    className="text-[13px] font-semibold"
                  >
                    Passage set
                  </label>
                  <select
                    id="passage-set"
                    value={selectedSet?.number ?? ''}
                    onChange={(e) => {
                      const set = sets.find(
                        (s) => s.number === Number(e.target.value)
                      );
                      if (set) onSelectSet?.(set);
                    }}
                    className="min-w-[16rem] rounded border border-exam-line bg-white px-3 py-1.5 text-[13px] text-exam-text"
                  >
                    <option value="" disabled>
                      Choose a set…
                    </option>
                    {sets.map((s) => (
                      <option key={s.number} value={s.number}>
                        Set {s.number} — {s.title}
                      </option>
                    ))}
                  </select>
                </div>
              </Section>
            )}
          </div>

          {/* -------------------------------------------------- declaration */}
          <div className="border-t border-exam-panel-edge bg-exam-panel px-5 py-4">
            {declarationNeeded && (
              <label className="flex cursor-pointer items-start gap-2.5 text-[13px] leading-relaxed">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => onAgreedChange(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-exam-chrome"
                />
                <span>
                  I have read and understood the instructions above. I agree
                  that the test is qualifying in nature and that my errors will
                  be evaluated against the limits shown.
                </span>
              </label>
            )}

            <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => router.push('/exam')}
                className="exam-btn exam-btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onBegin}
                disabled={!canBegin}
                className="exam-btn"
              >
                I am ready to begin
              </button>
            </div>

            {sets.length > 0 && !selectedSet && (
              <p className="mt-2 text-right text-[12px] text-exam-err">
                Select a passage set to continue.
              </p>
            )}
          </div>
        </div>
      </div>
    </ExamChrome>
  );
}
