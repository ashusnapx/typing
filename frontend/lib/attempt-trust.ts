/**
 * What an attempt is worth when the server could not mark it for itself.
 *
 * A submission carries both the passage and what was typed, and the server
 * marks one against the other. When either is missing there is nothing to
 * mark — and the mutation used to fall back to the figures the submission
 * declared about itself: its own speed, its own accuracy, and a verdict taken
 * from `netWpm >= 35 && accuracy >= 95`, the LDC bar applied to every post.
 *
 * So a request with no passage and no typing at all was stored as a qualified
 * 36 WPM attempt at 96% accuracy, worth 83 XP, counted towards the candidate's
 * level and ranked on the leaderboard. Every number on it came from the client.
 *
 * There is no honest figure to put in that case. An unmarkable attempt is
 * worth nothing, and saying so is the only thing that keeps the leaderboard
 * and the XP ladder meaning what they claim to mean.
 */
export interface MarkedFigures {
  grossWpm: number;
  netWpm: number;
  accuracy: number;
  totalErrors: number;
  errorPercentage: number;
  isQualified: boolean;
}

/** The figures for an attempt the server has no way to check. */
export const UNMARKABLE: Readonly<MarkedFigures> = Object.freeze({
  grossWpm: 0,
  netWpm: 0,
  accuracy: 0,
  totalErrors: 0,
  /* Nothing verified correct is not nothing wrong. Zero here is what let an
     unmarkable attempt read as a clean sheet against the error cap. */
  errorPercentage: 100,
  isQualified: false,
});

/** True when there is enough in the submission to mark it at all. */
export function isMarkable(originalContent?: string | null, typedContent?: string | null): boolean {
  return Boolean(originalContent && typedContent);
}
