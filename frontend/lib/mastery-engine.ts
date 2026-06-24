import { KeystrokeEvent } from '@/types';
import { fingerMap, FingerZone } from '@/components/learn/keyboard-layout';

export interface KeyMastery {
  key: string;
  accuracy: number; // 0-100
  speed: number;    // 0-100 (derived from response time)
  consistency: number; // 0-100 (speed stability)
  masteryScore: number; // 0-100
  attempts: number;
  correctCount: number;
  incorrectCount: number;
  avgResponseTimeMs: number;
  responseTimes: number[]; // Store last 10 response times
  // Spaced Repetition:
  reviewBucket: number; // 0 to 5
  lastPracticeTime: string; // ISO
  nextReviewTime: string; // ISO
  intervalDays: number;
}

export interface BigramMastery {
  bigram: string;
  accuracy: number;
  avgTimeMs: number;
  attempts: number;
  correctCount: number;
  incorrectCount: number;
}

export interface TrigramMastery {
  trigram: string;
  accuracy: number;
  avgTimeMs: number;
  attempts: number;
  correctCount: number;
  incorrectCount: number;
}

export interface FingerAnalytics {
  finger: FingerZone;
  accuracy: number;
  avgResponseTimeMs: number;
  totalKeystrokes: number;
  errorCount: number;
}

export interface MasteryData {
  keys: Record<string, KeyMastery>;
  bigrams: Record<string, BigramMastery>;
  trigrams: Record<string, TrigramMastery>;
  lastUpdated: string;
}

const COMMON_BIGRAMS = [
  'th', 'he', 'in', 'er', 'an', 're', 'on', 'at', 'en', 'es',
  'it', 'te', 'or', 'st', 'nt', 'is', 'to', 'as', 'ou', 'ti'
];

const COMMON_TRIGRAMS = [
  'the', 'and', 'ing', 'ent', 'ion', 'her', 'for', 'tha', 'nth', 'int',
  'tis', 'tio', 'ter', 'est', 'ers', 'ati', 'hat', 'ate', 'all', 'eth'
];

const BUCKET_INTERVALS = [0.5, 1, 2, 4, 8, 16]; // Days

function getStorageKey(): string {
  try {
    const raw = localStorage.getItem('token');
    if (raw) {
      const payload = raw.split('.')[1];
      const decoded = JSON.parse(atob(payload));
      return `typing_mastery_data_${decoded.sub}`;
    }
  } catch {}
  return 'typing_mastery_data_default';
}

export function loadMasteryData(): MasteryData {
  if (typeof window === 'undefined') {
    return { keys: {}, bigrams: {}, trigrams: {}, lastUpdated: new Date().toISOString() };
  }
  try {
    const key = getStorageKey();
    const raw = localStorage.getItem(key);
    if (raw) {
      return JSON.parse(raw) as MasteryData;
    }
  } catch {}
  return { keys: {}, bigrams: {}, trigrams: {}, lastUpdated: new Date().toISOString() };
}

export function saveMasteryData(data: MasteryData): void {
  if (typeof window === 'undefined') return;
  try {
    const key = getStorageKey();
    data.lastUpdated = new Date().toISOString();
    localStorage.setItem(key, JSON.stringify(data));
  } catch {}
}

