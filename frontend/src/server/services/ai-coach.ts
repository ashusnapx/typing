export interface CoachFeedback {
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  detailedFeedback: string;
  dailyDrills: Drill[];
  weakWordExercises: string[];
  speedExercises: SpeedExercise[];
  accuracyExercises: AccuracyExercise[];
  fatigueAnalysis: FatigueInfo | null;
  practicePassageSuggestion: string | null;
  predictedImprovement: PredictedImprovement | null;
}

export interface Drill {
  name: string;
  description: string;
  durationMinutes: number;
  words?: string[];
  type: string;
}

export interface SpeedExercise {
  name: string;
  targetWpm?: number;
  durationSeconds?: number;
  passageType?: string;
  description?: string;
  repetitions?: number;
}

export interface AccuracyExercise {
  name: string;
  targetAccuracy?: number;
  durationSeconds?: number;
  description?: string;
  words?: string[];
  repetitions?: number;
}

export interface FatigueInfo {
  fatigueDetected: boolean;
  reason?: string;
  fatigueStartSeconds?: number;
  speedDeclinePercentage?: number;
  firstHalfWpm?: number;
  secondHalfWpm?: number;
}

export interface PredictedImprovement {
  wpmTrend: string;
  accuracyTrend: string;
  projectedWpm7Days: number | null;
  projectedAccuracy7Days: number | null;
}

export class AITypingCoach {
  private static readonly SUFFIX_PATTERNS = [
    'ing', 'ed', 'tion', 'ment', 'able', 'ness', 'ful', 'less', 'ously', 'ation',
  ];

  generateFeedback(
    testData: Record<string, any>,
    recentTests: Record<string, any>[],
  ): CoachFeedback {
    const strengths = this.identifyStrengths(testData, recentTests);
    const weaknesses = this.identifyWeaknesses(testData, recentTests);
    const detailedFeedback = this.generateDetailedFeedback(testData, recentTests);
    const fatigueAnalysis = this.analyzeFatigue(testData, testData.time_taken_seconds ?? 600);
    const drills = this.generateDailyDrills(weaknesses, testData.weak_words ?? []);

    return {
      overallScore: Math.round(this.calculateOverallScore(testData) * 100) / 100,
      strengths,
      weaknesses,
      detailedFeedback,
      dailyDrills: drills,
      weakWordExercises: (testData.weak_words ?? []).slice(0, 10),
      speedExercises: this.generateSpeedExercises(testData.net_wpm ?? 0),
      accuracyExercises: this.generateAccuracyExercises(testData.accuracy ?? 0, testData.weak_words ?? []),
      fatigueAnalysis,
      practicePassageSuggestion: this.suggestPracticePassage(testData.weak_words ?? []),
      predictedImprovement: this.predictImprovement(testData, recentTests),
    };
  }

  private identifyStrengths(test: Record<string, any>, _recent: Record<string, any>[]): string[] {
    const strengths: string[] = [];
    const accuracy = test.accuracy ?? 0;
    const wpm = test.net_wpm ?? 0;
    const consistency = test.consistency_score ?? 50;

    if (accuracy >= 97) strengths.push('Exceptional typing accuracy');
    else if (accuracy >= 95) strengths.push('Above average typing accuracy');

    if (wpm >= 40) strengths.push('Strong typing speed');
    else if (wpm >= 35) strengths.push('Good typing speed');

    if (consistency >= 80) strengths.push('Consistent typing rhythm');

    if ((test.backspace_count ?? 0) <= 5) strengths.push('Minimal corrections needed');

    if ((test.pause_count ?? 0) <= 3) strengths.push('Excellent flow with minimal pauses');

    return strengths.slice(0, 5);
  }

  private identifyWeaknesses(test: Record<string, any>, _recent: Record<string, any>[]): string[] {
    const weaknesses: string[] = [];
    const accuracy = test.accuracy ?? 0;
    const wpm = test.net_wpm ?? 0;
    const consistency = test.consistency_score ?? 50;
    const weakWords: string[] = test.weak_words ?? [];
    const pauses = test.pause_count ?? 0;
    const backspaces = test.backspace_count ?? 0;

    if (accuracy < 90) weaknesses.push('Accuracy needs significant improvement');
    else if (accuracy < 95) weaknesses.push('Accuracy slightly below qualifying threshold');

    if (wpm < 35) weaknesses.push('Speed below SSC CHSL requirement (35 WPM)');

    if (consistency < 60) weaknesses.push('Inconsistent typing rhythm');

    if (pauses > 10) weaknesses.push('Frequent pauses disrupting flow');

    if (backspaces > 15) weaknesses.push('Excessive corrections - accuracy issues while typing');

    if (weakWords.length > 0) {
      weaknesses.push(`Frequent mistakes in: ${weakWords.slice(0, 3).join(', ')}`);
    }

    const suffixErrors = this.detectSuffixErrors(test);
    if (suffixErrors.length > 0) {
      weaknesses.push(`Pattern errors detected in suffix groups: ${suffixErrors.join(', ')}`);
    }

    if ((test.space_errors ?? 0) > 3) {
      weaknesses.push('Space handling needs improvement');
    }

    const fatigue = this.analyzeFatigue(test, test.time_taken_seconds ?? 600);
    if (fatigue?.fatigueDetected) {
      weaknesses.push(`Fatigue detected after ${fatigue.fatigueStartSeconds} seconds`);
    }

    return weaknesses.slice(0, 7);
  }

