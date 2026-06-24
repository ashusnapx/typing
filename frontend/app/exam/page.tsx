'use client';

import { useRouter } from 'next/navigation';
import { EXAM_MODES, WOBBLY_RADII, CSS } from '@/lib/config';
import { Clock, Target, ArrowRight, ScrollText } from 'lucide-react';

const ICONS: Record<string, React.ReactNode> = {
  Target: <Target className="w-5 h-5" strokeWidth={3} />,
  Keyboard: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M6 16h12" />
    </svg>
  ),
  Play: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  ),
  Sparkles: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5z" />
      <path d="M18 14l1 2.5L22 17l-2.5 1L18 21l-1-2.5L14 17l2.5-1z" />
    </svg>
  ),
  Award: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <circle cx="12" cy="8" r="6" />
      <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
    </svg>
  ),
};

export default function ExamListingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-paper">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 flex items-center justify-center border-2 border-pencil bg-postit"
            style={{ borderRadius: WOBBLY_RADII.sm }}>
            <ScrollText className="w-5 h-5 text-pencil" strokeWidth={3} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-pencil font-marker">Choose a Typing Test</h1>
            <p className="text-sm text-pencil/60 font-hand">Select an exam mode. Each follows official SSC guidelines.</p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {EXAM_MODES.map((exam, idx) => {
            const minutes = Math.floor(exam.duration / 60);
            const wpmLabel = exam.wpmTarget > 0 ? `${exam.wpmTarget} WPM` : 'KDPH';
            const isHindi = exam.lang === 'hindi';

            return (
              <button
                key={exam.id}
                onClick={() => router.push(exam.href)}
                className="bg-white border-2 border-pencil p-4 hover:shadow-hard transition-all text-left cursor-pointer group flex items-center gap-4"
                style={{
                  borderRadius: WOBBLY_RADII.md,
                  transform: `rotate(${idx % 2 === 0 ? '-0.3' : '0.3'}deg)`,
                }}
              >
                {/* Icon */}
                <div className="w-12 h-12 shrink-0 flex items-center justify-center border-2 border-pencil bg-paper"
                  style={{ borderRadius: WOBBLY_RADII.sm }}>
                  <span className="text-pencil">{ICONS[exam.icon] || <Target className="w-5 h-5" strokeWidth={3} />}</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-marker text-base text-pencil flex items-center gap-2">
                    {exam.title}
                    {isHindi && (
                      <span className="text-[10px] bg-accent text-white font-bold px-2 py-0.5" style={{ borderRadius: WOBBLY_RADII.sm }}>
                        HINDI
                      </span>
                    )}
                  </div>
                  <div className="font-hand text-sm text-pencil/60 mt-0.5">{exam.description}</div>
                </div>

                {/* Meta */}
                <div className="hidden sm:flex items-center gap-4 shrink-0">
                  <div className="flex items-center gap-1.5 text-xs font-hand text-pencil/50">
                    <Clock className="w-3.5 h-3.5" strokeWidth={2.5} />
                    {minutes} min
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-hand text-pencil/50">
                    <Target className="w-3.5 h-3.5" strokeWidth={2.5} />
                    {wpmLabel}
                  </div>
                  <ArrowRight className="w-4 h-4 text-pencil/30 group-hover:text-pencil/60 transition-colors" strokeWidth={3} />
                </div>
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
}
