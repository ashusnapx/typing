'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTypingEngine } from '@/hooks/use-typing-engine';
import { useTypingStore } from '@/store/typing-store';
import { useAuthStore } from '@/store/auth-store';
import { formatTime, calculateWPM, calculateAccuracy } from '@/lib/utils';
import { saveTestResult } from '@/lib/test-storage';
import { saveLessonProgress } from '@/lib/lesson-storage';
import { useUpdateProfile } from '@/lib/queries';
import { blastConfetti } from '@/lib/confetti';
import { ROUTES } from '@/lib/config';
import { TypingDisplay } from './typing-display';
import { Lesson, getNextLessonId } from '@/lib/typing-curriculum';
import KeyboardSVG from '@/components/learn/keyboard-svg';

import MouseSVG from '@/components/learn/mouse-svg';
import HindiKeyboardGuide from '@/components/learn/hindi-keyboard-guide';
import { CapsLockNotice } from '@/components/learn/caps-lock-notice';

import {
  Check, CheckCircle2, XCircle, RotateCcw,
  Keyboard, ArrowLeft, ArrowRight,
} from 'lucide-react';

interface LessonExamProps {
  lesson: Lesson;
  levelName: string;
}

type MouseAction = 'left-click' | 'right-click' | 'scroll';

const MOUSE_STEPS: { action: MouseAction; label: string }[] = [
  { action: 'left-click', label: 'Left button dabayein' },
  { action: 'right-click', label: 'Right button dabayein' },
  { action: 'scroll', label: 'Scroll wheel ghumayein' },
];

