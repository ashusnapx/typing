import { describe, it, expect } from 'vitest';
import { UNMARKABLE, isMarkable } from './attempt-trust';

/**
 * The trust boundary between what a submission claims and what the server
 * checked. Everything the candidate is credited with has to come from the
 * second one.
 */
describe('what the server will mark', () => {
  it('needs both the passage and the typing', () => {
    expect(isMarkable('the passage', 'the passage')).toBe(true);
  });

  it.each([
    ['neither', undefined, undefined],
    ['no passage', undefined, 'what they typed'],
    ['no typing', 'the passage', undefined],
    ['empty typing', 'the passage', ''],
    ['empty passage', '', 'what they typed'],
    ['nulls', null, null],
  ])('refuses to mark an attempt with %s', (_label, original, typed) => {
    expect(isMarkable(original, typed)).toBe(false);
  });
});

describe('an attempt that cannot be marked', () => {
  it('is worth nothing, whatever the submission claimed for itself', () => {
    // The exact shape of the hole: a request declaring 36 WPM at 96% was
    // stored as a qualified attempt worth 83 XP with no passage behind it.
    expect(UNMARKABLE.netWpm).toBe(0);
    expect(UNMARKABLE.grossWpm).toBe(0);
    expect(UNMARKABLE.accuracy).toBe(0);
    expect(UNMARKABLE.isQualified).toBe(false);
  });

  it('counts as every mistake, not as none', () => {
    // Zero error on an unmarked attempt reads as a clean sheet against the cap.
    expect(UNMARKABLE.errorPercentage).toBe(100);
  });

  it('cannot be edited into something valuable by anything holding it', () => {
    expect(() => {
      (UNMARKABLE as { netWpm: number }).netWpm = 120;
    }).toThrow();
    expect(UNMARKABLE.netWpm).toBe(0);
  });
});
