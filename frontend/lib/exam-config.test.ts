import { describe, it, expect } from 'vitest';
import {
  calculateNetWpm,
  calculateGrossWpm,
  calculateAccuracySsc,
  calculateKdph,
  checkQualification,
  getExamSpecs,
  EXAM_VARIANTS,
} from './exam-config';

describe('calculateNetWpm', () => {
  it('calculates SSC Net WPM correctly', () => {
    // 1000 key depressions in 10 minutes, 5 full mistakes, 4 half mistakes
    // gross words = 1000/5 = 200
    // errors = 5 + 4/2 = 7
    // net words = 200 - 7 = 193
    // net WPM = 193/10 = 19.3 -> 19
    expect(calculateNetWpm(1000, 5, 4, 10)).toBe(19);
  });

  it('returns 0 for 0 key depressions', () => {
    expect(calculateNetWpm(0, 0, 0, 10)).toBe(0);
  });

  it('handles no mistakes', () => {
    expect(calculateNetWpm(1000, 0, 0, 10)).toBe(20);
  });
});

describe('calculateGrossWpm', () => {
  it('calculates gross WPM correctly', () => {
    expect(calculateGrossWpm(1000, 10)).toBe(20);
  });

  it('returns 0 for 0 key depressions', () => {
    expect(calculateGrossWpm(0, 10)).toBe(0);
  });
});

describe('calculateAccuracySsc', () => {
  it('returns 100 when no errors', () => {
    expect(calculateAccuracySsc(1000, 0, 0)).toBe(100);
  });

  it('calculates SSC accuracy correctly', () => {
    // 1000 key depressions = 200 gross words
    // 5 full mistakes, 4 half mistakes
    // errors = 5 + 4/2 = 7
    // accuracy = (200 - 7) / 200 * 100 = 96.5
    expect(calculateAccuracySsc(1000, 5, 4)).toBe(96.5);
  });

  it('returns 100 when key depressions are 0', () => {
    expect(calculateAccuracySsc(0, 5, 4)).toBe(100);
  });
});

describe('calculateKdph', () => {
  it('calculates KDPH correctly', () => {
    // 1000 key depressions in 10 minutes = (1000/10)*60 = 6000
    expect(calculateKdph(1000, 10)).toBe(6000);
  });

  it('returns 0 for zero time', () => {
    expect(calculateKdph(1000, 0)).toBe(0);
  });
});

describe('getExamSpecs', () => {
  it('returns CHSL specs for ssc_chsl mode', () => {
    const specs = getExamSpecs('ssc_chsl');
    expect(specs).not.toBeNull();
    expect(specs!.englishSpeedWpm).toBe(35);
    expect(specs!.durationMinutes).toBe(10);
    expect(specs!.qualifyingNature).toBe('speed_wpm');
  });

  it('returns CGL DEST specs for ssc_cgl_dest mode', () => {
    const specs = getExamSpecs('ssc_cgl_dest');
    expect(specs).not.toBeNull();
    expect(specs!.englishKdph).toBe(8000);
    expect(specs!.durationMinutes).toBe(15);
    expect(specs!.qualifyingNature).toBe('kdph');
  });

  it('returns null for unknown modes', () => {
    expect(getExamSpecs('unknown_mode')).toBeNull();
  });
});

describe('checkQualification', () => {
  it('qualifies CHSL UR with sufficient WPM and low errors', () => {
    const result = checkQualification('ssc_chsl', 40, 98, 0, 5, 'UR');
    expect(result.qualified).toBe(true);
  });

  it('fails CHSL UR with low WPM', () => {
    const result = checkQualification('ssc_chsl', 30, 98, 0, 5, 'UR');
    expect(result.qualified).toBe(false);
    expect(result.required).toContain('35');
  });

  it('fails CHSL UR with high errors', () => {
    const result = checkQualification('ssc_chsl', 40, 90, 0, 10, 'UR');
    expect(result.qualified).toBe(false);
    expect(result.required).toContain('7%');
  });

  it('qualifies CGL DEST with sufficient KDPH and errors inside the cap', () => {
    const result = checkQualification('ssc_cgl_dest', 40, 95, 9000, 4, 'UR');
    expect(result.qualified).toBe(true);
  });

  it('holds CGL DEST to the strict 5% cap, not the data-entry 20%', () => {
    // Sources disagree on whether Tax Assistant is marked at 5% or 20%. We
    // mark at 5%, so a pass here is a pass under either reading — telling a
    // candidate at 15% errors that they passed would fail them on the day.
    const result = checkQualification('ssc_cgl_dest', 40, 95, 9000, 15, 'UR');
    expect(result.qualified).toBe(false);
    expect(result.required).toContain('5%');
  });

  it('fails CGL DEST with low KDPH', () => {
    const result = checkQualification('ssc_cgl_dest', 40, 95, 7000, 15, 'UR');
    expect(result.qualified).toBe(false);
    expect(result.required).toContain('8,000');
  });

  it('uses higher error allowance for SC/ST', () => {
    // For CHSL UR: max 7% errors; for SC/ST: max 10% errors
    const resultUR = checkQualification('ssc_chsl', 40, 90, 0, 8, 'UR');
    expect(resultUR.qualified).toBe(false);

    const resultSC = checkQualification('ssc_chsl', 40, 90, 0, 8, 'SC');
    expect(resultSC.qualified).toBe(true);
  });

  it('returns not qualified for unknown mode', () => {
    const result = checkQualification('unknown_mode', 40, 95, 0, 5, 'UR');
    expect(result.qualified).toBe(false);
    expect(result.required).toBe('Unknown');
  });
});

