import { describe, it, expect } from 'vitest';
import { alignWords, diagnose } from './exam-diagnosis';
import { getFlatLessons } from './typing-curriculum';

const kinds = (original: string, typed: string) =>
  Object.fromEntries(
    diagnose(original, typed).findings.map((f) => [f.kind, f.count])
  );

describe('alignWords', () => {
  it('costs one mistake for one skipped word, not every word after it', () => {
    // The bug this whole module exists to fix: index-based comparison marked
    // seven of nine words wrong when the candidate dropped exactly one.
    const expected = 'the quick brown fox jumps over the lazy dog'.split(' ');
    const typed = 'the quick fox jumps over the lazy dog'.split(' ');
    const pairs = alignWords(expected, typed);

    const wrong = pairs.filter((p) => p.expected !== p.typed);
    expect(wrong).toHaveLength(1);
    expect(wrong[0]).toEqual({ expected: 'brown', typed: null });
  });

  it('keeps every word paired when the attempt is perfect', () => {
    const words = 'one two three four'.split(' ');
    const pairs = alignWords(words, words);
    expect(pairs).toHaveLength(4);
    expect(pairs.every((p) => p.expected === p.typed)).toBe(true);
  });

  it('reports an inserted word as an extra rather than shifting the rest', () => {
    const pairs = alignWords(
      'alpha beta gamma'.split(' '),
      'alpha beta extra gamma'.split(' ')
    );
    const wrong = pairs.filter((p) => p.expected !== p.typed);
    expect(wrong).toEqual([{ expected: null, typed: 'extra' }]);
  });

  it('handles an empty attempt', () => {
    const pairs = alignWords('one two'.split(' '), []);
    expect(pairs).toHaveLength(2);
    expect(pairs.every((p) => p.typed === null)).toBe(true);
  });
});

describe('diagnose — classification', () => {
  it('calls a case slip capitalisation, not spelling', () => {
    expect(kinds('The Reserve Bank', 'the Reserve Bank')).toEqual({
      capitalisation: 1,
    });
  });

  it('calls a missing comma punctuation', () => {
    expect(kinds('growth, and jobs', 'growth and jobs')).toEqual({
      punctuation: 1,
    });
  });

  it('calls two words run together a spacing mistake, once', () => {
    // Aligns as a substitution plus a skip. Counted naively that reads as one
    // and a half mistakes; it is half.
    const d = diagnose('I hope so', 'Ihope so');
    expect(d.findings.map((f) => f.kind)).toEqual(['spacing']);
    expect(d.findings[0].count).toBe(1);
    expect(d.totalMistakes).toBe(0.5);
  });

  it('calls one word split in two a spacing mistake', () => {
    const d = diagnose('I have it', 'I h ave it');
    expect(d.findings.map((f) => f.kind)).toEqual(['spacing']);
    expect(d.totalMistakes).toBe(0.5);
  });

  it('calls a swapped pair word order, once, not two mistakes', () => {
    const d = diagnose('I hope you', 'hope I you');
    expect(d.findings.map((f) => f.kind)).toEqual(['wordOrder']);
    expect(d.findings[0].count).toBe(1);
    expect(d.totalMistakes).toBe(0.5);
  });

  it('separates figures from spelling', () => {
    expect(kinds('grew by 2019 crore', 'grew by 2018 crore')).toEqual({
      figures: 1,
    });
  });

  it('calls a wrong letter spelling', () => {
    expect(kinds('the government said', 'the goverment said')).toEqual({
      spelling: 1,
    });
  });

  it('counts a skipped word and an extra word separately', () => {
    expect(kinds('one two three', 'one three')).toEqual({ skipped: 1 });
    expect(kinds('one three', 'one two three')).toEqual({ extra: 1 });
  });

  it('finds nothing wrong with a perfect attempt', () => {
    const d = diagnose('The quick brown fox.', 'The quick brown fox.');
    expect(d.findings).toEqual([]);
    expect(d.totalMistakes).toBe(0);
    expect(d.wordsCorrect).toBe(4);
  });
});

