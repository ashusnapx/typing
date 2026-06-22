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
import { SSCExamUI } from './ssc-exam-ui';
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
  const { user, isLoading: authLoading, loadUser } = useAuthStore();
  const store = useTypingStore();
  const { typedContent, originalContent, elapsedSeconds } = useTypingEngine();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<any>(null);
  const [showResult, setShowResult] = useState(false);
  const [passage, setPassage] = useState<any>(null);
  const [countdown, setCountdown] = useState(3);
  const [phase, setPhase] = useState<'loading' | 'countdown' | 'typing' | 'submitting' | 'result'>('loading');

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

  if (phase === 'countdown') {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', background: '#f5f5f5', fontFamily: 'Poppins, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 96, fontWeight: 700, color: '#2F5BFF' }}>{countdown}</div>
          <p style={{ marginTop: 16, fontSize: 20, color: '#333' }}>Get ready...</p>
        </div>
      </div>
    );
  }

  if (phase === 'result' && result) {
    return <ResultScreen result={result} mode={mode} wpmTarget={wpmTarget} router={router} />;
  }

  return (
    <SSCExamUI
      mode={mode}
      durationSeconds={durationSeconds}
      wpmTarget={wpmTarget}
      passage={passage}
      onComplete={() => store.completeTest()}
      phase={phase}
    />
  );
}

function ResultScreen({ result, mode, wpmTarget, router }: { result: any; mode: string; wpmTarget?: number; router: any }) {
  const qualified = result.is_qualified !== undefined
    ? result.is_qualified
    : (result.net_wpm || 0) >= (wpmTarget || 35) && (result.accuracy || 0) >= 95;

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: 'Poppins, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ maxWidth: 640, width: '100%', background: '#fff', border: '1px solid #dcdcdc', borderRadius: 8, padding: 32 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
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

        <div style={{ borderTop: `1px solid ${'#eee'}`, paddingTop: 16, marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: '#333', marginBottom: 12 }}>Detailed Breakdown</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, fontSize: 14 }}>
            {[
              { label: 'Omission', value: result.omission_errors || 0 },
              { label: 'Addition', value: result.addition_errors || 0 },
              { label: 'Substitution', value: result.substitution_errors || 0 },
              { label: 'Wrong Word', value: result.wrong_word_errors || 0 },
              { label: 'Space Errors', value: result.space_errors || 0 },
              { label: 'Backspaces', value: result.backspace_count || 0 },
            ].map((item) => (
              <div key={item.label} style={{ padding: '6px 8px', background: '#f5f5f5', borderRadius: 4, textAlign: 'center' }}>
                <span style={{ color: '#888' }}>{item.label}: </span>
                <strong style={{ color: '#333' }}>{item.value}</strong>
              </div>
            ))}
          </div>
        </div>

        {result.feedback && (
          <div style={{ marginBottom: 24, padding: 16, background: '#fff8e1', border: '1px solid #ffc107', borderRadius: 6, fontSize: 14, color: '#333', lineHeight: 1.6 }}>
            {result.feedback}
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
