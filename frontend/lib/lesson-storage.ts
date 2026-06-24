import { STORAGE_KEYS } from '@/lib/config';
import { KeystrokeEvent } from '@/types';
import { processKeystrokeEvents } from './mastery-engine';
import { LEVELS } from './typing-curriculum';

export interface LessonProgress {
  lessonId: string;
  bestWpm: number;
  bestAccuracy: number;
  qualified: boolean;
  attempts: number;
  lastDate: string;
  completedDates: string[];
}

function storageKey(): string {
  try {
    const raw = localStorage.getItem('token');
    if (raw) {
      const payload = raw.split('.')[1];
      const decoded = JSON.parse(atob(payload));
      return `${STORAGE_KEYS.lessonProgress}_${decoded.sub}`;
    }
  } catch {}
  return STORAGE_KEYS.lessonProgress;
}

function getAll(): Record<string, LessonProgress> {
  try {
    const raw = localStorage.getItem(storageKey());
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, LessonProgress>;
  } catch {
    return {};
  }
}

function save(all: Record<string, LessonProgress>): void {
  try {
    localStorage.setItem(storageKey(), JSON.stringify(all));
  } catch {}
}

export function saveLessonProgress(
  lessonId: string,
  wpm: number,
  accuracy: number,
  qualified: boolean,
  keystrokeEvents?: KeystrokeEvent[]
): LessonProgress {
  const all = getAll();
  const current = all[lessonId];
  const now = new Date().toISOString();

  // If keystrokeEvents are provided, process them through the mastery engine
  if (keystrokeEvents && keystrokeEvents.length > 0) {
    try {
      processKeystrokeEvents(keystrokeEvents);
    } catch (err) {
      console.error('Error processing keystrokes in mastery engine:', err);
    }
  }

  if (current) {
    const isBetter = wpm > current.bestWpm || (wpm === current.bestWpm && accuracy > current.bestAccuracy);
    if (isBetter) {
      current.bestWpm = wpm;
      current.bestAccuracy = accuracy;
      current.qualified = qualified;
      current.attempts += 1;
      current.lastDate = now;
      current.completedDates.push(now);
    } else {
      current.attempts += 1;
      current.lastDate = now;
    }
    all[lessonId] = current;
    save(all);
    return current;
  }

  const entry: LessonProgress = {
    lessonId,
    bestWpm: wpm,
    bestAccuracy: accuracy,
    qualified,
    attempts: 1,
    lastDate: now,
    completedDates: [now],
  };
  all[lessonId] = entry;
  save(all);
  return entry;
}

export function getLessonProgress(lessonId: string): LessonProgress | null {
  const all = getAll();
  return all[lessonId] || null;
}

export function getAllLessonProgress(): Record<string, LessonProgress> {
  return getAll();
}

export function getOverallProgress(): { completed: number; total: number; avgWpm: number; avgAccuracy: number; qualifiedCount: number } {
  const all = getAll();
  const entries = Object.values(all);
  
  // Calculate total lessons dynamically from levels
  let total = 0;
  try {
    total = LEVELS.reduce((sum, lvl) => sum + (lvl.lessons?.length || 0), 0);
  } catch {
    total = 45; // fallback
  }

  const completed = entries.length;
  const avgWpm = entries.length > 0 ? entries.reduce((s, e) => s + e.bestWpm, 0) / entries.length : 0;
  const avgAccuracy = entries.length > 0 ? entries.reduce((s, e) => s + e.bestAccuracy, 0) / entries.length : 0;
  const qualifiedCount = entries.filter(e => e.qualified).length;
  return { completed, total, avgWpm, avgAccuracy, qualifiedCount };
}

export function getCompletionTimeline(): { lessonId: string; wpm: number; accuracy: number; date: string; qualified: boolean }[] {
  const all = getAll();
  return Object.values(all)
    .filter(e => e.completedDates.length > 0)
    .map(e => ({
      lessonId: e.lessonId,
      wpm: e.bestWpm,
      accuracy: e.bestAccuracy,
      date: e.completedDates[0],
      qualified: e.qualified,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export interface KeyAccuracyData {
  key: string;
  correct: number;
  incorrect: number;
  avgResponseTimeMs: number;
}

function keyAccuracyKey(): string {
  try {
    const raw = localStorage.getItem('token');
    if (raw) {
      const payload = raw.split('.')[1];
      const decoded = JSON.parse(atob(payload));
      return `key_accuracy_${decoded.sub}`;
    }
  } catch {}
  return 'key_accuracy';
}

function getKeyAccuracyRaw(): Record<string, KeyAccuracyData> {
  try {
    const raw = localStorage.getItem(keyAccuracyKey());
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveKeyAccuracyRaw(data: Record<string, KeyAccuracyData>): void {
  try {
    localStorage.setItem(keyAccuracyKey(), JSON.stringify(data));
  } catch {}
}

export function saveKeyAccuracy(events: { key: string; correct: boolean; responseTimeMs: number }[]): void {
  const all = getKeyAccuracyRaw();
  for (const evt of events) {
    const k = evt.key.toLowerCase();
    const existing = all[k] || { key: k, correct: 0, incorrect: 0, avgResponseTimeMs: 0 };
    if (evt.correct) {
      existing.correct += 1;
    } else {
      existing.incorrect += 1;
    }
    existing.avgResponseTimeMs = existing.avgResponseTimeMs
      ? (existing.avgResponseTimeMs + evt.responseTimeMs) / 2
      : evt.responseTimeMs;
    all[k] = existing;
  }
  saveKeyAccuracyRaw(all);
}

export function getKeyAccuracy(): Record<string, KeyAccuracyData> {
  return getKeyAccuracyRaw();
}

export function getWeakestKeys(n: number = 5): KeyAccuracyData[] {
  const all = getKeyAccuracyRaw();
  return Object.values(all)
    .filter(k => k.incorrect + k.correct > 0)
    .sort((a, b) => {
      const aErrRate = a.incorrect / (a.correct + a.incorrect);
      const bErrRate = b.incorrect / (b.correct + b.incorrect);
      return bErrRate - aErrRate;
    })
    .slice(0, n);
}

export function clearLessonProgress(): void {
  try {
    localStorage.removeItem(storageKey());
  } catch {}
}

