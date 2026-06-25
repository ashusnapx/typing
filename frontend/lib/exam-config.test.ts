import { describe, it, expect } from 'vitest';
import {
  calculateNetWpm,
  calculateGrossWpm,
  calculateAccuracySsc,
  calculateKdph,
  checkQualification,
  getExamSpecs,
} from './exam-config';

describe('calculateNetWpm', () => {
  it('calculates SSC Net WPM correctly', () => {
    // 1000 key depressions in 10 minutes, 5 full mistakes, 4 half mistakes
    // gross words = 1000/5 = 200
    // errors = 5 + 4/2 = 7
    // net words = 200 - 7 = 193
    // net WPM = 193/10 = 19.3 -> 19
    expect(calculateNetWpm(1000, 5, 4, 10)).toBe(19);
  });

  it('returns 0 for 0 key depressions', () => {
    expect(calculateNetWpm(0, 0, 0, 10)).toBe(0);
  });

  it('handles no mistakes', () => {
    expect(calculateNetWpm(1000, 0, 0, 10)).toBe(20);
  });
});

describe('calculateGrossWpm', () => {
  it('calculates gross WPM correctly', () => {
    expect(calculateGrossWpm(1000, 10)).toBe(20);
  });

  it('returns 0 for 0 key depressions', () => {
    expect(calculateGrossWpm(0, 10)).toBe(0);
  });
});

describe('calculateAccuracySsc', () => {
  it('returns 100 when no errors', () => {
    expect(calculateAccuracySsc(1000, 0, 0)).toBe(100);
  });

  it('calculates SSC accuracy correctly', () => {
    // 1000 key depressions = 200 gross words
    // 5 full mistakes, 4 half mistakes
    // errors = 5 + 4/2 = 7
    // accuracy = (200 - 7) / 200 * 100 = 96.5
    expect(calculateAccuracySsc(1000, 5, 4)).toBe(96.5);
  });

  it('returns 100 when key depressions are 0', () => {
    expect(calculateAccuracySsc(0, 5, 4)).toBe(100);
  });
});

describe('calculateKdph', () => {
  it('calculates KDPH correctly', () => {
    // 1000 key depressions in 10 minutes = (1000/10)*60 = 6000
    expect(calculateKdph(1000, 10)).toBe(6000);
  });

  it('returns 0 for zero time', () => {
    expect(calculateKdph(1000, 0)).toBe(0);
  });
});

describe('getExamSpecs', () => {
  it('returns CHSL specs for ssc_chsl mode', () => {
    const specs = getExamSpecs('ssc_chsl');
    expect(specs).not.toBeNull();
    expect(specs!.englishSpeedWpm).toBe(35);
    expect(specs!.durationMinutes).toBe(10);
    expect(specs!.qualifyingNature).toBe('speed_wpm');
  });

  it('returns CGL DEST specs for ssc_cgl_dest mode', () => {
    const specs = getExamSpecs('ssc_cgl_dest');
    expect(specs).not.toBeNull();
    expect(specs!.englishKdph).toBe(8000);
    expect(specs!.durationMinutes).toBe(15);
    expect(specs!.qualifyingNature).toBe('kdph');
  });

  it('returns null for unknown modes', () => {
    expect(getExamSpecs('unknown_mode')).toBeNull();
  });
});

describe('checkQualification', () => {
  it('qualifies CHSL UR with sufficient WPM and low errors', () => {
    const result = checkQualification('ssc_chsl', 40, 98, 0, 5, 'UR');
    expect(result.qualified).toBe(true);
  });

  it('fails CHSL UR with low WPM', () => {
    const result = checkQualification('ssc_chsl', 30, 98, 0, 5, 'UR');
    expect(result.qualified).toBe(false);
    expect(result.required).toContain('35');
  });

  it('fails CHSL UR with high errors', () => {
    const result = checkQualification('ssc_chsl', 40, 90, 0, 10, 'UR');
    expect(result.qualified).toBe(false);
    expect(result.required).toContain('7%');
  });

  it('qualifies CGL DEST with sufficient KDPH', () => {
    const result = checkQualification('ssc_cgl_dest', 40, 95, 9000, 15, 'UR');
    expect(result.qualified).toBe(true);
  });

  it('fails CGL DEST with low KDPH', () => {
    const result = checkQualification('ssc_cgl_dest', 40, 95, 7000, 15, 'UR');
    expect(result.qualified).toBe(false);
    expect(result.required).toContain('8,000');
  });

  it('uses higher error allowance for SC/ST', () => {
    // For CHSL UR: max 7% errors; for SC/ST: max 10% errors
    const resultUR = checkQualification('ssc_chsl', 40, 90, 0, 8, 'UR');
    expect(resultUR.qualified).toBe(false);

    const resultSC = checkQualification('ssc_chsl', 40, 90, 0, 8, 'SC');
    expect(resultSC.qualified).toBe(true);
  });

  it('returns not qualified for unknown mode', () => {
    const result = checkQualification('unknown_mode', 40, 95, 0, 5, 'UR');
    expect(result.qualified).toBe(false);
    expect(result.required).toBe('Unknown');
  });
});