describe('config consistency', () => {
  it('shows the same error cap on the listing as it marks against', () => {
    // The listing card, the instructions screen and the evaluation all quote
    // an error limit. When they drift, a candidate is told one bar and marked
    // against another — which is exactly what happened when CGL DEST was
    // listed at 20% and scored at 5%.
    for (const variant of EXAM_VARIANTS) {
      const spec = getExamSpecs(variant.mode);
      expect(spec, variant.mode).not.toBeNull();
      expect(variant.errorCapUr, variant.mode).toBe(spec!.errorAllowanceGeneral);
    }
  });

  it('quotes the same speed requirement as the spec', () => {
    for (const variant of EXAM_VARIANTS) {
      const spec = getExamSpecs(variant.mode)!;
      const expected =
        spec.qualifyingNature === 'speed_wpm'
          ? `${spec.englishSpeedWpm} WPM`
          : `${spec.englishKdph.toLocaleString('en-IN')} KDPH`;
      expect(variant.requirement, variant.mode).toBe(expected);
    }
  });
});

describe('XP bounds', () => {
  /** Mirrors tests.submit. XP drives the leaderboard, so an attempt reporting
   *  an implausible speed must not be able to buy a rank. */
  const MAX_HUMAN_WPM = 200;
  const MAX_XP_PER_TEST = 500;
  const xpFor = (wpm: number, accuracy: number) =>
    Math.min(
      MAX_XP_PER_TEST,
      Math.round(
        Math.min(MAX_HUMAN_WPM, Math.max(0, wpm)) *
          10 *
          (Math.min(100, Math.max(0, accuracy)) / 100)
      )
    );

  it('pays a normal attempt normally', () => {
    expect(xpFor(38, 96)).toBe(365);
  });

  it('caps an implausible speed', () => {
    // A pasted or scripted submission reported 865 WPM and earned 7,482 XP —
    // more than the highest rank costs.
    expect(xpFor(865, 86.5)).toBe(MAX_XP_PER_TEST);
    expect(xpFor(100000, 100)).toBe(MAX_XP_PER_TEST);
  });

  it('never pays negative XP', () => {
    expect(xpFor(-50, 90)).toBe(0);
    expect(xpFor(40, -10)).toBe(0);
  });
});

describe('speed plausibility', () => {
  /** Mirrors the elapsed-time floor in the error engine. Nobody types faster
   *  than this, so a shorter reported time means a broken clock rather than a
   *  fast candidate. */
  const MAX_HUMAN_CPS = 17;
  const wpmFor = (chars: number, reportedSeconds: number, windowSeconds = 600) => {
    const elapsed = Math.min(
      windowSeconds,
      Math.max(reportedSeconds, chars / MAX_HUMAN_CPS, 1)
    );
    return chars / 5 / (elapsed / 60);
  };

  it('reports an ordinary attempt at its real speed', () => {
    // 1,200 characters over four minutes is 60 WPM, and should be untouched.
    expect(Math.round(wpmFor(1200, 240))).toBe(60);
  });

  it('refuses to report a speed no human reaches', () => {
    // The paste case: 1,200 characters claimed in six seconds read as 2,083
    // WPM, which cleared posts the candidate had not cleared.
    expect(wpmFor(1200, 6)).toBeLessThanOrEqual(205);
  });

  it('never divides by a zero or negative clock', () => {
    expect(Number.isFinite(wpmFor(500, 0))).toBe(true);
    expect(Number.isFinite(wpmFor(0, 0))).toBe(true);
  });

  it('never stretches elapsed time beyond the test window', () => {
    // The floor may raise the elapsed time but must never exceed the window,
    // or a full-length attempt would be scored as slower than it was.
    expect(wpmFor(100000, 1, 600)).toBeGreaterThan(0);
  });
});
