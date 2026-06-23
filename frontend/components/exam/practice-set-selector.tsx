'use client';

import { PracticeSet } from '@/lib/practice-sets';
import { CSS } from '@/lib/config';
import { GraduationCap, ArrowRight, Timer, Target } from 'lucide-react';

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
      <div className="max-w-4xl mx-auto px-6 py-8">
        <button onClick={onBack} className="flex items-center space-x-2 text-pencil/50 hover:text-pencil font-hand mb-6 transition-colors">
          <ArrowRight className="w-4 h-4 rotate-180" strokeWidth={3} />
          <span>Back to Exams</span>
        </button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-postit border-2 border-pencil mb-4"
               style={{ borderRadius: CSS.radii.sm }}>
            <GraduationCap className="w-8 h-8 text-pencil" strokeWidth={3} />
          </div>
          <h1 className="text-3xl font-bold text-pencil font-marker">{examName}</h1>
          <p className="text-lg text-pencil/60 font-hand mt-2">Choose a practice set to begin</p>
          <div className="flex items-center justify-center space-x-4 mt-3 text-sm font-hand text-pencil/50">
            <span className="flex items-center space-x-1"><Timer className="w-4 h-4" strokeWidth={3} /> {durationMinutes} min</span>
            {wpmTarget ? <span className="flex items-center space-x-1"><Target className="w-4 h-4" strokeWidth={3} /> {wpmTarget} WPM target</span> : null}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {sets.map((set) => (
            <button
              key={set.number}
              onClick={() => onSelect(set)}
              className="bg-white border-2 border-pencil/20 p-5 shadow-hard-sm text-left hover:border-pencil/60 hover:shadow-hard-md transition-all group"
              style={{ borderRadius: CSS.radii.sm }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 flex items-center justify-center bg-postit border-2 border-pencil/30 text-lg font-bold font-marker text-pencil"
                       style={{ borderRadius: CSS.radii.sm }}>
                    {set.number}
                  </div>
                  <div>
                    <h3 className="font-bold text-pencil font-marker text-lg group-hover:underline">{set.title}</h3>
                    <p className="text-sm text-pencil/50 font-hand mt-0.5">{set.description}</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-pencil/30 group-hover:text-pencil/60 transition-colors shrink-0 mt-1" strokeWidth={3} />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
