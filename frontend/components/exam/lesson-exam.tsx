'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTypingEngine } from '@/hooks/use-typing-engine';
import { useTypingStore } from '@/store/typing-store';
import { useAuthStore } from '@/store/auth-store';
import { formatTime, calculateWPM, calculateAccuracy, getModeDisplayName, normalizeCase } from '@/lib/utils';
import { saveTestResult } from '@/lib/test-storage';
import { api } from '@/lib/api';
import { TypingDisplay } from './typing-display';
import { Lesson } from '@/lib/typing-curriculum';
import KeyboardSVG from '@/components/learn/keyboard-svg';
import MouseSVG from '@/components/learn/mouse-svg';
import HindiKeyboardGuide from '@/components/learn/hindi-keyboard-guide';
import {
  Timer, Target, CheckCircle2, XCircle, RotateCcw,
  BarChart3, Keyboard, GraduationCap, ArrowLeft, MousePointer2,
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
  const { typedContent, originalContent, elapsedSeconds } = useTypingEngine();
  const [phase, setPhase] = useState<'ready' | 'countdown' | 'typing' | 'result'>('ready');
  const [countdown, setCountdown] = useState(3);
  const [result, setResult] = useState<any>(null);
  const [showKeyboard, setShowKeyboard] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const isMouseLesson = lesson.targetWpm === 0 && lesson.keys.some(k => k.includes('click') || k.includes('scroll'));
  const sampleText = normalizeCase(lesson.sampleText);

  const [mouseActions, setMouseActions] = useState<Set<string>>(new Set());
  const [mouseStep, setMouseStep] = useState(0);

  useEffect(() => {
    store.startTest('lesson', 'practice' as any, sampleText, lesson.durationSec);
  }, []);

  useEffect(() => {
    if (store.isComplete && phase === 'typing' && !isMouseLesson) finishLesson();
  }, [store.isComplete, phase]);

  const finishLesson = useCallback(async (extra?: { wpm?: number; acc?: number }) => {
    const correctChars = typedContent.split('').filter((c, i) => c === originalContent[i]).length;
    const totalType = typedContent.length;
    const finalWpm = extra?.wpm ?? (totalType > 0 ? calculateWPM(totalType, elapsedSeconds) : 0);
    const finalAcc = extra?.acc ?? (totalType > 0 ? calculateAccuracy(correctChars, totalType) : 100);
    const qualified = finalWpm >= lesson.targetWpm && finalAcc >= lesson.minAccuracy;
    const earnedXp = qualified ? lesson.xpReward : Math.round(lesson.xpReward * 0.25);
    const finalResult = {
      net_wpm: finalWpm,
      accuracy: finalAcc,
      total_errors: totalType - correctChars,
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
      total_errors: totalType - correctChars,
      key_depression_count: totalType,
      xp_earned: earnedXp,
    });

    if (authStore.isAuthenticated && authStore.user) {
      try {
        const newXp = (authStore.user.xp || 0) + earnedXp;
        const newLevel = Math.floor(newXp / 100) + 1;
        await api.updateProfile({ xp: newXp, level: newLevel });
        authStore.updateUser({ xp: newXp, level: newLevel });
      } catch {}
    }

    setPhase('result');
  }, [typedContent, originalContent, elapsedSeconds, lesson, authStore]);

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

  const lessonKeys = lesson.keys || [];

  if (phase === 'ready') {
    const isHindi = lessonKeys.some(k => k.includes('hindi') || k === 'hi' || lesson.id.includes('hindi'));
    return (
      <div className="min-h-screen bg-paper">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <button onClick={() => router.push('/learn')} className="flex items-center space-x-2 text-pencil/50 hover:text-pencil font-hand mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" strokeWidth={3} /> Back to Lessons
          </button>

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-postit border-2 border-pencil mb-4"
                 style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}>
              {isMouseLesson
                ? <MousePointer2 className="w-8 h-8 text-pencil" strokeWidth={3} />
                : <GraduationCap className="w-8 h-8 text-pencil" strokeWidth={3} />}
            </div>
            <h1 className="text-3xl font-bold text-pencil font-marker">{lesson.title}</h1>
            <p className="text-lg text-pencil/60 font-hand mt-2">{levelName}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-postit border-2 border-pencil p-6 shadow-hard-sm"
                 style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}>
              <h3 className="font-bold text-pencil font-marker mb-2">Instruction</h3>
              <p className="text-pencil/80 font-hand text-base leading-relaxed">{lesson.instruction}</p>
            </div>
            <div className="bg-white border-2 border-pencil p-4 shadow-hard-sm"
                 style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-pencil/40 font-hand uppercase tracking-wider">Lesson Info</span>
              </div>
              <div className="space-y-2">
                {!isMouseLesson && (
                  <>
                    <div className="flex items-center justify-between text-sm font-hand">
                      <span className="text-pencil/60">Target Speed</span>
                      <span className="font-bold text-pencil">{lesson.targetWpm} WPM</span>
                    </div>
                    <div className="flex items-center justify-between text-sm font-hand">
                      <span className="text-pencil/60">Min Accuracy</span>
                      <span className="font-bold text-pencil">{lesson.minAccuracy}%</span>
                    </div>
                  </>
                )}
                <div className="flex items-center justify-between text-sm font-hand">
                  <span className="text-pencil/60">Duration</span>
                  <span className="font-bold text-pencil">{Math.round(lesson.durationSec / 60)} min</span>
                </div>
                <div className="flex items-center justify-between text-sm font-hand">
                  <span className="text-pencil/60">XP Reward</span>
                  <span className="font-bold text-green-600">+{lesson.xpReward} XP</span>
                </div>
              </div>
            </div>
          </div>

          {!isMouseLesson && (
            <div className="bg-white border-2 border-pencil p-6 mb-6 shadow-hard-sm"
                 style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}>
              <div className="text-xs text-pencil/40 font-hand mb-3 uppercase tracking-wider">Practice Text Preview</div>
              <p className="font-mono text-sm leading-relaxed text-pencil/70 select-none">
                {sampleText.substring(0, 200)}{sampleText.length > 200 ? '...' : ''}
              </p>
            </div>
          )}

          {isHindi && <div className="mb-6"><HindiKeyboardGuide /></div>}

          <button onClick={startLesson} className="btn-hand w-full max-w-md mx-auto block text-center text-lg py-4">
            {isMouseLesson ? 'Start Mouse Practice' : 'Start Lesson'}
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'countdown') {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-paper">
        <div className="text-center">
          <div className="text-8xl font-bold text-pencil font-marker animate-pulse">{countdown}</div>
          <p className="mt-4 text-2xl text-pencil/60 font-hand">Get ready...</p>
        </div>
      </div>
    );
  }

  if (phase === 'result' && result) {
    const passed = result.net_wpm >= result.goal_wpm && result.accuracy >= result.goal_acc;
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center p-4">
        <div className="max-w-lg w-full card-hand-lg p-8 -rotate-[0.5deg] hover:rotate-0 transition-transform">
          <div className="text-center mb-8">
            <div className={`inline-flex items-center justify-center w-20 h-20 border-[3px] border-pencil mb-4 ${passed ? 'bg-postit' : 'bg-red-50'}`}
                 style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}>
              {passed
                ? <CheckCircle2 className="w-10 h-10 text-green-600" strokeWidth={3} />
                : <XCircle className="w-10 h-10 text-accent" strokeWidth={3} />}
            </div>
            <h2 className="text-2xl font-bold text-pencil font-marker">{passed ? 'Lesson Passed!' : 'Keep Practicing'}</h2>
            <p className="mt-1 text-base text-pencil/60 font-hand">{lesson.title}</p>
          </div>

          <div className={`grid ${isMouseLesson ? 'grid-cols-1' : 'grid-cols-3'} gap-3 mb-6`}>
            {!isMouseLesson && (
              <div className="text-center p-3 border-2 border-pencil bg-postit"
                   style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}>
                <div className="text-3xl font-bold text-pencil font-marker">{result.net_wpm.toFixed(1)}</div>
                <div className="text-sm text-pencil/60 font-hand">WPM (goal: {result.goal_wpm})</div>
              </div>
            )}
            {!isMouseLesson && (
              <div className="text-center p-3 border-2 border-pencil bg-green-50"
                   style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}>
                <div className="text-3xl font-bold text-pencil font-marker">{result.accuracy.toFixed(1)}%</div>
                <div className="text-sm text-pencil/60 font-hand">Accuracy (goal: {result.goal_acc}%)</div>
              </div>
            )}
            <div className="text-center p-3 border-2 border-pencil bg-yellow-50"
                 style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}>
              <div className="text-3xl font-bold text-green-600 font-marker">+{result.xp_earned}</div>
              <div className="text-sm text-pencil/60 font-hand">XP Earned</div>
            </div>
          </div>

          <div className="flex space-x-4">
            <button onClick={() => window.location.reload()} className="btn-hand flex-1">
              <RotateCcw className="w-4 h-4 mr-2" strokeWidth={3} /> Retry
            </button>
            <button onClick={() => router.push('/learn')} className="btn-hand-secondary flex-1">
              <BarChart3 className="w-4 h-4 mr-2" strokeWidth={3} /> All Lessons
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===== MOUSE PRACTICE MODE =====
  if (isMouseLesson) {
    return (
      <div className="min-h-screen bg-paper">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => store.completeTest()} className="text-sm font-hand text-pencil/40 hover:text-pencil flex items-center space-x-1 transition-colors">
              <ArrowLeft className="w-4 h-4" strokeWidth={3} /> Exit
            </button>
            <div className="text-sm font-hand text-pencil/40">{levelName} &mdash; {lesson.title}</div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-postit border-2 border-pencil p-6 shadow-hard-sm"
                 style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}>
              <h3 className="font-bold text-pencil font-marker mb-3 text-lg">Mouse Practice</h3>
              <div className="space-y-3">
                {MOUSE_STEPS.map((step, i) => {
                  const done = mouseActions.has(step.action);
                  const active = mouseStep === i;
                  return (
                    <div key={step.action}
                      className={`flex items-center space-x-3 p-3 border-2 transition-all ${
                        done ? 'bg-green-50 border-green-300' :
                        active ? 'bg-blue-50 border-blue-pen animate-pulse' :
                        'bg-white border-pencil/20'
                      }`}
                      style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
                    >
                      <div className={`w-8 h-8 flex items-center justify-center rounded-full border-2 text-sm font-bold font-marker ${
                        done ? 'bg-green-500 text-white border-green-500' :
                        active ? 'bg-blue-pen text-white border-blue-pen' :
                        'bg-pencil/5 text-pencil/40 border-pencil/30'
                      }`}>
                        {done ? '✓' : i + 1}
                      </div>
                      <div>
                        <p className={`font-hand text-base ${done ? 'text-green-700 line-through' : active ? 'text-pencil font-bold' : 'text-pencil/50'}`}>
                          {step.label}
                        </p>
                        {active && <p className="text-xs text-blue-pen/70 font-hand">Abhi karein...</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <MouseSVG pressedKeys={Array.from(mouseActions)} />
            </div>
          </div>

          <div className="mt-6 text-center text-sm font-hand text-pencil/40">
            {mouseStep >= MOUSE_STEPS.length ? 'Practice complete! ✅' : `${mouseStep} / ${MOUSE_STEPS.length} steps done`}
          </div>
        </div>
      </div>
    );
  }

  // ===== TYPING MODE =====
  const correctChars = typedContent.split('').filter((c, i) => c === originalContent[i]).length;
  const totalChars = typedContent.length;
  const currentWpm = elapsedSeconds > 0 ? calculateWPM(totalChars, elapsedSeconds) : 0;
  const currentAccuracy = totalChars > 0 ? calculateAccuracy(correctChars, totalChars) : 100;
  const remainingTime = Math.max(0, lesson.durationSec - elapsedSeconds);
  const nextChar = originalContent[typedContent.length] || null;
  const keysPreview = typedContent.split('').slice(-50);
  const isHindi = false;

  return (
    <div className="min-h-screen bg-paper">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => store.completeTest()} className="text-sm font-hand text-pencil/40 hover:text-pencil flex items-center space-x-1 transition-colors">
            <ArrowLeft className="w-4 h-4" strokeWidth={3} /> Exit
          </button>
          <div className="text-sm font-hand text-pencil/40">{levelName} &mdash; {lesson.title}</div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowKeyboard(!showKeyboard)}
              className={`flex items-center space-x-1 px-3 py-1.5 border-2 border-pencil/30 text-sm font-hand transition-colors ${
                showKeyboard ? 'bg-pencil/10 text-pencil' : 'text-pencil/40 hover:text-pencil'
              }`}
              style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
            >
              <Keyboard className="w-4 h-4" strokeWidth={3} />
              <span>Keys</span>
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4 text-pencil/60 font-hand text-base">
          <div className="flex items-center space-x-4">
            <span className={`font-bold font-marker text-lg ${currentWpm >= lesson.targetWpm ? 'text-green-600' : ''}`}>
              {currentWpm} <span className="text-sm font-hand font-normal">wpm</span>
            </span>
            <span className={`font-bold font-marker text-lg ${currentAccuracy >= lesson.minAccuracy ? 'text-green-600' : currentAccuracy >= 80 ? 'text-yellow-600' : 'text-red-500'}`}>
              {currentAccuracy}% <span className="text-sm font-hand font-normal">acc</span>
            </span>
            <span className="flex items-center space-x-1 font-mono text-lg">
              <Timer className="w-4 h-4" strokeWidth={3} />
              <span className={remainingTime <= 30 ? 'text-red-500 font-bold' : ''}>{formatTime(remainingTime)}</span>
            </span>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <Target className="w-4 h-4" strokeWidth={3} />
            <span>Goal: {lesson.targetWpm} WPM / {lesson.minAccuracy}% acc</span>
          </div>
        </div>

        <div className={`grid ${showKeyboard ? 'lg:grid-cols-5' : ''} gap-4`}>
          {isHindi && (
            <div className="lg:col-span-5 mb-4">
              <HindiKeyboardGuide />
            </div>
          )}
          <div className={showKeyboard ? 'lg:col-span-3' : 'lg:col-span-5'}>
            <TypingDisplay
              originalContent={originalContent}
              typedContent={typedContent}
              isActive={phase === 'typing'}
            />

            <div className="mt-4 flex items-center justify-between text-sm font-hand text-pencil/40">
              <span>{typedContent.length} / {originalContent.length} chars</span>
              <button onClick={() => store.completeTest()} className="btn-hand-sm">
                Finish Lesson
              </button>
            </div>
          </div>

          {showKeyboard && (
            <div className="lg:col-span-2">
              <KeyboardSVG expectedChar={nextChar} typedHistory={keysPreview} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
