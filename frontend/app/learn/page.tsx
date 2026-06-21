'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import LEVELS from '@/lib/typing-curriculum';
import { APP, WOBBLY_RADII } from '@/lib/config';
import {
  Monitor,
  Keyboard,
  ArrowUp,
  ArrowDown,
  BookOpen,
  ScrollText,
  Type,
  FileText,
  Gauge,
  Target,
  Award,
  CheckCircle2,
  Lock,
  Play,
  ChevronRight,
  Clock,
  Zap,
} from 'lucide-react';

const LEVEL_ICONS: Record<string, any> = {
  Monitor, Keyboard, ArrowUp, ArrowDown, BookOpen,
  ScrollText, Type, FileText, Gauge, Target, Award,
};

export default function LearnPage() {
  const router = useRouter();
  const [activeLevel, setActiveLevel] = useState<number | null>(null);
  const [activeLesson, setActiveLesson] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-paper">
      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8 -rotate-1">
          <GraduationCap className="w-8 h-8 text-blue-pen" strokeWidth={3} />
          <div>
            <h1 className="text-3xl font-bold text-pencil font-marker">Typing Sikhein</h1>
            <p className="text-lg text-pencil/60 font-hand mt-1">
              Bilkul zero se — agar aapne kabhi computer nahi chhoda, to yahin se shuru karein
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { value: `${LEVELS.length}`, label: 'Levels', icon: <BookOpen className="w-5 h-5" strokeWidth={3} /> },
            { value: `${LEVELS.reduce((s, l) => s + l.lessons.length, 0)}`, label: 'Lessons', icon: <Type className="w-5 h-5" strokeWidth={3} /> },
            { value: '0 → 45', label: 'WPM Journey', icon: <Gauge className="w-5 h-5" strokeWidth={3} /> },
            { value: 'SSC Ready', label: 'Final Goal', icon: <Award className="w-5 h-5" strokeWidth={3} /> },
          ].map((stat) => (
            <div key={stat.label}
                 className="bg-white border-2 border-pencil shadow-hard-sm p-4 text-center hover:shadow-hard transition-all"
                 style={{ borderRadius: WOBBLY_RADII.md, transform: `rotate(${Math.random() > 0.5 ? '-0.5' : '0.5'}deg)` }}>
              <div className="flex justify-center mb-2 text-pencil">{stat.icon}</div>
              <div className="text-2xl font-bold text-pencil font-marker">{stat.value}</div>
              <div className="text-sm text-pencil/60 font-hand mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Levels */}
        <div className="space-y-6">
          {LEVELS.map((level) => {
            const IconComponent = LEVEL_ICONS[level.icon] || BookOpen;
            const isOpen = activeLevel === level.id;
            return (
              <div key={level.id}
                   className="bg-white border-2 border-pencil shadow-hard-sm hover:shadow-hard transition-all"
                   style={{ borderRadius: WOBBLY_RADII.md }}>
                {/* Level Header */}
                <button
                  onClick={() => setActiveLevel(isOpen ? null : level.id)}
                  className="w-full text-left p-6 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 flex items-center justify-center border-2 border-pencil bg-muted shrink-0"
                         style={{ borderRadius: WOBBLY_RADII.sm }}>
                      <IconComponent className="w-6 h-6 text-pencil" strokeWidth={3} />
                    </div>
                    <div>
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-hand text-pencil/50 bg-muted px-2 py-0.5 border border-pencil"
                              style={{ borderRadius: WOBBLY_RADII.sm }}>
                          Level {level.id}
                        </span>
                        <h2 className="text-xl font-bold text-pencil font-marker">{level.name}</h2>
                      </div>
                      <p className="text-base text-pencil/60 font-hand mt-1">{level.subtitle}</p>
                    </div>
                  </div>
                  <ChevronRight className={`w-6 h-6 text-pencil/40 transition-transform ${isOpen ? 'rotate-90' : ''}`} strokeWidth={3} />
                </button>

                {/* Description (always visible) */}
                <div className="px-6 pb-4">
                  <p className="text-base text-pencil/70 font-hand border-l-4 border-pencil pl-4">
                    {level.description}
                  </p>
                </div>

                {/* Lessons (expandable) */}
                {isOpen && (
                  <div className="px-6 pb-6 space-y-3">
                    <div className="border-t-2 border-pencil/20 pt-4" />
                    {level.lessons.map((lesson, i) => {
                      const lessonOpen = activeLesson === lesson.id;
                      return (
                        <div key={lesson.id}
                             className="border-2 border-pencil bg-paper hover:shadow-hard-sm transition-all"
                             style={{ borderRadius: WOBBLY_RADII.sm }}>
                          <button
                            onClick={() => setActiveLesson(lessonOpen ? null : lesson.id)}
                            className="w-full text-left p-4 flex items-center justify-between"
                          >
                            <div className="flex items-center space-x-3">
                              <span className="w-8 h-8 flex items-center justify-center bg-muted border-2 border-pencil text-sm font-bold text-pencil font-hand"
                                    style={{ borderRadius: WOBBLY_RADII.sm }}>
                                {i + 1}
                              </span>
                              <div>
                                <span className="font-bold text-pencil font-hand">{lesson.title}</span>
                                <div className="flex items-center space-x-3 text-xs text-pencil/50 font-hand mt-1">
                                  <span className="flex items-center space-x-1">
                                    <Target className="w-3 h-3" strokeWidth={3} />
                                    <span>{lesson.targetWpm} WPM</span>
                                  </span>
                                  <span className="flex items-center space-x-1">
                                    <CheckCircle2 className="w-3 h-3" strokeWidth={3} />
                                    <span>{lesson.minAccuracy}% acc</span>
                                  </span>
                                  <span className="flex items-center space-x-1">
                                    <Clock className="w-3 h-3" strokeWidth={3} />
                                    <span>{Math.round(lesson.durationSec / 60)} min</span>
                                  </span>
                                </div>
                              </div>
                            </div>
                            <Play className={`w-5 h-5 ${lessonOpen ? 'text-accent' : 'text-pencil/30'}`} strokeWidth={3} />
                          </button>

                          {lessonOpen && (
                            <div className="px-4 pb-4 space-y-3">
                              <div className="p-3 bg-postit border-2 border-pencil" style={{ borderRadius: WOBBLY_RADII.sm }}>
                                <p className="text-base text-pencil font-hand">{lesson.instruction}</p>
                              </div>
                              <div className="p-4 bg-white border-2 border-pencil" style={{ borderRadius: WOBBLY_RADII.sm }}>
                                <div className="text-xs text-pencil/40 font-hand mb-2 uppercase tracking-wider">Practice Text</div>
                                <p className="font-mono text-sm leading-relaxed text-pencil">
                                  {lesson.sampleText}
                                </p>
                              </div>
                              <button
                                onClick={() => router.push(`/exam/lesson/${lesson.id}`)}
                                className="btn-hand w-full text-center"
                              >
                                <Play className="w-4 h-4 mr-2" strokeWidth={3} fill="currentColor" />
                                Start Lesson
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

function GraduationCap(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={props.strokeWidth || 2} strokeLinecap="round" strokeLinejoin="round" className={props.className} {...props}>
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
  );
}
