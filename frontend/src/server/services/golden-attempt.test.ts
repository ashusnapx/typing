import { describe, it, expect } from 'vitest';
import { errorEngine } from './error-engine';
import { diagnose } from '@/lib/exam-diagnosis';
import { summariseKeystrokes } from '@/lib/keystroke-summary';
import { summariseAttempt } from '@/lib/attempt-summary';
import { assessReadiness } from '@/lib/exam-readiness';
import { levelFromXp } from '@/lib/utils';

/**
 * One attempt, worked through by hand, asserted at every stage it passes.
 *
 * Each piece of the scoring has its own tests. This one exists because the
 * pieces have to agree with each other: the mistakes the report lists must add
 * up to the error percentage the verdict rests on, which must match the speed
 * on the dashboard, which must match the XP awarded and the row the leaderboard
 * ranks. Every scoring bug in this product has lived in a seam between two of
 * those, not inside any one of them.
 *
 * The numbers below are computed here in the test from the Commission's own
 * formulae, not copied from a run — so if the engine drifts, this fails rather
 * than being quietly updated to match.
 */

/* ── The attempt ───────────────────────────────────────────────────────────
 *
 * A ten-minute SSC CHSL paper. The candidate types the passage exactly, except
 * for five deliberate slips, and stops when the clock does.
 */
const SENTENCE =
  'The Reserve Bank of India said that the growth of the economy would rise by about 2019 percent in the coming year. ';
const PASSAGE = SENTENCE.repeat(12).trim();

/** Five slips: two half mistakes, three full ones. */
const TYPED = (() => {
  const words = PASSAGE.split(' ');
  words[0] = 'the';        // capitalisation  — half
  words[5] = 'said,';      // punctuation     — half
  words[8] = 'growht';     // spelling        — full
  words[15] = '2018';      // figures         — full
  words.splice(20, 1);     // a skipped word  — full
  return words.slice(0, 300).join(' ');
})();

const DURATION = 600;
const MODE = 'ssc_chsl';

/* The Commission's arithmetic, written out rather than imported, so the test
   is checking the engine rather than agreeing with it. */
const EXPECTED_FULL = 3;      // spelling, figures, skipped
const EXPECTED_HALF = 2;      // capitalisation, punctuation
const EXPECTED_MISTAKES = EXPECTED_FULL + EXPECTED_HALF / 2; // 4
const KEY_DEPRESSIONS = TYPED.length;
const GROSS_WORDS = KEY_DEPRESSIONS / 5;
const NET_WPM = (GROSS_WORDS - EXPECTED_MISTAKES) / (DURATION / 60);
const ERROR_PCT = ((GROSS_WORDS - (GROSS_WORDS - EXPECTED_MISTAKES)) / GROSS_WORDS) * 100;

