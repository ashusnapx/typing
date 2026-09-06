'use client';

import React, { useEffect, useId, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ChevronDown,
  Clock,
  Target,
  FileText,
  Delete,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { getModeDisplayName } from '@/lib/utils';
import { getExamSpecs, FULL_MISTAKES, HALF_MISTAKES } from '@/lib/exam-config';
import { TestMode } from '@/types';
import { PracticeSet } from '@/lib/practice-sets';

interface ExamInstructionsProps {
  mode: TestMode;
  durationSeconds: number;
  wpmTarget?: number;
  lang?: 'english' | 'hindi';
  onBegin: () => void;
  selectedSet?: PracticeSet;
}

/** Modes that reproduce exam conditions keep the declaration checkbox — the
 *  ritual is part of what is being rehearsed. Practice and lessons skip it;
 *  a wall of text between a learner and a drill is pure drop-off. */
const FORMAL_MODES = new Set([
  'ssc_chsl',
  'ssc_cgl_dest',
  'ssc_hindi',
  'mock',
  'tcs_ion_replica',
]);

function Disclosure({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();

  return (
    <div className="border-b-2 border-vast/10 last:border-0">
      {/* Heading-wrapped trigger so the reference material is navigable by
          heading, and the panel stays mounted so aria-controls always resolves. */}
      <h3 className="text-xl">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={panelId}
          className="flex w-full items-center gap-3 py-4 text-left"
        >
          {title}
          <ChevronDown
            className={`ml-auto h-4 w-4 shrink-0 text-vast/40 transition-transform ${
              open ? 'rotate-180' : ''
            }`}
            strokeWidth={2}
          />
        </button>
      </h3>
      <div
        id={panelId}
        hidden={!open}
        className="pb-4 text-base leading-relaxed text-vast/70"
      >
        {children}
      </div>
    </div>
  );
}

export function ExamInstructions({
  mode,
  durationSeconds,
  wpmTarget,
  lang = 'english',
  onBegin,
  selectedSet,
}: ExamInstructionsProps) {
  const router = useRouter();
  const specs = getExamSpecs(mode);
  const requiresDeclaration = FORMAL_MODES.has(mode);
  const [agreed, setAgreed] = useState(!requiresDeclaration);

  const examTitle = getModeDisplayName(mode);
  const minutes = Math.round(durationSeconds / 60);
  const backspaceAllowed = specs ? specs.backspaceAllowed : true;

  // Hindi, mock and TCS-ION have no spec row of their own, so the category
  // allowances fall back to the DEST defaults rather than disappearing — a
  // screen that asks you to sign a declaration must show the standard it is
  // asking you to accept.
  const allowance = {
    general: specs?.errorAllowanceGeneral ?? 20,
    obcEws: specs?.errorAllowanceObcEws ?? 25,
    scSt: specs?.errorAllowanceScSt ?? 30,
  };
  const citations = [...(specs?.citations ?? []), 'https://ssc.gov.in'];

  // Training modes have no SSC spec of their own, so they fall back to the
  // target the route was configured with rather than rendering a dash.
  const speedTarget =
    specs?.qualifyingNature === 'speed_wpm'
      ? `${lang === 'hindi' ? (specs.hindiSpeedWpm ?? specs.englishSpeedWpm) : specs.englishSpeedWpm} WPM`
      : specs
        ? `${specs.englishKdph.toLocaleString('en-IN')} KDPH`
        : wpmTarget
          ? `${wpmTarget} WPM`
          : '—';

  // Enter starts the test once the declaration is satisfied — the same
  // muscle memory the rest of the app uses.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || !agreed) return;
      // Enter belongs to whatever control has focus first — Cancel, the
      // disclosure triggers and the source links all activate on it. Only
      // claim the key when focus is sitting on the page itself.
      const target = e.target instanceof HTMLElement ? e.target : null;
      if (
        target?.closest('a, button, input, select, textarea, [contenteditable="true"]')
      ) {
        return;
      }
      e.preventDefault();
      onBegin();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [agreed, onBegin]);

  const facts = [
    { icon: Clock, label: 'Duration', value: `${minutes} minutes` },
    { icon: Target, label: 'Target speed', value: speedTarget },
    {
      icon: FileText,
      label: 'Passage',
      value: specs
        ? `${specs.passageKeyDepressions[0].toLocaleString('en-IN')}–${specs.passageKeyDepressions[1].toLocaleString('en-IN')} KD`
        : '≈2,000 KD',
    },
    {
      icon: Delete,
      label: 'Backspace',
      value: backspaceAllowed ? 'Allowed' : 'Disabled',
      tone: backspaceAllowed ? '' : 'err',
    },
  ] as const;

  return (
    /* The doorway between the two registers: cream ground and a serif headline
       from the site, but no slabs, no colour blocks and no motion — the next
       screen is a timed test. */
    <div className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
      <button
        onClick={() => router.push('/exam')}
        className="btn btn-ghost btn-sm -ml-3 mb-6"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={2} />
        All tests
      </button>

      <p className="eyebrow">Before you begin</p>
      <h1 className="mt-4 text-4xl sm:text-5xl">{examTitle}</h1>
      <p className="mt-4 text-lg text-vast/60">
        {selectedSet ? (
          `Set ${selectedSet.number} · ${selectedSet.title}`
        ) : lang === 'hindi' ? (
          <>
            <span className="font-hindi" lang="hi">
              हिंदी
            </span>{' '}
            medium
          </>
        ) : (
          'English medium'
        )}
        {requiresDeclaration && ' · Qualifying skill test'}
      </p>

      {/* The four numbers that actually change how you type. */}
      <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {facts.map((f) => (
          <div key={f.label} className="card p-4">
            <dt className="eyebrow flex items-center gap-1.5">
              <f.icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
              {f.label}
            </dt>
            <dd
              className={`tnum mt-2.5 text-md font-semibold ${
                'tone' in f && f.tone === 'err' ? 'text-err' : ''
              }`}
            >
              {f.value}
            </dd>
          </div>
        ))}
      </dl>

      {requiresDeclaration && (
        /* Lilac is the system's "read this" fill — the one place on this screen
           that is allowed to raise its voice. */
        <div className="card mt-4 flex gap-3 bg-dawn p-4">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
          <p className="text-base leading-relaxed text-vast/70">
            This test is <strong className="font-semibold text-vast">qualifying only</strong>{' '}
            — it adds no marks to your merit, but you must clear it. Your errors
            must stay under{' '}
            <strong className="tnum font-semibold text-vast">
              {allowance.general}%
            </strong>{' '}
            (UR), <span className="tnum">{allowance.obcEws}%</span>{' '}
            (OBC/EWS), or <span className="tnum">{allowance.scSt}%</span> (SC/ST).
          </p>
        </div>
      )}

      {/* Everything below is reference material, collapsed by default. */}
      <div className="card mt-4 px-5">
        <Disclosure title="How mistakes are counted" defaultOpen={requiresDeclaration}>
          <p className="mb-3">
            <strong className="font-semibold text-vast">Full mistakes</strong> count
            as 1 error each:
          </p>
          <ul className="ml-4 list-disc space-y-1">
            {FULL_MISTAKES.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
          <p className="mb-3 mt-4">
            <strong className="font-semibold text-vast">Half mistakes</strong> count
            as 0.5 each:
          </p>
          <ul className="ml-4 list-disc space-y-1">
            {HALF_MISTAKES.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
          <div className="mt-4 rounded-lg border border-vast/15 bg-lumen p-3.5 font-mono text-xs leading-relaxed text-vast">
            Total errors = full + (half ÷ 2)
            <br />
            Error % = (total errors ÷ key depressions) × 100
          </div>
        </Disclosure>

        <Disclosure title="Rules that cost people marks">
          <ul className="ml-4 list-disc space-y-1.5">
            <li>
              Use the <strong className="font-semibold text-vast">Tab key</strong> to
              start a paragraph. Manual spaces count as a half mistake.
            </li>
            <li>Exactly one space after punctuation.</li>
            <li>Type words, numbers and symbols exactly as shown.</li>
            <li>
              {backspaceAllowed
                ? 'Backspace is allowed — but every correction costs you time.'
                : 'Backspace is disabled. A mistake stays on the page.'}
            </li>
            <li>
              Do not retype the passage after finishing it once. Use the
              remaining time to revise.
            </li>
            <li>The test auto-submits when the timer expires.</li>
          </ul>
        </Disclosure>

        <Disclosure title="How the test runs">
          <ul className="ml-4 list-disc space-y-1.5">
            <li>Your medium is the one you opted for in your application.</li>
            <li>Read the passage on screen and type it into the box below it.</li>
            <li>Formatting is marked. Follow the layout of the passage exactly.</li>
            <li>
              Spend whatever time is left checking spelling, spacing and
              punctuation.
            </li>
            <li>Sit somewhere quiet and check your connection before you start.</li>
          </ul>
        </Disclosure>

        {requiresDeclaration ? (
          <Disclosure title="Source">
            {specs?.source ? <p className="mb-2">{specs.source}</p> : null}
            <ul className="space-y-1">
              {citations.map((url) => (
                <li key={url}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 break-all font-medium text-fathom underline underline-offset-4 hover:no-underline"
                  >
                    {url}
                    <ExternalLink className="h-3 w-3 shrink-0" strokeWidth={2} aria-hidden />
                  </a>
                </li>
              ))}
            </ul>
          </Disclosure>
        ) : null}
      </div>

      {requiresDeclaration && (
        <label className="card mt-4 flex cursor-pointer items-center gap-3 p-4 text-base">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="h-4 w-4 shrink-0 cursor-pointer accent-vast"
          />
          I have read and understood the instructions.
        </label>
      )}

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
        <button
          onClick={() => router.push('/exam')}
          className="btn btn-outline btn-lg sm:w-auto"
        >
          Cancel
        </button>
        <button
          onClick={onBegin}
          disabled={!agreed}
          className="btn btn-primary btn-lg flex-1"
        >
          Start test
          <kbd className="kbd ml-1 hidden sm:inline-flex" aria-hidden>
            ↵
          </kbd>
        </button>
      </div>

      <p className="mt-4 text-center text-sm text-vast/50">
        The timer starts the moment you press start.
      </p>
    </div>
  );
}
