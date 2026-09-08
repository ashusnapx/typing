'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useSubmitTest, useDirectSubmit, useStartTest } from '@/lib/queries';
import { useTypingStore } from '@/store/typing-store';
import { useAuthStore } from '@/store/auth-store';
import { useTypingEngine } from '@/hooks/use-typing-engine';
import { ENABLE_NEW_TYPING_ENGINE } from '@/lib/config';
import { useNewTypingEngine } from '@/features/typing/engine/typing-engine';

import { SyncQueue } from '@/lib/offline/sync-queue';
import { calculateWPM, calculateAccuracy, getModeDisplayName } from '@/lib/utils';
import { saveTestResult } from '@/lib/test-storage';
import toast from 'react-hot-toast';

import { blastConfetti } from '@/lib/confetti';
import { TestMode } from '@/types';
import { pickPassage, type PoolPassage } from '@/lib/passages/pool';

/** Only reached when the pool is empty — a misconfigured environment. */
const FALLBACK_PASSAGE =
  'The Staff Selection Commission conducts the typing test to assess the speed and accuracy of candidates for various government posts across the country.';
import { getExamSpecs, SSC_EXAM_SPECS, checkQualification, calculateNetWpm, calculateAccuracySsc } from '@/lib/exam-config';
import { getPracticeSets, PracticeSet } from '@/lib/practice-sets';
import { AuthPrompt } from '@/components/auth/auth-prompt';
import { KeyLoader } from '@/components/ui/loading-logo';
import { SSCExamUI } from './ssc-exam-ui';
import { ExamChrome } from './exam-chrome';
import { ExamInstructions, requiresDeclaration } from './exam-instructions';
import { ResultScreen } from './result-screen';

interface TypingExamProps {
  mode: TestMode;
  durationSeconds: number;
  wpmTarget?: number;
  lang?: 'english' | 'hindi';
  /** Reproduce the exam vendor's chrome exactly. */
  isEduquityReplica?: boolean;
  /** Every active passage, fetched and cached on the server. Passing the pool
   *  in means selecting a passage is a synchronous filter rather than a
   *  network round trip, which removes the loading phase entirely. */
  passagePool?: PoolPassage[];
}

