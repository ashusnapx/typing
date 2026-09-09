export type SscExamType =
  | 'ssc_chsl_ldc_jsa'
  | 'ssc_chsl_deo'
  | 'ssc_chsl_deo_grade_a'
  | 'ssc_cgl_dest'
  | 'ssc_cgl_cpt';

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
  citations: string[];
}

export const FULL_MISTAKES = [
  'Omission — skipping any word, number, or figure present in the passage',
  'Substitution — replacing a word with a different word',
  'Addition — typing an extra word or figure not in the passage',
  'Spelling errors (repetition, addition, omission, or substitution of letters)',
  'Repetition of a word or number (e.g., "the the")',
  'Incomplete or half-typed words',
];

export const HALF_MISTAKES = [
  'Spacing errors — no space between words (e.g., "Ihope") or extra space within a word (e.g., "I h ave")',
  'Wrong capitalisation — capital used instead of small letter or vice versa (not applicable for Hindi)',
  'Punctuation errors — missing, extra, or wrong punctuation mark',
  'Transposition — words typed in wrong order (e.g., "hope I" instead of "I hope")',
  'Paragraph formatting — manual spacing used instead of Tab key at paragraph start',
];

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
    citations: [
      'https://ssc.gov.in/api/attachment/uploads/masterData/NoticeBoards/Notice_of_adv_chsl_2025.pdf',
    ],
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
    citations: [
      'https://ssc.gov.in/api/attachment/uploads/masterData/NoticeBoards/Notice_of_adv_chsl_2025.pdf',
    ],
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
    citations: [
      'https://ssc.gov.in/api/attachment/uploads/masterData/NoticeBoards/Notice_of_adv_chsl_2025.pdf',
    ],
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
    // The stricter of the two readings, deliberately.
    //
    // Published sources disagree on whether Tax Assistant is marked against
    // the 20% cap used for data-entry posts or the 5% cap used for the
    // Computer Proficiency Test, and lib/ssc-posts.ts has carried that
    // dispute as `disputed: true` from the start. Evaluating at 20% while
    // telling candidates elsewhere to practise to 5% is the worst of both:
    // someone finishing at 15% errors is told they passed, and would fail the
    // real test. Marked at 5%, a pass here is a pass under either reading.
    errorAllowanceGeneral: 5,
    errorAllowanceObcEws: 7,
    errorAllowanceScSt: 7,
    backspaceAllowed: true,
    posts: ['Tax Assistant (CBDT/CBIC)', 'Compiler (MoSPI/NSSO)'],
    source:
      'SSC CGL 2025 Notification Tier-4 DEST, marked against the stricter CPT error cap',
    citations: [
      'https://ssc.gov.in/api/attachment/uploads/masterData/NoticeBoards/Notice_of_adv_cgl_2025.pdf',
    ],
  },
  ssc_cgl_cpt: {
    type: 'ssc_cgl_cpt',
    label: 'SSC CGL CPT — DEST Module (ASO / Inspector)',
    durationMinutes: 15,
    durationSeconds: 900,
    englishSpeedWpm: 27,
    hindiSpeedWpm: null,
    englishKdph: 8000,
    hindiKdph: null,
    passageKeyDepressions: [2000, 2200],
    qualifyingNature: 'kdph',
    // CPT posts are marked against the strict cap, not the DEST one. A
    // candidate practising to 20% here would fail the real test at 6%.
    errorAllowanceGeneral: 5,
    errorAllowanceObcEws: 7,
    errorAllowanceScSt: 7,
    backspaceAllowed: true,
    posts: ['ASO (CSS/MEA/AFHQ)', 'Inspector (CBIC)', 'UDC/SSA (CBN)'],
    source: 'SSC Revised Guidelines for Evaluation of Typing Test / DEST Scripts',
    citations: [
      'https://ssc.gov.in/api/attachment/uploads/masterData/NoticeBoards/Notice_of_adv_cgl_2025.pdf',
    ],
  },
};

/* -------------------------------------------------------------------------- */
/* Test modes → specs                                                          */
/* -------------------------------------------------------------------------- */

/** Every route-backed mode that carries an official spec. Adding a variant
 *  means adding one row here and one row in EXAM_VARIANTS — nothing else. */
const MODE_TO_SPEC: Record<string, SscExamType> = {
  ssc_chsl: 'ssc_chsl_ldc_jsa',
  ssc_chsl_deo: 'ssc_chsl_deo',
  ssc_chsl_deo_grade_a: 'ssc_chsl_deo_grade_a',
  ssc_cgl_dest: 'ssc_cgl_dest',
  ssc_cgl_cpt: 'ssc_cgl_cpt',
};

export function getExamSpecs(mode: string): SscExamSpec | null {
  const key = MODE_TO_SPEC[mode];
  return key ? SSC_EXAM_SPECS[key] : null;
}

