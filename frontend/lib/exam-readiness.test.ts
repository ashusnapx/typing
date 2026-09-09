import { describe, it, expect } from 'vitest';
import { assessReadiness } from './exam-readiness';
import { SSC_EXAM_SPECS, getExamBar, isHindiMode } from './exam-config';

const attempt = (netWpm: number, errorPercentage: number, isQualified: boolean) => ({
  netWpm,
  errorPercentage,
  accuracy: 100 - errorPercentage,
  isQualified,
});

describe('readiness is conjunctive, because qualifying is', () => {
  it('does not let speed pay for being over the error cap', () => {
    // The exact shape of the bug: 148 WPM at a 20% error rate against a 7%
    // cap, not one attempt cleared, was scored 93.4% and told "You are
    // exam-ready for SSC CHSL". Speed is four times the bar and buys nothing.
    const r = assessReadiness([
      attempt(177.9, 12.8, false),
      attempt(138.5, 29.1, false),
      attempt(128.9, 19.9, false),
    ]);
    expect(r.speedScore).toBe(100);
    expect(r.score).toBeLessThan(40);
    expect(r.blockedBy).toBe('errors');
    expect(r.cleared).toBe(0);
    expect(r.recommendation).toContain('Mistakes are what is stopping you');
    expect(r.recommendation).not.toContain('exam-ready');
  });

  it('names the speed when speed is the only thing short', () => {
    const r = assessReadiness([attempt(28, 2, false), attempt(30, 1, false)]);
    expect(r.blockedBy).toBe('speed');
    expect(r.errorScore).toBe(100);
    expect(r.recommendation).toContain('more WPM to reach 35');
  });

  it('names both when both are short', () => {
    const r = assessReadiness([attempt(20, 15, false)]);
    expect(r.blockedBy).toBe('both');
    expect(r.recommendation).toContain('Accuracy first');
  });

  it('says so plainly when every attempt cleared', () => {
    const r = assessReadiness([attempt(40, 2, true), attempt(42, 1, true)]);
    expect(r.blockedBy).toBe('nothing');
    expect(r.score).toBe(99);
    expect(r.recommendation).toContain('cleared');
  });

  it('gives a candidate with no attempts nothing, not fifty percent', () => {
    // The old predictor returned a flat 50% probability for someone who had
    // never taken a test, and the dashboard's own version added a flat 20.
    const r = assessReadiness([]);
    expect(r.score).toBe(0);
    expect(r.blockedBy).toBe('unknown');
    expect(r.recommendation).toBe('Take a full test to see where you stand.');
  });

  it('gives no extra credit for being far under the cap', () => {
    const atCap = assessReadiness([attempt(40, 7, true)]);
    const wellUnder = assessReadiness([attempt(40, 0, true)]);
    expect(atCap.errorScore).toBe(100);
    expect(wellUnder.errorScore).toBe(100);
  });

  it('reads the wider allowance for a reserved category', () => {
    const errs = [attempt(40, 9, false)];
    expect(assessReadiness(errs, SSC_EXAM_SPECS.ssc_chsl_ldc_jsa, 'ur').blockedBy).toBe('errors');
    // 9% is over the 7% general cap but inside the 10% SC/ST one.
    expect(assessReadiness(errs, SSC_EXAM_SPECS.ssc_chsl_ldc_jsa, 'scSt').blockedBy).toBe('nothing');
  });

  it('holds CGL DEST to its stricter 5% cap', () => {
    const errs = [attempt(40, 6, false)];
    expect(assessReadiness(errs, SSC_EXAM_SPECS.ssc_chsl_ldc_jsa).blockedBy).toBe('nothing');
    expect(assessReadiness(errs, SSC_EXAM_SPECS.ssc_cgl_dest).blockedBy).toBe('errors');
  });
});

describe('the bar knows which language the test is sat in', () => {
  it('qualifies Hindi LDC/JSA at 30 WPM, not the English 35', () => {
    // /exam/hindi is a live route and its instructions screen has always said
    // 30 WPM, but nothing resolved the language for the marking, so a Hindi
    // candidate at 31 WPM was failed against a bar they were never held to.
    const hindi = getExamBar('ssc_hindi');
    const english = getExamBar('ssc_chsl');
    expect(hindi?.speedWpm).toBe(30);
    expect(english?.speedWpm).toBe(35);
    expect(hindi?.language).toBe('hindi');
    expect(hindi?.errorCap).toBe(english?.errorCap);
  });

  it('recognises the Hindi modes', () => {
    expect(isHindiMode('ssc_hindi')).toBe(true);
    expect(isHindiMode('ssc_chsl')).toBe(false);
  });

  it('gives every KDPH post its own bar and allowance', () => {
    expect(getExamBar('ssc_chsl_deo')).toMatchObject({ nature: 'kdph', kdph: 8000, errorCap: 20 });
    expect(getExamBar('ssc_chsl_deo_grade_a')).toMatchObject({ nature: 'kdph', kdph: 15000 });
    expect(getExamBar('ssc_cgl_dest')).toMatchObject({ nature: 'kdph', kdph: 8000, errorCap: 5 });
    expect(getExamBar('ssc_cgl_cpt')?.errorCap).toBe(5);
  });

  it('widens the allowance by category, and never narrows it', () => {
    for (const mode of ['ssc_chsl', 'ssc_chsl_deo', 'ssc_cgl_dest']) {
      const ur = getExamBar(mode, 'ur')!.errorCap;
      expect(getExamBar(mode, 'obcEws')!.errorCap).toBeGreaterThanOrEqual(ur);
      expect(getExamBar(mode, 'scSt')!.errorCap).toBeGreaterThanOrEqual(ur);
    }
  });

  it('has no bar for a training mode', () => {
    expect(getExamBar('practice')).toBeNull();
    expect(getExamBar('lesson')).toBeNull();
  });
});
