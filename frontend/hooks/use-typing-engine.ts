'use client';

import { useCallback, useRef, useEffect } from 'react';
import { useTypingStore } from '@/store/typing-store';
import { KeystrokeEvent } from '@/types';

export function useTypingEngine() {
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

  useEffect(() => {
    if (isActive && !isComplete) {
      intervalRef.current = setInterval(tick, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, isComplete, tick]);

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

    if (isBackspace) {
      newContent = typedContent.slice(0, -1);
    } else if (key === 'Tab') {
      return;
    } else if (key.length === 1) {
      newContent = typedContent + key;
      expectedChar = originalContent[typedContent.length] || '';
    }

    const expected = originalContent[typedContent.length] || '';
    const isError = key.length === 1 && key !== expected && !isBackspace;

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
  }, [isActive, isComplete, typedContent, originalContent, startTime, elapsedSeconds, addKeystroke, updateTypedContent, updateMetrics, completeTest, keystrokeEvents]);

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
