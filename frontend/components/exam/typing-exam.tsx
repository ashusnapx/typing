'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { supabase, getRandomPassage } from '@/lib/supabase';
import { useTypingStore } from '@/store/typing-store';
import { useAuthStore } from '@/store/auth-store';
import { useTypingEngine } from '@/hooks/use-typing-engine';
import { formatTime, calculateWPM, calculateAccuracy, getModeDisplayName } from '@/lib/utils';
import { saveTestResult } from '@/lib/test-storage';
import { TestMode } from '@/types';
import { LoadingLogo } from '@/components/ui/loading-logo';
import { TypingDisplay } from './typing-display';
import {
  Timer,
  Target,
  CheckCircle2,
  XCircle,
  RotateCcw,
  BarChart3,
} from 'lucide-react';

const wobbly = { borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' };

interface TypingExamProps {
  mode: TestMode;
  durationSeconds: number;
  wpmTarget?: number;
  lang?: 'english' | 'hindi';
  isTCSReplica?: boolean;
}

export function TypingExam({ mode, durationSeconds, wpmTarget, lang = 'english', isTCSReplica = false }: TypingExamProps) {
  const router = useRouter();
  const { user, isLoading: authLoading, loadUser } = useAuthStore();
  const store = useTypingStore();
  const { typedContent, originalContent, elapsedSeconds } = useTypingEngine();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<any>(null);
  const [showResult, setShowResult] = useState(false);
  const [passage, setPassage] = useState<any>(null);
  const [countdown, setCountdown] = useState(3);
  const [phase, setPhase] = useState<'loading' | 'countdown' | 'typing' | 'submitting' | 'result'>('loading');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const waitAndInit = async () => {
      if (authLoading) return;
      initTest();
    };
    waitAndInit();
  }, [authLoading]);

  useEffect(() => {
    if (store.isComplete && !showResult) submitTest();
  }, [store.isComplete]);

  const initTest = async () => {
    try {
      const category = mode === 'ssc_chsl' ? 'ssc_chsl' : mode === 'ssc_cgl_dest' ? 'ssc_cgl' : undefined;
      const passageData = await getRandomPassage(category, undefined, lang);
      setPassage(passageData);
      const fallbackContent = passageData?.content || 'Sample passage for typing practice.';

      if (user && passageData) {
        let started = false;
        for (let attempt = 0; attempt < 2 && !started; attempt++) {
          try {
            const test = await api.startTest(mode, passageData.id, durationSeconds);
            store.startTest(test.test_id, mode, passageData.content, durationSeconds);
            started = true;
          } catch {
            if (attempt === 0) await new Promise(r => setTimeout(r, 500));
          }
        }
        if (!started) {
          store.startTest('local', mode, fallbackContent, durationSeconds);
        }
      } else {
        store.startTest('local', mode, fallbackContent, durationSeconds);
      }

      setLoading(false);
      startCountdown();
    } catch {
      setLoading(false);
      store.startTest('local', mode, 'Sample passage for typing practice.', durationSeconds);
      startCountdown();
    }
  };

  const startCountdown = () => {
    setPhase('countdown');
    let count = 3;
    setCountdown(count);
    const interval = setInterval(() => {
      count--;
      if (count <= 0) { clearInterval(interval); startTyping(); }
      else setCountdown(count);
    }, 1000);
  };

  const startTyping = () => {
    setPhase('typing');
  };

  const submitTest = async () => {
    if (phase === 'submitting') return;
    setPhase('submitting');
    setShowResult(true);
    try {
      const resultData = await api.submitTest(
        store.testId || 'local', store.typedContent, store.keystrokeEvents, store.elapsedSeconds
      );
      setResult(resultData);
      saveTestResult({
        wpm: resultData.net_wpm || 0,
        accuracy: resultData.accuracy || 0,
        mode,
        qualified: !!resultData.is_qualified,
        duration: durationSeconds,
        gross_wpm: resultData.gross_wpm,
        total_errors: resultData.total_errors,
        key_depression_count: resultData.key_depression_count,
        backspace_count: resultData.backspace_count,
      });
      loadUser();
      setPhase('result');
      return;
    } catch {
      // Fall back to direct-submit if two-step flow failed
    }

    if (store.testId === 'local' && passage && user) {
      try {
        const resultData = await api.directSubmit(
          mode, passage.id, durationSeconds, store.typedContent, store.keystrokeEvents, store.elapsedSeconds
        );
        setResult(resultData);
        saveTestResult({
          wpm: resultData.net_wpm || 0,
          accuracy: resultData.accuracy || 0,
          mode,
          qualified: !!resultData.is_qualified,
          duration: durationSeconds,
          gross_wpm: resultData.gross_wpm,
          total_errors: resultData.total_errors,
          key_depression_count: resultData.key_depression_count,
          backspace_count: resultData.backspace_count,
        });
        loadUser();
        setPhase('result');
        return;
      } catch {
        // Fall through to client-side result
      }
    }

    const clientResult = {
      net_wpm: store.wpm,
      accuracy: store.accuracy,
      gross_wpm: calculateWPM(store.typedContent.length, store.elapsedSeconds),
      key_depression_count: store.typedContent.length,
      total_errors: store.errors,
      backspace_count: store.backspaces,
      is_qualified: store.wpm >= (wpmTarget || 35) && store.accuracy >= 95,
    };
    setResult(clientResult);
    saveTestResult({
      wpm: store.wpm,
      accuracy: store.accuracy,
      mode,
      qualified: store.wpm >= (wpmTarget || 35) && store.accuracy >= 95,
      duration: durationSeconds,
      gross_wpm: clientResult.gross_wpm,
      total_errors: store.errors,
      key_depression_count: store.typedContent.length,
      backspace_count: store.backspaces,
    });
    setPhase('result');
  };

  if (isTCSReplica) {
    return <TCSReplicaUI passage={passage} mode={mode} durationSeconds={durationSeconds} />;
  }

  if (phase === 'loading') {
    return <LoadingLogo />;
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
    return <ResultScreen result={result} mode={mode} wpmTarget={wpmTarget} router={router} />;
  }

  const correctChars = typedContent.split('').filter((c, i) => c === originalContent[i]).length;
  const totalChars = typedContent.length;
  const currentWpm = elapsedSeconds > 0 ? calculateWPM(totalChars, elapsedSeconds) : 0;
  const currentAccuracy = totalChars > 0 ? calculateAccuracy(correctChars, totalChars) : 100;
  const errors = totalChars - correctChars;
  const remainingTime = Math.max(0, durationSeconds - elapsedSeconds);

  return (
    <div className="min-h-screen bg-paper" onClick={() => containerRef.current?.focus()} ref={containerRef}>
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Stats Header - Monkeytype style */}
        <div className="flex items-center justify-between mb-6 text-pencil/60 font-hand text-base">
          <div className="flex items-center space-x-6">
            <span className="font-bold text-pencil font-marker text-lg">{getModeDisplayName(mode)}</span>
            {wpmTarget && (
              <span className="flex items-center space-x-1">
                <Target className="w-4 h-4" strokeWidth={3} />
                <span>{wpmTarget} WPM</span>
              </span>
            )}
          </div>
          <div className="flex items-center space-x-6">
            <span className={currentWpm >= (wpmTarget || 0) ? 'text-green-600' : ''}>
              <strong className="text-xl font-marker">{currentWpm}</strong>
              <span className="ml-1 text-sm">wpm</span>
            </span>
            <span className={currentAccuracy >= 95 ? 'text-green-600' : currentAccuracy >= 80 ? 'text-yellow-600' : 'text-red-500'}>
              <strong className="text-xl font-marker">{currentAccuracy}%</strong>
              <span className="ml-1 text-sm">acc</span>
            </span>
            <span className="flex items-center space-x-1 font-mono text-lg">
              <Timer className="w-4 h-4" strokeWidth={3} />
              <span className={remainingTime <= 30 ? 'text-red-500 font-bold' : ''}>
                {formatTime(remainingTime)}
              </span>
            </span>
          </div>
        </div>

        {/* Monkeytype-style Word Display */}
        <TypingDisplay
          originalContent={originalContent}
          typedContent={typedContent}
          isActive={phase === 'typing'}
        />

        {/* Progress footer - Monkeytype style */}
        <div className="mt-4 flex items-center justify-between text-sm font-hand text-pencil/40">
          <div className="flex items-center space-x-4">
            <span>{errors > 0 ? `${errors} errors` : 'no errors'}</span>
            <span>{typedContent.length} / {originalContent.length} chars</span>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => store.completeTest()}
              className="px-4 py-2 border-2 border-pencil/30 text-pencil/60 hover:text-pencil hover:border-pencil rounded-lg transition-colors"
            >
              Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TCSReplicaUI({ passage, mode, durationSeconds }: {
  passage: any; mode: string; durationSeconds: number;
}) {
  const store = useTypingStore();
  const { typedContent } = useTypingEngine();
  return (
    <div className="min-h-screen bg-paper">
      <div className="bg-pencil text-paper px-6 py-3 flex items-center justify-between border-b-2 border-pencil">
        <div className="flex items-center space-x-4 font-hand">
          <span className="font-bold text-lg font-marker">TCS iON</span>
          <span className="text-paper/50">|</span>
          <span className="text-base">SSC Computer Based Skill Test</span>
        </div>
        <div className="flex items-center space-x-6">
          <div className="text-center">
            <div className="text-xs text-paper/60 font-hand">Time Remaining</div>
            <div className="font-mono text-2xl font-bold text-red-400">
              {formatTime(Math.max(0, durationSeconds - store.elapsedSeconds))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4">
        <div className="card-hand p-3 mb-4 flex items-center justify-between text-base">
          <span className="font-hand text-pencil/60">
            Candidate: <span className="font-bold text-pencil">Test User</span>
          </span>
          <div className="flex items-center space-x-6 font-hand">
            <span className="text-pencil/60">WPM: <strong className="text-pencil">{store.wpm}</strong></span>
            <span className="text-pencil/60">Accuracy: <strong className="text-pencil">{store.accuracy}%</strong></span>
            <span className="text-pencil/60">Chars: <strong className="text-pencil">{typedContent.length}</strong></span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card-hand">
            <div className="bg-muted px-4 py-2 border-b-2 border-pencil text-base font-bold font-marker text-pencil">
              Passage
            </div>
            <div className="p-4 h-[400px] overflow-y-auto font-mono text-sm leading-relaxed text-pencil">
              {passage?.content || 'Loading passage...'}
            </div>
          </div>
          <div className="card-hand">
            <div className="bg-muted px-4 py-2 border-b-2 border-pencil text-base font-bold font-marker text-pencil">
              Typing Area
            </div>
            <textarea
              value={typedContent}
              onChange={(e) => store.updateTypedContent(e.target.value)}
              className="w-full h-[400px] font-mono text-sm leading-relaxed p-4 resize-none focus:outline-none border-0 bg-transparent"
              placeholder="Start typing here..."
              autoFocus
            />
          </div>
        </div>

        <div className="mt-4 card-hand p-3 flex justify-between items-center">
          <div className="font-hand text-base text-pencil/50">
            {typedContent.length > 0
              ? `Typing... ${typedContent.length} characters`
              : 'Click in the Typing Area to begin'}
          </div>
          <button onClick={() => store.completeTest()} className="btn-hand-sm bg-accent text-white hover:bg-accent">
            Submit Test
          </button>
        </div>
      </div>
    </div>
  );
}

function ResultScreen({ result, mode, wpmTarget, router }: { result: any; mode: string; wpmTarget?: number; router: any }) {
  const qualified = result.is_qualified !== undefined
    ? result.is_qualified
    : (result.net_wpm || 0) >= (wpmTarget || 35) && (result.accuracy || 0) >= 95;

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center p-4">
      <div className="max-w-2xl w-full card-hand-lg p-8 -rotate-[0.5deg] hover:rotate-0 transition-transform">
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center w-20 h-20 border-[3px] border-pencil mb-4 ${qualified ? 'bg-postit' : 'bg-red-50'}`}
               style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}>
            {qualified
              ? <CheckCircle2 className="w-10 h-10 text-green-600" strokeWidth={3} />
              : <XCircle className="w-10 h-10 text-accent" strokeWidth={3} />}
          </div>
          <h2 className="text-3xl font-bold text-pencil font-marker">
            {qualified ? 'Qualified!' : 'Not Qualified'}
          </h2>
          <p className="mt-1 text-lg text-pencil/60 font-hand">
            {getModeDisplayName(mode)} &mdash; {result.time_taken_seconds?.toFixed(0) || '0'}s
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          {[
            { label: 'Net WPM', value: `${result.net_wpm?.toFixed(1) || 0}`, bg: 'bg-postit' },
            { label: 'Accuracy', value: `${result.accuracy?.toFixed(1) || 0}%`, bg: 'bg-green-50' },
            { label: 'Gross WPM', value: `${result.gross_wpm?.toFixed(1) || 0}`, bg: 'bg-blue-50' },
            { label: 'Total Errors', value: `${result.total_errors || 0}`, bg: 'bg-red-50' },
          ].map((s, i) => (
            <div key={s.label} className={`text-center p-4 border-2 border-pencil ${s.bg}`}
                 style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}>
              <div className={`text-3xl font-bold text-pencil font-marker ${i % 2 === 0 ? 'rotate-1' : '-rotate-1'}`}>
                {s.value}
              </div>
              <div className="text-base text-pencil/60 font-hand mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="border-t-2 border-pencil/20 pt-4 mb-6">
          <h3 className="text-xl font-bold text-pencil font-marker mb-3 -rotate-1">Detailed Breakdown</h3>
          <div className="grid grid-cols-3 gap-3 text-base font-hand">
            {[
              { label: 'Omission', value: result.omission_errors || 0 },
              { label: 'Addition', value: result.addition_errors || 0 },
              { label: 'Substitution', value: result.substitution_errors || 0 },
              { label: 'Wrong Word', value: result.wrong_word_errors || 0 },
              { label: 'Space', value: result.space_errors || 0 },
              { label: 'Backspaces', value: result.backspace_count || 0 },
            ].map((item) => (
              <div key={item.label} className="p-2 bg-muted border border-pencil text-center"
                   style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}>
                <span className="text-pencil/60 text-sm">{item.label}:</span>{' '}
                <strong className="text-pencil">{item.value}</strong>
              </div>
            ))}
          </div>
        </div>

        {result.feedback && (
          <div className="mb-6 p-4 bg-postit border-2 border-pencil shadow-hard-sm"
               style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}>
            <p className="text-base text-pencil font-hand">{result.feedback}</p>
          </div>
        )}

        <div className="flex space-x-4">
          <button onClick={() => window.location.reload()} className="btn-hand flex-1">
            <RotateCcw className="w-4 h-4 mr-2" strokeWidth={3} />
            Take Another Test
          </button>
          <button onClick={() => router.push('/dashboard')} className="btn-hand-secondary flex-1">
            <BarChart3 className="w-4 h-4 mr-2" strokeWidth={3} />
            Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
