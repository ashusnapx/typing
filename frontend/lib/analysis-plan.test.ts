import { describe, it, expect } from 'vitest';
import { buildPlan, type PlanInput } from './analysis-plan';
import type { Finding } from './exam-diagnosis';

/**
 * The advice at the foot of the report.
 *
 * What matters here is not the wording but that it names the right bar. A
 * candidate who is fast and inaccurate being told to type faster is worse than
 * no advice at all: it is the exact mistake that costs the paper.
 */

const finding = (over: Partial<Finding> = {}): Finding => ({
  kind: 'spelling',
  label: 'Spelling',
  weight: 'full',
  count: 4,
  cost: 4,
  examples: [],
  advice: '',
  lessonId: 's3-accuracy',
  lessonTitle: 'Accuracy over speed',
  href: '/exam/lesson/s3-accuracy',
  ...over,
});

const input = (over: Partial<PlanInput> = {}): PlanInput => ({
  qualified: false,
  speedMet: true,
  errorsMet: false,
  nature: 'speed_wpm',
  netWpm: 42,
  speedTarget: 35,
  kdph: 12600,
  kdphTarget: 8000,
  errorPct: 12.4,
  errorCap: 7,
  findings: [finding()],
  wordsUnreached: 0,
  hesitationCount: 0,
  ...over,
});

describe('which bar it points at', () => {
  it('tells a fast, inaccurate candidate to stop chasing speed', () => {
    const plan = buildPlan(input());
    expect(plan.focus).toBe('mistakes');
    expect(plan.headline).toMatch(/Speed to ho gayi/);
    expect(plan.headline).toContain('12.4%');
    expect(plan.headline).toContain('7%');
  });

  it('tells an accurate, slow candidate not to trade accuracy for speed', () => {
    const plan = buildPlan(input({ speedMet: false, errorsMet: true, netWpm: 22, errorPct: 1 }));
    expect(plan.focus).toBe('speed');
    expect(plan.headline).toMatch(/Galtiyaan control mein hain/);
    expect(plan.headline).toMatch(/Accuracy mat girne dena/);
  });

  it('puts mistakes first when both bars were missed', () => {
    const plan = buildPlan(input({ speedMet: false, errorsMet: false, netWpm: 20 }));
    expect(plan.focus).toBe('both');
    expect(plan.headline).toMatch(/Pehle galtiyaan pakad, speed baad mein/);
  });

  it('does not hand a cleared attempt something to fix', () => {
    const plan = buildPlan(
      input({ qualified: true, speedMet: true, errorsMet: true, errorPct: 1, findings: [] }),
    );
    expect(plan.focus).toBe('nothing');
    expect(plan.headline).toMatch(/Nikal gaya/);
    // Not "you are done" — one good attempt is one good day.
    expect(plan.steps.map((s) => s.text).join(' ')).toMatch(/dohra/);
  });

  it('quotes depressions per hour to a DEO candidate, not words per minute', () => {
    const plan = buildPlan(input({ nature: 'kdph', speedMet: false, kdph: 6000 }));
    expect(plan.headline).toContain('6,000 KDPH');
    expect(plan.headline).toContain('8,000 KDPH');
    expect(plan.headline).not.toMatch(/WPM/);
  });
});

describe('what it asks the candidate to do', () => {
  it('names at most two kinds of mistake, the two carrying the marks', () => {
    // Eight findings is the whole vocabulary. A list of eight things to fix is
    // a list of nothing to fix.
    const many = ['spelling', 'skipped', 'extra', 'figures', 'capitalisation'].map((k, i) =>
      finding({ kind: k as Finding['kind'], label: k, cost: 10 - i, count: 10 - i }),
    );
    const plan = buildPlan(input({ findings: many }));
    const fixes = plan.steps.filter((s) => s.id.startsWith('fix-'));
    expect(fixes).toHaveLength(2);
    expect(fixes[0].id).toBe('fix-spelling');
    expect(fixes[1].id).toBe('fix-skipped');
  });

  it('sends every mistake step to a drill that exists', () => {
    const plan = buildPlan(input());
    for (const step of plan.steps.filter((s) => s.id.startsWith('fix-'))) {
      expect(step.href).toMatch(/^\/exam\/lesson\//);
      expect(step.hrefLabel).toBeTruthy();
    }
  });

  it('counts the words left when the passage ran out of time', () => {
    const plan = buildPlan(input({ speedMet: false, wordsUnreached: 96 }));
    const speed = plan.steps.find((s) => s.id === 'speed')!;
    expect(speed.text).toContain('96');
    expect(speed.text).toMatch(/Passage khatam nahi hua/);
  });

  it('does not mention unfinished words when the candidate finished', () => {
    const plan = buildPlan(input({ speedMet: false, wordsUnreached: 0 }));
    expect(plan.steps.find((s) => s.id === 'speed')!.text).not.toMatch(/khatam nahi hua/);
  });

  it('never leaves a candidate with nothing at all to do', () => {
    const plan = buildPlan(
      input({ qualified: true, speedMet: true, errorsMet: true, findings: [], hesitationCount: 0 }),
    );
    expect(plan.steps.length).toBeGreaterThan(0);
  });

  it('keeps the list to three, so it is a list someone acts on', () => {
    const plan = buildPlan(
      input({
        speedMet: false,
        errorsMet: false,
        findings: [finding(), finding({ kind: 'skipped', label: 'Skipped words' })],
        wordsUnreached: 40,
        hesitationCount: 6,
      }),
    );
    expect(plan.steps.length).toBeLessThanOrEqual(3);
  });
});
