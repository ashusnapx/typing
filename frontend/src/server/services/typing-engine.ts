import { errorEngine } from './error-engine';

export interface TypingMetrics {
  grossWpm: number;
  netWpm: number;
  accuracy: number;
  errorPercentage: number;
  keyDepressionCount: number;
  backspaceCount: number;
  pauseCount: number;
  totalPauseDuration: number;
  avgPauseDuration: number;
  longestPauseDuration: number;
  timeUtilizationPercentage: number;
  consistencyScore: number;
  typingRhythmScore: number;
  errorZones: Record<string, { errors: number; keys: string[] }>;
  weakWords: string[];
  commonMistypes: Record<string, number>;
  leftHandErrors: number;
  rightHandErrors: number;
  shiftKeyErrors: number;
  numberRowErrors: number;
}

interface CharTiming {
  key: string;
  time: number;
  duration: number;
}

interface PauseInfo {
  startMs: number;
  endMs: number;
  durationMs: number;
}

interface KeystrokeEvent {
  key: string;
  timestampMs: number;
  durationMs: number;
  isBackspace?: boolean;
  isError?: boolean;
}

interface SessionData {
  original: string;
  duration: number;
  events: KeystrokeEvent[];
  startTime: number;
  pauses: PauseInfo[];
  backspaces: number;
  totalChars: number;
  errorCount: number;
  corrections: number;
  charTimings: CharTiming[];
  lastEventTime: number | null;
}

export class TypingEngine {
  private static readonly PAUSE_THRESHOLD_MS = 2000;
  private static readonly LEFT_HAND_KEYS = new Set('qwertasdfgzxcvb');
  private static readonly RIGHT_HAND_KEYS = new Set('yuiophjklnm');
  private static readonly NUMBER_ROW_KEYS = new Set('1234567890');
  private static readonly SHIFT_KEYS = new Set('~!@#$%^&*()_+{}|:"<>?QWERTYUIOPASDFGHJKLZXCVBNM');
  private static readonly SESSION_TTL_MS = 30 * 60 * 1000;

