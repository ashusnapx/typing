import { SSC_EXAM_SPECS } from '@/lib/exam-config';

/**
 * How ready a candidate is for the typing test, said honestly.
 *
 * The figure this replaces was a weighted average — speed, accuracy and a flat
 * twenty points of "consistency" that was hardcoded to 100 and so was simply
 * twenty free points. Because it averaged, being fast paid for being wrong: a
 * candidate averaging 148 WPM at a 20% error rate, three times the 7% allowed,
 * with not one attempt cleared, was scored at 93.4% and told "You are
 * exam-ready for SSC CHSL".
 *
 * Qualifying is a conjunction. The Commission requires the speed AND the error
 * cap, and typing faster buys nothing against mistakes. So the readiness is
 * the worse of the two scores: the failing half sets the number, which is the
 * half the candidate has to fix.
 */

export interface AttemptSummary {
  netWpm: number | null;
  /** Errors as a percentage, as stored with the attempt. */
  errorPercentage: number | null;
  accuracy: number | null;
  isQualified: boolean | null;
}

export interface Readiness {
  /** 0–100. Zero when there is nothing to go on — not fifty. */
  score: number;
  speedScore: number;
  errorScore: number;
  avgWpm: number;
  avgError: number;
  /** How many of these attempts actually cleared. */
  cleared: number;
  attempts: number;
  speedTarget: number;
  errorCap: number;
  /** Which bar is the one costing them the pass. */
  blockedBy: 'nothing' | 'speed' | 'errors' | 'both' | 'unknown';
  recommendation: string;
}

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const round1 = (n: number) => Math.round(n * 10) / 10;

export function assessReadiness(
  attempts: AttemptSummary[],
  spec = SSC_EXAM_SPECS.ssc_chsl_ldc_jsa,
  category: 'ur' | 'obcEws' | 'scSt' = 'ur',
): Readiness {
  const speedTarget = spec.englishSpeedWpm;
  const errorCap =
    category === 'scSt'
      ? spec.errorAllowanceScSt
      : category === 'obcEws'
        ? spec.errorAllowanceObcEws
        : spec.errorAllowanceGeneral;

  if (attempts.length === 0) {
    return {
      score: 0,
      speedScore: 0,
      errorScore: 0,
      avgWpm: 0,
      avgError: 0,
      cleared: 0,
      attempts: 0,
      speedTarget,
      errorCap,
      blockedBy: 'unknown',
      recommendation: 'Take a full test to see where you stand.',
    };
  }

  const avgWpm = mean(attempts.map((a) => a.netWpm ?? 0));
  const avgError = mean(
    attempts.map((a) => a.errorPercentage ?? 100 - (a.accuracy ?? 0)),
  );
  const cleared = attempts.filter((a) => a.isQualified).length;

  const speedScore = Math.min(100, (avgWpm / speedTarget) * 100);
  // At or under the cap is a pass, and a pass is 100 — there is no credit for
  // being further under it, because the Commission gives none.
  const errorScore =
    avgError <= errorCap ? 100 : Math.max(1, (errorCap / avgError) * 100);

  const score = Math.min(99, Math.max(1, Math.min(speedScore, errorScore)));

  const slowEnough = avgWpm < speedTarget;
  const tooManyErrors = avgError > errorCap;
  const blockedBy = slowEnough && tooManyErrors
    ? 'both'
    : tooManyErrors
      ? 'errors'
      : slowEnough
        ? 'speed'
        : 'nothing';

  /* Name the bar that is failing, in the words the result screen uses. The
     line this replaces — "Focus on your weak areas identified in the AI coach
     feedback" — told a candidate nothing they could act on. */
  let recommendation: string;
  if (cleared === attempts.length) {
    recommendation = `Every one of your last ${attempts.length} attempts cleared. Keep the routine.`;
  } else if (blockedBy === 'both') {
    recommendation = `Both bars are short: ${avgWpm.toFixed(0)} WPM against ${speedTarget}, and ${avgError.toFixed(1)}% errors against ${errorCap}%. Accuracy first — speed follows it.`;
  } else if (blockedBy === 'errors') {
    recommendation = `Your speed clears the bar. Mistakes are what is stopping you: ${avgError.toFixed(1)}% against a ${errorCap}% cap. Slow down until the errors fall.`;
  } else if (blockedBy === 'speed') {
    recommendation = `Your accuracy is within the ${errorCap}% cap. You need ${(speedTarget - avgWpm).toFixed(0)} more WPM to reach ${speedTarget}.`;
  } else {
    recommendation = `You are averaging above both bars. ${cleared} of your last ${attempts.length} attempts cleared — keep them consistent.`;
  }

  return {
    score: round1(score),
    speedScore: round1(speedScore),
    errorScore: round1(errorScore),
    avgWpm: round1(avgWpm),
    avgError: round1(avgError),
    cleared,
    attempts: attempts.length,
    speedTarget,
    errorCap,
    blockedBy,
    recommendation,
  };
}
