import { describe, it, expect } from 'vitest';
import { diagnose } from './exam-diagnosis';
import { MISTAKE_GROUPS, COMBINATIONS } from './marking-scheme-examples';
import { getFlatLessons } from './typing-curriculum';

/**
 * The marking-scheme page explains the rules with worked examples. These tests
 * run every one of those examples through the same `diagnose()` the exam uses.
 *
 * The point is that the page cannot lie. If the engine's classification ever
 * drifts from the example printed beside it, this fails — rather than a
 * candidate reading "this costs half a mistake" and being charged one.
 */

describe('every printed example matches the engine', () => {
  for (const group of MISTAKE_GROUPS) {
    describe(group.title.en, () => {
      for (const ex of group.examples) {
        it(`"${ex.passage}" → "${ex.typed}"`, () => {
          const d = diagnose(ex.passage, ex.typed);

          // Exactly one kind of mistake, so the example teaches one thing.
          expect(
            d.findings.map((f) => f.kind),
            'should be a single, unambiguous mistake'
          ).toEqual([ex.kind]);

          expect(d.findings[0].count, 'occurrences').toBe(1);
          expect(d.findings[0].cost, 'marks lost').toBe(ex.cost);
          expect(d.totalMistakes).toBe(ex.cost);
        });
      }

      it('is weighted as the page claims', () => {
        for (const ex of group.examples) {
          const d = diagnose(ex.passage, ex.typed);
          expect(d.findings[0].weight).toBe(group.weight);
        }
      });

      it('points at a lesson that exists', () => {
        const ids = new Set(getFlatLessons().map((l) => l.id));
        expect(ids.has(group.lessonId), group.lessonId).toBe(true);

        // And the engine routes this kind to the same lesson the page names.
        const d = diagnose(group.examples[0].passage, group.examples[0].typed);
        expect(d.findings[0].lessonId).toBe(group.lessonId);
      });
    });
  }

  it('covers every kind the engine can produce', () => {
    // A mistake the engine can report but the page never explains is a rule a
    // candidate meets for the first time in their result.
    const explained = new Set(MISTAKE_GROUPS.map((g) => g.kind));
    const produced = [
      'capitalisation',
      'spacing',
      'punctuation',
      'figures',
      'wordOrder',
      'spelling',
      'skipped',
      'extra',
    ];
    for (const kind of produced) {
      expect(explained.has(kind as never), `${kind} is not explained`).toBe(true);
    }
  });

  it('gives each group a Hinglish translation, not an English copy', () => {
    for (const g of MISTAKE_GROUPS) {
      expect(g.title.hi.length, g.kind).toBeGreaterThan(0);
      expect(g.meaning.hi, g.kind).not.toBe(g.meaning.en);
      expect(g.fix.hi, g.kind).not.toBe(g.fix.en);
      for (const ex of g.examples) {
        expect(ex.why.hi, g.kind).not.toBe(ex.why.en);
      }
    }
  });
});

describe('combination examples add up as printed', () => {
  for (const c of COMBINATIONS) {
    it(`"${c.typed}" costs ${c.total}`, () => {
      const d = diagnose(c.passage, c.typed);

      expect(new Set(d.findings.map((f) => f.kind))).toEqual(new Set(c.kinds));
      expect(d.fullMistakes, 'full mistakes').toBe(c.full);
      expect(d.halfMistakes, 'half mistakes').toBe(c.half);
      expect(d.totalMistakes, 'total').toBe(c.total);
    });
  }

  it('shows that two halves make one whole', () => {
    // The arithmetic the page rests on: full + half/2.
    const twoHalves = COMBINATIONS.find((c) => c.half === 2 && c.full === 0);
    expect(twoHalves?.total).toBe(1);
  });
});