export function TypingExam({
  mode,
  durationSeconds,
  wpmTarget,
  lang = 'english',
  isEduquityReplica = false,
  passagePool = [],
}: TypingExamProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, loadUser } = useAuthStore();
  const store = useTypingStore();
  const { typedContent, originalContent, elapsedSeconds } = useTypingEngine(lang);
  const isHindiMode = lang === 'hindi';
  const newEngine = useNewTypingEngine(isHindiMode ? 'english' : lang);
  const effectiveNewEngine = isHindiMode ? null : newEngine;
  const submitMutation = useSubmitTest();
  const directSubmitMutation = useDirectSubmit();
  const startTestMutation = useStartTest();
  const [result, setResult] = useState<any>(null);
  const [showResult, setShowResult] = useState(false);
  const [passage, setPassage] = useState<any>(null);
  const sets = getPracticeSets(mode);
  const [selectedSet, setSelectedSet] = useState<PracticeSet | null>(null);
  // Practice modes have nothing to declare, so their button is live on arrival.
  const [agreed, setAgreed] = useState(() => !requiresDeclaration(mode));
  // With the pool already in hand there is nothing to wait for, and passage-set
  // selection now lives on the instructions page itself — so the session opens
  // on a real screen rather than a spinner or a chooser.
  const [phase, setPhase] = useState<
    'instructions' | 'typing' | 'submitting' | 'result'
  >('instructions');
  const [showAuth, setShowAuth] = useState(false);

  // Modes without passage sets have their passage picked on arrival; the rest
  // wait for the set dropdown.
  useEffect(() => {
    if (sets.length === 0) initTest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  useEffect(() => {
    if (store.isComplete && !showResult && phase === 'typing') submitTest();
  }, [store.isComplete, phase]);

  useEffect(() => {
    if (phase === 'result') {
      if (document.fullscreenElement) document.exitFullscreen();
    }
  }, [phase]);

  // The vendor chrome now runs from instructions through to the result, so the
  // site navbar stays down for the whole session — one frame, start to finish.
  useEffect(() => {
    store.setNavHidden(true);
    return () => useTypingStore.getState().setNavHidden(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Synchronous. Picks from the server-supplied pool and shows the
   *  instructions immediately; registering the attempt happens afterwards and
   *  never blocks the candidate. */
  const initTest = (practiceSet?: number) => {
    store.reset();

    const category = mode.startsWith('ssc_chsl')
      ? 'ssc_chsl'
      : mode.startsWith('ssc_cgl')
        ? 'ssc_cgl'
        : undefined;
    const isSscMode = category !== undefined;

    const passageData =
      pickPassage(passagePool, {
        category,
        language: lang,
        practiceSet,
        examLength: isSscMode,
      }) ?? null;

    setPassage(passageData);

    // 'local' until the server hands back a real id. Submission already falls
    // back to direct-submit when the id is still local, so nothing is lost if
    // registration is slow or fails.
    store.startTest(
      'local',
      mode,
      passageData?.content ?? FALLBACK_PASSAGE,
      durationSeconds
    );
    setPhase('instructions');

    if (!user || !passageData) return;

    // Fire and forget: the test id is only needed at submit time, minutes away.
    startTestMutation
      .mutateAsync({
        mode,
        passage_id: passageData.id,
        duration_seconds: durationSeconds,
      })
      .then((test) => {
        if (test?.test_id) useTypingStore.getState().setTestId(test.test_id);
      })
      .catch(() => {
        /* stays 'local'; direct-submit handles it */
      });
  };

  const startTyping = () => {
    setPhase('typing');
    try { document.documentElement.requestFullscreen(); } catch {}
  };

  const submitTest = async () => {
    if (phase === 'submitting') return;
    setPhase('submitting');
    setShowResult(true);

    const typedContent = ENABLE_NEW_TYPING_ENGINE && effectiveNewEngine ? effectiveNewEngine.getTypedText() : store.typedContent;
    const keystrokeEvents = ENABLE_NEW_TYPING_ENGINE && effectiveNewEngine ? effectiveNewEngine.getKeystrokes() : store.keystrokeEvents;
    const elapsedSeconds = ENABLE_NEW_TYPING_ENGINE && effectiveNewEngine
      ? Math.max(1, Math.floor(effectiveNewEngine.getTelemetry().elapsed_ms / 1000)) 
      : store.elapsedSeconds;

    const wpm = ENABLE_NEW_TYPING_ENGINE && effectiveNewEngine ? effectiveNewEngine.getWpm() : store.wpm;
    const accuracy = ENABLE_NEW_TYPING_ENGINE && effectiveNewEngine ? effectiveNewEngine.getAccuracy() : store.accuracy;
    const errors = ENABLE_NEW_TYPING_ENGINE && effectiveNewEngine ? effectiveNewEngine.getMistakes() : store.errors;
    const backspaces = ENABLE_NEW_TYPING_ENGINE && effectiveNewEngine
      ? effectiveNewEngine.getKeystrokes().filter((e: any) => e.is_backspace).length
      : store.backspaces;

    let submissionSuccess = false;
    let resultData: any = null;

    try {
      resultData = await submitMutation.mutateAsync({
        testId: store.testId || 'local',
        typed_content: typedContent,
        keystroke_events: keystrokeEvents,
        time_taken_seconds: elapsedSeconds,
      });
      submissionSuccess = true;
    } catch {
      // Fall back to direct-submit if primary submission failed
      if (passage && user) {
        try {
          resultData = await directSubmitMutation.mutateAsync({
            mode,
            passage_id: passage.id,
            duration_seconds: durationSeconds,
            typed_content: typedContent,
            keystroke_events: keystrokeEvents,
            time_taken_seconds: elapsedSeconds,
          });
          submissionSuccess = true;
        } catch {
          // offline/failure
        }
      }
    }

    if (submissionSuccess && resultData) {
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
        typed_content: typedContent,
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
      const earnedXp = resultData.xp_earned || 0;
      if (earnedXp > 0 && user) {
        const newXp = (user.xp || 0) + earnedXp;
        const newLevel = Math.floor(Math.sqrt(newXp / 100)) + 1;
        useAuthStore.getState().updateUser({ xp: newXp, level: newLevel });
      }
      loadUser();
      setPhase('result');
      return;
    }

    // Offline / API failure enqueueing
    if (user && passage) {
      try {
        const grossWpm = calculateWPM(typedContent.length, elapsedSeconds);
        await SyncQueue.enqueue({
          userId: user.id,
          mode,
          passageId: passage.id,
          isDirectSubmit: store.testId === 'local',
          grossWpm,
          netWpm: wpm,
          accuracy,
          totalErrors: errors,
          trustScore: 1.0,
          payload: {
            mode,
            durationSeconds,
            typedContent,
            keystrokeEvents,
            timeTakenSeconds: elapsedSeconds,
          },
        });
        toast.success('Attempt saved offline! It will sync when connection returns.');
      } catch (err) {
        console.error('Failed to enqueue attempt to offline database:', err);
      }
    }

    const clientResult = {
      net_wpm: wpm,
      accuracy: accuracy,
      gross_wpm: calculateWPM(typedContent.length, elapsedSeconds),
      key_depression_count: typedContent.length,
      total_errors: errors,
      backspace_count: backspaces,
      is_qualified: wpm >= (wpmTarget || 35) && accuracy >= 95,
    };
    setResult(clientResult);
    saveTestResult({
      wpm,
      accuracy,
      mode,
      qualified: wpm >= (wpmTarget || 35) && accuracy >= 95,
      duration: durationSeconds,
      gross_wpm: clientResult.gross_wpm,
      total_errors: errors,
      key_depression_count: typedContent.length,
      backspace_count: backspaces,
      typed_content: typedContent,
      original_content: store.originalContent,
    });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    window.dispatchEvent(new CustomEvent('dashboard-invalidate'));
    setPhase('result');
    blastConfetti();
  };

  const content = (() => {
    if (phase === 'instructions') {
      return (
        <ExamInstructions
          mode={mode}
          durationSeconds={durationSeconds}
          wpmTarget={wpmTarget}
          lang={lang}
          sets={sets}
          selectedSet={selectedSet || undefined}
          onSelectSet={(set) => {
            // No sign-in gate here. Guests take the full test and are asked to
            // create an account on the results screen, where there is a score
            // worth saving. Attempts are kept locally until then.
            setSelectedSet(set);
            initTest(set.number);
          }}
          agreed={agreed}
          onAgreedChange={setAgreed}
          onBegin={startTyping}
        />
      );
    }

    if (phase === 'submitting') {
      // Still inside the vendor frame — leaving it mid-session would break the
      // one continuity this flow is built on.
      return (
        <ExamChrome postLabel={getModeDisplayName(mode)}>
          <div className="relative flex flex-1 items-center justify-center px-5 py-24">
            <div className="text-center">
              <KeyLoader />
              <p className="mt-5 text-base font-bold">Evaluating your test</p>
              <p className="mt-1.5 text-[13px] text-exam-muted">
                Running the SSC error engine over every word.
              </p>
            </div>
          </div>
        </ExamChrome>
      );
    }

    if (phase === 'result' && result) {
      return (
        <ResultScreen
          result={result}
          mode={mode}
          lang={lang}
          wpmTarget={wpmTarget}
          router={router}
          originalContent={store.originalContent}
          typedContent={ENABLE_NEW_TYPING_ENGINE && effectiveNewEngine ? effectiveNewEngine.getTypedText() : store.typedContent}
          onRetry={() => {
            // Re-enter the flow in place rather than reloading — a full reload
            // discards the query cache and re-runs auth for no benefit.
            setResult(null);
            setShowResult(false);
            setSelectedSet(null);
            setAgreed(!requiresDeclaration(mode));
            if (sets.length > 0) setPhase('instructions');
            else initTest();
          }}
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
        newEngine={ENABLE_NEW_TYPING_ENGINE ? effectiveNewEngine : undefined}
      />
    );
  })();

  return (
    <>
      {content}
      {showAuth && (
        <AuthPrompt
          onClose={() => setShowAuth(false)}
          onSuccess={() => setShowAuth(false)}
        />
      )}
    </>
  );
}
