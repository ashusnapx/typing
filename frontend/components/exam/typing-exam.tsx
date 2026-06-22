'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { supabase, getRandomPassage } from '@/lib/supabase';
import { useTypingStore } from '@/store/typing-store';
import { useAuthStore } from '@/store/auth-store';
import { useTypingEngine } from '@/hooks/use-typing-engine';
import { calculateWPM, calculateAccuracy, getModeDisplayName } from '@/lib/utils';
import { saveTestResult } from '@/lib/test-storage';
import { invalidateDashboardCache } from '@/lib/dashboard-cache';
import { TestMode } from '@/types';
import { LoadingLogo } from '@/components/ui/loading-logo';
import Image from 'next/image';
import { SSCExamUI } from './ssc-exam-ui';
import { ExamInstructions } from './exam-instructions';
import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  BarChart3,
} from 'lucide-react';

interface TypingExamProps {
  mode: TestMode;
  durationSeconds: number;
  wpmTarget?: number;
  lang?: 'english' | 'hindi';
  isTCSReplica?: boolean;
}

export function TypingExam({ mode, durationSeconds, wpmTarget, lang = 'english', isTCSReplica = false }: TypingExamProps) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, loadUser } = useAuthStore();
  const store = useTypingStore();
  const { typedContent, originalContent, elapsedSeconds } = useTypingEngine(lang);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<any>(null);
  const [showResult, setShowResult] = useState(false);
  const [passage, setPassage] = useState<any>(null);
  const [phase, setPhase] = useState<'loading' | 'instructions' | 'typing' | 'submitting' | 'result'>('loading');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) { router.push('/auth/login'); return; }
    const waitAndInit = async () => {
      if (authLoading) return;
      initTest();
    };
    waitAndInit();
  }, [authLoading]);

  useEffect(() => {
    if (store.isComplete && !showResult && phase === 'typing') submitTest();
  }, [store.isComplete, phase]);

  useEffect(() => {
    if (phase === 'result') {
      if (document.fullscreenElement) document.exitFullscreen();
    }
  }, [phase]);

  const initTest = async () => {
    store.reset();
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
      setPhase('instructions');
    } catch {
      setLoading(false);
      store.startTest('local', mode, 'Sample passage for typing practice.', durationSeconds);
      setPhase('instructions');
    }
  };

  const startTyping = () => {
    setPhase('typing');
    try { document.documentElement.requestFullscreen(); } catch {}
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
        xp_earned: resultData.xp_earned || 0,
      });
      loadUser();
      invalidateDashboardCache();
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
          xp_earned: resultData.xp_earned || 0,
        });
        loadUser();
        invalidateDashboardCache();
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
    invalidateDashboardCache();
    setPhase('result');
  };

  if (phase === 'loading') {
    return <LoadingLogo />;
  }

  if (phase === 'instructions') {
    return (
      <ExamInstructions
        mode={mode}
        durationSeconds={durationSeconds}
        lang={lang}
        onBegin={startTyping}
      />
    );
  }

  if (phase === 'submitting') {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#f5f5f5',
        fontFamily: 'Poppins, sans-serif',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="inline-block animate-spin">
            <Image
              src="/images/logo.jpg"
              alt=""
              width={64}
              height={64}
              className="w-16 h-16 border-2 border-pencil shadow-hard-sm"
              style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
            />
          </div>
          <p style={{ marginTop: 20, fontSize: 18, color: '#666', fontWeight: 500 }}>
            Evaluating your typing test...
          </p>
          <p style={{ marginTop: 8, fontSize: 14, color: '#999' }}>
            Please wait while we analyze your performance
          </p>
        </div>
      </div>
    );
  }

  if (phase === 'result' && result) {
    return (
      <ResultScreen
        result={result}
        mode={mode}
        wpmTarget={wpmTarget}
        router={router}
        originalContent={store.originalContent}
        typedContent={store.typedContent}
      />
    );
  }

  return (
    <SSCExamUI
      mode={mode}
      durationSeconds={durationSeconds}
      wpmTarget={wpmTarget}
      passage={passage}
      lang={lang}
      onComplete={() => store.completeTest()}
      phase={phase}
    />
  );
}

function WordsDiff({ original, typed }: { original: string; typed: string }) {
  const origWords = original.split(' ');
  const typedWords = typed.split(' ');

  return (
    <div style={{ fontFamily: "'Courier New', monospace", fontSize: 14, lineHeight: 2 }}>
      {origWords.map((word, i) => {
        const typed = typedWords[i];
        if (!typed) {
          return (
            <span key={i} style={{ color: '#999', background: '#f5f5f5', padding: '1px 2px', margin: '0 1px', borderRadius: 2, textDecoration: 'line-through' }}>
              {word}{' '}
            </span>
          );
        }
        const match = typed === word;
        let bg = '#e8f5e9';
        let color = '#2e7d32';
        if (!match) {
          const ratio = levenshteinRatio(word, typed);
          if (ratio > 0.6) {
            bg = '#fff3e0';
            color = '#e65100';
          } else {
            bg = '#ffebee';
            color = '#c62828';
          }
        }
        return (
          <span key={i} style={{ background: bg, color, padding: '1px 3px', margin: '0 1px', borderRadius: 3, borderBottom: match ? '2px solid #4caf50' : '2px solid transparent' }}>
            {typed}{' '}
          </span>
        );
      })}
      {typedWords.length > origWords.length && (
        <span style={{ color: '#c62828', background: '#ffebee', padding: '1px 3px', margin: '0 1px', borderRadius: 3 }}>
          +{typedWords.slice(origWords.length).join(' ')}
        </span>
      )}
    </div>
  );
}

