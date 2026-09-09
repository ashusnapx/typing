import { describe, it, expect } from 'vitest';
import { summariseAttempt } from './attempt-summary';
import { diffPassage } from './exam-diagnosis';

const figures = (over: Partial<Parameters<typeof summariseAttempt>[0]> = {}) => ({
  mode: 'ssc_chsl',
  isQualified: false,
  netWpm: 40,
  errorPercentage: 2,
  keyDepressions: 2000,
  secondsTyped: 600,
  ...over,
});

describe('the analysis page reads the verdict, it does not re-decide it', () => {
  it('takes the stored verdict as given', () => {
    // The page recomputed this for itself, against englishSpeedWpm whatever
    // language the test was sat in and a 20% error default for every post, and
    // then added a "50% of the passage" rule the Commission does not have. The
    // same attempt could read Qualified here and Not qualified on the
    // dashboard.
    expect(summariseAttempt(figures({ isQualified: true })).qualified).toBe(true);
    expect(summariseAttempt(figures({ isQualified: false })).qualified).toBe(false);
  });

  it('names the requirement that was missed', () => {
    expect(summariseAttempt(figures({ netWpm: 40, errorPercentage: 20 })).verdict)
      .toContain('Mistakes are what cost you');
    expect(summariseAttempt(figures({ netWpm: 20, errorPercentage: 2 })).verdict)
      .toContain('Speed is what cost you');
    expect(summariseAttempt(figures({ netWpm: 20, errorPercentage: 20 })).verdict)
      .toContain('Accuracy is the one to fix first');
    expect(summariseAttempt(figures({ isQualified: true })).verdict)
      .toContain('met both requirements');
  });
});

describe('the figures beside the verdict are the ones it was judged on', () => {
  it('reports KDPH net of mistakes, not the raw rate', () => {
    // The page printed keyDepressions / seconds * 3600 — the gross rate —
    // while the marking uses the net one. A DEO candidate saw 8,400 KDPH
    // beside a verdict that had just failed them at an 8,000 bar.
    const s = summariseAttempt(figures({ mode: 'ssc_chsl_deo', netWpm: 26, keyDepressions: 2100, secondsTyped: 900 }));
    expect(s.kdph).toBe(26 * 300);
    expect(s.nature).toBe('kdph');
    expect(s.speedMet).toBe(false); // 7,800 against 8,000
    expect(summariseAttempt(figures({ mode: 'ssc_chsl_deo', netWpm: 27 })).speedMet).toBe(true);
  });

  it('holds a Hindi attempt to 30 WPM', () => {
    const s = summariseAttempt(figures({ mode: 'ssc_hindi', netWpm: 31 }));
    expect(s.speedTarget).toBe(30);
    expect(s.language).toBe('hindi');
    expect(s.speedMet).toBe(true);
    expect(summariseAttempt(figures({ mode: 'ssc_chsl', netWpm: 31 })).speedMet).toBe(false);
  });

  it('uses the error cap for the post and the category, not a flat 20%', () => {
    expect(summariseAttempt(figures(), 'ur').errorCap).toBe(7);
    expect(summariseAttempt(figures(), 'scSt').errorCap).toBe(10);
    expect(summariseAttempt(figures({ mode: 'ssc_cgl_dest' }), 'ur').errorCap).toBe(5);
    expect(summariseAttempt(figures({ mode: 'ssc_chsl_deo' }), 'ur').errorCap).toBe(20);
  });

  it('lets a wider category cap change whether the errors were met', () => {
    const nine = figures({ errorPercentage: 9 });
    expect(summariseAttempt(nine, 'ur').errorsMet).toBe(false);
    expect(summariseAttempt(nine, 'scSt').errorsMet).toBe(true);
  });
});

describe('the passage view is aligned, not compared position by position', () => {
  it('does not paint the rest of the passage red after one skipped word', () => {
    // The side-by-side view compared word i against word i. Skipping a single
    // word shifted every word after it, so a candidate whose score said one
    // mistake was shown a passage of solid red.
    const original = 'the quick brown fox jumps over the lazy dog';
    const typed = 'the quick fox jumps over the lazy dog';
    const { cells } = diffPassage(original, typed);
    expect(cells.filter((c) => c.status !== 'correct')).toEqual([
      { expected: 'brown', typed: null, status: 'missed', kind: 'skipped' },
    ]);
  });

  it('separates a half mistake from a full one, as the marking does', () => {
    const { cells } = diffPassage('The Reserve Bank said', 'the Reserve Bank said');
    expect(cells[0]).toMatchObject({ status: 'half', kind: 'capitalisation' });

    const spelt = diffPassage('the government said', 'the goverment said');
    expect(spelt.cells[1]).toMatchObject({ status: 'full', kind: 'spelling' });
  });

  it('shows what was never reached as not reached, not as mistakes', () => {
    const words = Array.from({ length: 60 }, (_, i) => `word${i}`);
    const { cells, unreached } = diffPassage(words.join(' '), words.slice(0, 20).join(' '));
    expect(cells).toHaveLength(20);
    expect(cells.every((c) => c.status === 'correct')).toBe(true);
    expect(unreached).toHaveLength(40);
  });

  it('has nothing to compare when nothing was typed', () => {
    const { cells, unreached } = diffPassage('one two three', '');
    expect(cells).toEqual([]);
    expect(unreached).toEqual(['one', 'two', 'three']);
  });

  it('marks an extra word as extra', () => {
    const { cells } = diffPassage('alpha beta gamma', 'alpha beta extra gamma');
    expect(cells.filter((c) => c.status !== 'correct')).toEqual([
      { expected: null, typed: 'extra', status: 'extra', kind: 'extra' },
    ]);
  });
});
