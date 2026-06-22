"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import LEVELS from "@/lib/typing-curriculum";
import { APP, WOBBLY_RADII } from "@/lib/config";
import {
  getAllLessonProgress,
  getOverallProgress,
  getCompletionTimeline,
} from "@/lib/lesson-storage";
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
  TrendingUp,
  Trophy,
} from "lucide-react";

const LEVEL_ICONS: Record<string, any> = {
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
};

export default function LearnPage() {
  const router = useRouter();
  const [activeLevel, setActiveLevel] = useState<number | null>(null);
  const [activeLesson, setActiveLesson] = useState<string | null>(null);
  const [progress, setProgress] = useState<Record<string, any>>({});
  const [overall, setOverall] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);

  useEffect(() => {
    setProgress(getAllLessonProgress());
    setOverall(getOverallProgress());
    setTimeline(getCompletionTimeline());
  }, []);

  const totalLessons = LEVELS.reduce((s, l) => s + l.lessons.length, 0);

  return (
    <div className='min-h-screen bg-paper'>
      <main className='max-w-5xl mx-auto px-6 py-8'>
        {/* Header */}
        <div className='flex items-center space-x-4 mb-8 -rotate-1'>
          <GraduationCap className='w-8 h-8 text-blue-pen' strokeWidth={3} />
          <div>
            <h1 className='text-3xl font-bold text-pencil font-marker'>
              Typing Sikhein
            </h1>
            <p className='text-lg text-pencil/60 font-hand mt-1'>
              Bilkul zero se — agar aapne kabhi computer nahi chhua, to yahin se
              shuru karein
            </p>
          </div>
        </div>

        {/* Overall Progress */}
        {overall && (
          <div
            className='bg-white border-2 border-pencil p-5 shadow-hard-sm mb-6'
            style={{ borderRadius: WOBBLY_RADII.md }}
          >
            <div className='flex items-center justify-between mb-3'>
              <h2 className='text-lg font-bold text-pencil font-marker flex items-center gap-2'>
                <Trophy className='w-5 h-5 text-yellow-500' strokeWidth={3} />
                Overall Progress
              </h2>
              <span className='text-sm font-hand text-pencil/50'>
                {overall.completed} / {totalLessons} lessons
              </span>
            </div>
            <div className='w-full h-4 bg-gray-100 border border-pencil/20 rounded-full overflow-hidden mb-3'>
              <div
                className='h-full rounded-full transition-all duration-700'
                style={{
                  width: `${(overall.completed / totalLessons) * 100}%`,
                  background:
                    overall.completed === totalLessons ?
                      "linear-gradient(90deg, #4caf50, #8bc34a)"
                    : "linear-gradient(90deg, #2F5BFF, #4ec5df)",
                }}
              />
            </div>
            <div className='grid grid-cols-3 gap-3 text-center text-xs font-hand'>
              <div className='bg-paper rounded p-2'>
                <div className='font-bold text-pencil font-marker text-base'>
                  {overall.avgWpm.toFixed(1)}
                </div>
                <div className='text-pencil/50'>Avg WPM</div>
              </div>
              <div className='bg-paper rounded p-2'>
                <div className='font-bold text-pencil font-marker text-base'>
                  {overall.avgAccuracy.toFixed(1)}%
                </div>
                <div className='text-pencil/50'>Avg Accuracy</div>
              </div>
              <div className='bg-paper rounded p-2'>
                <div className='font-bold text-green-600 font-marker text-base'>
                  {overall.qualifiedCount}/{overall.completed}
                </div>
                <div className='text-pencil/50'>Qualified</div>
              </div>
            </div>
            {timeline.length >= 2 && (
              <div className='mt-3 pt-3 border-t border-pencil/10'>
                <div className='text-xs text-pencil/40 font-hand mb-2 flex items-center gap-1'>
                  <TrendingUp className='w-3 h-3' strokeWidth={2.5} />
                  WPM Progression ({timeline.length} lessons completed)
                </div>
                <div className='flex items-end gap-0.5 h-16'>
                  {timeline.map((t, i) => {
                    const maxWpm = Math.max(...timeline.map((x) => x.wpm), 1);
                    const h = Math.max(4, (t.wpm / maxWpm) * 56);
                    return (
                      <div
                        key={i}
                        className='flex-1 flex flex-col items-center gap-0.5 group relative'
                      >
                        <div
                          className='absolute bottom-full mb-1 hidden group-hover:block bg-white border border-pencil/30 text-xs font-hand text-pencil px-2 py-1 whitespace-nowrap z-10'
                          style={{ borderRadius: WOBBLY_RADII.sm }}
                        >
                          {t.wpm.toFixed(1)} WPM
                        </div>
                        <div
                          className='w-full rounded-t transition-all duration-300'
                          style={{
                            height: h,
                            background: t.qualified ? "#4caf50" : "#ff9800",
                          }}
                        />
                        <div className='text-[8px] text-pencil/30 font-hand leading-none'>
                          {i + 1}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {!overall && (
          <div
            className='bg-postit border-2 border-pencil p-5 shadow-hard-sm mb-6 text-center'
            style={{ borderRadius: WOBBLY_RADII.md }}
          >
            <p className='text-base text-pencil/60 font-hand'>
              Start your first lesson to see progress!
            </p>
          </div>
        )}

        {/* Quick Stats */}
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-10'>
          {[
            {
              value: `${LEVELS.length}`,
              label: "Levels",
              icon: <BookOpen className='w-5 h-5' strokeWidth={3} />,
            },
            {
              value: `${totalLessons}`,
              label: "Lessons",
              icon: <Type className='w-5 h-5' strokeWidth={3} />,
            },
            {
              value: `${overall?.completed || 0} / ${totalLessons}`,
              label: "Completed",
              icon: <CheckCircle2 className='w-5 h-5' strokeWidth={3} />,
            },
            {
              value: "SSC Ready",
              label: "Final Goal",
              icon: <Award className='w-5 h-5' strokeWidth={3} />,
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className='bg-white border-2 border-pencil shadow-hard-sm p-4 text-center hover:shadow-hard transition-all'
              style={{
                borderRadius: WOBBLY_RADII.md,
                transform: `rotate(${Math.random() > 0.5 ? "-0.5" : "0.5"}deg)`,
              }}
            >
              <div className='flex justify-center mb-2 text-pencil'>
                {stat.icon}
              </div>
              <div className='text-2xl font-bold text-pencil font-marker'>
                {stat.value}
              </div>
              <div className='text-sm text-pencil/60 font-hand mt-1'>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Levels */}
        <div className='space-y-6'>
          {LEVELS.map((level) => {
            const IconComponent = LEVEL_ICONS[level.icon] || BookOpen;
            const isOpen = activeLevel === level.id;
            const levelCompleted = level.lessons.every((l) => progress[l.id]);
            const levelProgress = level.lessons.filter(
              (l) => progress[l.id],
            ).length;
            return (
              <div
                key={level.id}
                className={`bg-white border-2 ${levelCompleted ? "border-green-300" : "border-pencil"} shadow-hard-sm hover:shadow-hard transition-all`}
                style={{ borderRadius: WOBBLY_RADII.md }}
              >
                {/* Level Header */}
                <button
                  onClick={() => setActiveLevel(isOpen ? null : level.id)}
                  className='w-full text-left p-6 flex items-center justify-between'
                >
                  <div className='flex items-center space-x-4'>
                    <div
                      className='w-14 h-14 flex items-center justify-center border-2 border-pencil shrink-0 relative'
                      style={{
                        borderRadius: WOBBLY_RADII.sm,
                        background: levelCompleted ? "#e8f5e9" : "#f5f5f5",
                      }}
                    >
                      <IconComponent
                        className='w-6 h-6 text-pencil'
                        strokeWidth={3}
                      />
                      {levelCompleted && (
                        <CheckCircle2
                          className='w-5 h-5 text-green-600 absolute -top-1.5 -right-1.5 bg-white rounded-full'
                          strokeWidth={3}
                        />
                      )}
                    </div>
                    <div>
                      <div className='flex items-center space-x-3'>
                        <span
                          className='text-sm font-hand text-pencil/50 bg-muted px-2 py-0.5 border border-pencil'
                          style={{ borderRadius: WOBBLY_RADII.sm }}
                        >
                          Level {level.id}
                        </span>
                        <h2 className='text-xl font-bold text-pencil font-marker'>
                          {level.name}
                        </h2>
                      </div>
                      <p className='text-base text-pencil/60 font-hand mt-1'>
                        {level.subtitle}
                      </p>
                    </div>
                  </div>
                  <div className='flex items-center gap-3'>
                    <span className='text-xs font-hand text-pencil/40'>
                      {levelProgress}/{level.lessons.length}
                    </span>
                    <ChevronRight
                      className={`w-6 h-6 text-pencil/40 transition-transform ${isOpen ? "rotate-90" : ""}`}
                      strokeWidth={3}
                    />
                  </div>
                </button>

                {/* Description (always visible) */}
                <div className='px-6 pb-4'>
                  <p className='text-base text-pencil/70 font-hand border-l-4 border-pencil pl-4'>
                    {level.description}
                  </p>
                  {levelProgress > 0 &&
                    levelProgress < level.lessons.length && (
                      <div className='mt-2 w-full h-1.5 bg-gray-100 rounded-full overflow-hidden'>
                        <div
                          className='h-full rounded-full bg-blue-pen transition-all'
                          style={{
                            width: `${(levelProgress / level.lessons.length) * 100}%`,
                          }}
                        />
                      </div>
                    )}
                </div>

                {/* Lessons (expandable) */}
                {isOpen && (
                  <div className='px-6 pb-6 space-y-3'>
                    <div className='border-t-2 border-pencil/20 pt-4' />
                    {level.lessons.map((lesson, i) => {
                      const lessonOpen = activeLesson === lesson.id;
                      const lessonProg = progress[lesson.id];
                      return (
                        <div
                          key={lesson.id}
                          className={`border-2 ${lessonProg?.qualified ? "border-green-300" : "border-pencil"} bg-paper hover:shadow-hard-sm transition-all`}
                          style={{ borderRadius: WOBBLY_RADII.sm }}
                        >
                          <button
                            onClick={() =>
                              setActiveLesson(lessonOpen ? null : lesson.id)
                            }
                            className='w-full text-left p-4 flex items-center justify-between'
                          >
                            <div className='flex items-center space-x-3'>
                              <span
                                className={`w-8 h-8 flex items-center justify-center text-sm font-bold font-hand
                                ${lessonProg ? "bg-green-100 border-green-300 text-green-700" : "bg-muted border-2 border-pencil text-pencil"}`}
                                style={{ borderRadius: WOBBLY_RADII.sm }}
                              >
                                {lessonProg ? "✓" : i + 1}
                              </span>
                              <div>
                                <div className='flex items-center gap-2'>
                                  <span className='font-bold text-pencil font-hand'>
                                    {lesson.title}
                                  </span>
                                  {lessonProg && (
                                    <span className='text-[10px] font-hand bg-postit border border-pencil/20 px-1.5 py-0.5 text-pencil/60'>
                                      Best: {lessonProg.bestWpm.toFixed(1)} WPM
                                    </span>
                                  )}
                                </div>
                                <div className='flex items-center space-x-3 text-xs text-pencil/50 font-hand mt-1'>
                                  <span className='flex items-center space-x-1'>
                                    <Target
                                      className='w-3 h-3'
                                      strokeWidth={3}
                                    />
                                    <span>{lesson.targetWpm} WPM</span>
                                  </span>
                                  <span className='flex items-center space-x-1'>
                                    <CheckCircle2
                                      className='w-3 h-3'
                                      strokeWidth={3}
                                    />
                                    <span>{lesson.minAccuracy}% acc</span>
                                  </span>
                                  <span className='flex items-center space-x-1'>
                                    <Clock
                                      className='w-3 h-3'
                                      strokeWidth={3}
                                    />
                                    <span>
                                      {Math.round(lesson.durationSec / 60)} min
                                    </span>
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className='flex items-center gap-2'>
                              {lessonProg && (
                                <span
                                  className={`text-[10px] font-hand px-1.5 py-0.5 border ${
                                    lessonProg.qualified ?
                                      "text-green-700 bg-green-50 border-green-200"
                                    : "text-orange-600 bg-orange-50 border-orange-200"
                                  }`}
                                  style={{ borderRadius: WOBBLY_RADII.sm }}
                                >
                                  {lessonProg.qualified ?
                                    "Passed"
                                  : "Attempted"}
                                </span>
                              )}
                              <Play
                                className={`w-5 h-5 ${lessonOpen ? "text-accent" : "text-pencil/30"}`}
                                strokeWidth={3}
                              />
                            </div>
                          </button>

                          {lessonOpen && (
                            <div className='px-4 pb-4 space-y-3'>
                              <div
                                className='p-3 bg-postit border-2 border-pencil'
                                style={{ borderRadius: WOBBLY_RADII.sm }}
                              >
                                <p className='text-base text-pencil font-hand'>
                                  {lesson.instruction}
                                </p>
                              </div>
                              {lessonProg && (
                                <div className='grid grid-cols-3 gap-2 text-center text-xs font-hand'>
                                  <div className='bg-white border border-pencil/20 p-2 rounded'>
                                    <div className='font-bold font-mono text-pencil'>
                                      {lessonProg.bestWpm.toFixed(1)}
                                    </div>
                                    <div className='text-pencil/40'>
                                      Best WPM
                                    </div>
                                  </div>
                                  <div className='bg-white border border-pencil/20 p-2 rounded'>
                                    <div className='font-bold font-mono text-pencil'>
                                      {lessonProg.bestAccuracy.toFixed(1)}%
                                    </div>
                                    <div className='text-pencil/40'>
                                      Best Accuracy
                                    </div>
                                  </div>
                                  <div className='bg-white border border-pencil/20 p-2 rounded'>
                                    <div className='font-bold font-mono text-pencil'>
                                      {lessonProg.attempts}
                                    </div>
                                    <div className='text-pencil/40'>
                                      Attempts
                                    </div>
                                  </div>
                                </div>
                              )}
                              <div
                                className='p-4 bg-white border-2 border-pencil'
                                style={{ borderRadius: WOBBLY_RADII.sm }}
                              >
                                <div className='text-xs text-pencil/40 font-hand mb-2 uppercase tracking-wider'>
                                  Practice Text
                                </div>
                                <p className='font-mono text-sm leading-relaxed text-pencil'>
                                  {lesson.sampleText}
                                </p>
                              </div>
                              <button
                                onClick={() =>
                                  router.push(`/exam/lesson/${lesson.id}`)
                                }
                                className='btn-hand w-full text-center'
                              >
                                <Play
                                  className='w-4 h-4 mr-2'
                                  strokeWidth={3}
                                  fill='currentColor'
                                />
                                {lessonProg ? "Retry Lesson" : "Start Lesson"}
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
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth={props.strokeWidth || 2}
      strokeLinecap='round'
      strokeLinejoin='round'
      className={props.className}
      {...props}
    >
      <path d='M22 10v6M2 10l10-5 10 5-10 5z' />
      <path d='M6 12v5c3 3 9 3 12 0v-5' />
    </svg>
  );
}
