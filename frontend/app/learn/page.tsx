"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import LEVELS, {
  isLessonUnlocked,
  getFlatLessons,
  getLevelName,
  getLevelProgress,
  getLevelIndex,
} from "@/lib/typing-curriculum";
import {
  getAllLessonProgress,
  getOverallProgress,
  getCompletionTimeline,
  type LessonProgress,
} from "@/lib/lesson-storage";
import { WOBBLY_RADII, ROUTES, CSS } from "@/lib/config";
import { CurriculumTimeline } from "@/components/learn/curriculum-timeline";
import { FingerLegend } from "@/components/learn/finger-legend";
import KeyboardSVG from "@/components/learn/keyboard-svg";
import { DailyFocus } from "@/components/learn/daily-focus";
import { KeyHeatmap } from "@/components/learn/key-heatmap";
import {
  KEYBOARD_KEYS,
  getKeyByLabel,
  type FingerZone,
} from "@/components/learn/keyboard-layout";
import {
  Trophy,
  BookOpen,
  CheckCircle2,
  Play,
  Star,
  Target,
  Gauge,
  GraduationCap,
  Keyboard,
  TrendingUp,
  Eye,
  EyeOff,
  Sparkles,
  RefreshCw,
  ChevronDown,
} from "lucide-react";

const FINGER_LABELS: FingerZone[] = [
  "lp", "lr", "lm", "li",
  "ri", "rm", "rr", "rp",
];

function todayDateStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function computeStreak(progress: Record<string, LessonProgress>): number {
  const dateSet = new Set<string>();
  for (const p of Object.values(progress)) {
    for (const d of p.completedDates) {
      dateSet.add(d.slice(0, 10));
    }
  }
  const sorted = [...dateSet].sort().reverse();
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < sorted.length; i++) {
    const expected = new Date(today);
    expected.setDate(expected.getDate() - i);
    if (sorted[i] === expected.toISOString().slice(0, 10)) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

function computeTodayMinutes(
  progress: Record<string, LessonProgress>,
  levels: typeof LEVELS
): number {
  const today = todayDateStr();
  let totalSec = 0;
  for (const level of levels) {
    for (const lesson of level.lessons) {
      const p = progress[lesson.id];
      if (p && p.completedDates.some((d) => d.slice(0, 10) === today)) {
        totalSec += lesson.durationSec;
      }
    }
  }
  return Math.round(totalSec / 60);
}

function computeWeakestKeys(
  progress: Record<string, LessonProgress>,
  levels: typeof LEVELS
): string[] {
  const keyAcc: Record<string, { total: number; count: number }> = {};
  for (const level of levels) {
    for (const lesson of level.lessons) {
      const p = progress[lesson.id];
      if (!p || lesson.keys.length === 0) continue;
      const accPerKey = p.bestAccuracy / lesson.keys.length;
      for (const key of lesson.keys) {
        if (key === " ") continue;
        if (!keyAcc[key]) keyAcc[key] = { total: 0, count: 0 };
        keyAcc[key].total += accPerKey;
        keyAcc[key].count++;
      }
    }
  }
  return Object.entries(keyAcc)
    .map(([key, v]) => ({ key, avg: v.total / v.count }))
    .sort((a, b) => a.avg - b.avg)
    .slice(0, 10)
    .map((e) => e.key);
}

function computeKeyHeatmapData(
  progress: Record<string, LessonProgress>,
  levels: typeof LEVELS
): Record<string, { correct: number; incorrect: number }> {
  const data: Record<string, { correct: number; incorrect: number }> = {};
  for (const level of levels) {
    for (const lesson of level.lessons) {
      const p = progress[lesson.id];
      if (!p || lesson.keys.length === 0) continue;
      const perKey = 10;
      const correct = Math.round(perKey * (p.bestAccuracy / 100));
      const incorrect = perKey - correct;
      for (const key of lesson.keys) {
        if (key === " ") continue;
        if (!data[key]) data[key] = { correct: 0, incorrect: 0 };
        data[key].correct += correct;
        data[key].incorrect += incorrect;
      }
    }
  }
  return data;
}

function computeTotalXp(
  progress: Record<string, LessonProgress>,
  levels: typeof LEVELS
): number {
  let xp = 0;
  for (const level of levels) {
    for (const lesson of level.lessons) {
      if (progress[lesson.id]?.qualified) {
        xp += lesson.xpReward;
      }
    }
  }
  return xp;
}

function computeTotalXpPossible(levels: typeof LEVELS): number {
  return levels.reduce(
    (s, l) => s + l.lessons.reduce((s2, le) => s2 + le.xpReward, 0),
    0
  );
}

function findNextIncompleteLessonId(
  progress: Record<string, LessonProgress>
): string | null {
  for (const f of getFlatLessons()) {
    if (!progress[f.id]?.qualified) return f.id;
  }
  return null;
}

export default function LearnPage() {
  const router = useRouter();
  const [activeLevelId, setActiveLevelId] = useState<number | null>(null);
  const [progress, setProgress] = useState<Record<string, LessonProgress>>({});
  const [overall, setOverall] = useState<ReturnType<typeof getOverallProgress> | null>(null);
  const [timeline, setTimeline] = useState<
    { lessonId: string; wpm: number; accuracy: number; date: string; qualified: boolean }[]
  >([]);
  const [fingerQuizMode, setFingerQuizMode] = useState(false);
  const [selectedFinger, setSelectedFinger] = useState<FingerZone | null>(null);
  const [quizKey, setQuizKey] = useState<string | null>(null);
  const [quizScore, setQuizScore] = useState({ correct: 0, total: 0 });
  const [quizFeedback, setQuizFeedback] = useState<"correct" | "incorrect" | null>(null);

  useEffect(() => {
    setProgress(getAllLessonProgress());
    setOverall(getOverallProgress());
    setTimeline(getCompletionTimeline());
  }, []);

  useEffect(() => {
    if (fingerQuizMode && !quizKey) pickRandomKey();
  }, [fingerQuizMode, quizKey]);

  const totalLessons = useMemo(
    () => LEVELS.reduce((s, l) => s + l.lessons.length, 0),
    []
  );

  const totalXp = useMemo(() => computeTotalXp(progress, LEVELS), [progress]);
  const totalXpPossible = useMemo(() => computeTotalXpPossible(LEVELS), []);
  const nextLessonId = useMemo(() => findNextIncompleteLessonId(progress), [progress]);
  const xpInfo = useMemo(() => getLevelProgress(totalXp), [totalXp]);
  const weakestKeys = useMemo(() => computeWeakestKeys(progress, LEVELS), [progress]);
  const streak = useMemo(() => computeStreak(progress), [progress]);
  const todayMinutes = useMemo(() => computeTodayMinutes(progress, LEVELS), [progress]);
  const keyHeatmapData = useMemo(() => computeKeyHeatmapData(progress, LEVELS), [progress]);

  const levelsCompleted = useMemo(
    () => LEVELS.filter((l) => l.lessons.every((le) => progress[le.id]?.qualified)).length,
    [progress]
  );

  function pickRandomKey() {
    const letterKeys = KEYBOARD_KEYS.filter(
      (k) => k.label.length === 1 && /^[a-z0-9.,;:'"/[\]\\=-]$/.test(k.label)
    );
    if (letterKeys.length === 0) return;
    setQuizKey(letterKeys[Math.floor(Math.random() * letterKeys.length)].label);
    setQuizFeedback(null);
  }

  function handleQuizAnswer(zone: FingerZone) {
    if (!quizKey) return;
    const def = getKeyByLabel(quizKey);
    if (!def) return;
    const correct = def.finger === zone;
    setQuizFeedback(correct ? "correct" : "incorrect");
    setQuizScore((s) => ({
      correct: s.correct + (correct ? 1 : 0),
      total: s.total + 1,
    }));
    setTimeout(pickRandomKey, 800);
  }

  const handleStartLesson = useCallback(
    (lessonId: string) => {
      router.push(`${ROUTES.examLesson}/${lessonId}`);
    },
    [router]
  );

  const handleFingerClick = useCallback(
    (zone: FingerZone) => {
      setSelectedFinger((prev) => (prev === zone ? null : zone));
    },
    []
  );

  const handleKeyHeatmapClick = useCallback(
    (key: string) => {
      for (const level of LEVELS) {
        for (const lesson of level.lessons) {
          if (lesson.keys.includes(key) && isLessonUnlocked(lesson.id, progress)) {
            setActiveLevelId(level.id);
            setTimeout(() => {
              const el = document.getElementById(`lesson-${lesson.id}`);
              if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
            }, 100);
            handleStartLesson(lesson.id);
            return;
          }
        }
      }
    },
    [progress, handleStartLesson]
  );

  const handleContinueLearning = useCallback(() => {
    if (!nextLessonId) return;
    handleStartLesson(nextLessonId);
  }, [nextLessonId, handleStartLesson]);

  return (
    <div className="min-h-screen bg-paper">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* ─── Hero Section ─────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 mb-6 sm:mb-8">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <GraduationCap className="w-8 h-8 text-blue-pen shrink-0" strokeWidth={3} />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-pencil font-marker">
                Typing Sikhein
              </h1>
              <p className="text-sm sm:text-lg text-pencil/60 font-hand mt-0.5">
                Bilkul zero se — SSC typing tak ka safar
              </p>
            </div>
          </div>

          {overall && (
            <div className="mt-3 sm:mt-0 sm:ml-auto flex items-center gap-3 flex-wrap">
              <div
                className="bg-white border-2 border-pencil px-3 py-1.5 shadow-hard-sm flex items-center gap-2"
                style={{ borderRadius: WOBBLY_RADII.sm }}
              >
                <Star className="w-4 h-4 text-yellow-500" strokeWidth={3} />
                <span className="font-marker text-pencil text-sm">{getLevelName(totalXp)}</span>
                <span className="font-hand text-pencil/40 text-xs">{totalXp} XP</span>
              </div>
              {nextLessonId && (
                <button
                  onClick={handleContinueLearning}
                  className="btn-hand text-sm flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5" strokeWidth={3} fill="currentColor" />
                  Continue Learning
                </button>
              )}
            </div>
          )}
        </div>

        {/* ─── Overall Progress ─────────────────────────────────── */}
        {overall && (
          <div
            className="bg-white border-2 border-pencil p-4 sm:p-5 shadow-hard-sm mb-6"
            style={{ borderRadius: WOBBLY_RADII.md }}
          >
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base sm:text-lg font-bold text-pencil font-marker flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" strokeWidth={3} />
                Overall Progress
              </h2>
              <span className="text-xs font-hand text-pencil/50">
                {overall.completed} / {totalLessons} lessons
              </span>
            </div>
            <div className="w-full h-4 bg-gray-100 border border-pencil/10 rounded-full overflow-hidden mb-2">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${totalLessons > 0 ? (overall.completed / totalLessons) * 100 : 0}%`,
                  background:
                    overall.completed === totalLessons
                      ? `linear-gradient(90deg, ${CSS.colors.green}, #8bc34a)`
                      : `linear-gradient(90deg, ${CSS.colors.blue}, ${CSS.colors.teal})`,
                }}
              />
            </div>
            <div className="mt-3 pt-3 border-t border-pencil/10">
              <div className="flex items-center justify-between text-xs font-hand text-pencil/50 mb-1">
                <span className="flex items-center gap-1">
                  <Star className="w-3 h-3" strokeWidth={2.5} />
                  {xpInfo.current}
                </span>
                <span>{totalXp} / {totalXpPossible} XP</span>
                {xpInfo.next && <span className="text-pencil/40">{xpInfo.next}</span>}
              </div>
              <div className="w-full h-2 bg-gray-100 border border-pencil/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${xpInfo.progress}%`,
                    background: "linear-gradient(90deg, #f59e0b, #f97316)",
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {!overall && (
          <div
            className="bg-postit border-2 border-pencil p-5 shadow-hard-sm mb-6 text-center"
            style={{ borderRadius: WOBBLY_RADII.md }}
          >
            <p className="text-base text-pencil/60 font-hand">
              Start your first lesson to see progress!
            </p>
          </div>
        )}

        {/* ─── Quick Stats Dashboard ────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8 sm:mb-10">
          {[
            {
              value: `${levelsCompleted} / ${LEVELS.length}`,
              label: "Levels",
              icon: <BookOpen className="w-5 h-5 text-blue-pen" strokeWidth={3} />,
            },
            {
              value: `${overall?.completed || 0} / ${totalLessons}`,
              label: "Lessons Completed",
              icon: <CheckCircle2 className="w-5 h-5 text-green-600" strokeWidth={3} />,
            },
            {
              value: overall ? overall.avgWpm.toFixed(1) : "0",
              label: "Avg WPM",
              icon: <Gauge className="w-5 h-5 text-purple-500" strokeWidth={3} />,
            },
            {
              value: overall ? `${overall.avgAccuracy.toFixed(1)}%` : "0%",
              label: "Avg Accuracy",
              icon: <Target className="w-5 h-5 text-orange-500" strokeWidth={3} />,
            },
          ].map((stat, idx) => (
            <div
              key={stat.label}
              className="bg-white border-2 border-pencil shadow-hard-sm p-3 sm:p-4 text-center hover:shadow-hard transition-all"
              style={{
                borderRadius: WOBBLY_RADII.md,
                transform: `rotate(${idx % 2 === 0 ? "-0.5" : "0.5"}deg)`,
              }}
            >
              <div className="flex justify-center mb-1.5">{stat.icon}</div>
              <div className="text-xl sm:text-2xl font-bold text-pencil font-marker">{stat.value}</div>
              <div className="text-xs text-pencil/60 font-hand mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        {/*
        <DailyFocus
          weakestKeys={weakestKeys}
          streak={streak}
          todayMinutes={todayMinutes}
          onStartDrill={(key) => {
            if (key === "quick") {
              const next = findNextIncompleteLessonId(progress);
              if (next) handleStartLesson(next);
            }
          }}
        />
        */}
 
        {/* ─── Keyboard Guide Section ──────────────────────────── */}
        {/*
        <div
          className="bg-white border-2 border-pencil shadow-hard-sm mb-6 overflow-hidden"
          style={{ borderRadius: WOBBLY_RADII.md }}
        >
          <details className="group" open>
            <summary className="flex items-center justify-between p-4 cursor-pointer list-none">
              <div className="flex items-center gap-2">
                <Keyboard className="w-5 h-5 text-pencil" strokeWidth={3} />
                <h2 className="text-lg font-bold text-pencil font-marker">Keyboard Guide</h2>
              </div>
              <ChevronDown
                className="w-5 h-5 text-pencil/40 transition-transform group-open:rotate-180"
                strokeWidth={3}
              />
            </summary>

            <div className="px-4 pb-4">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => {
                    setFingerQuizMode(!fingerQuizMode);
                    if (!fingerQuizMode) {
                      setQuizKey(null);
                      setQuizScore({ correct: 0, total: 0 });
                      setQuizFeedback(null);
                    }
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 border-2 text-sm font-hand transition-all ${
                    fingerQuizMode
                      ? "bg-blue-pen text-white border-blue-pen"
                      : "bg-paper text-pencil border-pencil hover:shadow-hard-sm"
                  }`}
                  style={{ borderRadius: WOBBLY_RADII.sm }}
                >
                  {fingerQuizMode ? <EyeOff className="w-4 h-4" strokeWidth={3} /> : <Eye className="w-4 h-4" strokeWidth={3} />}
                  {fingerQuizMode ? "Quiz Mode On" : "Which Finger?"}
                </button>

                {fingerQuizMode && quizScore.total > 0 && (
                  <span className="text-xs font-hand text-pencil/50">
                    Score: {quizScore.correct}/{quizScore.total} (
                    {quizScore.total > 0 ? ((quizScore.correct / quizScore.total) * 100).toFixed(0) : 0}%)
                  </span>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <KeyboardSVG showLegend={true} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FingerLegend
                    activeZone={selectedFinger}
                    onZoneHover={setSelectedFinger}
                    onZoneClick={handleFingerClick}
                  />

                  {fingerQuizMode && quizKey && (
                    <div
                      className="p-3 bg-paper border-2 border-pencil shadow-hard-sm"
                      style={{ borderRadius: WOBBLY_RADII.sm }}
                    >
                      <div className="text-xs font-marker text-pencil/40 uppercase tracking-wider mb-2">
                        Which finger presses?
                      </div>
                      <div className="text-center mb-3">
                        <kbd className="inline-flex items-center justify-center w-12 h-12 bg-white border-2 border-pencil text-xl font-mono font-bold text-pencil shadow-hard-sm">
                          {quizKey === " " ? "␣" : quizKey.toUpperCase()}
                        </kbd>
                      </div>
                      {quizFeedback && (
                        <div
                          className={`text-center text-xs font-hand mb-2 ${
                            quizFeedback === "correct" ? "text-green-600" : "text-red-500"
                          }`}
                        >
                          {quizFeedback === "correct" ? "✓ Correct!" : "✗ Nope!"}
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-1.5">
                        {FINGER_LABELS.map((zone) => {
                          const color =
                            zone === "lp" ? "#ff6b6b" :
                            zone === "lr" ? "#ffa94d" :
                            zone === "lm" ? "#ffd43b" :
                            zone === "li" ? "#69db7c" :
                            zone === "ri" ? "#4dabf7" :
                            zone === "rm" ? "#9775fa" :
                            zone === "rr" ? "#f783ac" : "#adb5bd";
                          const name =
                            zone === "lp" ? "L Pinky" :
                            zone === "lr" ? "L Ring" :
                            zone === "lm" ? "L Middle" :
                            zone === "li" ? "L Index" :
                            zone === "ri" ? "R Index" :
                            zone === "rm" ? "R Middle" :
                            zone === "rr" ? "R Ring" : "R Pinky";
                          return (
                            <button
                              key={zone}
                              onClick={() => handleQuizAnswer(zone)}
                              disabled={quizFeedback !== null}
                              className="flex items-center gap-1.5 text-[10px] font-hand text-pencil border border-pencil/20 hover:bg-pencil/5 hover:border-pencil/40 py-1 px-1.5 rounded transition-colors disabled:opacity-40"
                              style={{ borderRadius: WOBBLY_RADII.sm }}
                            >
                              <span className="inline-block w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                              {name}
                            </button>
                          );
                        })}
                      </div>
                      <button
                        onClick={pickRandomKey}
                        className="mt-2 w-full text-xs font-hand text-pencil/40 hover:text-pencil border border-pencil/10 hover:border-pencil/30 py-1 rounded transition-colors"
                        style={{ borderRadius: WOBBLY_RADII.sm }}
                      >
                        <RefreshCw className="w-3 h-3 inline mr-1" />
                        Skip
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </details>
        </div>
        */}
 
        {/* ─── Curriculum Timeline ─────────────────────────────── */}
        <CurriculumTimeline
          levels={LEVELS}
          progress={progress}
          activeLevelId={activeLevelId}
          onToggleLevel={setActiveLevelId}
          onStartLesson={handleStartLesson}
        />

        {/* ─── Key Heatmap Section ──────────────────────────────── */}
        <div className="mb-6">
          <KeyHeatmap
            accuracyData={keyHeatmapData}
            onKeyClick={handleKeyHeatmapClick}
          />
        </div>

        {/* ─── Timeline Chart ──────────────────────────────────── */}
        {timeline.length >= 2 && (
          <div
            className="bg-white border-2 border-pencil p-4 sm:p-5 shadow-hard-sm mb-6"
            style={{ borderRadius: WOBBLY_RADII.md }}
          >
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-pencil" strokeWidth={3} />
              <h2 className="text-lg font-bold text-pencil font-marker">WPM Progression</h2>
              <span className="text-xs font-hand text-pencil/40">({timeline.length} entries)</span>
            </div>
            <div className="flex items-end gap-1 h-24 sm:h-28">
              {timeline.map((t, i) => {
                const maxWpm = Math.max(...timeline.map((x) => x.wpm), 1);
                const h = Math.max(6, (t.wpm / maxWpm) * (timeline.length >= 15 ? 80 : 88));
                return (
                  <div key={t.lessonId} className="flex-1 flex flex-col items-center gap-0.5 group relative">
                    <div
                      className="absolute bottom-full mb-1 hidden group-hover:block bg-white border border-pencil/30 text-xs font-hand text-pencil px-2 py-1 whitespace-nowrap z-10 shadow-hard-sm"
                      style={{ borderRadius: WOBBLY_RADII.sm }}
                    >
                      {t.wpm.toFixed(1)} WPM — {t.lessonId}
                    </div>
                    <div
                      className="w-full rounded-t transition-all duration-300 cursor-pointer"
                      style={{
                        height: `${h}px`,
                        background: t.qualified ? CSS.colors.green : CSS.colors.orange,
                      }}
                    />
                    {timeline.length <= 20 && (
                      <div className="text-[7px] sm:text-[8px] text-pencil/30 font-hand leading-none mt-0.5">
                        {i + 1}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-2 text-center text-[10px] font-hand text-pencil/30">
              Earlier &mdash; Later
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
