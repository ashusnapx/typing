export interface QualificationResult {
  probability: number;
  isQualified: boolean;
  confidence: 'high' | 'medium' | 'low';
  avgWpm?: number;
  avgAccuracy?: number;
  avgConsistency?: number;
  testsAnalyzed: number;
}

export class QualificationPredictor {
  private static readonly CHSL_WPM_THRESHOLD = 35;
  private static readonly CHSL_WPM_HINDI_THRESHOLD = 30;
  private static readonly CHSL_ACCURACY_THRESHOLD = 95;
  private static readonly CGL_ACCURACY_THRESHOLD = 95;

  predictChslQualification(
    recentTests: Record<string, any>[],
    language: string = 'english',
  ): QualificationResult {
    if (recentTests.length === 0) {
      return { probability: 50, isQualified: false, confidence: 'low', testsAnalyzed: 0 };
    }

    const wpmThreshold = language === 'hindi'
      ? QualificationPredictor.CHSL_WPM_HINDI_THRESHOLD
      : QualificationPredictor.CHSL_WPM_THRESHOLD;

    const recent = recentTests.slice(-20);

    const wpms = recent.map(t => t.net_wpm ?? 0);
    const accuracies = recent.map(t => t.accuracy ?? 0);
    const consistencies = recent.map(t => t.consistency_score ?? 50);

    const avgWpm = wpms.length > 0 ? wpms.reduce((a, b) => a + b, 0) / wpms.length : 0;
    const avgAccuracy = accuracies.length > 0 ? accuracies.reduce((a, b) => a + b, 0) / accuracies.length : 0;
    const avgConsistency = consistencies.length > 0 ? consistencies.reduce((a, b) => a + b, 0) / consistencies.length : 0;

    const wpmScore = Math.min(100, (avgWpm / wpmThreshold) * 100);
    const accuracyScore = Math.min(100, (avgAccuracy / QualificationPredictor.CHSL_ACCURACY_THRESHOLD) * 100);
    const consistencyScore = avgConsistency;

    let probability = wpmScore * 0.4 + accuracyScore * 0.4 + consistencyScore * 0.2;
    probability = Math.min(99, Math.max(1, probability));

    const recentTrend = this.calculateTrend(wpms);
    if (recentTrend > 0) probability = Math.min(99, probability + 5);
    else if (recentTrend < 0) probability = Math.max(1, probability - 5);

    const isQualified = avgWpm >= wpmThreshold && avgAccuracy >= QualificationPredictor.CHSL_ACCURACY_THRESHOLD;

    const confidence: 'high' | 'medium' | 'low' =
      recentTests.length >= 10 ? 'high' : recentTests.length >= 5 ? 'medium' : 'low';

    return {
      probability: Math.round(probability * 10) / 10,
      isQualified,
      confidence,
      avgWpm: Math.round(avgWpm * 10) / 10,
      avgAccuracy: Math.round(avgAccuracy * 10) / 10,
      avgConsistency: Math.round(avgConsistency * 10) / 10,
      testsAnalyzed: recentTests.length,
    };
  }

  predictCglDestQualification(recentTests: Record<string, any>[]): QualificationResult {
    if (recentTests.length === 0) {
      return { probability: 50, isQualified: false, confidence: 'low', testsAnalyzed: 0 };
    }

    const recent = recentTests.slice(-20);

    const accuracies = recent.map(t => t.accuracy ?? 0);
    const consistencies = recent.map(t => t.consistency_score ?? 50);

    const avgAccuracy = accuracies.length > 0 ? accuracies.reduce((a, b) => a + b, 0) / accuracies.length : 0;
    const avgConsistency = consistencies.length > 0 ? consistencies.reduce((a, b) => a + b, 0) / consistencies.length : 0;

    const accuracyScore = Math.min(100, (avgAccuracy / QualificationPredictor.CGL_ACCURACY_THRESHOLD) * 100);
    const consistencyScore = avgConsistency;

    let probability = accuracyScore * 0.7 + consistencyScore * 0.3;
    probability = Math.min(99, Math.max(1, probability));

    const accuracyTrend = this.calculateTrend(accuracies);
    if (accuracyTrend > 0) probability = Math.min(99, probability + 3);

    const isQualified = avgAccuracy >= QualificationPredictor.CGL_ACCURACY_THRESHOLD;

    const confidence: 'high' | 'medium' | 'low' =
      recentTests.length >= 10 ? 'high' : recentTests.length >= 5 ? 'medium' : 'low';

    return {
      probability: Math.round(probability * 10) / 10,
      isQualified,
      confidence,
      avgAccuracy: Math.round(avgAccuracy * 10) / 10,
      avgConsistency: Math.round(avgConsistency * 10) / 10,
      testsAnalyzed: recentTests.length,
    };
  }

  private calculateTrend(values: number[]): number {
    if (values.length < 3) return 0;
    const recent = values.slice(-3);
    return recent[recent.length - 1] - recent[0];
  }
}

export const qualificationPredictor = new QualificationPredictor();
