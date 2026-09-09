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
  it('rewards finishing the passage early', () => {
    // Scoring a passage finished in five minutes as though it took ten
    // under-reported every fast candidate by half.
    const whole = PASSAGE.length;
    const full = sit('ssc_chsl', whole, 600, 600);
    const half = sit('ssc_chsl', whole, 300, 600);
    expect(half.sscNetWpm).toBeCloseTo(full.sscNetWpm * 2, 1);
  });

  it('does not let giving up early count as typing quickly', () => {
    // The clock in the hall runs for the whole window whatever the candidate
    // does. Dividing by the time they chose to type for meant three lines
    // typed fast and then abandoned scored as a very high speed and a pass —
    // which is what an invented "at least 50% of the passage" rule existed to
    // paper over, and that rule was shown to candidates as the Commission's.
    const abandoned = sit('ssc_chsl', 400, 30, 600);
    expect(abandoned.sscNetWpm).toBeLessThan(10);
    expect(errorEngine.isQualifiedFromReport(abandoned, 'ssc_chsl')).toBe(false);

    // And the whole passage typed in the same 30 seconds is still impossible,
    // so the physical floor still holds it down.
    expect(sit('ssc_chsl', PASSAGE.length, 30, 600).sscNetWpm).toBeLessThan(210);
  });

  it('scores an attempt that ran the clock out on the window either way', () => {
    expect(sit('ssc_chsl', 900, 600, 600).sscNetWpm).toBeCloseTo(
      sit('ssc_chsl', 900, 599, 600).sscNetWpm,
      1,
    );
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
    // Stopping a third of the way in, everything typed correctly. It fails on
    // speed, which is honest — but not on a list of mistakes it never made.
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

describe('a full-length passage is scored without exhausting the heap', () => {
  it('scores a 4,000-depression passage quickly', () => {
    // The character diff ran one Levenshtein over the whole passage against
    // the whole attempt, filling an m x n table of objects: 772 MB and half a
    // second for a DEO Grade 'A' passage, and a heap exhaustion for a longer
    // one — which on a serverless function loses the attempt the candidate
    // just sat. The bound that matters is that it is no longer quadratic in
    // the length of the passage.
    const long = SENT.repeat(30).trim(); // ~5,900 characters
    expect(long.length).toBeGreaterThan(4000);

    const before = process.memoryUsage().heapUsed;
    const started = Date.now();
    const r = errorEngine.evaluate(long, long.slice(0, 4000), 900, 'ssc_chsl_deo_grade_a', 900);
    const elapsed = Date.now() - started;
    const grew = (process.memoryUsage().heapUsed - before) / 1e6;

    expect(r.keyDepressionCount).toBe(4000);
    expect(elapsed).toBeLessThan(1000);
    expect(grew).toBeLessThan(200);
  });

  it('counts characters against the word the candidate actually typed', () => {
    // The strings compared were built by index, so one skipped word made every
    // character after it look wrong and the character counts never agreed with
    // the mistakes printed beside them.
    const original = 'the quick brown fox jumps over the lazy dog today';
    const typed = 'the quick fox jumps over the lazy dog today';
    const r = errorEngine.evaluate(original, typed, 600, 'ssc_chsl', 600);

    expect(r.fullMistakes).toBe(1);
    expect(r.wrongWordErrors).toBe(1);
    expect(r.totalCorrectWords).toBe(9); // every word they typed
    // Only the five characters of "brown" are missing.
    expect(r.omissionErrors).toBe(5);
    expect(r.substitutionErrors).toBe(0);
  });
});

/**
 * An attempt with nothing in it.
 *
 * Nought accuracy and nought error is a contradiction, and it was reachable:
 * the error percentage was forced to zero whenever no key was depressed, while
 * the accuracy beside it was already zero. A candidate who submitted only
 * whitespace was told "0.00% mistakes" against a 7% cap — met — on an attempt
 * where they had typed nothing at all, and the same attempt submitted as a
 * genuinely empty box reported 100%.
 */
describe('an attempt with no key depressions', () => {
  const PASSAGE = 'The Reserve Bank of India said that growth would rise this year. '.repeat(4).trim();

  it.each([
    ['nothing at all', ''],
    ['only spaces', '     '],
    ['only whitespace', '  \n\t  '],
  ])('marks %s as a total loss, not a clean sheet', (_label, typed) => {
    const r = errorEngine.evaluate(PASSAGE, typed, 600, 'ssc_chsl', 600);
    expect(r.keyDepressionCount).toBe(0);
    expect(r.sscAccuracy).toBe(0);
    // The half of the pair that used to disagree with the other half.
    expect(r.sscErrorPercentage).toBe(100);
    expect(r.sscNetWpm).toBe(0);
  });

  it('agrees with itself however the empty attempt arrives', () => {
    const kinds = ['', ' ', '\n', '\t\t', '   \n  '].map((t) => {
      const r = errorEngine.evaluate(PASSAGE, t, 600, 'ssc_chsl', 600);
      return `${r.sscAccuracy}/${r.sscErrorPercentage}`;
    });
    expect(new Set(kinds).size).toBe(1);
  });

  it('still charges a real attempt its real error rate', () => {
    // The guard removed above must not have flattened everything to 100%.
    const r = errorEngine.evaluate(PASSAGE, PASSAGE, 600, 'ssc_chsl', 600);
    expect(r.sscErrorPercentage).toBe(0);
    expect(r.sscAccuracy).toBe(100);
  });
});

/**
 * A clock that could not have been kept.
 *
 * The elapsed reading arrives from the browser and is the one number in a
 * submission that nothing else can corroborate. Flooring it at the fastest a
 * person could physically type stopped the 2,083 WPM readings, but left the
 * attempt resting on that ceiling: one second for 1,609 keys was marked at
 * 204 WPM, stored as qualified and paid the full XP award. The ceiling is not
 * a plausible score either — it is the shape of the same broken clock.
 */
describe('an impossible elapsed time', () => {
  const PASSAGE = 'The Reserve Bank of India said that growth would rise this year. '.repeat(14).trim();

  it.each([
    ['one second', 1],
    ['zero seconds', 0],
    ['four seconds', 4],
  ])('does not turn %s of typing into a record speed', (_label, secs) => {
    const r = errorEngine.evaluate(PASSAGE, PASSAGE, 600, 'ssc_chsl', secs);
    // The window stands in for the unusable reading, so the speed is the one
    // the candidate would have had typing for the whole ten minutes.
    expect(r.sscNetWpm).toBeLessThan(60);
    expect(errorEngine.isQualifiedFromReport(r, 'ssc_chsl')).toBe(false);
  });

  it('agrees with a submission that sent no clock at all', () => {
    const impossible = errorEngine.evaluate(PASSAGE, PASSAGE, 600, 'ssc_chsl', 1);
    const missing = errorEngine.evaluate(PASSAGE, PASSAGE, 600, 'ssc_chsl', undefined);
    expect(impossible.sscNetWpm).toBe(missing.sscNetWpm);
  });

  it('still believes a fast but possible candidate', () => {
    // Finishing this passage in 200 of the 600 seconds is quick and entirely
    // possible, so the saved time has to count for them: the speed must beat
    // what the same attempt scores when the clock is thrown away.
    const believed = errorEngine.evaluate(PASSAGE, PASSAGE, 600, 'ssc_chsl', 200);
    const discarded = errorEngine.evaluate(PASSAGE, PASSAGE, 600, 'ssc_chsl', 1);
    expect(believed.sscNetWpm).toBeGreaterThan(discarded.sscNetWpm);
    // Three times the window left, three times the speed.
    expect(believed.sscNetWpm).toBeCloseTo(discarded.sscNetWpm * 3, 0);
  });

  it('never reports a speed beyond a human ceiling, whatever it is sent', () => {
    for (const secs of [0, 1, 2, 5, 10, 30]) {
      const r = errorEngine.evaluate(PASSAGE, PASSAGE, 600, 'ssc_chsl', secs);
      expect(r.sscNetWpm).toBeLessThanOrEqual(200);
    }
  });
});