describe('diagnose — weighting', () => {
  it('weights full and half mistakes the way the Commission does', () => {
    const d = diagnose(
      'The Reserve Bank said growth, would rise by 2019 percent',
      'the Reserve Bank said growth would rise by 2018 percent'
    );
    // capitalisation (half) + punctuation (half) + figures (full)
    expect(d.halfMistakes).toBe(2);
    expect(d.fullMistakes).toBe(1);
    expect(d.totalMistakes).toBe(2);
  });

  it('orders findings by the marks they cost', () => {
    const d = diagnose(
      'alpha beta gamma delta epsilon zeta',
      'alpho beto gammo delta epsilon zeta'.replace('delta', 'Delta')
    );
    const costs = d.findings.map((f) => f.cost);
    expect(costs).toEqual([...costs].sort((a, b) => b - a));
  });
});

describe('diagnose — unfinished passages', () => {
  it('does not score the part never reached as hundreds of mistakes', () => {
    // The old behaviour: type a line of a long passage and every remaining
    // word became an omission, which drove the score to zero.
    const passage = Array.from({ length: 300 }, (_, i) => `word${i}`).join(' ');
    const typed = Array.from({ length: 20 }, (_, i) => `word${i}`).join(' ');
    const d = diagnose(passage, typed);
    expect(d.totalMistakes).toBeLessThanOrEqual(5);
    expect(d.wordsCorrect).toBe(20);
  });

  it('still reports mistakes inside the part that was reached', () => {
    const passage = 'alpha beta gamma delta epsilon zeta eta theta';
    const d = diagnose(passage, 'alpha beto gamma');
    expect(d.findings.some((f) => f.kind === 'spelling')).toBe(true);
  });

  it('handles an empty attempt without inventing mistakes', () => {
    const d = diagnose('alpha beta gamma', '');
    expect(d.wordsAttempted).toBe(0);
    expect(d.findings).toEqual([]);
  });
});

describe('diagnose — learn mapping', () => {
  it('points every finding at a lesson that exists', () => {
    // The whole point of the report: a mistake the candidate can go and drill.
    const ids = new Set(getFlatLessons().map((l) => l.id));
    const d = diagnose(
      'The Reserve Bank said growth, would rise by 2019 percent and I hope so',
      'the Reserve Bank said growth would rise by 2018 percent and Ihope so'
    );
    expect(d.findings.length).toBeGreaterThan(0);
    for (const f of d.findings) {
      expect(ids.has(f.lessonId), `${f.kind} -> ${f.lessonId}`).toBe(true);
      expect(f.href).toBe(`/exam/lesson/${f.lessonId}`);
      expect(f.lessonTitle).toBeTruthy();
      expect(f.advice).toBeTruthy();
    }
  });

  it('gives every finding at least one concrete example', () => {
    const d = diagnose('the government said', 'the goverment said');
    expect(d.findings[0].examples).toEqual([
      { expected: 'government', typed: 'goverment' },
    ]);
  });
});

describe('unfinished attempts are not charged for the part never reached', () => {
  const passage = Array.from({ length: 300 }, (_, i) => `word${i}`).join(' ');
  const twoThirds = Array.from({ length: 200 }, (_, i) => `word${i}`).join(' ');

  it('charges nothing for stopping early with everything typed correct', () => {
    // The reach used to be guessed as typedWords * 1.15, which charged about
    // fifteen percent of the attempt's length in phantom skipped words: two
    // thirds of a passage typed perfectly came back as 32 mistakes and a
    // 12.8% error rate.
    const d = diagnose(passage, twoThirds);
    expect(d.totalMistakes).toBe(0);
    expect(d.findings).toEqual([]);
  });

  it('still charges a word skipped in the middle', () => {
    // The trim must only remove the untouched tail. A gap with typed words
    // after it is a real omission and stays chargeable.
    const withGap = Array.from({ length: 200 }, (_, i) => `word${i}`)
      .filter((w) => w !== 'word50')
      .join(' ');
    const d = diagnose(passage, withGap);
    expect(d.findings.map((f) => f.kind)).toEqual(['skipped']);
    expect(d.totalMistakes).toBe(1);
  });

  it('still charges a slip inside the part that was typed', () => {
    const d = diagnose(passage, twoThirds.replace('word50', 'wrod50'));
    expect(d.totalMistakes).toBe(1);
  });

  it('charges nothing for a complete, perfect attempt', () => {
    expect(diagnose(passage, passage).totalMistakes).toBe(0);
  });

  it('scales: a one-word attempt is not charged for the other 299', () => {
    const d = diagnose(passage, 'word0');
    expect(d.totalMistakes).toBe(0);
    expect(d.wordsCorrect).toBe(1);
  });
});
