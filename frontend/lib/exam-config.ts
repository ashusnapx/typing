export type SscExamType = 'ssc_chsl_ldc_jsa' | 'ssc_chsl_deo' | 'ssc_chsl_deo_grade_a' | 'ssc_cgl_dest';

export interface SscExamSpec {
  type: SscExamType;
  label: string;
  durationMinutes: number;
  durationSeconds: number;
  englishSpeedWpm: number;
  hindiSpeedWpm: number | null;
  englishKdph: number;
  hindiKdph: number | null;
  passageKeyDepressions: [number, number];
  qualifyingNature: 'speed_wpm' | 'kdph';
  errorAllowanceGeneral: number;
  errorAllowanceObcEws: number;
  errorAllowanceScSt: number;
  backspaceAllowed: boolean;
  posts: string[];
  source: string;
}

export const SSC_EXAM_SPECS: Record<SscExamType, SscExamSpec> = {
  ssc_chsl_ldc_jsa: {
    type: 'ssc_chsl_ldc_jsa',
    label: 'SSC CHSL LDC/JSA Typing Test',
    durationMinutes: 10,
    durationSeconds: 600,
    englishSpeedWpm: 35,
    hindiSpeedWpm: 30,
    englishKdph: 10500,
    hindiKdph: 9000,
    passageKeyDepressions: [2000, 2200],
    qualifyingNature: 'speed_wpm',
    errorAllowanceGeneral: 7,
    errorAllowanceObcEws: 10,
    errorAllowanceScSt: 10,
    backspaceAllowed: true,
    posts: ['LDC', 'JSA', 'Postal Assistant', 'Sorting Assistant', 'Court Clerk'],
    source: 'SSC CHSL 2025 Notification Para 13.8.13.7',
  },
  ssc_chsl_deo: {
    type: 'ssc_chsl_deo',
    label: 'SSC CHSL DEO Skill Test (8,000 KDPH)',
    durationMinutes: 15,
    durationSeconds: 900,
    englishSpeedWpm: 27,
    hindiSpeedWpm: null,
    englishKdph: 8000,
    hindiKdph: null,
    passageKeyDepressions: [2000, 2200],
    qualifyingNature: 'kdph',
    errorAllowanceGeneral: 20,
    errorAllowanceObcEws: 25,
    errorAllowanceScSt: 30,
    backspaceAllowed: true,
    posts: ['DEO', 'DEO Grade A (except CAG)'],
    source: 'SSC CHSL 2025 Notification Para 13.8.13.6(iii)',
  },
  ssc_chsl_deo_grade_a: {
    type: 'ssc_chsl_deo_grade_a',
    label: 'SSC CHSL DEO Grade A Skill Test (15,000 KDPH)',
    durationMinutes: 15,
    durationSeconds: 900,
    englishSpeedWpm: 50,
    hindiSpeedWpm: null,
    englishKdph: 15000,
    hindiKdph: null,
    passageKeyDepressions: [3700, 4000],
    qualifyingNature: 'kdph',
    errorAllowanceGeneral: 20,
    errorAllowanceObcEws: 25,
    errorAllowanceScSt: 30,
    backspaceAllowed: true,
    posts: ['DEO Grade A (CAG)'],
    source: 'SSC CHSL 2025 Notification Para 13.8.13.6(ii)',
  },
  ssc_cgl_dest: {
    type: 'ssc_cgl_dest',
    label: 'SSC CGL DEST (Tax Assistant)',
    durationMinutes: 15,
    durationSeconds: 900,
    englishSpeedWpm: 27,
    hindiSpeedWpm: null,
    englishKdph: 8000,
    hindiKdph: null,
    passageKeyDepressions: [2000, 2200],
    qualifyingNature: 'kdph',
    errorAllowanceGeneral: 20,
    errorAllowanceObcEws: 25,
    errorAllowanceScSt: 30,
    backspaceAllowed: true,
    posts: ['Tax Assistant (CBDT/CBIC)', 'Compiler (MoSPI/NSSO)'],
    source: 'SSC CGL 2025 Notification Tier-4 DEST',
  },
};

export function getExamSpecs(mode: string): SscExamSpec | null {
  switch (mode) {
    case 'ssc_chsl':
      return SSC_EXAM_SPECS.ssc_chsl_ldc_jsa;
    case 'ssc_cgl_dest':
      return SSC_EXAM_SPECS.ssc_cgl_dest;
    default:
      return null;
  }
}

export function calculateNetWpm(
  totalKeyDepressions: number,
  fullMistakes: number,
  halfMistakes: number,
  timeMinutes: number
): number {
  const grossWords = totalKeyDepressions / 5;
  const totalErrors = fullMistakes + (halfMistakes / 2);
  const netWords = grossWords - totalErrors;
  return Math.round(netWords / timeMinutes);
}

export function calculateGrossWpm(
  totalKeyDepressions: number,
  timeMinutes: number
): number {
  return Math.round((totalKeyDepressions / 5) / timeMinutes);
}

export function calculateAccuracySsc(
  totalKeyDepressions: number,
  fullMistakes: number,
  halfMistakes: number
): number {
  const totalErrors = fullMistakes + (halfMistakes / 2);
  if (totalKeyDepressions <= 0) return 100;
  return Math.round(((totalKeyDepressions - totalErrors) / totalKeyDepressions) * 100 * 100) / 100;
}

export function calculateKdph(
  totalKeyDepressions: number,
  timeMinutes: number
): number {
  if (timeMinutes <= 0) return 0;
  return Math.round((totalKeyDepressions / timeMinutes) * 60);
}

export function checkQualification(
  mode: string,
  netWpm: number,
  accuracy: number,
  kdph: number,
  category: string = 'UR'
): { qualified: boolean; required: string; actual: string } {
  const specs = getExamSpecs(mode);
  if (!specs) return { qualified: false, required: 'Unknown', actual: '' };

  if (specs.qualifyingNature === 'speed_wpm') {
    const required = `>= ${specs.englishSpeedWpm} WPM`;
    const actual = `${netWpm} WPM`;
    return {
      qualified: netWpm >= specs.englishSpeedWpm,
      required,
      actual,
    };
  }

  const errorAllowanceMap: Record<string, number> = {
    UR: specs.errorAllowanceGeneral,
    GENERAL: specs.errorAllowanceGeneral,
    OBC: specs.errorAllowanceObcEws,
    EWS: specs.errorAllowanceObcEws,
    SC: specs.errorAllowanceScSt,
    ST: specs.errorAllowanceScSt,
  };
  const maxErrorPct = errorAllowanceMap[category.toUpperCase()] ?? specs.errorAllowanceGeneral;
  const required = `>= ${specs.englishKdph.toLocaleString()} KDPH (≤ ${maxErrorPct}% errors)`;
  const actual = `${kdph.toLocaleString()} KDPH (${(100 - accuracy).toFixed(1)}% errors)`;
  return {
    qualified: kdph >= specs.englishKdph,
    required,
    actual,
  };
}