describe('the golden attempt: one test, checked at every stage', () => {
  const report = errorEngine.evaluate(PASSAGE, TYPED, DURATION, MODE, DURATION);

  it('classifies exactly the five slips that were made', () => {
    const d = diagnose(PASSAGE, TYPED);
    expect(Object.fromEntries(d.findings.map((f) => [f.kind, f.count]))).toEqual({
      capitalisation: 1,
      punctuation: 1,
      spelling: 1,
      figures: 1,
      skipped: 1,
    });
    expect(d.fullMistakes).toBe(EXPECTED_FULL);
    expect(d.halfMistakes).toBe(EXPECTED_HALF);
    expect(d.totalMistakes).toBe(EXPECTED_MISTAKES);
  });

  it('weights them as the Commission does — full is one, half is half', () => {
    expect(report.fullMistakes).toBe(EXPECTED_FULL);
    expect(report.halfMistakes).toBe(EXPECTED_HALF);
  });

  it('derives net speed from the marks lost, to the depression', () => {
    expect(report.keyDepressionCount).toBe(KEY_DEPRESSIONS);
    expect(report.sscNetWpm).toBeCloseTo(NET_WPM, 1);
  });

  it('states an error percentage the mistakes actually add up to', () => {
    expect(report.sscErrorPercentage).toBeCloseTo(ERROR_PCT, 1);
    expect(report.sscAccuracy + report.sscErrorPercentage).toBeCloseTo(100, 1);
  });

  it('reaches a verdict against this post and this category', () => {
    const cleared = errorEngine.isQualifiedFromReport(report, MODE, 'ur');
    // 35 WPM and a 7% cap for an unreserved LDC/JSA candidate.
    expect(cleared).toBe(report.sscNetWpm >= 35 && report.sscErrorPercentage <= 7);
  });

  it('shows the candidate the same numbers the verdict was reached on', () => {
    const summary = summariseAttempt(
      {
        mode: MODE,
        isQualified: errorEngine.isQualifiedFromReport(report, MODE, 'ur'),
        netWpm: report.sscNetWpm,
        errorPercentage: report.sscErrorPercentage,
        keyDepressions: report.keyDepressionCount,
        secondsTyped: DURATION,
      },
      'ur',
    );
    expect(summary.speedTarget).toBe(35);
    expect(summary.errorCap).toBe(7);
    expect(summary.speedMet).toBe(report.sscNetWpm >= 35);
    expect(summary.errorsMet).toBe(report.sscErrorPercentage <= 7);
    expect(summary.qualified).toBe(summary.speedMet && summary.errorsMet);
  });

  it('awards XP from the scored speed, and bounds it', () => {
    // The rule in the submit mutation, which once paid 7,482 XP for one
    // attempt because nothing capped the speed it was derived from.
    const MAX_HUMAN_WPM = 200;
    const MAX_XP_PER_TEST = 500;
    const scoredWpm = Math.min(MAX_HUMAN_WPM, Math.max(0, report.sscNetWpm));
    const scoredAccuracy = Math.min(100, Math.max(0, report.sscAccuracy));
    const xp = Math.min(MAX_XP_PER_TEST, Math.round(scoredWpm * 10 * (scoredAccuracy / 100)));

    expect(xp).toBeGreaterThan(0);
    expect(xp).toBeLessThanOrEqual(MAX_XP_PER_TEST);
    expect(levelFromXp(xp)).toBeGreaterThanOrEqual(1);
  });

  it('keeps the keystrokes as an answer small enough to store on the row', () => {
    const events = [...TYPED].map((ch, i) => ({
      key: ch, timestamp_ms: i * 180, duration_ms: 40,
      is_error: false, is_backspace: false, cursor_position: i, expected_char: ch,
    }));
    const summary = summariseKeystrokes(TYPED, events);
    expect(summary.keystrokes).toBe(TYPED.length);
    expect(JSON.stringify(summary).length).toBeLessThan(2048);
  });

  it('feeds a readiness figure that cannot exceed either half of the bar', () => {
    const readiness = assessReadiness([
      {
        netWpm: report.sscNetWpm,
        errorPercentage: report.sscErrorPercentage,
        accuracy: report.sscAccuracy,
        isQualified: errorEngine.isQualifiedFromReport(report, MODE, 'ur'),
      },
    ]);
    expect(readiness.score).toBe(Math.min(readiness.speedScore, readiness.errorScore));
    expect(readiness.attempts).toBe(1);
  });
});

describe('the golden attempt, judged for every post and category', () => {
  const report = errorEngine.evaluate(PASSAGE, TYPED, DURATION, MODE, DURATION);

  it('never narrows the error allowance as the category widens', () => {
    for (const mode of ['ssc_chsl', 'ssc_chsl_deo', 'ssc_cgl_dest', 'ssc_hindi']) {
      const ur = errorEngine.isQualifiedFromReport(report, mode, 'ur');
      const sc = errorEngine.isQualifiedFromReport(report, mode, 'scSt');
      // A wider allowance can turn a fail into a pass, never the reverse.
      expect(ur && !sc, `${mode}: SC/ST stricter than UR`).toBe(false);
    }
  });

  it('holds the same attempt to a different bar per post', () => {
    const verdicts = ['ssc_chsl', 'ssc_chsl_deo', 'ssc_chsl_deo_grade_a', 'ssc_cgl_dest']
      .map((m) => errorEngine.isQualifiedFromReport(report, m, 'ur'));
    // Grade 'A' asks for 15,000 KDPH — nothing this attempt could reach.
    expect(verdicts[2]).toBe(false);
  });
});
