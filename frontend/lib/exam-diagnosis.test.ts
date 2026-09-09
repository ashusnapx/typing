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

  it('pairs nothing at all against an empty attempt', () => {
    // Not two skipped words: the alignment stops where the candidate stopped,
    // and a candidate who typed nothing reached nothing. What is left of the
    // passage is a completion figure, reported on its own.
    expect(alignWords('one two'.split(' '), [])).toEqual([]);
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

describe('a trailing fragment does not drag the alignment to the end', () => {
  const words = Array.from({ length: 300 }, (_, i) => `word${i}`);
  const passage = words.join(' ');
  const upTo222 = words.slice(0, 222).join(' ');

  it('charges one mistake for stopping mid-word, not eighty', () => {
    // Stopping mid-word leaves a fragment that matches nothing well, so the
    // aligner parked it against the LAST word of the passage — every untyped
    // word in between then read as a skip. A 74% attempt was charged 80
    // phantom mistakes and a 29% error rate.
    const midWord = upTo222.slice(0, upTo222.length - 3);
    const d = diagnose(passage, midWord);
    expect(d.totalMistakes).toBe(1);
  });

  it('still charges nothing for stopping on a clean word boundary', () => {
    expect(diagnose(passage, upTo222).totalMistakes).toBe(0);
  });

  it('bounds an attempt that matches nothing at all', () => {
    // No anchor to trim from. Three wrong words against a 300-word passage
    // must not be scored as 300 mistakes.
    expect(diagnose(passage, 'xxx yyy zzz').totalMistakes).toBeLessThanOrEqual(5);
  });
});

describe('the alignment stops where the candidate stopped', () => {
  const P = 'the quick brown fox jumps over the lazy dog and runs away home';

  it('does not chase a repeated word to its last occurrence', () => {
    // Plain Levenshtein has to consume the whole passage, so the deletions
    // after the last typed word priced the alignment for the words that WERE
    // typed. Typing "in the" correctly had the "the" matched to the last of
    // four, and the eleven words in between charged as skipped: eleven full
    // mistakes for two words typed perfectly.
    const passage = 'in the year the bank of the nation said the rate of the loan';
    expect(diagnose(passage, 'in the').totalMistakes).toBe(0);
    expect(diagnose(P, 'the').totalMistakes).toBe(0);
  });

  it('charges a short attempt for what it typed and nothing more', () => {
    expect(kinds(P, 't')).toEqual({ spelling: 1 });
    expect(kinds(P, 'xx yy zz')).toEqual({ spelling: 3 });
    expect(kinds(P, 'aa bb cc dd ee')).toEqual({ spelling: 5 });
  });

  it('prefers the longer reading when two cost the same', () => {
    // Substituting a word costs exactly what inserting it costs, and stopping
    // early is free, so shouting the passage back tied with an alignment
    // against no passage at all — three full mistakes for extra words instead
    // of three half ones for capitals.
    expect(kinds('The Reserve Bank', 'THE RESERVE BANK')).toEqual({
      capitalisation: 3,
    });
    expect(diagnose('The Reserve Bank', 'THE RESERVE BANK').totalMistakes).toBe(1.5);
  });

  it('reads a local swap as a swap, not as a jump down the passage', () => {
    // "first" appears again later. Matching that copy was cheaper than
    // admitting the transposition, once the tail was being paid for.
    const passage = 'other first that me most all first on the list today';
    expect(kinds(passage, 'other that first me most')).toEqual({ wordOrder: 1 });
  });

  it('keeps a merge visible even as the last thing typed', () => {
    // The swallowed word sits one past where the alignment ends, and without
    // it the merge reads as a plain misspelling — a full mistake charged for
    // half a one.
    expect(kinds('I hope so', 'Ihope')).toEqual({ spacing: 1 });
    expect(diagnose('I hope so', 'Ihope').totalMistakes).toBe(0.5);
  });
});

describe('Hindi is marked on the same rules, and correctly', () => {
  // Matras, anusvara, halant and nukta are Unicode Marks rather than Letters,
  // so stripping "punctuation" with \p{L}\p{N} deleted every one of them and
  // made two different Hindi words compare equal. The commonest mistake in
  // Hindi typing was reported as a punctuation slip worth half a mistake, and
  // sent the candidate to the punctuation lesson.

  it('calls a dropped matra a spelling mistake, and charges a full mark', () => {
    const d = diagnose('भारत सरकार ने कहा', 'भारत सरकर ने कहा');
    expect(d.findings.map((f) => f.kind)).toEqual(['spelling']);
    expect(d.totalMistakes).toBe(1);
    expect(d.findings[0].lessonId).toBe('s3-spelling');
  });

  it('calls an added anusvara a spelling mistake', () => {
    expect(kinds('भारत सरकार ने कहा', 'भारत सरकार ने कहां')).toEqual({ spelling: 1 });
  });

  it('calls a dropped nukta a spelling mistake', () => {
    expect(kinds('वह क़लम है', 'वह कलम है')).toEqual({ spelling: 1 });
  });

  it('still calls a dropped danda or comma punctuation', () => {
    expect(kinds('भारत सरकार ने कहा।', 'भारत सरकार ने कहा')).toEqual({ punctuation: 1 });
    expect(kinds('भारत, सरकार ने कहा', 'भारत सरकार ने कहा')).toEqual({ punctuation: 1 });
  });

  it('marks spacing, omission and figures in Hindi as it does in English', () => {
    expect(kinds('भारत सरकार ने कहा', 'भारतसरकार ने कहा')).toEqual({ spacing: 1 });
    expect(kinds('भारत सरकार ने कहा है', 'भारत ने कहा है')).toEqual({ skipped: 1 });
    expect(kinds('वर्ष २०१९ में आया', 'वर्ष २०१८ में आया')).toEqual({ figures: 1 });
  });
});

describe('no attempt is charged more than it could possibly have earned', () => {
  const VOCAB = ('the of and to in a is that for it as was with be by on not he this are '
    + 'but had have from or an they which one you were her all she there would their we him '
    + 'been has when who will more no if out so said what its about into than them can only').split(' ');

  it('holds every invariant across ten thousand random attempts', () => {
    // The property that matters: you cannot lose more marks than the number of
    // words you typed plus the slips you actually made. Every scoring bug this
    // module has had showed up as a violation of it — phantom skipped words,
    // a repeated word dragging the anchor, a truncated final word.
    let seed = 7;
    const r = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
    const violations: string[] = [];

    for (let t = 0; t < 10000; t++) {
      const length = 3 + Math.floor(r() * 60);
      const passage = Array.from({ length }, () => VOCAB[Math.floor(r() * VOCAB.length)]);
      let typed = passage.slice(0, Math.floor(r() * (length + 1)));

      const mutations = Math.floor(r() * 5);
      for (let k = 0; k < mutations && typed.length; k++) {
        const i = Math.floor(r() * typed.length);
        switch (Math.floor(r() * 9)) {
          case 0: typed = typed.map((w, j) => (j === i ? w.toUpperCase() : w)); break;
          case 1: typed = typed.map((w, j) => (j === i ? w + 'q' : w)); break;
          case 2: typed = typed.filter((_, j) => j !== i); break;
          case 3: typed = [...typed.slice(0, i), 'zzz', ...typed.slice(i)]; break;
          case 4: if (i + 1 < typed.length) typed = [...typed.slice(0, i), typed[i] + typed[i + 1], ...typed.slice(i + 2)]; break;
          case 5: typed = typed.map((w, j) => (j === i ? w + ',' : w)); break;
          case 6: if (i + 1 < typed.length) typed = [...typed.slice(0, i), typed[i + 1], typed[i], ...typed.slice(i + 2)]; break;
          case 7: if (typed[i].length > 2) typed = [...typed.slice(0, i), typed[i].slice(0, 1), typed[i].slice(1), ...typed.slice(i + 1)]; break;
          default: typed = typed.map((w, j) => (j === i ? w.slice(0, -1) : w));
        }
      }

      const d = diagnose(passage.join(' '), typed.join(' '));
      const where = `\n  passage: ${passage.join(' ')}\n  typed:   ${typed.join(' ')}\n  got:     ${d.totalMistakes} (${d.findings.map((f) => f.kind + ' x' + f.count).join(', ')})`;

      if (d.totalMistakes > Math.max(typed.length, 1) + mutations) violations.push('charged more than was typed' + where);
      if (Math.abs(d.findings.reduce((s, f) => s + f.cost, 0) - d.totalMistakes) > 1e-9) violations.push('breakdown does not add up to the total' + where);
      if (d.totalMistakes !== d.fullMistakes + d.halfMistakes / 2) violations.push('full + half/2 does not hold' + where);
      if (d.wordsCorrect > d.wordsAttempted) violations.push('more words right than were typed' + where);
      if (d.findings.some((f) => f.count < 1)) violations.push('a finding with no occurrences' + where);
    }

    expect(violations.slice(0, 3).join('\n'), `${violations.length} of 10000`).toBe('');
  });

  it('never charges an attempt that stopped early but typed correctly', () => {
    let seed = 99;
    const r = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
    for (let t = 0; t < 500; t++) {
      const length = 1 + Math.floor(r() * 120);
      const passage = Array.from({ length }, () => VOCAB[Math.floor(r() * VOCAB.length)]);
      const stop = 1 + Math.floor(r() * length);
      const d = diagnose(passage.join(' '), passage.slice(0, stop).join(' '));
      expect(d.totalMistakes, `stopped at ${stop} of ${length}: ${passage.join(' ')}`).toBe(0);
    }
  });
});
