'use client';

import { useState } from 'react';
import type { Level, Lesson } from '@/lib/typing-curriculum';
import { isLessonUnlocked } from '@/lib/typing-curriculum';
import { CSS, WOBBLY_RADII } from '@/lib/config';
import { FINGER_COLORS, FingerZone } from './keyboard-layout';
import type { LucideIcon } from 'lucide-react';
import {
  Lock, Play, CheckCircle2, ChevronDown, ChevronRight, Target, Clock,
  Star, Sparkles, BookOpen, Brain, Award, Gauge, Zap, Hash,
  Monitor, ArrowUpLeft, ArrowUpRight, ArrowDown, ChevronLeft, ChevronRight as ChevronRightIcon,
  Keyboard, FileText, Flame, ShieldAlert,
} from 'lucide-react';

const LEVEL_ICONS: Record<string, LucideIcon> = {
  Monitor, ArrowUpLeft, ArrowUpRight, ArrowDown, BookOpen, Hash, Zap, Award,
  Gauge, FileText, Flame, ShieldAlert, Keyboard, ChevronLeft, ChevronRightIcon,
};

function getDifficultyStars(targetWpm: number): number {
  if (targetWpm <= 0) return 0;
  if (targetWpm <= 10) return 1;
  if (targetWpm <= 15) return 2;
  if (targetWpm <= 22) return 3;
  if (targetWpm <= 30) return 4;
  return 5;
}

function getPrimaryFingerZone(lesson: Lesson): FingerZone | null {
  if (!lesson.fingerZones || lesson.fingerZones.length === 0) return null;
  const counts: Partial<Record<FingerZone, number>> = {};
  for (const z of lesson.fingerZones) {
    counts[z] = (counts[z] || 0) + 1;
  }
  let maxCount = 0;
  let primary: FingerZone | null = null;
  for (const [zone, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxCount = count;
      primary = zone as FingerZone;
    }
  }
  return primary;
}

interface CurriculumTimelineProps {
  levels: Level[];
  progress: Record<string, any>;
  activeLevelId: number | null;
  onToggleLevel: (levelId: number) => void;
  onStartLesson: (lessonId: string) => void;
}

