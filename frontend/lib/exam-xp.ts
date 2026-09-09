import { getExamBar, type BarCategory } from '@/lib/exam-config';

/**
 * What an attempt is worth.
 *
 * XP was `netWpm × 10 × accuracy`, capped at 500. Two things followed from
 * that. One good attempt paid four hundred points, so the whole ladder — which
 * ended at 16,000 — could be walked in a day; the account that prompted this
 * reached the top rank on its first day of practice, which makes the rank mean
 * nothing to the person who earned it.
 *
 * And it paid for raw speed. A candidate who types quickly and fails on errors
 * out-earned one who types at exactly the bar and clears it, which is backwards
 * for a product whose whole argument is that accuracy is what fails people.
 *
 * So the award follows the exam instead. Sitting a test is worth a little.
 * Accuracy inside the cap is worth the most. Speed is worth something up to the
 * bar for the post and nothing at all beyond it — there are no marks for being
 * faster than the Commission asks. Clearing both earns the rest.
 */

export interface AttemptForXp {
  mode: string;
  netWpm: number;
  errorPercentage: number;
  /** Whether the attempt cleared the bar for its post and category. */
  isQualified: boolean;
}

export const XP = {
  /** For sitting a full attempt at all. */
  BASE: 10,
  /** Earned by staying inside the error cap, in proportion to how far inside. */
  ACCURACY: 30,
  /** Earned up to the speed bar. Nothing past it. */
  SPEED: 30,
  /** For clearing both, which is the only thing the exam actually asks. */
  CLEARED: 30,
} as const;

export const MAX_XP_PER_ATTEMPT = XP.BASE + XP.ACCURACY + XP.SPEED + XP.CLEARED;

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

export function xpForAttempt(
  attempt: AttemptForXp,
  category: BarCategory = 'ur',
): number {
  const bar = getExamBar(attempt.mode, category);
  // A training mode has no official bar; hold it to LDC/JSA so practice still
  // earns something, and the same something everywhere.
  const speedTarget = bar
    ? bar.nature === 'kdph'
      ? bar.kdph / 300
      : bar.speedWpm
    : 35;
  const errorCap = bar?.errorCap ?? 7;

  const netWpm = Number.isFinite(attempt.netWpm) ? Math.max(0, attempt.netWpm) : 0;
  const errorPct = Number.isFinite(attempt.errorPercentage)
    ? Math.max(0, attempt.errorPercentage)
    : 100;

  // Nothing typed is not practice.
  if (netWpm <= 0) return 0;

  const speedShare = clamp01(netWpm / speedTarget);
  // Full marks for a clean sheet, nothing once the cap is passed.
  const accuracyShare = clamp01((errorCap - errorPct) / errorCap);

  const earned =
    XP.BASE +
    XP.SPEED * speedShare +
    XP.ACCURACY * accuracyShare +
    (attempt.isQualified ? XP.CLEARED : 0);

  return Math.min(MAX_XP_PER_ATTEMPT, Math.round(earned));
}
