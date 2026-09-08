/**
 * When a lesson counts as cleared.
 *
 * Neither of the two figures a lesson reports notices an unfinished passage.
 * WPM is a rate over the time actually spent, and accuracy only counts keys
 * that were pressed — so typing half the passage well and stopping reads as a
 * fast, accurate attempt. It used to clear the lesson outright and pay the
 * full reward.
 *
 * The bar needs no invented threshold: you cleared it if you finished the
 * passage, or if you were still going when the clock ran out. Stopping early
 * is still scored and still earns the partial reward — it just is not a pass.
 * Someone who runs the full duration having typed 60% is judged on a WPM
 * computed over that whole duration, which is low by itself, so the rule only
 * ever bites the early exit.
 */

export interface LessonAttempt {
  /** Characters the candidate actually typed. */
  typedChars: number;
  /** Length of the drill text. */
  passageChars: number;
  elapsedSeconds: number;
  durationSec: number;
  wpm: number;
  accuracy: number;
  targetWpm: number;
  minAccuracy: number;
  /** Drills that finish on something other than a passage — the mouse lesson
   *  ends on three gestures — assert their own completion. */
  selfReported?: boolean;
}

export interface LessonVerdict {
  qualified: boolean;
  /** Finished the passage, or ran the clock out. */
  wentTheDistance: boolean;
  /** How much of the passage was typed, 0–100. */
  completionPct: number;
}

export function judgeLesson(a: LessonAttempt): LessonVerdict {
  const completedPassage =
    a.passageChars > 0 && a.typedChars >= a.passageChars;
  const usedFullTime = a.elapsedSeconds >= a.durationSec;
  const wentTheDistance = !!a.selfReported || completedPassage || usedFullTime;

  const completionPct = a.passageChars
    ? Math.min(100, Math.round((a.typedChars / a.passageChars) * 100))
    : 100;

  return {
    qualified:
      wentTheDistance && a.wpm >= a.targetWpm && a.accuracy >= a.minAccuracy,
    wentTheDistance,
    completionPct,
  };
}

/** Full reward for clearing the bar, a quarter for finishing without it.
 *  Mirrored by user.awardLessonXp on the server, which is the figure that
 *  actually reaches the account. */
export function lessonXpFor(reward: number, qualified: boolean): number {
  return qualified ? reward : Math.round(reward * 0.25);
}
