/**
 * Post-wise skill-test requirements.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * The app previously applied one error allowance per exam (20/25/30% for
 * everything CGL-shaped). That is wrong, and dangerously so: a candidate
 * targeting ASO in CSS is evaluated against a 5% cap, not 20%. Someone
 * practising to a 20% bar and finishing at 6% errors would believe they had
 * passed comfortably while actually failing.
 *
 * The requirement is a property of the POST, not of the exam. So the user
 * picks their post once, and every test, target and verdict follows from it.
 *
 * SOURCES
 * -------
 * - SSC CHSL 2025 Notice of Examination, paras 13.8.13.6 and 13.8.13.7
 *   (speeds, durations, passage lengths, compensatory time). Verified against
 *   the notification PDF.
 * - SSC "Revised Guidelines for Evaluation of Typing Test / DEST Scripts
 *   (English/Hindi)" for the full/half mistake taxonomy and error caps.
 *
 * Where public sources disagree (notably whether Tax Assistant sits under the
 * strict CPT cap or the relaxed DEST cap), the post carries `disputed: true`
 * and the UI shows both bars rather than silently picking one.
 */

export type ErrorCaps = {
  /** Unreserved. */
  ur: number;
  /** OBC and EWS. */
  obcEws: number;
  /** SC and ST. */
  scSt: number;
  /** Persons with benchmark disability, where a separate cap is published. */
  pwbd?: number;
};

export type SscPost = {
  id: string;
  /** Full official post name. */
  name: string;
  /** What an aspirant actually calls it. */
  shortName: string;
  exam: 'CHSL' | 'CGL';
  /** Departments, to help someone recognise their post. */
  department?: string;

  /** How the requirement is expressed in the notification. */
  measure: 'wpm' | 'kdph';
  /** Words per minute, where the requirement is stated as speed. */
  wpmEnglish?: number;
  wpmHindi?: number;
  /** Key depressions per hour, where the requirement is stated as KDPH. */
  kdph?: number;

  durationMinutes: number;
  /** Compensatory time for candidates eligible for a scribe (para 7.1–7.3). */
  compensatoryMinutes: number;
  /** Approximate key depressions in the printed passage. */
  passageKd: [number, number];

  /** Hindi medium available for this post. */
  hindiAvailable: boolean;
  /** Backspace and editing permitted during the test. */
  backspaceAllowed: boolean;

  errorCaps: ErrorCaps;
  /** True when public sources disagree on the cap for this post. */
  disputed?: boolean;
  notes?: string;
  citation: string;
};

/** The strict cap that applies to Computer Proficiency Test posts. */
const CPT_CAPS: ErrorCaps = { ur: 5, obcEws: 7, scSt: 7, pwbd: 10 };
/** The relaxed cap for data-entry posts evaluated on key depressions. */
const DEST_CAPS: ErrorCaps = { ur: 20, obcEws: 25, scSt: 30 };
/** Typing Test for LDC/JSA-type posts. */
const TYPING_CAPS: ErrorCaps = { ur: 7, obcEws: 10, scSt: 10 };

const CHSL_CITATION =
  'SSC CHSL 2025 Notice of Examination, para 13.8.13.6–13.8.13.7';
const EVAL_CITATION =
  'SSC Revised Guidelines for Evaluation of Typing Test / DEST Scripts';