  private detectSuffixErrors(test: Record<string, any>): string[] {
    const detected: string[] = [];
    const typedContent: string = test.typed_content ?? '';
    const original: string = test.original_content ?? '';

    for (const suffix of AITypingCoach.SUFFIX_PATTERNS) {
      let typedSuffixes = 0;
      let errorSuffixes = 0;
      let idx = 0;
      while (idx < typedContent.length) {
        const pos = typedContent.indexOf(suffix, idx);
        if (pos === -1) break;
        typedSuffixes++;
        if (pos + suffix.length > original.length || original.slice(pos, pos + suffix.length) !== suffix) {
          errorSuffixes++;
        }
        idx = pos + 1;
      }

      if (typedSuffixes > 0 && errorSuffixes / typedSuffixes > 0.3) {
        detected.push(suffix);
      }
    }

    return detected;
  }

  private analyzeFatigue(test: Record<string, any>, totalDuration: number): FatigueInfo | null {
    if (totalDuration < 300) {
      return { fatigueDetected: false, reason: 'Test too short for fatigue analysis' };
    }

    const wpmHalves = this.compareHalves(test);
    if (!wpmHalves) return null;

    const { firstHalfWpm, secondHalfWpm } = wpmHalves;

    if (firstHalfWpm > 0 && secondHalfWpm < firstHalfWpm * 0.85) {
      const fatigueStart = Math.round(totalDuration * 0.5);
      return {
        fatigueDetected: true,
        fatigueStartSeconds: fatigueStart,
        speedDeclinePercentage: Math.round((1 - secondHalfWpm / firstHalfWpm) * 1000) / 10,
        firstHalfWpm: Math.round(firstHalfWpm * 10) / 10,
        secondHalfWpm: Math.round(secondHalfWpm * 10) / 10,
      };
    }

    return { fatigueDetected: false, reason: 'Consistent speed throughout' };
  }

  private compareHalves(test: Record<string, any>): { firstHalfWpm: number; secondHalfWpm: number } | null {
    const typed: string = test.typed_content ?? '';
    if (!typed) return null;

    const mid = Math.floor(typed.length / 2);
    const firstHalf = typed.slice(0, mid);
    const secondHalf = typed.slice(mid);
    const duration = test.time_taken_seconds ?? 600;

    const firstHalfTime = duration * 0.5;
    const secondHalfTime = duration * 0.5;

    return {
      firstHalfWpm: firstHalfTime > 0 ? (firstHalf.length / 5) / (firstHalfTime / 60) : 0,
      secondHalfWpm: secondHalfTime > 0 ? (secondHalf.length / 5) / (secondHalfTime / 60) : 0,
    };
  }

  private generateDetailedFeedback(test: Record<string, any>, _recent: Record<string, any>[]): string {
    const parts: string[] = [];
    const wpm = test.net_wpm ?? 0;
    const accuracy = test.accuracy ?? 0;
    const consistency = test.consistency_score ?? 50;

    if (wpm < 25) parts.push('Start with speed-building exercises focusing on common words.');
    else if (wpm < 35) parts.push("You're close to the SSC threshold. Focus on reducing unnecessary movements.");

    if (accuracy < 90) parts.push('Prioritize accuracy over speed. Slow down and focus on each keystroke.');
    else if (accuracy < 95) parts.push('Small improvements in accuracy will make you qualifying-ready.');

    if (consistency < 60) parts.push('Work on maintaining a steady rhythm. Use the metronome feature during practice.');

    if ((test.pause_count ?? 0) > 10) parts.push('Your frequent pauses suggest hesitation. Practice the passages beforehand.');

    const fatigue = this.analyzeFatigue(test, test.time_taken_seconds ?? 600);
    if (fatigue?.fatigueDetected) {
      parts.push(`Fatigue starts at ~${fatigue.fatigueStartSeconds}s. Try building endurance with longer practice sessions.`);
    }

    return parts.length > 0 ? parts.join(' ') : 'Good performance! Keep practicing to maintain consistency.';
  }