  private sessions: Map<string, SessionData> = new Map();
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.cleanupTimer = setInterval(() => this.evictStale(), 60_000);
    this.cleanupTimer.unref();
  }

  dispose(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.sessions.clear();
  }

  private evictStale(): void {
    const now = Date.now();
    for (const [id, session] of this.sessions) {
      if (now - session.startTime > TypingEngine.SESSION_TTL_MS) {
        this.sessions.delete(id);
      }
    }
  }

  createSession(testId: string, originalContent: string, durationSeconds: number): string {
    this.sessions.set(testId, {
      original: originalContent,
      duration: durationSeconds,
      events: [],
      startTime: Date.now(),
      pauses: [],
      backspaces: 0,
      totalChars: 0,
      errorCount: 0,
      corrections: 0,
      charTimings: [],
      lastEventTime: null,
    });
    return testId;
  }

  recordEvent(testId: string, key: string, timestampMs: number, durationMs: number = 0): void {
    const session = this.sessions.get(testId);
    if (!session) return;

    const currentTime = Date.now();

    if (session.lastEventTime !== null) {
      const gap = currentTime - session.lastEventTime;
      if (gap > TypingEngine.PAUSE_THRESHOLD_MS) {
        session.pauses.push({
          startMs: Math.round(session.lastEventTime),
          endMs: Math.round(currentTime),
          durationMs: Math.round(gap),
        });
      }
    }

    session.lastEventTime = currentTime;

    const isBackspace = key === 'Backspace' || key === 'Delete';
    if (isBackspace) {
      session.backspaces += 1;
    }

    session.events.push({ key, timestampMs, durationMs, isBackspace });
    session.charTimings.push({ key, time: timestampMs, duration: durationMs });
  }

  computeMetrics(
    testId: string,
    typedContent: string,
    originalContent: string,
    timeTakenSeconds: number,
  ): TypingMetrics {
    const session = this.sessions.get(testId);
    if (!session) {
      return this.emptyMetrics();
    }

    const events = session.events;
    const charTimings = session.charTimings;
    const pauses = session.pauses;

    const keyDepressionCount = typedContent.length;
    const backspaceCount = session.backspaces;
    const pauseCount = pauses.length;

    let totalPauseDuration = 0;
    let avgPauseDuration = 0;
    let longestPauseDuration = 0;

    if (pauses.length > 0) {
      totalPauseDuration = pauses.reduce((sum, p) => sum + p.durationMs, 0) / 1000;
      avgPauseDuration = totalPauseDuration / pauses.length;
      longestPauseDuration = Math.max(...pauses.map(p => p.durationMs)) / 1000;
    }

    const totalDurationMs = timeTakenSeconds * 1000;
    let timeUtilizationPercentage = 0;
    if (totalDurationMs > 0) {
      const activeTime = Math.max(0, totalDurationMs - (totalPauseDuration * 1000));
      timeUtilizationPercentage = Math.round((activeTime / totalDurationMs) * 10000) / 100;
    }

    const consistencyScore = this.calculateConsistency(charTimings);
    const typingRhythmScore = this.calculateRhythm(charTimings);

    const [leftHandErrors, rightHandErrors, shiftKeyErrors, numberRowErrors] =
      this.analyzeHandErrors(events, originalContent);

    const weakWords = this.identifyWeakWords(typedContent, originalContent);
    const commonMistypes = this.findCommonMistypes(events, originalContent);
    const errorZones = this.generateErrorZones(events, originalContent);

    this.sessions.delete(testId);

    const report = errorEngine.evaluate(originalContent, typedContent, timeTakenSeconds);

    return {
      grossWpm: report.grossWpm,
      netWpm: report.netWpm,
      accuracy: report.accuracy,
      errorPercentage: report.errorPercentage,
      keyDepressionCount,
      backspaceCount,
      pauseCount,
      totalPauseDuration: Math.round(totalPauseDuration * 100) / 100,
      avgPauseDuration: Math.round(avgPauseDuration * 100) / 100,
      longestPauseDuration: Math.round(longestPauseDuration * 100) / 100,
      timeUtilizationPercentage,
      consistencyScore,
      typingRhythmScore,
      errorZones,
      weakWords,
      commonMistypes,
      leftHandErrors,
      rightHandErrors,
      shiftKeyErrors,
      numberRowErrors,
    };
  }

  private calculateConsistency(charTimings: CharTiming[]): number {
    if (charTimings.length < 10) return 100;

    const intervals: number[] = [];
    for (let i = 1; i < charTimings.length; i++) {
      const gap = charTimings[i].time - charTimings[i - 1].time;
      if (gap > 0 && gap < 5000) {
        intervals.push(gap);
      }
    }

    if (intervals.length === 0) return 0;

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((sum, i) => sum + (i - avgInterval) ** 2, 0) / intervals.length;
    const stdDev = Math.sqrt(variance);
    const cv = avgInterval > 0 ? stdDev / avgInterval : 1;
    const consistency = Math.max(0, Math.min(100, 100 - cv * 50));
    return Math.round(consistency * 100) / 100;
  }

  private calculateRhythm(charTimings: CharTiming[]): number {
    if (charTimings.length < 20) return 100;

    const bigrams: number[] = [];
    for (let i = 1; i < charTimings.length; i++) {
      const gap = charTimings[i].time - charTimings[i - 1].time;
      if (gap > 0 && gap < 3000) {
        bigrams.push(gap);
      }
    }

    if (bigrams.length === 0) return 0;

    const smooth = bigrams.reduce((a, b) => a + b, 0) / bigrams.length;
    const rhythmPenalties = bigrams.filter(b => Math.abs(b - smooth) > smooth * 1.5).length;
    const penaltyRatio = rhythmPenalties / bigrams.length;
    const score = Math.max(0, Math.min(100, 100 - penaltyRatio * 100));
    return Math.round(score * 100) / 100;
  }

  private analyzeHandErrors(
    events: KeystrokeEvent[],
    _original: string,
  ): [number, number, number, number] {
    let leftErrors = 0, rightErrors = 0, shiftErrors = 0, numberErrors = 0;

    for (const event of events) {
      const key = event.key;
      if (TypingEngine.LEFT_HAND_KEYS.has(key)) leftErrors++;
      else if (TypingEngine.RIGHT_HAND_KEYS.has(key)) rightErrors++;
      else if (TypingEngine.SHIFT_KEYS.has(key)) shiftErrors++;
      else if (TypingEngine.NUMBER_ROW_KEYS.has(key)) numberErrors++;
    }

    return [leftErrors, rightErrors, shiftErrors, numberErrors];
  }

  private identifyWeakWords(typed: string, original: string): string[] {
    const typedWords = typed.split(/\s+/);
    const originalWords = original.split(/\s+/);
    const weakWords: string[] = [];

    for (let i = 0; i < Math.min(typedWords.length, originalWords.length); i++) {
      if (typedWords[i] !== originalWords[i]) {
        weakWords.push(originalWords[i]);
      }
    }

    const wordFreq = new Map<string, number>();
    for (const w of weakWords) {
      wordFreq.set(w, (wordFreq.get(w) || 0) + 1);
    }

    return [...wordFreq.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([w]) => w);
  }

  private findCommonMistypes(events: KeystrokeEvent[], _original: string): Record<string, number> {
    const mistypes = new Map<string, number>();
    for (const event of events) {
      if (event.isError) {
        if (event.key && event.key.length === 1) {
          mistypes.set(event.key, (mistypes.get(event.key) || 0) + 1);
        }
      }
    }
    const sorted = [...mistypes.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
    return Object.fromEntries(sorted);
  }

  private generateErrorZones(
    _events: KeystrokeEvent[],
    _original: string,
  ): Record<string, { errors: number; keys: string[] }> {
    return {
      left_hand: { errors: 0, keys: [...TypingEngine.LEFT_HAND_KEYS] },
      right_hand: { errors: 0, keys: [...TypingEngine.RIGHT_HAND_KEYS] },
      number_row: { errors: 0, keys: [...TypingEngine.NUMBER_ROW_KEYS] },
      shift_key: { errors: 0, keys: [] },
    };
  }

  private emptyMetrics(): TypingMetrics {
    return {
      grossWpm: 0, netWpm: 0, accuracy: 0, errorPercentage: 0,
      keyDepressionCount: 0, backspaceCount: 0, pauseCount: 0,
      totalPauseDuration: 0, avgPauseDuration: 0, longestPauseDuration: 0,
      timeUtilizationPercentage: 0, consistencyScore: 0, typingRhythmScore: 0,
      errorZones: {}, weakWords: [], commonMistypes: {},
      leftHandErrors: 0, rightHandErrors: 0, shiftKeyErrors: 0, numberRowErrors: 0,
    };
  }
}

export const typingEngine = new TypingEngine();