export const SSC_POSTS: SscPost[] = [
  /* ---------------------------------------------------------------- CHSL */
  {
    id: 'chsl_ldc_jsa',
    name: 'Lower Division Clerk / Junior Secretariat Assistant',
    shortName: 'LDC / JSA',
    exam: 'CHSL',
    department: 'Various ministries and departments',
    measure: 'wpm',
    wpmEnglish: 35,
    wpmHindi: 30,
    durationMinutes: 10,
    compensatoryMinutes: 5,
    // 35 wpm x 10 min x 5 chars = ~1,750 key depressions.
    passageKd: [1700, 1900],
    hindiAvailable: true,
    backspaceAllowed: true,
    errorCaps: TYPING_CAPS,
    notes:
      '35 WPM English or 30 WPM Hindi — about 10,500 and 9,000 key depressions per hour.',
    citation: CHSL_CITATION,
  },
  {
    id: 'chsl_pa_sa',
    name: 'Postal Assistant / Sorting Assistant',
    shortName: 'PA / SA',
    exam: 'CHSL',
    department: 'Department of Posts',
    measure: 'wpm',
    wpmEnglish: 35,
    wpmHindi: 30,
    durationMinutes: 10,
    compensatoryMinutes: 5,
    passageKd: [1700, 1900],
    hindiAvailable: true,
    backspaceAllowed: true,
    errorCaps: TYPING_CAPS,
    citation: CHSL_CITATION,
  },
  {
    id: 'chsl_deo',
    name: "Data Entry Operator / DEO Grade 'A'",
    shortName: 'DEO',
    exam: 'CHSL',
    department: 'Departments other than those at para 8.1',
    measure: 'kdph',
    kdph: 8000,
    durationMinutes: 15,
    compensatoryMinutes: 5,
    passageKd: [2000, 2200],
    hindiAvailable: false,
    backspaceAllowed: true,
    errorCaps: DEST_CAPS,
    notes:
      'English only. Skill Test is mandatory for DEOs — no candidate is exempt.',
    citation: CHSL_CITATION,
  },
  {
    id: 'chsl_deo_grade_a_cag',
    name: "DEO / DEO Grade 'A' (Consumer Affairs, Culture, SSC)",
    shortName: 'DEO Grade A',
    exam: 'CHSL',
    department:
      'Ministry of Consumer Affairs, Food & Public Distribution; Ministry of Culture; Staff Selection Commission',
    measure: 'kdph',
    kdph: 15000,
    durationMinutes: 15,
    compensatoryMinutes: 5,
    passageKd: [3700, 4000],
    hindiAvailable: false,
    backspaceAllowed: true,
    errorCaps: DEST_CAPS,
    notes:
      'The fastest SSC requirement — 15,000 key depressions per hour, roughly 50 WPM.',
    citation: CHSL_CITATION,
  },

  /* ----------------------------------------------------------------- CGL */
  {
    id: 'cgl_aso_css',
    name: 'Assistant Section Officer (CSS / MEA / AFHQ)',
    shortName: 'ASO',
    exam: 'CGL',
    department: 'Central Secretariat Service, Ministry of External Affairs, AFHQ',
    measure: 'kdph',
    kdph: 8000,
    durationMinutes: 15,
    compensatoryMinutes: 5,
    passageKd: [2000, 2200],
    hindiAvailable: false,
    backspaceAllowed: true,
    errorCaps: CPT_CAPS,
    notes:
      'A CPT post — the DEST module is marked against the strict 5% cap, not the 20% used for data-entry posts.',
    citation: EVAL_CITATION,
  },
  {
    id: 'cgl_inspector_cbic',
    name: 'Inspector (CGST & Central Excise / Preventive Officer / Examiner)',
    shortName: 'Inspector CBIC',
    exam: 'CGL',
    department: 'Central Board of Indirect Taxes and Customs',
    measure: 'kdph',
    kdph: 8000,
    durationMinutes: 15,
    compensatoryMinutes: 5,
    passageKd: [2000, 2200],
    hindiAvailable: false,
    backspaceAllowed: true,
    errorCaps: CPT_CAPS,
    notes: 'A CPT post — strict 5% error cap.',
    citation: EVAL_CITATION,
  },
  {
    id: 'cgl_tax_assistant',
    name: 'Tax Assistant',
    shortName: 'Tax Assistant',
    exam: 'CGL',
    department: 'CBDT / CBIC',
    measure: 'kdph',
    kdph: 8000,
    durationMinutes: 15,
    compensatoryMinutes: 5,
    passageKd: [2000, 2200],
    hindiAvailable: false,
    backspaceAllowed: true,
    errorCaps: DEST_CAPS,
    disputed: true,
    notes:
      'Sources disagree on whether Tax Assistant is marked against the 20% DEST cap or the strict 5% CPT cap. Practise to 5% and you clear either way.',
    citation: EVAL_CITATION,
  },
  {
    id: 'cgl_udc_cbn',
    name: 'Upper Division Clerk / Senior Secretariat Assistant',
    shortName: 'UDC / SSA',
    exam: 'CGL',
    department: 'Central Bureau of Narcotics',
    measure: 'kdph',
    kdph: 8000,
    durationMinutes: 15,
    compensatoryMinutes: 5,
    passageKd: [2000, 2200],
    hindiAvailable: false,
    backspaceAllowed: true,
    errorCaps: DEST_CAPS,
    citation: EVAL_CITATION,
  },
];

export type CategoryKey = 'ur' | 'obcEws' | 'scSt' | 'pwbd';

export const CATEGORY_LABELS: Record<CategoryKey, string> = {
  ur: 'Unreserved',
  obcEws: 'OBC / EWS',
  scSt: 'SC / ST',
  pwbd: 'PwBD',
};

export function getPost(id: string): SscPost | undefined {
  return SSC_POSTS.find((p) => p.id === id);
}

/** The error cap that applies to this candidate, falling back sensibly when a
 *  post publishes no separate PwBD figure. */
export function errorCapFor(post: SscPost, category: CategoryKey): number {
  if (category === 'pwbd') return post.errorCaps.pwbd ?? post.errorCaps.scSt;
  return post.errorCaps[category];
}

/** Total test time including the 5-minute compensatory allowance where the
 *  candidate is eligible for a scribe (paras 7.1–7.3). No competitor offers
 *  this, and PwBD candidates currently have to mentally adjust every mock. */
export function durationFor(post: SscPost, compensatory: boolean): number {
  return (post.durationMinutes + (compensatory ? post.compensatoryMinutes : 0)) * 60;
}

/** Speed requirement expressed in both units, because notifications mix them
 *  and candidates think in whichever one their post uses. */
export function speedFor(
  post: SscPost,
  lang: 'english' | 'hindi'
): { wpm: number; kdph: number; label: string } {
  if (post.measure === 'wpm') {
    const wpm =
      (lang === 'hindi' ? post.wpmHindi : post.wpmEnglish) ?? post.wpmEnglish ?? 35;
    return { wpm, kdph: wpm * 5 * 60, label: `${wpm} WPM` };
  }
  const kdph = post.kdph ?? 8000;
  return {
    wpm: Math.round(kdph / 300),
    kdph,
    label: `${kdph.toLocaleString('en-IN')} KDPH`,
  };
}
