'use client';

import { ArrowRight } from 'lucide-react';
import type { Finding } from '@/lib/exam-diagnosis';

/**
 * What the marks went on, and where to go and fix it.
 *
 * The result screen and the analysis page both show this, and they used to
 * build it separately — one from the aligned diagnosis, the other from an
 * index-by-index word comparison. A candidate finishing a test and then opening
 * the report on the same attempt saw two different lists of mistakes. One
 * component, one calculation.
 */

/** Half a mistake is genuinely half, and saying so is what makes the order
 *  above it make sense. */
export function formatCost(cost: number): string {
  const n = cost % 1 === 0 ? String(cost) : cost.toFixed(1);
  return `${n} mistake${cost === 1 ? '' : 's'}`;
}

export function MistakeBreakdown({
  findings,
  className = '',
}: {
  findings: Finding[];
  className?: string;
}) {
  if (findings.length === 0) return null;

  return (
    <ul className={`space-y-2 ${className}`}>
      {findings.map((f) => (
        <li key={f.kind} className="border-2 border-vast/15 bg-lumen px-4 py-3">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-[13px] font-bold">{f.label}</span>
            <span className="tnum text-[12px] text-vast/55">
              {f.count}&times; · {formatCost(f.cost)}
            </span>
            <span
              className={`chip ${f.weight === 'half' ? 'chip-lilac' : 'chip-err'} text-[11px]`}
            >
              {f.weight === 'half' ? 'half mistake each' : 'full mistake each'}
            </span>
            <a
              href={f.href}
              className="ml-auto inline-flex items-center gap-1 text-[12px] font-bold underline"
            >
              Practise: {f.lessonTitle}
              <ArrowRight className="h-3 w-3" strokeWidth={2.5} aria-hidden />
            </a>
          </div>

          <p className="mt-1.5 text-[13px] leading-relaxed text-vast/75">
            {f.advice}
          </p>

          {f.examples.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12px]">
              {f.examples.map((ex, i) => (
                <li key={i} className="tnum text-vast/55">
                  <span className="text-vast/70">{ex.expected || '—'}</span>
                  {' → '}
                  <span className="bg-accent px-1 font-semibold">
                    {ex.typed || '(skipped)'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  );
}
