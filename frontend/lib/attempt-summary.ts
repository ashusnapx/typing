import { getExamBar, type BarCategory } from '@/lib/exam-config';

/**
 * Did this attempt clear the bar, and if not, which bar.
 *
 * Pulled out of the analysis page because that page used to decide it for
 * itself: it recomputed the verdict against `englishSpeedWpm` whatever
 * language the test was sat in, defaulted the error allowance to 20% for every
 * post, and added a "at least 50% of the passage" rule that the Commission
 * does not have. So the same attempt could read Qualified here and Not
 * qualified on the dashboard.
 *
 * The verdict itself is stored with the attempt. What this works out is the
 * rest — which of the two requirements was missed, and the figures to show
 * beside them.
 */

export interface AttemptFigures {
  mode: string;
  /** The stored verdict. Nothing here recomputes it. */
  isQualified: boolean;
  netWpm: number;
  errorPercentage: number;
  keyDepressions: number;
  secondsTyped: number;
}

export interface AttemptSummary {
  qualified: boolean;
  speedMet: boolean;
  errorsMet: boolean;
  /** Net of mistakes and per hour — the figure the marking uses. */
  kdph: number;
  nature: 'speed_wpm' | 'kdph';
  speedTarget: number;
  kdphTarget: number;
  errorCap: number;
  language: 'english' | 'hindi';
  /** What went wrong, in one sentence. */
  verdict: string;
}

export function summariseAttempt(
  figures: AttemptFigures,
  category: BarCategory = 'ur',
): AttemptSummary {
  const bar = getExamBar(figures.mode, category);

  /* Net of mistakes, not raw depressions divided by time.
  
     The page reported `keyDepressions / seconds * 3600`, which is the gross
     rate, while the marking uses the net one. A DEO candidate saw 8,400 KDPH
     printed beside a verdict that had just failed them at an 8,000 bar. */
  const kdph = Math.round(figures.netWpm * 5 * 60);

  const nature = bar?.nature ?? 'speed_wpm';
  const speedTarget = bar?.speedWpm ?? 35;
  const kdphTarget = bar?.kdph ?? 10500;
  const errorCap = bar?.errorCap ?? 7;

  const speedMet =
    nature === 'kdph' ? kdph >= kdphTarget : figures.netWpm >= speedTarget;
  const errorsMet = figures.errorPercentage <= errorCap;

  const verdict = figures.isQualified
    ? 'You met both requirements for this post.'
    : !speedMet && !errorsMet
      ? 'Both requirements were missed. Accuracy is the one to fix first — speed follows it.'
      : !errorsMet
        ? 'Your speed was enough. Mistakes are what cost you this attempt.'
        : 'Your accuracy was within the limit. Speed is what cost you this attempt.';

  return {
    qualified: figures.isQualified,
    speedMet,
    errorsMet,
    kdph,
    nature,
    speedTarget,
    kdphTarget,
    errorCap,
    language: bar?.language ?? 'english',
    verdict,
  };
}
