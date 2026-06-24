'use client';

import { PracticeSet } from '@/lib/practice-sets';
import { ArrowLeft, Timer, Target, BookOpen } from 'lucide-react';
import { WOBBLY_RADII } from '@/lib/config';

interface PracticeSetSelectorProps {
  examName: string;
  sets: PracticeSet[];
  durationMinutes: number;
  wpmTarget?: number;
  onSelect: (set: PracticeSet) => void;
  onBack: () => void;
}

export default function PracticeSetSelector({ examName, sets, durationMinutes, wpmTarget, onSelect, onBack }: PracticeSetSelectorProps) {
  return (
    <div className="min-h-screen bg-paper">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Back */}
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm font-hand text-pencil/50 hover:text-pencil transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={3} />
          Back to Exams
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-10 h-10 flex items-center justify-center border-2 border-pencil bg-postit"
              style={{ borderRadius: WOBBLY_RADII.sm }}>
              <BookOpen className="w-5 h-5 text-pencil" strokeWidth={3} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-pencil font-marker">Select Practice Set</h1>
              <p className="text-sm text-pencil/60 font-hand">Choose a set to begin the {examName} typing test</p>
            </div>
          </div>
          <div className="flex justify-center gap-6 text-xs font-hand text-pencil/50">
            <span className="flex items-center gap-1.5">
              <Timer className="w-3.5 h-3.5" strokeWidth={2.5} /> {durationMinutes} min
            </span>
            {wpmTarget ? (
              <span className="flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5" strokeWidth={2.5} /> {wpmTarget} WPM target
              </span>
            ) : null}
          </div>
        </div>

        {/* Sets Grid */}
        <div className="flex flex-col gap-3">
          {sets.map((set, idx) => (
            <button
              key={set.number}
              onClick={() => onSelect(set)}
              className="bg-white border-2 border-pencil p-4 hover:shadow-hard transition-all text-left cursor-pointer group flex items-center gap-4"
              style={{
                borderRadius: WOBBLY_RADII.md,
                transform: `rotate(${idx % 2 === 0 ? '-0.3' : '0.3'}deg)`,
              }}
            >
              {/* Set number badge */}
              <div className="w-12 h-12 shrink-0 flex items-center justify-center border-2 border-pencil bg-accent text-white font-marker text-lg"
                style={{ borderRadius: WOBBLY_RADII.sm }}>
                {set.number}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="font-marker text-base text-pencil mb-0.5">{set.title}</div>
                <div className="font-hand text-sm text-pencil/60">{set.description}</div>
              </div>

              <ArrowLeft className="w-5 h-5 text-pencil/30 rotate-180 group-hover:text-pencil/60 transition-colors shrink-0" strokeWidth={3} />
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
