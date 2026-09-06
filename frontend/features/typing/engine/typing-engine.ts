import { useEffect, useRef, useCallback } from 'react';
import { useTypingStore } from '@/store/typing-store';
import { calculateRealtimeMetrics } from './metrics';
import { AntiCheatCollector } from './anti-cheat';
import { eventBus } from './event-bus';
import { DomRenderer } from './dom-renderer';
import { TypingSessionManager } from './typing-session';
import { transliterateEnglishToHindi } from '@/lib/hindi-transliteration';
import { EngineKeystroke } from './types';

export function useNewTypingEngine(
  lang?: 'english' | 'hindi',
  strict?: boolean,
  requireCapsLock?: boolean
) {
  const typedTextRef = useRef('');
  const positionRef = useRef(0);
  const mistakesRef = useRef(0);
  const elapsedMsRef = useRef(0);
  const backspacesRef = useRef(0);
  const startTimeRef = useRef<number | null>(null);
  const lastCharTimeRef = useRef<number>(0);
  const keystrokeEventsRef = useRef<EngineKeystroke[]>([]);

  const hindiBufferRef = useRef('');
  const prevTextareaValueRef = useRef('');

  const wpmRef = useRef(0);
  const accuracyRef = useRef(100);

  const antiCheat = useRef(new AntiCheatCollector());
  const sessionManager = useRef(new TypingSessionManager());
  const domRenderer = useRef<DomRenderer | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const { originalContent, isActive, isComplete, completeTest, tick } = useTypingStore();

  useEffect(() => {
    if (isActive && !isComplete) {
      intervalRef.current = setInterval(tick, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, isComplete, tick]);

  const setDomElements = useCallback((container: HTMLDivElement | null, caret: HTMLSpanElement | null) => {
    if (container) {
      domRenderer.current = new DomRenderer(container, caret);
    }
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isActive || isComplete) return;
    if (e.ctrlKey || e.altKey || e.metaKey) return;

    const key = e.key;
    const isBackspace = key === 'Backspace';
    const now = Date.now();

    // Start timer on first keystroke
    if (!startTimeRef.current) {
      startTimeRef.current = now;
      antiCheat.current.init();
      sessionManager.current.startAutoSave(
        'current_active_session',
        originalContent, 
        () => typedTextRef.current,
        () => positionRef.current,
        () => mistakesRef.current,
        () => elapsedMsRef.current,
        now
      );
    }

    const timestamp_ms = now - (startTimeRef.current || now);
    const duration_ms = lastCharTimeRef.current > 0 ? now - lastCharTimeRef.current : 0;
    lastCharTimeRef.current = now;

    const expected = originalContent[typedTextRef.current.length] || '';
    const effectiveKey = key === 'Enter' ? '\n' : key;
    const isError = effectiveKey.length === 1 && effectiveKey !== expected && !isBackspace;

    // Record timing signals for anti-cheat
    antiCheat.current.recordKeyDown(key);

    const isTargetInput = e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement;

    // CapsLock validation
    if (requireCapsLock && !isBackspace && expected !== '' && /[A-Z]/.test(expected) && !e.getModifierState('CapsLock')) {
      const keystrokeEvent: EngineKeystroke = {
        key,
        timestamp_ms,
        duration_ms: 0,
        is_error: true,
        is_backspace: false,
        cursor_position: typedTextRef.current.length,
        expected_char: expected,
      };
      keystrokeEventsRef.current.push(keystrokeEvent);
      if (!isTargetInput) {
        e.preventDefault();
      }
      return;
    }

    // Record keystroke event
    const keystrokeEvent: EngineKeystroke = {
      key,
      timestamp_ms,
      duration_ms,
      is_error: isError,
      is_backspace: isBackspace,
      cursor_position: typedTextRef.current.length + (isBackspace ? -1 : 1),
      expected_char: expected,
    };
    keystrokeEventsRef.current.push(keystrokeEvent);

    if (isTargetInput) {
      return;
    }

    e.preventDefault();

    let newContent = typedTextRef.current;
    
    if (isBackspace) {
      if (newContent.length > 0) {
        newContent = newContent.slice(0, -1);
        backspacesRef.current++;
      }
    } else if (key === 'Enter') {
      newContent += '\n';
    } else if (key.length === 1) {
      newContent += key;
    }

    if (strict && isError) {
      return;
    }

    if (isError) {
      mistakesRef.current++;
    }

    if (domRenderer.current) {
      const idx = typedTextRef.current.length;
      if (isBackspace) {
        domRenderer.current.updateChar(idx - 1, 'untyped');
      } else if (key.length === 1 || key === 'Enter') {
        domRenderer.current.updateChar(idx, isError ? 'incorrect' : 'correct');
      }
    }

    typedTextRef.current = newContent;
    positionRef.current = newContent.length;

    if (domRenderer.current) {
      domRenderer.current.updateCaret(positionRef.current);
    }

    const elapsedSeconds = startTimeRef.current ? Math.floor((Date.now() - startTimeRef.current) / 1000) : 0;
    const metrics = calculateRealtimeMetrics(
      typedTextRef.current,
      originalContent,
      elapsedSeconds,
      backspacesRef.current
    );

    wpmRef.current = metrics.wpm;
    accuracyRef.current = metrics.accuracy;

    eventBus.emit('metrics', metrics);

    if (typedTextRef.current.length >= originalContent.length) {
      completeTest();
      sessionManager.current.stopAutoSave();
      TypingSessionManager.clearSession('current_active_session');
    }
  }, [isActive, isComplete, originalContent, lang, strict, requireCapsLock, completeTest]);

  const handleTextareaInput = useCallback((val: string) => {
    const now = Date.now();
    if (!startTimeRef.current) {
      startTimeRef.current = now;
      antiCheat.current.init();
      sessionManager.current.startAutoSave(
        'current_active_session',
        originalContent,
        () => typedTextRef.current,
        () => positionRef.current,
        () => mistakesRef.current,
        () => elapsedMsRef.current,
        startTimeRef.current
      );
    }

    const isBackspace = val.length < typedTextRef.current.length;
    if (isBackspace) {
      backspacesRef.current++;
    }

    let typedVal = val;

    if (lang === 'hindi') {
      const prevRaw = prevTextareaValueRef.current;
      if (val.length > prevRaw.length) {
        const added = val.slice(prevRaw.length);
        hindiBufferRef.current += added;
      } else if (val.length < prevRaw.length) {
        const trimCount = prevRaw.length - val.length;
        hindiBufferRef.current = hindiBufferRef.current.slice(0, -trimCount);
      } else {
        hindiBufferRef.current = val;
      }
      prevTextareaValueRef.current = val;
      typedVal = transliterateEnglishToHindi(hindiBufferRef.current);
    }

    typedTextRef.current = typedVal;
    positionRef.current = typedVal.length;

    let mistakes = 0;
    for (let i = 0; i < typedVal.length; i++) {
      if (typedVal[i] !== originalContent[i]) {
        mistakes++;
      }
    }
    mistakesRef.current = mistakes;

    const elapsedSeconds = startTimeRef.current ? Math.floor((Date.now() - startTimeRef.current) / 1000) : 0;
    const metrics = calculateRealtimeMetrics(
      typedTextRef.current,
      originalContent,
      elapsedSeconds,
      backspacesRef.current
    );

    wpmRef.current = metrics.wpm;
    accuracyRef.current = metrics.accuracy;

    eventBus.emit('metrics', metrics);

    if (typedTextRef.current.length >= originalContent.length) {
      completeTest();
      sessionManager.current.stopAutoSave();
      TypingSessionManager.clearSession('current_active_session');
    }
  }, [originalContent, completeTest, lang]);

  const resumeEngineSession = useCallback((session: any) => {
    typedTextRef.current = session.typedText;
    positionRef.current = session.currentPosition;
    mistakesRef.current = session.mistakes;
    elapsedMsRef.current = session.elapsedMs;
    startTimeRef.current = session.startedAt;
    lastCharTimeRef.current = session.updatedAt;

    const elapsedSeconds = Math.floor(session.elapsedMs / 1000);
    const metrics = calculateRealtimeMetrics(
      session.typedText,
      originalContent,
      elapsedSeconds,
      backspacesRef.current
    );

    wpmRef.current = metrics.wpm;
    accuracyRef.current = metrics.accuracy;

    eventBus.emit('metrics', metrics);

    // Restart auto-save
    sessionManager.current.startAutoSave(
      session.sessionId,
      session.passageId,
      () => typedTextRef.current,
      () => positionRef.current,
      () => mistakesRef.current,
      () => elapsedMsRef.current,
      session.startedAt
    );
  }, [originalContent]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    antiCheat.current.recordKeyUp(e.key);
  }, []);

  useEffect(() => {
    if (isActive) {
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      antiCheat.current.destroy();
      sessionManager.current.stopAutoSave();
    };
  }, [isActive, handleKeyDown, handleKeyUp]);

  return {
    getTypedText: () => typedTextRef.current,
    getPosition: () => positionRef.current,
    getMistakes: () => mistakesRef.current,
    getWpm: () => wpmRef.current,
    getAccuracy: () => accuracyRef.current,
    getKeystrokes: () => keystrokeEventsRef.current,
    getTelemetry: () => {
      const telemetry = antiCheat.current.getTelemetry();
      return {
        ...telemetry,
        elapsed_ms: startTimeRef.current ? Date.now() - startTimeRef.current : 0,
      };
    },
    setDomElements,
    handleTextareaInput,
    resumeEngineSession,
  };
}
