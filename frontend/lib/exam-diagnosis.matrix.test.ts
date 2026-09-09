import { describe, it, expect } from 'vitest';
import { diagnose, type MistakeKind } from './exam-diagnosis';

/**
 * Every combination of every kind of mistake, all 256 of them.
 *
 * The individual kinds were each tested on their own, which is the easy case:
 * one slip in a clean passage, nothing nearby for the aligner to confuse it
 * with. What actually arrives from a candidate is six kinds at once, and the
 * failure this whole module exists to prevent — one skipped word scored as
 * dozens of mistakes — is a failure of alignment under exactly that load.
 *
 * So each kind gets its own stretch of the passage, far from the others, and
 * every subset of the eight is built, marked and checked: the kinds reported
 * must be the kinds committed, no more and no fewer, and the marks must be the
 * Commission's — a full mistake for a whole word wrong, half for a slip of
 * case, spacing, punctuation or order.
 */

const SENTENCE =
  'The Reserve Bank of India said that the growth of the economy would rise by about 2019 percent in the coming year. ';
const PASSAGE = SENTENCE.repeat(14).trim();

/** Half a mistake under the Commission's rule; the other four cost a whole one. */
const HALF: MistakeKind[] = ['capitalisation', 'spacing', 'punctuation', 'wordOrder'];

/* One slip per kind, each in its own repetition of the sentence so no two can
   land close enough to be read as one another. Applied high index first, so a
   splice never shifts a slot that has not been written yet. */
const SLIPS: { kind: MistakeKind; at: number; word: string; apply: (w: string[]) => void }[] = [
  { kind: 'extra', at: 206, word: 'growth', apply: (w) => { w.splice(206, 0, 'zzz'); } },
  { kind: 'skipped', at: 184, word: 'growth', apply: (w) => { w.splice(184, 1); } },
  { kind: 'spacing', at: 140, word: 'growth', apply: (w) => { w.splice(140, 2, w[140] + w[141]); } },
  { kind: 'wordOrder', at: 118, word: 'growth', apply: (w) => { const t = w[118]; w[118] = w[119]; w[119] = t; } },
  { kind: 'figures', at: 104, word: '2019', apply: (w) => { w[104] = '2018'; } },
  { kind: 'spelling', at: 74, word: 'growth', apply: (w) => { w[74] = 'growht'; } },
  { kind: 'punctuation', at: 49, word: 'said', apply: (w) => { w[49] = 'said,'; } },
  { kind: 'capitalisation', at: 23, word: 'Reserve', apply: (w) => { w[23] = 'reserve'; } },
];

/** A slot that has drifted onto a different word is testing nothing, so the
 *  passage itself is checked before anything is built from it. */
it('every slip lands on the word it was aimed at', () => {
  const words = PASSAGE.split(' ');
  for (const s of SLIPS) expect(`${s.kind}@${s.at}=${words[s.at]}`).toBe(`${s.kind}@${s.at}=${s.word}`);
});

function typedWith(kinds: MistakeKind[]): string {
  const words = PASSAGE.split(' ');
  for (const slip of SLIPS) if (kinds.includes(slip.kind)) slip.apply(words);
  return words.join(' ');
}

/** All 2^8 subsets, smallest first. */
const SUBSETS: MistakeKind[][] = [];
const ALL = SLIPS.map((s) => s.kind);
for (let mask = 0; mask < 1 << ALL.length; mask++) {
  SUBSETS.push(ALL.filter((_, i) => mask & (1 << i)));
}

describe('every combination of mistakes, marked', () => {
  it('builds all 256 subsets of the eight kinds', () => {
    expect(SUBSETS).toHaveLength(256);
    expect(SUBSETS.filter((s) => s.length === 0)).toHaveLength(1);
    expect(SUBSETS.filter((s) => s.length === 8)).toHaveLength(1);
  });

  it('reports exactly the kinds committed — no more, no fewer', () => {
    const wrong: string[] = [];
    for (const kinds of SUBSETS) {
      const got = diagnose(PASSAGE, typedWith(kinds)).findings.map((f) => f.kind).sort();
      const want = [...kinds].sort();
      if (got.join(',') !== want.join(',')) {
        wrong.push(`[${want.join('+') || 'clean'}] reported [${got.join('+') || 'clean'}]`);
      }
    }
    expect(wrong).toEqual([]);
  });

  it('charges a full mark for a whole word and half for a slip', () => {
    const wrong: string[] = [];
    for (const kinds of SUBSETS) {
      const d = diagnose(PASSAGE, typedWith(kinds));
      const half = kinds.filter((k) => HALF.includes(k)).length;
      const full = kinds.length - half;
      const got = `${d.fullMistakes}f ${d.halfMistakes}h ${d.totalMistakes}`;
      const want = `${full}f ${half}h ${full + half / 2}`;
      if (got !== want) wrong.push(`[${kinds.join('+') || 'clean'}] want ${want}, got ${got}`);
    }
    expect(wrong).toEqual([]);
  });

  it('counts each kind exactly once, however many other kinds surround it', () => {
    // The bug this guards: one slip read as many, because the words after it
    // no longer line up. Every finding here is a single deliberate slip.
    const wrong: string[] = [];
    for (const kinds of SUBSETS) {
      for (const f of diagnose(PASSAGE, typedWith(kinds)).findings) {
        if (f.count !== 1) wrong.push(`[${kinds.join('+')}] ${f.kind} counted ${f.count}`);
      }
    }
    expect(wrong).toEqual([]);
  });

  it('never marks the passage as unfinished when it was typed to the end', () => {
    const wrong: string[] = [];
    for (const kinds of SUBSETS) {
      const d = diagnose(PASSAGE, typedWith(kinds));
      if (d.wordsUnreached !== 0) wrong.push(`[${kinds.join('+')}] ${d.wordsUnreached} unreached`);
    }
    expect(wrong).toEqual([]);
  });

  it('sends every finding to a drill that exists', () => {
    const wrong: string[] = [];
    for (const f of diagnose(PASSAGE, typedWith(ALL)).findings) {
      if (!f.href.startsWith('/exam/lesson/') || !f.lessonTitle) wrong.push(`${f.kind} → ${f.href}`);
    }
    expect(wrong).toEqual([]);
  });

  it('orders the findings by what they cost, worst first', () => {
    const costs = diagnose(PASSAGE, typedWith(ALL)).findings.map((f) => f.cost);
    expect(costs).toEqual([...costs].sort((a, b) => b - a));
  });
});

describe('the spacing slip in both directions', () => {
  // The matrix uses a merge. A split is the same half mistake and has to be
  // reported as the same kind, or a candidate is sent to the wrong drill.
  it('marks a word split in two as spacing, not as two spellings', () => {
    const words = PASSAGE.split(' ');
    words.splice(162, 1, words[162].slice(0, 2), words[162].slice(2));
    const d = diagnose(PASSAGE, words.join(' '));
    expect(d.findings.map((f) => f.kind)).toEqual(['spacing']);
    expect(d.halfMistakes).toBe(1);
    expect(d.totalMistakes).toBe(0.5);
  });
});
