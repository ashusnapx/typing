'use client';

import { useCallback, useRef, useEffect } from 'react';
import { useTypingStore } from '@/store/typing-store';
import { KeystrokeEvent } from '@/types';
import { transliterateEnglishToHindi } from '@/lib/hindi-transliteration';

export function useTypingEngine(lang?: 'english' | 'hindi', strict?: boolean, requireCapsLock?: boolean) {
  const {
    originalContent,
    typedContent,
    isActive,
    isComplete,
    startTime,
    keystrokeEvents,
    addKeystroke,
    updateTypedContent,
    updateMetrics,
    completeTest,
    tick,
    elapsedSeconds,
  } = useTypingStore();

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastCharTime = useRef<number>(0);
  const englishBuffer = useRef<string>('');

  const isHindi = lang === 'hindi';

  useEffect(() => {
    if (isActive && !isComplete) {
      intervalRef.current = setInterval(tick, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, isComplete, tick]);

  useEffect(() => {
    if (isActive) {
      englishBuffer.current = '';
    }
  }, [isActive]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isActive || isComplete) return;

    if (e.ctrlKey || e.altKey || e.metaKey) return;

    e.preventDefault();

    const now = Date.now();
    const timestamp_ms = now - (startTime || now);
    const duration_ms = lastCharTime.current > 0 ? now - lastCharTime.current : 0;
    lastCharTime.current = now;

    const key = e.key;
    const isBackspace = key === 'Backspace';

    let newContent = typedContent;
    let expectedChar = '';

    if (isHindi) {
      if (isBackspace) {
        englishBuffer.current = englishBuffer.current.slice(0, -1);
      } else if (key === 'Tab') {
        return;
      } else if (key.length === 1 && /^[a-zA-Z]$/.test(key)) {
        englishBuffer.current += key;
      } else if (key.length === 1 && /[\u0900-\u097F]/.test(key)) {
        englishBuffer.current += key;
      } else if (key === ' ') {
        englishBuffer.current += ' ';
      }
      const hindiText = transliterateEnglishToHindi(englishBuffer.current);
      newContent = hindiText;
      expectedChar = originalContent[typedContent.length] || '';
    } else {
      if (isBackspace) {
        newContent = typedContent.slice(0, -1);
      } else if (key === 'Tab') {
        return;
      } else if (key === 'Enter') {
        newContent = typedContent + '\n';
        expectedChar = originalContent[typedContent.length] || '';
      } else if (key.length === 1) {
        newContent = typedContent + key;
        expectedChar = originalContent[typedContent.length] || '';
      }
    }

    const expected = originalContent[typedContent.length] || '';
    const effectiveKey = key === 'Enter' ? '\n' : key;
    const isError = effectiveKey.length === 1 && effectiveKey !== expected && !isBackspace;

    if (requireCapsLock && !isBackspace && expected !== '' && /[A-Z]/.test(expected) && !e.getModifierState('CapsLock')) {
      const event: KeystrokeEvent = {
        key,
        timestamp_ms,
        duration_ms: 0,
        is_error: true,
        is_backspace: false,
        cursor_position: typedContent.length,
        expected_char: expected,
      };
      addKeystroke(event);
      return;
    }

    const event: KeystrokeEvent = {
      key,
      timestamp_ms,
      duration_ms,
      is_error: isError,
      is_backspace: isBackspace,
      cursor_position: newContent.length,
      expected_char: expectedChar,
    };

    addKeystroke(event);

    if (strict && isError && !isBackspace) {
      return;
    }

    updateTypedContent(newContent);

    const correctChars = newContent.split('').filter((c, i) => c === originalContent[i]).length;
    const totalChars = newContent.length;
    const errors = totalChars - correctChars;
    const backspaces = keystrokeEvents.filter((e) => e.is_backspace).length + (isBackspace ? 1 : 0);
    const wpm = totalChars > 0 ? Math.round((totalChars / 5) / (elapsedSeconds / 60)) : 0;
    const accuracy = totalChars > 0 ? Math.round((correctChars / totalChars) * 10000) / 100 : 100;

    updateMetrics(wpm, accuracy, errors, backspaces);

    if (newContent.length >= originalContent.length) {
      completeTest();
    }
  }, [isActive, isComplete, typedContent, originalContent, startTime, elapsedSeconds, addKeystroke, updateTypedContent, updateMetrics, completeTest, keystrokeEvents, isHindi, strict, requireCapsLock]);

  useEffect(() => {
    if (isActive) {
      window.addEventListener('keydown', handleKeyDown);
      lastCharTime.current = 0;
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive, handleKeyDown]);

  return {
    typedContent,
    originalContent,
    isActive,
    isComplete,
    elapsedSeconds,
    keystrokeEvents,
  };
}
