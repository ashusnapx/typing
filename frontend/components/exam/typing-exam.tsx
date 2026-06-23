'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useSubmitTest, useDirectSubmit } from '@/lib/queries';
import { getRandomPassage, preloadPassages } from '@/lib/supabase';
import { useTypingStore } from '@/store/typing-store';
import { useAuthStore } from '@/store/auth-store';
import { useTypingEngine } from '@/hooks/use-typing-engine';
import { calculateWPM, calculateAccuracy, getModeDisplayName } from '@/lib/utils';
import { saveTestResult } from '@/lib/test-storage';

import { blastConfetti } from '@/lib/confetti';
import { ROUTES } from '@/lib/config';
import PassageDiffView, { buildWordDisplay, getWordTiming, formatMs } from './passage-diff';
import { TestMode } from '@/types';
import { getExamSpecs, SSC_EXAM_SPECS, checkQualification, calculateNetWpm, calculateAccuracySsc } from '@/lib/exam-config';
import { getPracticeSets, PracticeSet } from '@/lib/practice-sets';
import { LoadingLogo, LogoSpinner } from '@/components/ui/loading-logo';
import Image from 'next/image';
import { SSCExamUI } from './ssc-exam-ui';
import PracticeSetSelector from './practice-set-selector';
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
  const { user, isAuthenticated, loadUser } = useAuthStore();
  const store = useTypingStore();
  const { typedContent, originalContent, elapsedSeconds } = useTypingEngine(lang);
  const submitMutation = useSubmitTest();
  const directSubmitMutation = useDirectSubmit();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<any>(null);
  const [showResult, setShowResult] = useState(false);
  const [passage, setPassage] = useState<any>(null);
  const [selectedSet, setSelectedSet] = useState<PracticeSet | null>(null);
  const [phase, setPhase] = useState<'loading' | 'select-set' | 'instructions' | 'typing' | 'submitting' | 'result'>('loading');

  useEffect(() => { preloadPassages(); }, []);

  useEffect(() => {
    const sets = getPracticeSets(mode);
    if (sets.length > 0) {
      setPhase('select-set');
      setLoading(false);
    } else {
      initTest();
    }
  }, [mode]);

  useEffect(() => {
    if (store.isComplete && !showResult && phase === 'typing') submitTest();
  }, [store.isComplete, phase]);

  useEffect(() => {
    if (phase === 'result') {
      if (document.fullscreenElement) document.exitFullscreen();
    }
  }, [phase]);

  useEffect(() => {
    store.setNavHidden(phase === 'typing' || phase === 'submitting');
  }, [phase]);

  const initTest = async (practiceSet?: number) => {
    store.reset();
    try {
      const category = mode === 'ssc_chsl' ? 'ssc_chsl' : mode === 'ssc_cgl_dest' ? 'ssc_cgl' : undefined;
      const passageData = await getRandomPassage(category, undefined, lang, practiceSet);
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
            if (attempt === 0) await new Promise(r => setTimeout(r, 50));
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
      const resultData = await submitMutation.mutateAsync({
        testId: store.testId || 'local',
        typed_content: store.typedContent,
        keystroke_events: store.keystrokeEvents,
        time_taken_seconds: store.elapsedSeconds,
      });
      setResult(resultData);
      saveTestResult({
        wpm: resultData.ssc_net_wpm || resultData.net_wpm || 0,
        accuracy: resultData.ssc_accuracy || resultData.accuracy || 0,
        mode,
        qualified: !!resultData.is_qualified,
        duration: durationSeconds,
        gross_wpm: resultData.gross_wpm,
        total_errors: resultData.total_errors,
        key_depression_count: resultData.key_depression_count,
        backspace_count: resultData.backspace_count,
        typed_content: store.typedContent,
        original_content: store.originalContent,
        full_mistakes: resultData.full_mistakes,
        half_mistakes: resultData.half_mistakes,
        ssc_net_wpm: resultData.ssc_net_wpm,
        ssc_accuracy: resultData.ssc_accuracy,
        omission_errors: resultData.omission_errors,
        addition_errors: resultData.addition_errors,
        substitution_errors: resultData.substitution_errors,
        wrong_word_errors: resultData.wrong_word_errors,
        space_errors: resultData.space_errors,
        consistency_score: resultData.consistency_score,
        xp_earned: resultData.xp_earned || 0,
      }, resultData.test_id);
      loadUser();
      setPhase('result');
      return;
    } catch {
      // Fall back to direct-submit if two-step flow failed
    }

    if (store.testId === 'local' && passage && user) {
      try {
        const resultData = await directSubmitMutation.mutateAsync({
          mode,
          passage_id: passage.id,
          duration_seconds: durationSeconds,
          typed_content: store.typedContent,
          keystroke_events: store.keystrokeEvents,
          time_taken_seconds: store.elapsedSeconds,
        });
        setResult(resultData);
        saveTestResult({
          wpm: resultData.ssc_net_wpm || resultData.net_wpm || 0,
          accuracy: resultData.ssc_accuracy || resultData.accuracy || 0,
          mode,
          qualified: !!resultData.is_qualified,
          duration: durationSeconds,
          gross_wpm: resultData.gross_wpm,
          total_errors: resultData.total_errors,
          key_depression_count: resultData.key_depression_count,
          backspace_count: resultData.backspace_count,
          typed_content: store.typedContent,
          original_content: store.originalContent,
          full_mistakes: resultData.full_mistakes,
          half_mistakes: resultData.half_mistakes,
          ssc_net_wpm: resultData.ssc_net_wpm,
          ssc_accuracy: resultData.ssc_accuracy,
          omission_errors: resultData.omission_errors,
          addition_errors: resultData.addition_errors,
          substitution_errors: resultData.substitution_errors,
          wrong_word_errors: resultData.wrong_word_errors,
          space_errors: resultData.space_errors,
          consistency_score: resultData.consistency_score,
          xp_earned: resultData.xp_earned || 0,
        }, resultData.test_id);
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
      typed_content: store.typedContent,
      original_content: store.originalContent,
    });
    setPhase('result');
    blastConfetti();
  };

  if (phase === 'loading') {
    return <LoadingLogo />;
  }

  if (phase === 'select-set') {
    const sets = getPracticeSets(mode);
    const spec = getExamSpecs(mode);
    return (
      <PracticeSetSelector
        examName={getModeDisplayName(mode)}
        sets={sets}
        durationMinutes={spec?.durationMinutes || Math.round(durationSeconds / 60)}
        wpmTarget={spec?.englishSpeedWpm}
        onSelect={(set) => {
          setSelectedSet(set);
          setPhase('loading');
          initTest(set.number);
        }}
        onBack={() => router.push('/exam')}
      />
    );
  }

  if (phase === 'instructions') {
    return (
      <ExamInstructions
        mode={mode}
        durationSeconds={durationSeconds}
        lang={lang}
        selectedSet={selectedSet || undefined}
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
          <LogoSpinner size="lg" />
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

// PassageDiffView and helpers extracted to ./passage-diff

function ResultScreen({ result, mode, wpmTarget, router, originalContent, typedContent }:
  { result: any; mode: string; wpmTarget?: number; router: any; originalContent: string; typedContent: string }) {
  const specs = getExamSpecs(mode);
  const sscNetWpm = result.ssc_net_wpm || result.net_wpm || 0;
  const sscAccuracy = result.ssc_accuracy || result.accuracy || 0;
  const fullMistakes = result.full_mistakes ?? 0;
  const halfMistakes = result.half_mistakes ?? 0;
  const sscErrorPct = result.ssc_error_percentage ?? (sscAccuracy > 0 ? +(100 - sscAccuracy).toFixed(2) : 0);

  const typedWordCount = typedContent?.trim() ? typedContent.trim().split(/\s+/).length : 0;
  const originalWordCount = originalContent?.trim() ? originalContent.trim().split(/\s+/).length : 1;
  const passageCompletionPct = Math.min(100, Math.round((typedWordCount / originalWordCount) * 100));

  const qualifiesCategory = (maxErrPct: number) => {
    if (specs?.qualifyingNature === 'speed_wpm') {
      return sscNetWpm >= (wpmTarget || specs?.englishSpeedWpm || 35) && sscErrorPct <= maxErrPct;
    }
    const kdphVal = result.key_depression_count && result.time_taken_seconds
      ? Math.round((result.key_depression_count / (result.time_taken_seconds / 60)) * 60)
      : 0;
    return kdphVal >= (specs?.englishKdph || 8000) && sscErrorPct <= maxErrPct;
  };

  const qualified = qualifiesCategory(specs?.errorAllowanceGeneral ?? 20) && passageCompletionPct >= 50;

  const wpmTargetNum = wpmTarget || specs?.englishSpeedWpm || 35;
  const categories = [
    { cat: 'UR', label: 'Unreserved', errLimit: specs?.errorAllowanceGeneral ?? 20 },
    { cat: 'OBC/EWS', label: 'OBC / EWS', errLimit: specs?.errorAllowanceObcEws ?? 25 },
    { cat: 'SC/ST', label: 'SC / ST', errLimit: specs?.errorAllowanceScSt ?? 30 },
  ];

  const N = '#333';
  const G = '#16a34a';
  const R = '#dc2626';
  const O = '#ea580c';
  const B = '#f5f5f5';
  const BD = '#dcdcdc';

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: 'Poppins, sans-serif', padding: 24 }}>
      <div style={{ maxWidth: 860, margin: '0 auto', background: '#fff', border: `1px solid ${BD}`, borderRadius: 12, padding: 32 }}>
        
        {/* Qualification + Primary Metrics */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: qualified ? '#f0fdf4' : '#fef2f2',
              border: `3px solid ${qualified ? G : R}`
            }}>
              {qualified ? <CheckCircle2 size={32} color={G} /> : <XCircle size={32} color={R} />}
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700, color: qualified ? G : R }}>{qualified ? 'QUALIFIED' : 'NOT QUALIFIED'}</div>
              <div style={{ fontSize: 13, color: '#888' }}>{getModeDisplayName(mode)} — {result.time_taken_seconds?.toFixed(0) || 0}s</div>
            </div>
          </div>
          {result.xp_earned > 0 && (
            <div style={{ background: '#fef3c7', border: `1px solid #f59e0b`, borderRadius: 8, padding: '6px 14px', fontSize: 14, fontWeight: 700, color: '#92400e' }}>
              +{result.xp_earned} XP
            </div>
          )}
        </div>

        {/* SSC Metrics Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'SSC Net WPM', value: sscNetWpm.toFixed(1), sub: `Target: ${wpmTargetNum} WPM`, color: sscNetWpm >= wpmTargetNum ? G : R },
            { label: 'SSC Accuracy', value: `${sscAccuracy.toFixed(1)}%`, sub: 'Target: ≥ 95%', color: sscAccuracy >= 95 ? G : R },
            { label: 'Full Mistakes', value: fullMistakes, sub: '100% penalty each', color: fullMistakes > 0 ? R : G },
            { label: 'Half Mistakes', value: halfMistakes, sub: '50% penalty each', color: halfMistakes > 0 ? O : G },
          ].map((m, i) => (
            <div key={i} style={{ padding: '14px 10px', background: B, borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: m.color }}>{m.value}</div>
              <div style={{ fontSize: 10, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 }}>{m.label}</div>
              <div style={{ fontSize: 10, color: '#aaa', marginTop: 1 }}>{m.sub}</div>
            </div>
          ))}
        </div>

        {/* Error % + Key Depressions + Qualification by Category */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
          <div style={{ padding: '12px 16px', background: B, borderRadius: 8 }}>
            <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>SSC Error %</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: sscErrorPct > 10 ? R : G }}>{sscErrorPct.toFixed(1)}%</div>
          </div>
          <div style={{ padding: '12px 16px', background: B, borderRadius: 8 }}>
            <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Key Depressions</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: N }}>{result.key_depression_count || 0}</div>
          </div>
          <div style={{ padding: '12px 16px', background: B, borderRadius: 8 }}>
            <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Backspaces</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: N }}>{result.backspace_count || 0}</div>
          </div>
        </div>

        {/* Citation */}
        <div style={{ fontSize: 11, color: '#999', marginBottom: 12, lineHeight: 1.5, padding: '8px 10px', background: '#f9f9f9', borderRadius: 6 }}>
          <strong>Source:</strong> {specs?.source || 'SSC Official Notification'}. Error allowance varies by post — LDC/JSA uses 7%/10%, DEO/DEST uses 20%/25%/30%.
          {' '}
          {specs?.citations?.map((url, i) => (
            <span key={i}><a href={url} target="_blank" rel="noopener noreferrer" style={{ color: '#2F5BFF' }}>{url.replace(/^https?:\/\//, '')}</a>{i < (specs.citations?.length ?? 0) - 1 ? ' · ' : ''} </span>
          ))}
          <a href="https://ssc.gov.in" target="_blank" rel="noopener noreferrer" style={{ color: '#2F5BFF' }}>ssc.gov.in</a>
        </div>

        {/* Qualification by Category */}
        <details style={{ marginBottom: 20 }}>
          <summary style={{ fontSize: 14, fontWeight: 600, color: N, cursor: 'pointer', userSelect: 'none', padding: '8px 0' }}>
            Qualification by Category
          </summary>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 8 }}>
            {categories.map(c => {
              const qualifies = qualifiesCategory(c.errLimit);
              return (
                <div key={c.cat} style={{
                  padding: '10px', borderRadius: 6,
                  background: qualifies ? '#f0fdf4' : '#fef2f2',
                  border: `1px solid ${qualifies ? G : R}`,
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: qualifies ? G : R }}>{c.cat}</div>
                  <div style={{ fontSize: 11, color: '#888' }}>Error ≤ {c.errLimit}%</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: qualifies ? G : R, marginTop: 2 }}>
                    {qualifies ? '✓' : '✗'}
                  </div>
                </div>
              );
            })}
          </div>
        </details>

        {!qualified && (
          <div style={{ padding: '10px 14px', background: '#fef2f2', border: `1px solid ${R}`, borderRadius: 6, fontSize: 13, color: R, marginBottom: 20 }}>
            {sscNetWpm < wpmTargetNum && <span>Speed: {sscNetWpm.toFixed(1)} WPM (need {wpmTargetNum}){sscErrorPct > (specs?.errorAllowanceGeneral ?? 20) ? '  |  ' : ''}</span>}
            {sscErrorPct > (specs?.errorAllowanceGeneral ?? 20) && <span>Errors: {sscErrorPct.toFixed(1)}% (need ≤{specs?.errorAllowanceGeneral ?? 20}%){passageCompletionPct < 50 ? '  |  ' : ''}</span>}
            {passageCompletionPct < 50 && <span>Passage: {passageCompletionPct}% completed (need ≥50%)</span>}
          </div>
        )}

        {/* Side-by-Side Passage Comparison */}
        {typedContent && originalContent && (
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: N, marginBottom: 8 }}>
              Passage Comparison
              <span style={{ fontSize: 11, fontWeight: 400, color: '#999', marginLeft: 10, display: 'inline-block' }}>
                <span style={{ color: '#16a34a' }}>green</span> = correct &nbsp;
                <span style={{ color: '#ea580c' }}>orange ~</span> = typo/caps &nbsp;
                <span style={{ color: '#dc2626' }}>red ✗</span> = wrong &nbsp;
                <span style={{ color: '#bbb' }}>gray —</span> = missed &nbsp;
                <span style={{ color: '#dc2626', textDecoration: 'underline' }}>red _</span> = extra
              </span>
            </h3>
            <PassageDiffView original={originalContent} typed={typedContent} />
          </div>
        )}

        {/* Detailed Breakdown (collapsible) */}
        <details style={{ marginBottom: 20 }}>
          <summary style={{ fontSize: 14, fontWeight: 600, color: N, cursor: 'pointer', userSelect: 'none', padding: '8px 0' }}>
            Detailed Error Breakdown
          </summary>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 8 }}>
            {[
              { label: 'Omission', value: result.omission_errors || 0, color: R },
              { label: 'Addition', value: result.addition_errors || 0, color: R },
              { label: 'Substitution', value: result.substitution_errors || 0, color: O },
              { label: 'Wrong Word', value: result.wrong_word_errors || 0, color: R },
              { label: 'Space', value: result.space_errors || 0, color: O },
              { label: 'Consistency', value: result.consistency_score ? `${result.consistency_score.toFixed(0)}%` : '-', color: N },
            ].map((item, i) => (
              <div key={i} style={{ padding: '8px 10px', background: B, borderRadius: 6, textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#888' }}>{item.label}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: (item as any).color }}>{(item as any).value}</div>
              </div>
            ))}
          </div>
        </details>

        {/* AI Coach Feedback */}
        {result.feedback && (
          <div style={{ marginBottom: 20, padding: 14, background: '#eef2ff', borderLeft: `4px solid #4f46e5`, borderRadius: 6, fontSize: 13, color: N, lineHeight: 1.6 }}>
            <strong style={{ color: '#4f46e5', display: 'block', marginBottom: 4 }}>AI Coach Feedback</strong>
            <div>{result.feedback}</div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => window.location.reload()}
            style={{ flex: 1, padding: '10px 0', border: `1px solid ${'#2F5BFF'}`, borderRadius: 8, background: '#2F5BFF', color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
            Take Another Test
          </button>
          <button onClick={() => router.push(ROUTES.dashboard)}
            style={{ flex: 1, padding: '10px 0', border: `1px solid ${BD}`, borderRadius: 8, background: '#fff', color: N, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
            Dashboard
          </button>
          {result.test_id && (
            <button onClick={() => router.push(`/analysis/${result.test_id}`)}
              style={{ padding: '10px 16px', border: `1px solid ${'#2F5BFF'}`, borderRadius: 8, background: '#fff', color: '#2F5BFF', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
              Full Report →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