/* -------------------------------------------------------------------------- */
/* Variant catalogue — what /exam offers                                       */
/* -------------------------------------------------------------------------- */

export interface ExamVariant {
  /** The TestMode string stored against every attempt. */
  mode: string;
  exam: 'CHSL' | 'CGL';
  /** What the candidate calls the post. */
  post: string;
  /** The departments that recruit for it, for recognition. */
  where: string;
  href: string;
  durationSeconds: number;
  /** Shown on the card: "35 WPM" or "8,000 KDPH". */
  requirement: string;
  /** Error cap for UR, the one figure that separates these variants. */
  errorCapUr: number;
  hindiAvailable: boolean;
}

/** Ordered easiest-bar first within each exam, because that is the order
 *  aspirants think in — "which of these can I already clear?". */
export const EXAM_VARIANTS: readonly ExamVariant[] = [
  {
    mode: 'ssc_chsl',
    exam: 'CHSL',
    post: 'LDC / JSA',
    where: 'Ministries, Postal Assistant, Sorting Assistant',
    href: '/exam/chsl',
    durationSeconds: 600,
    requirement: '35 WPM',
    errorCapUr: 7,
    hindiAvailable: true,
  },
  {
    mode: 'ssc_chsl_deo',
    exam: 'CHSL',
    post: 'DEO',
    where: 'Data Entry Operator, most departments',
    href: '/exam/chsl-deo',
    durationSeconds: 900,
    requirement: '8,000 KDPH',
    errorCapUr: 20,
    hindiAvailable: false,
  },
  {
    mode: 'ssc_chsl_deo_grade_a',
    exam: 'CHSL',
    post: "DEO Grade 'A'",
    where: 'Consumer Affairs, Culture, SSC',
    href: '/exam/chsl-deo-grade-a',
    durationSeconds: 900,
    requirement: '15,000 KDPH',
    errorCapUr: 20,
    hindiAvailable: false,
  },
  {
    mode: 'ssc_cgl_dest',
    exam: 'CGL',
    post: 'Tax Assistant',
    where: 'CBDT / CBIC — DEST',
    href: '/exam/cgl-dest',
    durationSeconds: 900,
    requirement: '8,000 KDPH',
    errorCapUr: 5,
    hindiAvailable: false,
  },
  {
    mode: 'ssc_cgl_cpt',
    exam: 'CGL',
    post: 'ASO / Inspector',
    where: 'CSS, MEA, AFHQ, CBIC — CPT',
    href: '/exam/cgl-cpt',
    durationSeconds: 900,
    requirement: '8,000 KDPH',
    errorCapUr: 5,
    hindiAvailable: false,
  },
] as const;

export function getExamVariant(mode: string): ExamVariant | null {
  return EXAM_VARIANTS.find((v) => v.mode === mode) ?? null;
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
  const grossWords = totalKeyDepressions / 5;
  const totalErrors = fullMistakes + (halfMistakes / 2);
  if (grossWords <= 0) return 100;
  return Math.round(Math.max(0, ((grossWords - totalErrors) / grossWords) * 100) * 100) / 100;
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
  errorPct: number,
  category: string = 'UR'
): { qualified: boolean; required: string; actual: string } {
  const specs = getExamSpecs(mode);
  if (!specs) return { qualified: false, required: 'Unknown', actual: '' };

  const errorAllowanceMap: Record<string, number> = {
    UR: specs.errorAllowanceGeneral,
    GENERAL: specs.errorAllowanceGeneral,
    OBC: specs.errorAllowanceObcEws,
    EWS: specs.errorAllowanceObcEws,
    SC: specs.errorAllowanceScSt,
    ST: specs.errorAllowanceScSt,
  };
  const maxErrorPct = errorAllowanceMap[category.toUpperCase()] ?? specs.errorAllowanceGeneral;

  if (specs.qualifyingNature === 'speed_wpm') {
    const speedOk = netWpm >= specs.englishSpeedWpm;
    const errorOk = errorPct <= maxErrorPct;
    const required = `≥ ${specs.englishSpeedWpm} WPM & ≤ ${maxErrorPct}% errors`;
    const actual = `${netWpm} WPM, ${errorPct.toFixed(1)}% errors`;
    return { qualified: speedOk && errorOk, required, actual };
  }

  const speedOk = kdph >= specs.englishKdph;
  const errorOk = errorPct <= maxErrorPct;
  const required = `≥ ${specs.englishKdph.toLocaleString()} KDPH & ≤ ${maxErrorPct}% errors`;
  const actual = `${kdph.toLocaleString()} KDPH, ${errorPct.toFixed(1)}% errors`;
  return { qualified: speedOk && errorOk, required, actual };
}