export function processKeystrokeEvents(events: KeystrokeEvent[]): MasteryData {
  const data = loadMasteryData();
  const now = new Date().toISOString();

  // 1. Process Keys
  events.forEach((evt) => {
    // We only care about normal typable characters (length 1) and spaces, not Backspace directly.
    if (evt.is_backspace) return;

    let keyChar = (evt.expected_char || evt.key || '').toLowerCase();
    if (!keyChar) return;
    if (keyChar === '\n') keyChar = ' '; // normalize enter to space for character level maps

    // initialize key if not present
    if (!data.keys[keyChar]) {
      data.keys[keyChar] = {
        key: keyChar,
        accuracy: 100,
        speed: 0,
        consistency: 100,
        masteryScore: 0,
        attempts: 0,
        correctCount: 0,
        incorrectCount: 0,
        avgResponseTimeMs: 0,
        responseTimes: [],
        reviewBucket: 0,
        lastPracticeTime: now,
        nextReviewTime: now,
        intervalDays: 0.5,
      };
    }

    const km = data.keys[keyChar];
    km.attempts += 1;
    km.lastPracticeTime = now;

    if (evt.is_error) {
      km.incorrectCount += 1;
    } else {
      km.correctCount += 1;
      // Cap response times to 2000ms to avoid outliers
      const duration = Math.min(2000, Math.max(10, evt.duration_ms));
      km.responseTimes.push(duration);
      if (km.responseTimes.length > 10) {
        km.responseTimes.shift();
      }
    }

    // Recalculate stats
    km.accuracy = Math.round((km.correctCount / km.attempts) * 100);

    if (km.responseTimes.length > 0) {
      const sum = km.responseTimes.reduce((a, b) => a + b, 0);
      km.avgResponseTimeMs = Math.round(sum / km.responseTimes.length);

      // Speed Score (500ms or lower is 100, 1500ms is 0)
      km.speed = Math.max(0, Math.min(100, Math.round(100 - (km.avgResponseTimeMs - 300) / 10)));

      // Consistency: standard deviation relative to mean
      const mean = km.avgResponseTimeMs;
      const variance = km.responseTimes.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / km.responseTimes.length;
      const stdDev = Math.sqrt(variance);
      km.consistency = Math.max(0, Math.min(100, Math.round(100 - (stdDev / Math.max(1, mean)) * 100)));
    } else {
      km.speed = 0;
      km.consistency = 100;
    }

    // Spaced Repetition (Leitner System) promotion/demotion
    if (km.attempts >= 5) {
      if (km.accuracy >= 92 && km.avgResponseTimeMs < 500) {
        // Promote
        km.reviewBucket = Math.min(5, km.reviewBucket + 1);
      } else if (km.accuracy < 90 || km.avgResponseTimeMs > 800) {
        // Demote
        km.reviewBucket = Math.max(0, km.reviewBucket - 1);
      }
      km.intervalDays = BUCKET_INTERVALS[km.reviewBucket];
      const nextTime = new Date();
      nextTime.setMinutes(nextTime.getMinutes() + km.intervalDays * 24 * 60);
      km.nextReviewTime = nextTime.toISOString();
    }

    // Mastery Score = 0.5*Acc + 0.3*Speed + 0.2*Consistency
    // Scaled by attempts up to 10 attempts
    const rawMastery = km.accuracy * 0.5 + km.speed * 0.3 + km.consistency * 0.2;
    const scalingFactor = Math.min(1, km.attempts / 10);
    km.masteryScore = Math.round(rawMastery * scalingFactor);
  });

  // 2. Process Bigrams and Trigrams
  // Filter out backspaces first to get consecutive actual keystrokes
  const flowEvents = events.filter((e) => !e.is_backspace);

  for (let i = 0; i < flowEvents.length - 1; i++) {
    const e1 = flowEvents[i];
    const e2 = flowEvents[i + 1];

    const c1 = (e1.expected_char || e1.key || '').toLowerCase();
    const c2 = (e2.expected_char || e2.key || '').toLowerCase();

    if (c1.length !== 1 || c2.length !== 1) continue;

    const bigramStr = c1 + c2;

    if (COMMON_BIGRAMS.includes(bigramStr)) {
      if (!data.bigrams[bigramStr]) {
        data.bigrams[bigramStr] = {
          bigram: bigramStr,
          accuracy: 100,
          avgTimeMs: 0,
          attempts: 0,
          correctCount: 0,
          incorrectCount: 0,
        };
      }
      const bm = data.bigrams[bigramStr];
      bm.attempts += 1;
      if (e1.is_error || e2.is_error) {
        bm.incorrectCount += 1;
      } else {
        bm.correctCount += 1;
        const duration = Math.min(2000, Math.max(10, e2.duration_ms));
        bm.avgTimeMs = bm.avgTimeMs === 0 ? duration : Math.round((bm.avgTimeMs * 4 + duration) / 5);
      }
      bm.accuracy = Math.round((bm.correctCount / bm.attempts) * 100);
    }

    // Trigrams
    if (i < flowEvents.length - 2) {
      const e3 = flowEvents[i + 2];
      const c3 = (e3.expected_char || e3.key || '').toLowerCase();

      if (c3.length !== 1) continue;

      const trigramStr = c1 + c2 + c3;
      if (COMMON_TRIGRAMS.includes(trigramStr)) {
        if (!data.trigrams[trigramStr]) {
          data.trigrams[trigramStr] = {
            trigram: trigramStr,
            accuracy: 100,
            avgTimeMs: 0,
            attempts: 0,
            correctCount: 0,
            incorrectCount: 0,
          };
        }
        const tm = data.trigrams[trigramStr];
        tm.attempts += 1;
        if (e1.is_error || e2.is_error || e3.is_error) {
          tm.incorrectCount += 1;
        } else {
          tm.correctCount += 1;
          const duration = Math.min(2000, Math.max(10, e2.duration_ms + e3.duration_ms));
          tm.avgTimeMs = tm.avgTimeMs === 0 ? duration : Math.round((tm.avgTimeMs * 4 + duration) / 5);
        }
        tm.accuracy = Math.round((tm.correctCount / tm.attempts) * 100);
      }
    }
  }

  saveMasteryData(data);
  return data;
}

