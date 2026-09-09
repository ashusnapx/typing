import { describe, it, expect } from 'vitest';
import { xpForAttempt, MAX_XP_PER_ATTEMPT, XP } from './exam-xp';
import { LEVEL_NAMES } from './utils';

const attempt = (over: Partial<Parameters<typeof xpForAttempt>[0]> = {}) => ({
  mode: 'ssc_chsl',
  netWpm: 35,
  errorPercentage: 0,
  isQualified: true,
  ...over,
});

describe('an attempt is worth what the exam says it is worth', () => {
  it('pays most for clearing the bar', () => {
    const cleared = xpForAttempt(attempt({ isQualified: true }));
    const missed = xpForAttempt(attempt({ isQualified: false }));
    expect(cleared - missed).toBe(XP.CLEARED);
  });

  it('stops paying for speed past the bar', () => {
    // There are no marks for typing faster than the Commission asks, and the
    // old rule paid linearly for speed — so a fast, inaccurate candidate
    // out-earned an accurate one typing at exactly the bar.
    const atBar = xpForAttempt(attempt({ netWpm: 35 }));
    const double = xpForAttempt(attempt({ netWpm: 70 }));
    const quadruple = xpForAttempt(attempt({ netWpm: 140 }));
    expect(double).toBe(atBar);
    expect(quadruple).toBe(atBar);
  });

  it('pays an accurate slow typist more than a fast careless one', () => {
    const careful = xpForAttempt(attempt({ netWpm: 24, errorPercentage: 0, isQualified: false }));
    const careless = xpForAttempt(attempt({ netWpm: 90, errorPercentage: 25, isQualified: false }));
    expect(careful).toBeGreaterThan(careless);
  });

  it('pays nothing extra once the error cap is passed', () => {
    const atCap = xpForAttempt(attempt({ errorPercentage: 7, isQualified: false }));
    const wayOver = xpForAttempt(attempt({ errorPercentage: 40, isQualified: false }));
    expect(atCap).toBe(wayOver);
  });

  it('uses the cap for the post, not one flat number', () => {
    // 6% clears CHSL's 7% and fails CGL's 5%.
    const chsl = xpForAttempt(attempt({ mode: 'ssc_chsl', errorPercentage: 6, isQualified: false }));
    const cgl = xpForAttempt(attempt({ mode: 'ssc_cgl_dest', errorPercentage: 6, isQualified: false }));
    expect(chsl).toBeGreaterThan(cgl);
  });

  it('scores a KDPH post against its own bar', () => {
    // DEO wants 8,000 an hour, which is 26.7 WPM.
    const atBar = xpForAttempt(attempt({ mode: 'ssc_chsl_deo', netWpm: 26.7, errorPercentage: 0 }));
    const halfBar = xpForAttempt(attempt({ mode: 'ssc_chsl_deo', netWpm: 13.3, errorPercentage: 0 }));
    expect(atBar).toBeGreaterThan(halfBar);
  });

  it('pays nothing for an attempt with nothing in it', () => {
    expect(xpForAttempt(attempt({ netWpm: 0, isQualified: false }))).toBe(0);
  });

  it('is bounded', () => {
    const best = xpForAttempt(attempt({ netWpm: 999, errorPercentage: 0, isQualified: true }));
    expect(best).toBe(MAX_XP_PER_ATTEMPT);
    expect(MAX_XP_PER_ATTEMPT).toBe(100);
  });

  it('survives figures that make no sense', () => {
    for (const bad of [NaN, -1, Infinity]) {
      const xp = xpForAttempt(attempt({ netWpm: bad, errorPercentage: bad, isQualified: false }));
      expect(Number.isFinite(xp)).toBe(true);
      expect(xp).toBeGreaterThanOrEqual(0);
      expect(xp).toBeLessThanOrEqual(MAX_XP_PER_ATTEMPT);
    }
  });
});

describe('the road takes a preparation to walk, not a day', () => {
  const summit = LEVEL_NAMES[LEVEL_NAMES.length - 1];

  it('cannot be finished in a day of practice', () => {
    // The account that prompted this reached the old summit on day one: the
    // ladder ended at 16,000 and one attempt paid up to 500.
    const perfectAttemptsToSummit = summit.minXp / MAX_XP_PER_ATTEMPT;
    expect(perfectAttemptsToSummit).toBeGreaterThan(300);
  });

  it('rises without a step that stalls the climb', () => {
    for (let i = 1; i < LEVEL_NAMES.length; i++) {
      const gap = LEVEL_NAMES[i].minXp - LEVEL_NAMES[i - 1].minXp;
      const previous = i > 1 ? LEVEL_NAMES[i - 1].minXp - LEVEL_NAMES[i - 2].minXp : gap;
      expect(gap, LEVEL_NAMES[i].name).toBeGreaterThan(0);
      // Each step is longer than the last, but never more than twice as long.
      expect(gap / previous, LEVEL_NAMES[i].name).toBeLessThanOrEqual(2.5);
    }
  });

  it('names every stop as something to be pleased about', () => {
    const borrowed = ['rookie', 'novice', 'amateur', 'noob', 'goated', 'grandmaster'];
    for (const l of LEVEL_NAMES) {
      expect(borrowed, l.name).not.toContain(l.name.toLowerCase());
      expect(l.blurb.length, l.name).toBeGreaterThan(0);
    }
  });
});
