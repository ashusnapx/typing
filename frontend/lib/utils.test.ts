import { describe, it, expect } from 'vitest';
import { calculateWPM, calculateAccuracy, formatTime, getModeDisplayName } from './utils';

describe('calculateWPM', () => {
  it('returns 0 for zero or negative time', () => {
    expect(calculateWPM(100, 0)).toBe(0);
    expect(calculateWPM(100, -1)).toBe(0);
  });

  it('calculates WPM correctly', () => {
    // 250 chars in 2 minutes = 250/5 = 50 words / 2 = 25 WPM
    expect(calculateWPM(250, 120)).toBe(25);
  });

  it('rounds to nearest integer', () => {
    // 260 chars in 2 minutes = 260/5 = 52 words / 2 = 26 WPM
    expect(calculateWPM(260, 120)).toBe(26);
  });

  it('returns 0 for 0 chars', () => {
    expect(calculateWPM(0, 60)).toBe(0);
  });
});

describe('calculateAccuracy', () => {
  it('returns 0 for zero or negative total', () => {
    expect(calculateAccuracy(50, 0)).toBe(0);
    expect(calculateAccuracy(50, -1)).toBe(0);
  });

  it('calculates accuracy as percentage', () => {
    expect(calculateAccuracy(95, 100)).toBe(95);
  });

  it('returns 100% when all correct', () => {
    expect(calculateAccuracy(100, 100)).toBe(100);
  });

  it('rounds to 2 decimal places', () => {
    expect(calculateAccuracy(1, 3)).toBe(33.33);
  });
});

describe('formatTime', () => {
  it('formats 0 seconds', () => {
    expect(formatTime(0)).toBe('00:00');
  });

  it('formats minutes and seconds', () => {
    expect(formatTime(125)).toBe('02:05');
  });

  it('pads single digit minutes and seconds', () => {
    expect(formatTime(65)).toBe('01:05');
  });

  it('formats exactly 10 minutes', () => {
    expect(formatTime(600)).toBe('10:00');
  });
});

describe('getModeDisplayName', () => {
  it('returns correct names for known modes', () => {
    expect(getModeDisplayName('ssc_chsl')).toBe('SSC CHSL');
    expect(getModeDisplayName('ssc_cgl_dest')).toBe('SSC CGL DEST');
    expect(getModeDisplayName('ssc_hindi')).toBe('SSC Hindi');
    expect(getModeDisplayName('practice')).toBe('Practice');
    expect(getModeDisplayName('blind')).toBe('Blind Mode');
    expect(getModeDisplayName('mock')).toBe('Mock Test');
    expect(getModeDisplayName('tcs_ion_replica')).toBe('Eduquity Replica');
  });

  it('returns the mode string itself for unknown modes', () => {
    expect(getModeDisplayName('unknown_mode')).toBe('unknown_mode');
  });
});