function levenshteinRatio(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return 1 - dp[m][n] / Math.max(m, n);
}

function ResultScreen({ result, mode, wpmTarget, router, originalContent, typedContent }:
  { result: any; mode: string; wpmTarget?: number; router: any; originalContent: string; typedContent: string }) {
  const qualified = result.is_qualified !== undefined
    ? result.is_qualified
    : (result.net_wpm || 0) >= (wpmTarget || 35) && (result.accuracy || 0) >= 95;

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: 'Poppins, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ maxWidth: 800, width: '100%', background: '#fff', border: '1px solid #dcdcdc', borderRadius: 8, padding: 32 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            width: 80, height: 80, margin: '0 auto 16px', borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: qualified ? '#e8f5e9' : '#ffebee',
            border: `2px solid ${qualified ? '#4caf50' : '#e53935'}`
          }}>
            {qualified
              ? <CheckCircle2 size={40} color="#4caf50" />
              : <XCircle size={40} color="#e53935" />}
          </div>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: '#333', margin: 0 }}>
            {qualified ? 'Qualified' : 'Not Qualified'}
          </h2>
          <p style={{ marginTop: 4, fontSize: 16, color: '#888' }}>
            {getModeDisplayName(mode)} &mdash; {result.time_taken_seconds?.toFixed(0) || '0'}s
          </p>
          {!qualified && (
            <div style={{ marginTop: 8, fontSize: 13, color: '#888', display: 'flex', gap: 16, justifyContent: 'center' }}>
              {(result.net_wpm || 0) < (wpmTarget || 35) && (
                <span style={{ color: '#e53935' }}>WPM: {result.net_wpm?.toFixed(1)} / {wpmTarget || 35} required</span>
              )}
              {(result.accuracy || 0) < 95 && (
                <span style={{ color: '#e53935' }}>Accuracy: {result.accuracy?.toFixed(1)}% / 95% required</span>
              )}
            </div>
          )}
          {result.xp_earned > 0 && (
            <div style={{ marginTop: 8, fontSize: 15, color: '#e65100', fontWeight: 600 }}>
              +{result.xp_earned} XP earned
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Characters Typed', value: result.key_depression_count || 0 },
            { label: 'Target Characters', value: '~2000' },
            { label: 'Net WPM', value: `${result.net_wpm?.toFixed(1) || 0}` },
            { label: 'Gross WPM', value: `${result.gross_wpm?.toFixed(1) || 0}` },
            { label: 'Accuracy', value: `${result.accuracy?.toFixed(1) || 0}%` },
            { label: 'Mistakes', value: result.total_errors || 0, color: '#e53935' },
          ].map((s) => (
            <div key={s.label} style={{ padding: 12, background: '#f9f9f9', borderRadius: 6, textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: (s as any).color || '#333' }}>{s.value}</div>
              <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {typedContent && originalContent && (
          <div style={{ borderTop: '1px solid #eee', paddingTop: 16, marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#333', marginBottom: 12 }}>
              Word-by-Word Feedback
              <span style={{ fontSize: 12, fontWeight: 400, color: '#888', marginLeft: 8 }}>
                Green = correct, Orange = partial, Red = wrong, Strikethrough = missed
              </span>
            </h3>
            <div style={{ maxHeight: 200, overflowY: 'auto', padding: 12, background: '#fafafa', borderRadius: 6, border: '1px solid #eee' }}>
              <WordsDiff original={originalContent} typed={typedContent} />
            </div>
          </div>
        )}

        <div style={{ borderTop: `1px solid ${'#eee'}`, paddingTop: 16, marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: '#333', marginBottom: 12 }}>Detailed Breakdown</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, fontSize: 14 }}>
            {[
              { label: 'Omission', value: result.omission_errors || 0, color: '#e53935' },
              { label: 'Addition', value: result.addition_errors || 0, color: '#e53935' },
              { label: 'Substitution', value: result.substitution_errors || 0, color: '#e65100' },
              { label: 'Wrong Word', value: result.wrong_word_errors || 0, color: '#e53935' },
              { label: 'Space Errors', value: result.space_errors || 0, color: '#e65100' },
              { label: 'Backspaces', value: result.backspace_count || 0, color: '#1565c0' },
            ].map((item) => (
              <div key={item.label} style={{ padding: '6px 8px', background: '#f5f5f5', borderRadius: 4, textAlign: 'center' }}>
                <span style={{ color: '#888' }}>{item.label}: </span>
                <strong style={{ color: (item as any).color || '#333' }}>{item.value}</strong>
              </div>
            ))}
          </div>
        </div>

        {result.feedback && (
          <div style={{ marginBottom: 24, padding: 16, background: '#e3f2fd', borderLeft: '4px solid #1976d2', borderRadius: 4, fontSize: 14, color: '#333', lineHeight: 1.6 }}>
            <strong style={{ color: '#1976d2' }}>AI Coach Feedback</strong>
            <div style={{ marginTop: 4 }}>{result.feedback}</div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => window.location.reload()}
            style={{ flex: 1, padding: '10px 0', border: `1px solid ${'#2F5BFF'}`, borderRadius: 8, background: '#2F5BFF', color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
            Take Another Test
          </button>
          <button onClick={() => router.push('/dashboard')}
            style={{ flex: 1, padding: '10px 0', border: `1px solid ${'#dcdcdc'}`, borderRadius: 8, background: '#fff', color: '#333', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
            Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
