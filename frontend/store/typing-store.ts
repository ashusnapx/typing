'use client';

import { create } from 'zustand';
import { KeystrokeEvent, TestMode } from '@/types';

interface TypingState {
  testId: string | null;
  mode: TestMode | null;
  originalContent: string;
  typedContent: string;
  cursorPosition: number;
  isActive: boolean;
  isComplete: boolean;
  startTime: number | null;
  elapsedSeconds: number;
  totalDuration: number;
  keystrokeEvents: KeystrokeEvent[];

  wpm: number;
  accuracy: number;
  errors: number;
  backspaces: number;

  navHidden: boolean;
  setNavHidden: (hidden: boolean) => void;

  startTest: (testId: string, mode: TestMode, content: string, duration: number) => void;
  /** Attach the server-side test id once registration completes. The test
   *  starts as 'local' so the candidate is never made to wait for it. */
  setTestId: (testId: string) => void;
  resumeSession: (params: {
    testId: string;
    mode: TestMode;
    content: string;
    duration: number;
    startTime: number;
    elapsedSeconds: number;
    typedContent: string;
  }) => void;
  addKeystroke: (event: KeystrokeEvent) => void;
  updateTypedContent: (content: string) => void;
  updateMetrics: (wpm: number, accuracy: number, errors: number, backspaces: number) => void;
  tick: () => void;
  completeTest: () => void;
  reset: () => void;
}

export const useTypingStore = create<TypingState>((set, get) => ({
  testId: null,
  mode: null,
  originalContent: '',
  typedContent: '',
  cursorPosition: 0,
  isActive: false,
  isComplete: false,
  startTime: null,
  elapsedSeconds: 0,
  totalDuration: 0,
  keystrokeEvents: [],
  wpm: 0,
  accuracy: 100,
  errors: 0,
  backspaces: 0,

  navHidden: false,

  setNavHidden: (hidden) => set({ navHidden: hidden }),

  setTestId: (testId) => set({ testId }),

  startTest: (testId, mode, content, duration) => {
    set({
      testId,
      mode,
      originalContent: content,
      typedContent: '',
      cursorPosition: 0,
      isActive: true,
      isComplete: false,
      startTime: Date.now(),
      elapsedSeconds: 0,
      totalDuration: duration,
      keystrokeEvents: [],
      wpm: 0,
      accuracy: 100,
      errors: 0,
      backspaces: 0,
    });
  },

  resumeSession: (params) => {
    set({
      testId: params.testId,
      mode: params.mode,
      originalContent: params.content,
      typedContent: params.typedContent,
      cursorPosition: params.typedContent.length,
      isActive: true,
      isComplete: false,
      startTime: params.startTime,
      elapsedSeconds: params.elapsedSeconds,
      totalDuration: params.duration,
      keystrokeEvents: [],
      wpm: 0,
      accuracy: 100,
      errors: 0,
      backspaces: 0,
    });
  },

  addKeystroke: (event) => {
    set((state) => ({
      keystrokeEvents: [...state.keystrokeEvents, event],
    }));
  },

  updateTypedContent: (content) => {
    set({ typedContent: content, cursorPosition: content.length });
  },

  updateMetrics: (wpm, accuracy, errors, backspaces) => {
    set({ wpm, accuracy, errors, backspaces });
  },

  tick: () => {
    const state = get();
    if (!state.isActive || state.isComplete) return;
    const elapsed = Math.floor((Date.now() - (state.startTime || Date.now())) / 1000);
    if (elapsed >= state.totalDuration) {
      set({ elapsedSeconds: state.totalDuration, isComplete: true, isActive: false });
    } else {
      set({ elapsedSeconds: elapsed });
    }
  },

  completeTest: () => {
    set({ isComplete: true, isActive: false });
  },

  reset: () => {
    set({
      testId: null,
      mode: null,
      originalContent: '',
      typedContent: '',
      cursorPosition: 0,
      isActive: false,
      isComplete: false,
      startTime: null,
      elapsedSeconds: 0,
      totalDuration: 0,
      keystrokeEvents: [],
      wpm: 0,
      accuracy: 100,
      errors: 0,
      backspaces: 0,
      navHidden: false,
    });
  },
}));