  private generateDailyDrills(weaknesses: string[], weakWords: string[]): Drill[] {
    const drills: Drill[] = [];
    const wordSet = [...new Set(weakWords.slice(0, 5))];

    if (wordSet.length > 0) {
      drills.push({
        name: 'Weak Words Drill',
        description: `Practice these words: ${wordSet.join(', ')}`,
        durationMinutes: 5,
        words: wordSet,
        type: 'accuracy',
      });
    }

    drills.push({
      name: 'Speed Sprint',
      description: 'Type simple sentences as fast as possible for 2 minutes',
      durationMinutes: 2,
      type: 'speed',
    });

    if (weaknesses.some(w => w.toLowerCase().includes('accuracy'))) {
      drills.push({
        name: 'Accuracy Focus',
        description: 'Slow down to 90% of your max speed and focus on zero errors',
        durationMinutes: 5,
        type: 'accuracy',
      });
    }

    drills.push({
      name: 'Rhythm Practice',
      description: 'Use the metronome at 80% of your current WPM for 3 minutes',
      durationMinutes: 3,
      type: 'rhythm',
    });

    return drills;
  }

  private generateSpeedExercises(currentWpm: number): SpeedExercise[] {
    const targetWpm = Math.max(currentWpm + 5, 35);
    return [
      {
        name: 'Speed Target',
        targetWpm,
        durationSeconds: 120,
        passageType: 'simple_common_words',
      },
      {
        name: 'Burst Typing',
        description: 'Type at 120% of target speed for 30-second bursts',
        targetWpm: targetWpm * 1.2,
        durationSeconds: 30,
        repetitions: 3,
      },
    ];
  }

  private generateAccuracyExercises(currentAccuracy: number, weakWords: string[]): AccuracyExercise[] {
    return [
      {
        name: 'Zero Error Challenge',
        targetAccuracy: 100,
        durationSeconds: 120,
        description: 'Type slowly but aim for zero errors',
      },
      {
        name: 'Weak Word Focus',
        words: weakWords.slice(0, 10),
        repetitions: 10,
        description: 'Practice each weak word 10 times correctly',
      },
    ];
  }

  private calculateOverallScore(test: Record<string, any>): number {
    const weights = { wpm: 0.35, accuracy: 0.35, consistency: 0.15, timeUtilization: 0.15 };
    const scores: Record<string, number> = {};

    const wpm = test.net_wpm ?? 0;
    scores.wpm = Math.min(100, (wpm / 50) * 100);
    scores.accuracy = test.accuracy ?? 0;
    scores.consistency = test.consistency_score ?? 50;
    scores.timeUtilization = test.time_utilization_percentage ?? 50;

    const total = Object.keys(weights).reduce((sum, k) => sum + (scores[k] ?? 0) * weights[k as keyof typeof weights], 0);
    return Math.min(100, total);
  }

  private suggestPracticePassage(weakWords: string[]): string | null {
    if (weakWords.length === 0) return null;
    return `A passage focused on ${weakWords.slice(0, 3).join(', ')} and related administrative vocabulary`;
  }

  private predictImprovement(
    test: Record<string, any>,
    recentTests: Record<string, any>[],
  ): PredictedImprovement | null {
    if (recentTests.length < 5) return null;

    const recentWpms = recentTests.slice(-5).map(t => t.net_wpm ?? 0);
    const recentAccuracies = recentTests.slice(-5).map(t => t.accuracy ?? 0);

    if (recentWpms.length >= 2) {
      const wpmTrend = recentWpms[recentWpms.length - 1] - recentWpms[0];
      const accuracyTrend = recentAccuracies[recentAccuracies.length - 1] - recentAccuracies[0];

      return {
        wpmTrend: `${wpmTrend >= 0 ? '+' : ''}${Math.round(wpmTrend * 10) / 10} WPM over last 5 tests`,
        accuracyTrend: `${accuracyTrend >= 0 ? '+' : ''}${Math.round(accuracyTrend * 10) / 10}% over last 5 tests`,
        projectedWpm7Days: recentWpms.length >= 2
          ? Math.round((recentWpms[recentWpms.length - 1] + wpmTrend * 1.4) * 10) / 10
          : null,
        projectedAccuracy7Days: recentAccuracies.length >= 2
          ? Math.round(Math.min(100, recentAccuracies[recentAccuracies.length - 1] + accuracyTrend * 1.4) * 10) / 10
          : null,
      };
    }

    return null;
  }
}

export const aiCoach = new AITypingCoach();