export function LessonExam({ lesson, levelName }: LessonExamProps) {
  const router = useRouter();
  const store = useTypingStore();
  const authStore = useAuthStore();
  const updateProfileMutation = useUpdateProfile();
  const [backspaceBlocked, setBackspaceBlocked] = useState(false);
  const { typedContent, originalContent, elapsedSeconds, keystrokeEvents, isComplete } = useTypingEngine('english', true, true, lesson.drillType === 'letters');
  const [phase, setPhase] = useState<'ready' | 'countdown' | 'typing' | 'result'>('ready');
  const [countdown, setCountdown] = useState(3);
  const [result, setResult] = useState<any>(null);
  const [showKeyboard, setShowKeyboard] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasCompletedRef = useRef(false);

  useEffect(() => {
    store.setNavHidden(phase === 'typing' || phase === 'countdown');
  }, [phase]);

  const isMouseLesson = lesson.targetWpm === 0 && lesson.keys.some(k => k.includes('click') || k.includes('scroll'));
  // Curriculum text is authored with deliberate casing — the capitalisation
  // drills depend on it exactly. normalizeCase() exists to repair badly-cased
  // imported passages and would flatten "The Reserve Bank of India" to
  // "The reserve bank of india", destroying the very lesson being taught.
  const sampleText = lesson.sampleText
    .replace(/\bSpace\b/g, ' ')
    .replace(/\bEnter\b/g, '\n');

  const [mouseActions, setMouseActions] = useState<Set<string>>(new Set());
  const [mouseStep, setMouseStep] = useState(0);
  const [errorFlash, setErrorFlash] = useState(false);
  const [firstKey, setFirstKey] = useState(false);
  const errorTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (keystrokeEvents.length === 0) return;
    if (!firstKey) setFirstKey(true);
    const lastEvent = keystrokeEvents[keystrokeEvents.length - 1];
    if (lastEvent.is_error) {
      setErrorFlash(true);
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
      errorTimerRef.current = setTimeout(() => setErrorFlash(false), 1500);
    }
  }, [keystrokeEvents, firstKey]);

  useEffect(() => {
    store.startTest('lesson', 'practice' as any, sampleText, lesson.durationSec);
  }, []);

  useEffect(() => {
    if (phase === 'typing') {
      containerRef.current?.focus();
    }
  }, [phase]);

  const finishLesson = useCallback(async (extra?: { wpm?: number; acc?: number }) => {
    const totalType = typedContent.length;
    const finalWpm = extra?.wpm ?? (totalType > 0 ? calculateWPM(totalType, elapsedSeconds) : 0);

    const allEvents = store.keystrokeEvents;
    const errorEvents = allEvents.filter(e => e.is_error).length;
    const nonBackspaceEvents = allEvents.filter(e => !e.is_backspace).length;
    const retrospectiveAcc = nonBackspaceEvents > 0
      ? ((nonBackspaceEvents - errorEvents) / nonBackspaceEvents) * 100
      : 100;
    const finalAcc = extra?.acc ?? (totalType > 0 ? retrospectiveAcc : 100);

    const qualified = finalWpm >= lesson.targetWpm && finalAcc >= lesson.minAccuracy;
    const earnedXp = qualified ? lesson.xpReward : Math.round(lesson.xpReward * 0.25);
    const finalResult = {
      net_wpm: finalWpm,
      accuracy: finalAcc,
      total_errors: errorEvents,
      is_qualified: qualified,
      goal_wpm: lesson.targetWpm,
      goal_acc: lesson.minAccuracy,
      xp_earned: earnedXp,
    };
    setResult(finalResult);
    saveTestResult({
      wpm: finalWpm,
      accuracy: finalAcc,
      mode: 'lesson',
      qualified,
      duration: lesson.durationSec,
      total_errors: errorEvents,
      key_depression_count: totalType,
      xp_earned: earnedXp,
    });
    saveLessonProgress(lesson.id, finalWpm, finalAcc, qualified, keystrokeEvents);

    if (authStore.isAuthenticated && authStore.user) {
      const newXp = (authStore.user.xp || 0) + earnedXp;
      const newLevel = Math.floor(newXp / 100) + 1;
      updateProfileMutation.mutate(
        { xp: newXp, level: newLevel },
        {
          onSuccess: () => {
            authStore.updateUser({ xp: newXp, level: newLevel });
          },
        }
      );
    }

    setPhase('result');
    blastConfetti();
  }, [typedContent, originalContent, elapsedSeconds, lesson, authStore]);

  useEffect(() => {
    if (isComplete && phase === 'typing' && !hasCompletedRef.current) {
      hasCompletedRef.current = true;
      finishLesson();
    }
  }, [isComplete, phase, finishLesson]);

  const startLesson = () => {
    setPhase('countdown');
    let count = 3;
    setCountdown(count);
    const interval = setInterval(() => {
      count--;
      if (count <= 0) { clearInterval(interval); setPhase('typing'); }
      else setCountdown(count);
    }, 1000);
  };

  const handleMouseAction = useCallback((action: string) => {
    setMouseActions(prev => new Set(prev).add(action));
    setMouseStep(prev => Math.min(prev + 1, MOUSE_STEPS.length));
    store.addKeystroke({ key: action, timestamp_ms: Date.now(), duration_ms: 0, is_error: false, is_backspace: false });
    store.updateTypedContent(store.typedContent + ' ');
    if (mouseStep + 1 >= MOUSE_STEPS.length) {
      store.completeTest();
      finishLesson({ wpm: 0, acc: 100 });
    }
  }, [mouseStep, store, finishLesson]);

  useEffect(() => {
    if (!isMouseLesson || phase !== 'typing') return;
    const handleClick = (e: MouseEvent) => {
      if (e.button === 0) handleMouseAction('left-click');
      if (e.button === 2) handleMouseAction('right-click');
    };
    const handleWheel = () => handleMouseAction('scroll');
    const handleContext = (e: MouseEvent) => e.preventDefault();

    window.addEventListener('mousedown', handleClick);
    window.addEventListener('wheel', handleWheel);
    window.addEventListener('contextmenu', handleContext);
    return () => {
      window.removeEventListener('mousedown', handleClick);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('contextmenu', handleContext);
    };
  }, [isMouseLesson, phase, handleMouseAction]);

  // Stage 4 lessons reproduce interfaces where editing is disabled. Blocking
  // the key here (rather than filtering afterwards) is the point of the drill:
  // the learner has to feel that a mistake is permanent.
  useEffect(() => {
    if (!lesson.noBackspace || phase !== 'typing') return;
    let timer: number | undefined;
    const block = (e: KeyboardEvent) => {
      if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        e.stopPropagation();
        setBackspaceBlocked(true);
        window.clearTimeout(timer);
        timer = window.setTimeout(() => setBackspaceBlocked(false), 900);
      }
    };
    window.addEventListener('keydown', block, true);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', block, true);
    };
  }, [lesson.noBackspace, phase]);

  const lessonKeys = lesson.keys || [];

  /* ══════════════════════════════════════════════════════ ready — expressive */
  if (phase === 'ready') {
    const isHindi = lessonKeys.some(k => k.includes('hindi') || k === 'hi' || lesson.id.includes('hindi'));
    const facts = [
      ...(isMouseLesson ? [] : [
        { label: 'Target speed', value: lesson.targetWpm ? `${lesson.targetWpm} WPM` : 'No target' },
        { label: 'Min accuracy', value: `${lesson.minAccuracy}%` },
      ]),
      { label: 'Duration', value: `${Math.round(lesson.durationSec / 60)} min` },
      { label: 'Reward', value: `+${lesson.xpReward} XP` },
    ];

    return (
      <div className="mx-auto w-full max-w-3xl px-5 py-8 sm:px-8 sm:py-12">
        <button onClick={() => router.push(ROUTES.learn)} className="btn btn-ghost btn-sm -ml-3 mb-8">
          <ArrowLeft className="h-4 w-4" strokeWidth={2} />
          All lessons
        </button>

        <p className="eyebrow">{levelName}</p>
        <h1 className="mt-3 text-4xl sm:text-5xl">{lesson.title}</h1>

        {(lesson.noBackspace || lesson.hidePositionHighlight) && (
          <div className="mt-5 flex flex-wrap gap-2">
            {lesson.noBackspace && <span className="chip chip-err">Backspace disabled</span>}
            {lesson.hidePositionHighlight && <span className="chip">No word highlight</span>}
          </div>
        )}

        <p className="mt-6 max-w-prose text-lg leading-relaxed text-vast/70">
          {lesson.instruction}
        </p>

        {/* The Commission's rule, stated before the drill so the learner knows
            what is being trained rather than just what to type. Set as a
            margin note — the teaching voice, not another boxed callout. */}
        {lesson.rule && (
          <div className="mt-8 border-l-2 border-vast pl-5">
            <p className="eyebrow">SSC rule</p>
            <p className="mt-2 max-w-prose text-lg leading-relaxed">{lesson.rule}</p>
          </div>
        )}

        {lesson.trap && (
          <div className="mt-6 border-l-2 border-flare pl-5">
            <p className="eyebrow">The trap</p>
            <p className="mt-2 max-w-prose text-base leading-relaxed text-vast/70">
              {lesson.trap}
            </p>
          </div>
        )}

        <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {facts.map(f => (
            <div key={f.label} className="card-flat px-4 py-3.5">
              <dt className="eyebrow">{f.label}</dt>
              <dd className="tnum mt-1.5 font-display text-2xl leading-none">{f.value}</dd>
            </div>
          ))}
        </dl>

        {!isMouseLesson && (
          <div className="card mt-4 overflow-hidden">
            <div className="border-b-2 border-vast bg-lumen px-4 py-2.5">
              <span className="eyebrow">What you will type</span>
            </div>
            <p className="select-none px-5 py-5 text-lg leading-[1.85] text-vast/60">
              {sampleText.substring(0, 220)}{sampleText.length > 220 ? '…' : ''}
            </p>
          </div>
        )}

        {!isMouseLesson && (
          <div className="mt-4">
            <CapsLockNotice text={sampleText} />
          </div>
        )}

        {isHindi && <div className="mt-4"><HindiKeyboardGuide /></div>}

        <button onClick={startLesson} className="btn btn-primary btn-lg mt-8 w-full">
          {isMouseLesson ? 'Start mouse practice' : 'Start lesson'}
        </button>
        <p className="mt-4 text-center text-base text-vast/50">
          {lesson.psychTip}
        </p>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════ countdown — expressive */
  if (phase === 'countdown') {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-5 text-center">
        <p className="eyebrow">Starting in</p>
        {/* The live region is the stable wrapper — a screen reader only
            announces a change if the region existed beforehand, so the keyed
            (remounted) digit has to sit inside it. */}
        <p role="status" aria-live="assertive" className="mt-4">
          <span
            key={countdown}
            className="tnum animate-rise block font-display text-8xl leading-none"
          >
            {countdown}
          </span>
        </p>
        <p className="mt-8 text-lg text-vast/60">Hands on the home row.</p>
      </div>
    );
  }

  /* ═════════════════════════════════════════════════════ result — expressive */
  if (phase === 'result' && result) {
    const passed = result.net_wpm >= result.goal_wpm && result.accuracy >= result.goal_acc;
    const nextId = getNextLessonId(lesson.id);
    // Say which of the two bars was missed, rather than a generic "keep going".
    const missed = !passed
      ? [
          result.net_wpm < result.goal_wpm
            ? `${(result.goal_wpm - result.net_wpm).toFixed(1)} WPM short of ${result.goal_wpm}`
            : null,
          result.accuracy < result.goal_acc
            ? `${(result.goal_acc - result.accuracy).toFixed(1)} points below ${result.goal_acc}% accuracy`
            : null,
        ].filter(Boolean)
      : [];

    return (
      <div className="mx-auto w-full max-w-xl px-5 py-10 sm:px-8 sm:py-16">
        <div className="animate-rise">
          <span className={`chip ${passed ? 'chip-ok' : 'chip-err'}`}>
            {passed
              ? <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.5} />
              : <XCircle className="h-3.5 w-3.5" strokeWidth={2.5} />}
            {passed ? 'Cleared' : 'Below the bar'}
          </span>

          <h1 className="mt-5 text-4xl sm:text-5xl">
            {passed ? <>Lesson <em>cleared</em></> : <>Not there <em>yet</em></>}
          </h1>
          <p className="mt-3 text-base text-vast/50">{lesson.title}</p>
        </div>

        {missed.length > 0 && (
          <p className="mt-6 text-lg leading-relaxed text-vast/70">
            You were {missed.join(', and ')}.
          </p>
        )}

        <dl className={`mt-8 grid gap-3 ${isMouseLesson ? 'grid-cols-1' : 'grid-cols-3'}`}>
          {!isMouseLesson && (
            <div className="card-flat px-4 py-4">
              <dt className="eyebrow">WPM</dt>
              <dd className="mt-1.5">
                <span className={`tnum font-display text-3xl leading-none ${result.net_wpm >= result.goal_wpm ? 'text-ok' : 'text-err'}`}>
                  {result.net_wpm.toFixed(1)}
                </span>
                <span className="mt-1.5 block text-sm text-vast/50">goal {result.goal_wpm}</span>
              </dd>
            </div>
          )}
          {!isMouseLesson && (
            <div className="card-flat px-4 py-4">
              <dt className="eyebrow">Accuracy</dt>
              <dd className="mt-1.5">
                <span className={`tnum font-display text-3xl leading-none ${result.accuracy >= result.goal_acc ? 'text-ok' : 'text-err'}`}>
                  {result.accuracy.toFixed(1)}%
                </span>
                <span className="mt-1.5 block text-sm text-vast/50">goal {result.goal_acc}%</span>
              </dd>
            </div>
          )}
          <div className="card-flat px-4 py-4">
            <dt className="eyebrow">XP earned</dt>
            <dd className="tnum mt-1.5 font-display text-3xl leading-none">
              +{result.xp_earned}
            </dd>
          </div>
        </dl>

        {lesson.psychTip && (
          <div className="mt-8 border-l-2 border-vast pl-5">
            <p className="max-w-prose text-base leading-relaxed text-vast/70">{lesson.psychTip}</p>
          </div>
        )}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          {passed && nextId ? (
            <button onClick={() => router.push(`${ROUTES.examLesson}/${nextId}`)} className="btn btn-primary btn-lg flex-1">
              Next lesson
              <ArrowRight className="h-4 w-4" strokeWidth={2} />
            </button>
          ) : (
            <button onClick={() => window.location.reload()} className="btn btn-primary btn-lg flex-1">
              <RotateCcw className="h-4 w-4" strokeWidth={2} />
              Try again
            </button>
          )}
          <button onClick={() => router.push(ROUTES.learn)} className="btn btn-outline btn-lg flex-1">
            All lessons
          </button>
        </div>
        {passed && nextId && (
          <button onClick={() => window.location.reload()} className="btn btn-ghost btn-md mt-3 w-full">
            <RotateCcw className="h-4 w-4" strokeWidth={2} />
            Repeat this lesson
          </button>
        )}
      </div>
    );
  }

  /* ═══════════════════════════════════════════ mouse practice — expressive */
  if (isMouseLesson) {
    return (
      <div className="min-h-screen bg-lumen">
        <div className="mx-auto w-full max-w-content px-5 py-6 sm:px-8">
          <div className="mb-8 flex items-center justify-between gap-4">
            <button onClick={() => store.completeTest()} className="btn btn-ghost btn-sm -ml-3">
              <ArrowLeft className="h-4 w-4" strokeWidth={2} />
              Exit
            </button>
            <p className="truncate text-base text-vast/50">
              {levelName} &mdash; {lesson.title}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="card p-6">
              <h2 className="text-3xl">Mouse practice</h2>
              <ol className="mt-6 space-y-3">
                {MOUSE_STEPS.map((step, i) => {
                  const done = mouseActions.has(step.action);
                  const active = mouseStep === i;
                  return (
                    <li
                      key={step.action}
                      aria-current={active ? 'step' : undefined}
                      className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3 transition-colors ${
                        done ? 'border-ok bg-ok-bg' :
                        active ? 'border-vast bg-dawn' :
                        'border-vast/15 bg-lumen'
                      }`}
                    >
                      <span className={`tnum flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold ${
                        done ? 'border-ok bg-ok text-lumen' :
                        active ? 'border-vast bg-lumen' :
                        'border-vast/25 text-vast/40'
                      }`}>
                        {done ? <Check className="h-4 w-4" strokeWidth={3} /> : i + 1}
                      </span>
                      <div className="min-w-0">
                        <p className={`text-base ${done ? 'text-ok line-through' : active ? 'font-semibold' : 'text-vast/50'}`}>
                          {step.label}
                        </p>
                        {active && <p className="mt-0.5 text-sm text-vast/50">Abhi karein</p>}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>

            <div className="card-flat flex items-center justify-center p-4">
              <MouseSVG pressedKeys={Array.from(mouseActions)} />
            </div>
          </div>

          <p className="tnum mt-8 text-center text-base text-vast/50" role="status">
            {mouseStep >= MOUSE_STEPS.length
              ? 'Practice complete.'
              : `${mouseStep} of ${MOUSE_STEPS.length} steps done`}
          </p>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════ typing — focus surface */
  const correctChars = typedContent.split('').filter((c, i) => c === originalContent[i]).length;
  const totalChars = typedContent.length;
  const currentWpm = elapsedSeconds > 0 ? calculateWPM(totalChars, elapsedSeconds) : 0;
  const currentAccuracy = totalChars > 0 ? calculateAccuracy(correctChars, totalChars) : 100;
  const remainingTime = Math.max(0, lesson.durationSec - elapsedSeconds);
  const nextChar = originalContent[typedContent.length] || null;
  const keysPreview = typedContent.split('').slice(-50);
  const isHindi = false;
  const progressPct = originalContent.length
    ? Math.min(100, (typedContent.length / originalContent.length) * 100)
    : 0;

  return (
    <div
      ref={containerRef}
      tabIndex={-1}
      className="flex h-screen flex-col overflow-hidden bg-lumen focus:outline-none"
    >
      {/* ---- chrome ---- */}
      {/* Hairline borders, no slabs: nothing here should compete with the
          passage the candidate is reading. */}
      <header className="shrink-0 border-b border-vast/10">
        <div className="mx-auto flex w-full max-w-5xl items-center gap-4 px-5 py-2.5">
          <button
            onClick={() => router.push(ROUTES.learn)}
            className="btn btn-ghost btn-sm -ml-3"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2} />
            Exit
          </button>
          <div className="min-w-0 flex-1 text-center">
            <p className="truncate text-sm font-medium">{lesson.title}</p>
            <p className="truncate text-xs text-vast/50">{levelName}</p>
          </div>
          <button
            onClick={() => setShowKeyboard(!showKeyboard)}
            aria-pressed={showKeyboard}
            className={`btn btn-sm ${showKeyboard ? 'btn-cream' : 'btn-ghost'}`}
          >
            <Keyboard className="h-4 w-4" strokeWidth={2} />
            <span className="hidden sm:inline">Keys</span>
          </button>
        </div>

        {/* Progress through the drill text. */}
        <div
          className="h-0.5 w-full bg-lumen-dark"
          role="progressbar"
          aria-label="Drill progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progressPct)}
        >
          <div
            className="h-full bg-vast transition-[width] duration-200"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </header>

      {/* ---- live metrics ---- */}
      <div className="shrink-0 border-b border-vast/10">
        <div className="mx-auto flex w-full max-w-5xl items-baseline gap-6 px-5 py-2">
          <span className="flex items-baseline gap-1.5">
            <span className={`tnum text-lg font-semibold ${currentWpm >= lesson.targetWpm && lesson.targetWpm > 0 ? 'text-ok' : ''}`}>
              {currentWpm}
            </span>
            <span className="text-xs text-vast/50">wpm</span>
          </span>
          <span className="flex items-baseline gap-1.5">
            <span className={`tnum text-lg font-semibold ${
              currentAccuracy >= lesson.minAccuracy ? 'text-ok' : currentAccuracy >= 80 ? 'text-warn' : 'text-err'
            }`}>
              {currentAccuracy}%
            </span>
            <span className="text-xs text-vast/50">acc</span>
          </span>
          <span className="ml-auto flex items-baseline gap-1.5">
            <span className={`tnum text-lg font-semibold ${remainingTime <= 30 ? 'text-err' : ''}`}>
              {formatTime(remainingTime)}
            </span>
            <span className="text-xs text-vast/50">left</span>
          </span>
          <span className="tnum hidden text-xs text-vast/50 sm:inline">
            goal {lesson.targetWpm} wpm · {lesson.minAccuracy}%
          </span>
        </div>
      </div>

      {/* A blocked backspace has to be felt, not silently swallowed. */}
      {backspaceBlocked && (
        <div
          role="status"
          className="animate-rise mx-auto mt-3 flex w-full max-w-5xl items-center gap-2 rounded-lg border-2 border-err/30 bg-err-bg px-4 py-2 text-sm text-err"
        >
          <XCircle className="h-4 w-4 shrink-0" strokeWidth={2} />
          Backspace is disabled in this lesson — keep going.
        </div>
      )}

      {/* ---- the drill ---- */}
      <div className="mx-auto flex w-full max-w-5xl flex-[2] flex-col overflow-hidden px-5 pb-1 pt-4">
        {isHindi && <HindiKeyboardGuide />}
        <TypingDisplay
          originalContent={originalContent}
          typedContent={typedContent}
          isActive={phase === 'typing'}
        />
        <p className="tnum mt-2 shrink-0 text-xs text-vast/40">
          {typedContent.length} / {originalContent.length} characters
        </p>
      </div>

      <div className="mx-auto flex w-full max-w-5xl flex-[3] flex-col overflow-hidden px-5 pb-4">
        <div className="mb-1 shrink-0">
          <CapsLockNotice text={sampleText} compact />
        </div>
        {showKeyboard ? (
          <div className="flex min-h-0 flex-1 items-center justify-center">
            <div className="h-full w-full max-w-4xl">
              <KeyboardSVG
                expectedChar={nextChar}
                typedHistory={keysPreview}
                keystrokeEvents={keystrokeEvents}
                showLegend={false}
              />
            </div>
          </div>
        ) : (
          <div className="min-h-0 flex-1" />
        )}
      </div>
    </div>
  );
}
