'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { supabase, getRandomPassage } from '@/lib/supabase';
import { useTypingStore } from '@/store/typing-store';
import { useAuthStore } from '@/store/auth-store';
import { formatTime, calculateWPM, calculateAccuracy } from '@/lib/utils';
import { TestMode } from '@/types';
import { LoadingLogo } from '@/components/ui/loading-logo';
import {
  Timer,
  Keyboard,
  Target,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  RotateCcw,
  BarChart3,
  SkipBack,
} from 'lucide-react';

const wobbly = { borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' };
const wobblyMd = { borderRadius: '60px 20px 80px 20px / 20px 60px 20px 80px' };

interface TypingExamProps {
  mode: TestMode;
  durationSeconds: number;
  wpmTarget?: number;
  lang?: 'english' | 'hindi';
  isTCSReplica?: boolean;
}

export function TypingExam({ mode, durationSeconds, wpmTarget, lang = 'english', isTCSReplica = false }: TypingExamProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const store = useTypingStore();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<any>(null);
  const [showResult, setShowResult] = useState(false);
  const [passage, setPassage] = useState<any>(null);
  const [countdown, setCountdown] = useState(3);
  const [phase, setPhase] = useState<'loading' | 'countdown' | 'typing' | 'submitting' | 'result'>('loading');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { initTest(); }, []);

  useEffect(() => {
    if (store.isComplete && !showResult) submitTest();
  }, [store.isComplete]);

  const initTest = async () => {
    try {
      const category = mode === 'ssc_chsl' ? 'ssc_chsl' : mode === 'ssc_cgl_dest' ? 'ssc_cgl' : undefined;
      const passageData = await getRandomPassage(category, undefined, lang);
      setPassage(passageData);

      if (user && passageData) {
        try {
          const test = await api.startTest(mode, passageData.id, durationSeconds);
          store.startTest(test.test_id, mode, passageData.content, durationSeconds);
        } catch {
          store.startTest('local', mode, passageData?.content || '', durationSeconds);
        }
      } else {
        store.startTest('local', mode, passageData?.content || '', durationSeconds);
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
    const timerInterval = setInterval(() => {
      store.tick();
    }, 1000);
    setTimeout(() => textareaRef.current?.focus(), 100);
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
    } catch {
      setResult({
        net_wpm: store.wpm,
        accuracy: store.accuracy,
        gross_wpm: calculateWPM(store.typedContent.length, store.elapsedSeconds),
        key_depression_count: store.typedContent.length,
        total_errors: store.errors,
        backspace_count: store.backspaces,
        is_qualified: store.wpm >= (wpmTarget || 35) && store.accuracy >= 95,
      });
    }
    setPhase('result');
  };

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

  if (isTCSReplica) {
    return <TCSReplicaUI passage={passage} mode={mode} durationSeconds={durationSeconds} textareaRef={textareaRef} />;
  }

  return (
    <div className="min-h-screen bg-paper">
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Header / Timer Bar */}
        <div className="card-hand-lg p-4 mb-4 flex items-center justify-between -rotate-[0.3deg]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 flex items-center justify-center border-2 border-pencil bg-muted" style={wobbly}>
              <Keyboard className="w-5 h-5" strokeWidth={3} />
            </div>
            <div>
              <span className="text-lg font-bold text-pencil font-marker">
                {mode.replace('_', ' ').toUpperCase()}
              </span>
              {wpmTarget && (
                <span className="ml-3 text-base text-pencil/50 font-hand">
                  Target: <strong>{wpmTarget} WPM</strong>
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <div className="text-sm text-pencil/50 font-hand">WPM</div>
              <div className="text-2xl font-bold text-pencil font-marker">{store.wpm}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-pencil/50 font-hand">Accuracy</div>
              <div className="text-2xl font-bold text-pencil font-marker">{store.accuracy}%</div>
            </div>
            <div className="text-center">
              <div className="flex items-center space-x-1 text-sm text-pencil/50 font-hand">
                <Timer className="w-4 h-4" strokeWidth={3} />
                <span>Time</span>
              </div>
              <div className="ssc-timer">
                {formatTime(Math.max(0, durationSeconds - store.elapsedSeconds))}
              </div>
            </div>
            <button onClick={submitTest} className="btn-hand-sm">
              Submit Test
            </button>
          </div>
        </div>

        {/* Passage Display */}
        <div className="card-hand-lg p-6 mb-4 -rotate-[0.2deg]">
          <div className="tape" />
          <div className="text-sm text-pencil/50 font-hand mb-2 uppercase tracking-wider">Passage</div>
          <div className={`font-mono text-sm leading-relaxed text-pencil ${lang === 'hindi' ? 'font-hindi' : ''}`}>
            {passage?.content || 'Loading...'}
          </div>
        </div>

        {/* Typing Area */}
        <div className="card-hand-lg p-4 rotate-[0.2deg]">
          <div className="text-sm text-pencil/50 font-hand mb-2 uppercase tracking-wider">Type here</div>
          <textarea
            ref={textareaRef}
            value={store.typedContent}
            onChange={(e) => {
              const content = e.target.value;
              store.updateTypedContent(content);
              const elapsed = Math.max(1, (Date.now() - (store.startTime || Date.now())) / 1000);
              const wpm = calculateWPM(content.length, elapsed);
              const original = passage?.content || '';
              const correct = content.split('').filter((ch, i) => ch === original[i]).length;
              const acc = calculateAccuracy(correct, content.length);
              const errors = content.length - correct;
              const backspaces = content.length < store.typedContent.length
                ? store.backspaces + 1
                : store.backspaces;
              store.updateMetrics(wpm, acc, errors, backspaces);
            }}
            className="ssc-typing-area"
            placeholder="Start typing here..."
            autoFocus
          />
        </div>
      </div>
    </div>
  );
}

function TCSReplicaUI({ passage, mode, durationSeconds, textareaRef }: {
  passage: any; mode: string; durationSeconds: number; textareaRef: React.RefObject<HTMLTextAreaElement>;
}) {
  const store = useTypingStore();
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
            <div className="ssc-timer text-red-400">
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
            <span className="text-pencil/60">Chars: <strong className="text-pencil">{store.typedContent.length}</strong></span>
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
              ref={textareaRef}
              value={store.typedContent}
              onChange={(e) => store.updateTypedContent(e.target.value)}
              className="w-full h-[400px] font-mono text-sm leading-relaxed p-4 resize-none focus:outline-none border-0 bg-transparent"
              placeholder="Start typing here..."
              autoFocus
            />
          </div>
        </div>

        <div className="mt-4 card-hand p-3 flex justify-between items-center">
          <div className="font-hand text-base text-pencil/50">
            {store.typedContent.length > 0
              ? `Typing... ${store.typedContent.length} characters`
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
            {mode.replace('_', ' ').toUpperCase()} &mdash; {result.time_taken_seconds?.toFixed(0) || '0'}s
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
          <div className="mb-6 p-4 bg-postit border-2 border-pencil shadow-hard-sm" style={wobbly}>
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