export function CurriculumTimeline({
  levels,
  progress,
  activeLevelId,
  onToggleLevel,
  onStartLesson,
}: CurriculumTimelineProps) {
  return (
    <div className="relative py-2">
      {/* Vertical line */}
      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-pencil/15" />

      {levels.map((level, idx) => {
        const IconComponent = LEVEL_ICONS[level.icon] || BookOpen;
        const isOpen = activeLevelId === level.id;

        const total = level.lessons.length;
        const completed = level.lessons.filter(l => progress[l.id]?.bestWpm > 0).length;
        const qualified = level.lessons.filter(l => progress[l.id]?.qualified).length;
        const isCompleted = total > 0 && completed === total;
        const isMastered = total > 0 && qualified === total;

        const isUnlocked = idx === 0 || level.lessons.some(l => isLessonUnlocked(l.id, progress));

        const fillHeight = total > 0 ? (qualified / total) * 100 : 0;

        return (
          <div key={level.id} className="relative pl-14 pb-8 last:pb-0">
            {/* Timeline node */}
            <div className="absolute left-4 top-1 z-10">
              <div
                className={`
                  w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-300
                  ${isMastered
                    ? 'bg-green-100 border-green-500 text-green-600 scale-110 shadow-hard-sm'
                    : isCompleted
                      ? 'bg-blue-50 border-blue-400 text-blue-500'
                      : isUnlocked
                        ? 'bg-paper border-pencil text-pencil'
                        : 'bg-gray-100 border-gray-300 text-gray-300'
                  }
                `}
              >
                {isMastered ? (
                  <Award className="w-2.5 h-2.5" strokeWidth={3} />
                ) : isCompleted ? (
                  <CheckCircle2 className="w-2.5 h-2.5" strokeWidth={3} />
                ) : !isUnlocked ? (
                  <Lock className="w-2.5 h-2.5" strokeWidth={3} />
                ) : (
                  <span className="font-marker text-[8px]">{level.id}</span>
                )}
              </div>
              {/* Fill line */}
              {fillHeight > 0 && (
                <div
                  className="absolute left-1/2 -translate-x-1/2 w-0.5 bg-green-400 transition-all duration-500"
                  style={{ top: '100%', height: `${fillHeight}%` }}
                />
              )}
            </div>

            {/* Level card */}
            <div
              className={`
                bg-white border-2 shadow-hard-sm transition-all duration-300
                ${isOpen ? 'shadow-hard' : 'hover:shadow-hard'}
                ${isMastered
                  ? 'border-green-400/60'
                  : isCompleted
                    ? 'border-blue-400/60'
                    : isUnlocked
                      ? 'border-pencil/30'
                      : 'border-pencil/10 opacity-60'
                }
              `}
              style={{ borderRadius: WOBBLY_RADII.md }}
            >
              <button
                type="button"
                onClick={() => onToggleLevel(level.id)}
                className="w-full text-left p-4 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`
                      w-10 h-10 rounded-lg border-2 flex items-center justify-center shrink-0
                      ${isMastered ? 'bg-green-50 border-green-300 text-green-600'
                        : isCompleted ? 'bg-blue-50 border-blue-300 text-blue-500'
                        : 'bg-paper border-pencil/20 text-pencil'
                      }
                    `}
                    style={{ borderRadius: WOBBLY_RADII.sm }}
                  >
                    <IconComponent className="w-5 h-5" strokeWidth={2.5} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-hand text-pencil/40 bg-pencil/5 border border-pencil/10 px-1.5 py-0.5 rounded">
                        Level {level.id}
                      </span>
                      <h3 className="font-marker text-base md:text-lg text-pencil truncate">{level.name}</h3>
                      {isMastered && (
                        <span className="text-[10px] font-marker bg-green-100 text-green-700 border border-green-300 px-1.5 py-0.5 rounded uppercase tracking-wider">Mastered</span>
                      )}
                    </div>
                    <p className="text-xs font-hand text-pencil/60 mt-0.5 truncate">{level.subtitle}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right hidden sm:block">
                    <div className="text-[10px] font-hand text-pencil/40">Progress</div>
                    <div className="text-xs font-marker text-pencil">{completed}/{total}</div>
                  </div>
                  {isOpen ? (
                    <ChevronDown className="w-4 h-4 text-pencil/50" strokeWidth={3} />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-pencil/30" strokeWidth={3} />
                  )}
                </div>
              </button>

              {/* Description */}
              {isOpen && (
                <div className="px-4 pb-2">
                  <p className="text-xs font-hand text-pencil/70 pl-3 border-l-2 border-pencil/20 leading-relaxed">
                    {level.description}
                  </p>
                  {completed > 0 && completed < total && (
                    <div className="mt-2 w-full h-1.5 bg-pencil/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-blue-400 transition-all duration-500"
                        style={{ width: `${(completed / total) * 100}%` }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Lessons */}
              {isOpen && (
                <div className="px-4 pb-4 space-y-2">
                  <div className="border-t border-pencil/10 pt-3" />
                  {level.lessons.map((lesson) => {
                    const lessonProg = progress[lesson.id];
                    const unlocked = isLessonUnlocked(lesson.id, progress);
                    const stars = getDifficultyStars(lesson.targetWpm);
                    const primaryFinger = getPrimaryFingerZone(lesson);
                    const borderColor = primaryFinger ? FINGER_COLORS[primaryFinger] : '#ccc';

                    let statusBadge: React.ReactNode;
                    if (lessonProg?.qualified) {
                      statusBadge = (
                        <span className="text-[10px] font-marker bg-green-50 text-green-700 border border-green-200 px-1.5 py-0.5 rounded">PASSED</span>
                      );
                    } else if (lessonProg) {
                      statusBadge = (
                        <span className="text-[10px] font-marker bg-orange-50 text-orange-700 border border-orange-200 px-1.5 py-0.5 rounded">ATTEMPTED</span>
                      );
                    } else if (unlocked) {
                      statusBadge = (
                        <span className="text-[10px] font-marker bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded">READY</span>
                      );
                    } else {
                      statusBadge = (
                        <span className="text-[10px] font-marker bg-gray-50 text-gray-400 border border-gray-200 px-1.5 py-0.5 rounded flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" /> LOCKED
                        </span>
                      );
                    }

                    return (
                      <div
                        key={lesson.id}
                        className={`
                          border-2 transition-all duration-200 border-l-4 relative overflow-hidden
                          ${lessonProg?.qualified
                            ? 'bg-green-50/10 border-green-300'
                            : unlocked
                              ? 'bg-paper/20 border-pencil/20 hover:shadow-hard-sm'
                              : 'bg-gray-50/60 border-pencil/10 opacity-60'
                          }
                        `}
                        style={{
                          borderRadius: WOBBLY_RADII.sm,
                          borderLeftColor: unlocked ? borderColor : undefined,
                        }}
                      >
                        <div className="p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`font-marker text-sm ${unlocked ? 'text-pencil' : 'text-pencil/40'}`}>
                                  {lesson.title}
                                </span>
                                {lesson.drillType && (
                                  <span className="text-[9px] font-hand bg-pencil/5 border border-pencil/10 px-1 text-pencil/50 capitalize rounded">
                                    {lesson.drillType}
                                  </span>
                                )}
                              </div>

                              {/* New keys chips */}
                              {lesson.newKeys && lesson.newKeys.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {lesson.newKeys.map((k) => (
                                    <span
                                      key={k}
                                      className="text-[10px] font-mono bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded"
                                    >
                                      {k === ' ' ? '␣' : k}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {/* Stats row */}
                              <div className="flex items-center gap-3 text-[10px] font-hand text-pencil/50 mt-2">
                                <span className="flex items-center gap-0.5">
                                  <Target className="w-3 h-3" /> {lesson.targetWpm} WPM
                                </span>
                                <span className="flex items-center gap-0.5">
                                  <CheckCircle2 className="w-3 h-3" /> {lesson.minAccuracy}% Acc
                                </span>
                                <span className="flex items-center gap-0.5">
                                  <Clock className="w-3 h-3" /> {Math.round(lesson.durationSec / 60)}m
                                </span>
                              </div>

                              {/* Difficulty stars */}
                              {stars > 0 && (
                                <div className="flex items-center gap-0.5 mt-1">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`w-2.5 h-2.5 ${i < stars ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`}
                                      strokeWidth={2}
                                    />
                                  ))}
                                </div>
                              )}

                              {/* Best score */}
                              {lessonProg && (
                                <div className="mt-2 text-[10px] font-hand text-pencil/50">
                                  Best: <span className="font-marker text-pencil">{lessonProg.bestWpm?.toFixed(1)} WPM</span> / <span className="font-marker text-pencil">{lessonProg.bestAccuracy?.toFixed(1)}%</span> ({lessonProg.attempts} attempts)
                                </div>
                              )}

                              {/* Psych tip */}
                              {lesson.psychTip && (
                                <div className="mt-2 flex items-start gap-1 text-[10px] font-hand text-pencil/50 italic bg-postit/50 p-1.5 rounded">
                                  <Sparkles className="w-2.5 h-2.5 mt-0.5 shrink-0 text-amber-400" />
                                  <span>{lesson.psychTip}</span>
                                </div>
                              )}
                            </div>

                            <div className="flex flex-col items-end gap-2 shrink-0">
                              {statusBadge}
                              {unlocked && (
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); onStartLesson(lesson.id); }}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white border-2 border-blue-600 font-marker text-xs shadow-hard-sm hover:bg-blue-600 transition-colors"
                                  style={{ borderRadius: WOBBLY_RADII.sm }}
                                >
                                  <Play className="w-3 h-3" fill="currentColor" strokeWidth={3} />
                                  Go
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
