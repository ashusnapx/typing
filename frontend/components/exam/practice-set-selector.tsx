'use client';

import { PracticeSet } from '@/lib/practice-sets';
import { ArrowLeft, ArrowRight, Clock, Target } from 'lucide-react';

interface PracticeSetSelectorProps {
  examName: string;
  sets: PracticeSet[];
  durationMinutes: number;
  wpmTarget?: number;
  onSelect: (set: PracticeSet) => void;
  onBack: () => void;
}

export default function PracticeSetSelector({
  examName,
  sets,
  durationMinutes,
  wpmTarget,
  onSelect,
  onBack,
}: PracticeSetSelectorProps) {
  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
      <button
        type="button"
        onClick={onBack}
        className="btn btn-ghost btn-sm -ml-3.5 mb-8"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={2} aria-hidden />
        All tests
      </button>

      {/* The exam name sits in the eyebrow rather than the headline: it is a
          dynamic string, and the italic gesture needs copy we control. */}
      <p className="eyebrow">{examName}</p>

      <h1 className="mt-4 text-4xl sm:text-5xl">
        Pick a <em>passage set</em>
      </h1>

      {/* Sets differ by subject, not by difficulty — the SSC lists are all
          rated hard — so the lead must not promise a difficulty ramp. */}
      <p className="mt-5 max-w-lg text-lg text-vast/70">
        Each set is a different subject. The clock and the speed target stay the
        same whichever one you pick.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <span className="chip tnum">
          <Clock className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          {durationMinutes} min
        </span>
        {wpmTarget ? (
          <span className="chip chip-lilac tnum">
            <Target className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            {wpmTarget} WPM target
          </span>
        ) : null}
      </div>

      <ol aria-label="Passage sets" className="card mt-10 overflow-hidden">
        {sets.map((set) => (
          <li key={set.number} className="border-b-2 border-vast/10 last:border-0">
            {/* The card clips to its radius, so the focus ring is drawn inside
                the row — at the default +2px offset the ol crops it. */}
            <button
              type="button"
              onClick={() => onSelect(set)}
              className="group flex w-full items-center gap-4 px-4 py-4 text-left transition-colors hover:bg-dawn focus-visible:-outline-offset-2 sm:gap-5 sm:px-6 sm:py-5"
            >
              <span className="tnum flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-vast text-base font-semibold text-lumen">
                {set.number}
              </span>

              <span className="min-w-0 flex-1">
                <span className="block font-display text-2xl">{set.title}</span>
                <span className="mt-1.5 block text-base text-vast/60">
                  {set.description}
                </span>
              </span>

              <ArrowRight
                className="h-4 w-4 shrink-0 text-vast/40 transition ease-spring group-hover:translate-x-1 group-hover:text-vast"
                strokeWidth={2.2}
                aria-hidden
              />
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