export function getFingerAnalytics(): FingerAnalytics[] {
  const data = loadMasteryData();
  const fingerStats: Record<FingerZone, { correct: number; total: number; totalTime: number; timeCount: number; errors: number }> = {} as any;

  // Initialize
  const zones: FingerZone[] = ['lp', 'lr', 'lm', 'li', 'ri', 'rm', 'rr', 'rp', 'thumb'];
  zones.forEach((z) => {
    fingerStats[z] = { correct: 0, total: 0, totalTime: 0, timeCount: 0, errors: 0 };
  });

  Object.values(data.keys).forEach((km) => {
    const finger = fingerMap[km.key] || 'rp';
    if (fingerStats[finger]) {
      fingerStats[finger].correct += km.correctCount;
      fingerStats[finger].total += km.attempts;
      fingerStats[finger].errors += km.incorrectCount;
      if (km.avgResponseTimeMs > 0) {
        fingerStats[finger].totalTime += km.avgResponseTimeMs * km.correctCount;
        fingerStats[finger].timeCount += km.correctCount;
      }
    }
  });

  return zones.map((zone) => {
    const stat = fingerStats[zone];
    const accuracy = stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 100;
    const avgResponseTimeMs = stat.timeCount > 0 ? Math.round(stat.totalTime / stat.timeCount) : 0;
    return {
      finger: zone,
      accuracy,
      avgResponseTimeMs,
      totalKeystrokes: stat.total,
      errorCount: stat.errors,
    };
  });
}

export function getWeakestKeys(n: number = 5): KeyMastery[] {
  const data = loadMasteryData();
  return Object.values(data.keys)
    .filter((km) => km.attempts >= 3)
    .sort((a, b) => a.masteryScore - b.masteryScore)
    .slice(0, n);
}

export function getWeakestBigrams(n: number = 3): BigramMastery[] {
  const data = loadMasteryData();
  return Object.values(data.bigrams)
    .filter((bm) => bm.attempts >= 3)
    .sort((a, b) => a.accuracy - b.accuracy || b.avgTimeMs - a.avgTimeMs)
    .slice(0, n);
}

export function getWeakestTrigrams(n: number = 3): TrigramMastery[] {
  const data = loadMasteryData();
  return Object.values(data.trigrams)
    .filter((tm) => tm.attempts >= 3)
    .sort((a, b) => a.accuracy - b.accuracy || b.avgTimeMs - a.avgTimeMs)
    .slice(0, n);
}

export function getRecentlyForgottenKeys(n: number = 5): KeyMastery[] {
  const data = loadMasteryData();
  const now = new Date();
  return Object.values(data.keys)
    .filter((km) => km.attempts >= 5 && new Date(km.nextReviewTime) <= now)
    .sort((a, b) => new Date(a.nextReviewTime).getTime() - new Date(b.nextReviewTime).getTime())
    .slice(0, n);
}

export function getMasteryClassification(score: number): 'Beginner' | 'Learning' | 'Proficient' | 'Mastered' {
  if (score < 40) return 'Beginner';
  if (score < 70) return 'Learning';
  if (score < 90) return 'Proficient';
  return 'Mastered';
}
