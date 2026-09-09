import { describe, it, expect } from 'vitest';
import { errorEngine } from './error-engine';

const SENT =
  'The Reserve Bank of India said that the growth of the economy would rise by about 2019 percent in the coming year and that inflation would remain within the tolerance band set by the government of India. ';
const PASSAGE = SENT.repeat(25).trim();
const HINDI =
  'भारत सरकार ने कहा कि देश की अर्थव्यवस्था इस वर्ष तेजी से बढ़ेगी और महंगाई तय सीमा के भीतर रहेगी। '.repeat(40).trim();

/** Type `chars` of the passage in `seconds` and score it as `mode`. */
const sit = (mode: string, chars: number, seconds: number, window: number, passage = PASSAGE) =>
  errorEngine.evaluate(passage, passage.slice(0, chars), window, mode, seconds);

describe('speed is measured against the time actually spent typing', () => {
  it('divides by the time taken, not the window that was allotted', () => {
    // Scoring a passage finished in five minutes as though it took ten
    // under-reported every fast candidate by half.
    const full = sit('ssc_chsl', 1500, 600, 600);
    const half = sit('ssc_chsl', 1500, 300, 600);
    expect(half.sscNetWpm).toBeCloseTo(full.sscNetWpm * 2, 1);
  });

  it('refuses to report a speed no one could have typed', () => {
    // A clock that misbehaved reported 2,083 WPM, cleared posts the candidate
    // had not cleared, and would have taken the leaderboard.
    const pasted = sit('ssc_chsl', 2000, 1, 600);
    expect(pasted.sscNetWpm).toBeLessThan(210);
  });

  it('cannot be inflated by claiming longer than the window', () => {
    expect(sit('ssc_chsl', 900, 9999, 600).sscNetWpm).toBeCloseTo(
      sit('ssc_chsl', 900, 600, 600).sscNetWpm,
      2,
    );
  });
});

describe('the arithmetic is the Commission\'s', () => {
  it('nets speed as (depressions/5 - mistakes) over minutes', () => {
    const r = sit('ssc_chsl', 1500, 600, 600);
    const mistakes = r.fullMistakes + r.halfMistakes / 2;
    expect(r.sscNetWpm).toBeCloseTo((r.keyDepressionCount / 5 - mistakes) / 10, 2);
  });

  it('leaves accuracy and error percentage summing to a hundred', () => {
    const r = sit('ssc_chsl', 1500, 600, 600);
    expect(r.sscAccuracy + r.sscErrorPercentage).toBeCloseTo(100, 2);
  });

  it('reports a worthless attempt as 100% errors, not 0%', () => {
    // `accuracy > 0 ? 100 - accuracy : 0` turned the worst possible attempt
    // into a report of no errors at all, which then passed every cap.
    const r = errorEngine.evaluate(PASSAGE, 'zz '.repeat(400).trim(), 600, 'ssc_chsl', 600);
    expect(r.sscAccuracy).toBe(0);
    expect(r.sscErrorPercentage).toBe(100);
    expect(errorEngine.isQualifiedFromReport(r, 'ssc_chsl')).toBe(false);
  });
});

describe('every post is judged against its own bar', () => {
  it('holds LDC/JSA to 35 WPM and a 7% error cap', () => {
    expect(errorEngine.isQualifiedFromReport(sit('ssc_chsl', 2000, 600, 600), 'ssc_chsl')).toBe(true);
    expect(errorEngine.isQualifiedFromReport(sit('ssc_chsl', 900, 600, 600), 'ssc_chsl')).toBe(false);
  });

  it('holds DEO to 8,000 key depressions an hour', () => {
    // 2,100 depressions in fifteen minutes is 8,400 an hour.
    expect(errorEngine.isQualifiedFromReport(sit('ssc_chsl_deo', 2100, 900, 900), 'ssc_chsl_deo')).toBe(true);
    expect(errorEngine.isQualifiedFromReport(sit('ssc_chsl_deo', 1500, 900, 900), 'ssc_chsl_deo')).toBe(false);
  });

  it("holds DEO Grade 'A' to 15,000", () => {
    expect(errorEngine.isQualifiedFromReport(sit('ssc_chsl_deo_grade_a', 3800, 900, 900), 'ssc_chsl_deo_grade_a')).toBe(true);
    expect(errorEngine.isQualifiedFromReport(sit('ssc_chsl_deo_grade_a', 2100, 900, 900), 'ssc_chsl_deo_grade_a')).toBe(false);
  });

  it('qualifies a Hindi candidate at 30 WPM, not the English 35', () => {
    // The instructions screen has always said 30. Nothing resolved the
    // language for the marking, so a Hindi candidate at 31 WPM was failed
    // against a bar they were never held to.
    const r = sit('ssc_hindi', 1550, 600, 600, HINDI);
    expect(r.sscNetWpm).toBeGreaterThan(30);
    expect(r.sscNetWpm).toBeLessThan(35);
    expect(errorEngine.isQualifiedFromReport(r, 'ssc_hindi')).toBe(true);
    expect(errorEngine.isQualifiedFromReport(r, 'ssc_chsl')).toBe(false);
  });

  it('widens the error allowance for a reserved category', () => {
    // Fast enough, but roughly 9% wrong: over the 7% general cap, inside the
    // 10% allowed to SC/ST candidates.
    const typed = PASSAGE.slice(0, 2000).split(' ').map((w, i) => (i % 11 === 0 ? w + 'zz' : w)).join(' ');
    const r = errorEngine.evaluate(PASSAGE, typed, 600, 'ssc_chsl', 600);
    expect(r.sscErrorPercentage).toBeGreaterThan(7);
    expect(r.sscErrorPercentage).toBeLessThan(10);
    expect(errorEngine.isQualifiedFromReport(r, 'ssc_chsl', 'ur')).toBe(false);
    expect(errorEngine.isQualifiedFromReport(r, 'ssc_chsl', 'scSt')).toBe(true);
  });

  it('charges capitalisation at half, so many slips can still clear', () => {
    // Fifty-three wrong capitals is 26.5 mistakes, not 53 — the difference
    // between clearing the 7% cap and failing it.
    const typed = PASSAGE.slice(0, 2000).split(' ').map((w, i) => (i % 7 === 0 ? w.toUpperCase() : w)).join(' ');
    const r = errorEngine.evaluate(PASSAGE, typed, 600, 'ssc_chsl', 600);
    expect(r.halfMistakes).toBeGreaterThan(40);
    // Only the truncated final word, from slicing the passage mid-word.
    expect(r.fullMistakes).toBeLessThanOrEqual(1);
    expect(r.sscErrorPercentage).toBeLessThan(7);
    expect(errorEngine.isQualifiedFromReport(r, 'ssc_chsl')).toBe(true);
  });

  it('does not charge an unfinished attempt for the part never reached', () => {
    // Stopping a third of the way in, everything typed correctly.
    const r = sit('ssc_chsl', 700, 300, 600);
    expect(r.fullMistakes + r.halfMistakes / 2).toBeLessThanOrEqual(1);
    expect(r.sscErrorPercentage).toBeLessThan(2);
  });
});

describe('an attempt with nothing in it', () => {
  it('is not reported as a perfect score', () => {
    const r = errorEngine.evaluate(PASSAGE, '   ', 600, 'ssc_chsl', 600);
    expect(r.keyDepressionCount).toBe(0);
    expect(r.sscAccuracy).toBe(0);
    expect(r.accuracy).toBe(0);
    expect(r.sscNetWpm).toBe(0);
    expect(errorEngine.isQualifiedFromReport(r, 'ssc_chsl')).toBe(false);
  });
});
