// =============================================================================
// TYPING MANIA by Maths Mania — Single Source of Truth
// =============================================================================
// All hardcoded strings, configs, plans, and metadata live here.
// Change NOTHING outside this file for any copy or configuration change.
// =============================================================================

// Nothing here may claim a rank, a market position or a number we cannot
// point at in the code or the notification. "India's most accurate" was a
// superlative no one can verify and it is gone; what replaced it is a plain
// description of what the product does. `tagLineFull`, `footer` and
// `footerDisclaimer` carried the same claim and were imported by nothing.
export const APP = {
  name: 'Typing Mania',
  tagline: 'by Maths Mania',
  fullName: 'Typing Mania by Maths Mania',
  description:
    'Free SSC typing test practice for CGL and CHSL. Real DEST exam interface, 35 WPM and 8,000 KDPH targets, full and half mistakes marked the way the Commission marks them, and English and Hindi passages. Includes typing lessons from zero.',
  /* What aspirants actually type into a search box. The exam is known by
     several names at once — typing test, skill test, DEST, data entry speed
     test — and by its numbers, so all of them are here. */
  keywords: [
    'SSC typing test',
    'SSC CGL typing test',
    'SSC CHSL typing test',
    'SSC typing test online free',
    'SSC DEST test',
    'data entry speed test',
    'SSC CGL DEST practice',
    'SSC CHSL typing practice',
    'typing test for government exams',
    '35 WPM typing test',
    '8000 key depressions per hour',
    'SSC Hindi typing test',
    'Mangal font typing test',
    'LDC JSA typing test',
    'DEO skill test',
    'free typing test India',
    'SSC typing test 2026',
    'typing speed test SSC',
  ].join(', '),
  /* The address the site is actually served from.
  
     This was hardcoded to typingmania.com, which has no DNS record at all — so
     every canonical link, the sitemap, the robots host and every Open Graph
     URL pointed at a domain that does not exist. A crawler following those
     finds nothing, which is the most complete way to not rank. Point
     NEXT_PUBLIC_SITE_URL at a real domain once there is one; until then this
     is where the site lives. */
  url:
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_ENV === 'production' && process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : 'https://typingmania.vercel.app'),
  logo: '/images/logo.png?v=2',
  ogImage: '/images/logo.png?v=2',
} as const;

// =============================================================================
// EXAM MODES
// =============================================================================
export const EXAM_MODES = [
  {
    id: 'ssc_chsl',
    title: 'CHSL — LDC / JSA',
    description: '35 WPM. 7% errors.',
    href: '/exam/chsl',
    duration: 600,
    wpmTarget: 35,
    lang: 'english',
    icon: 'Target',
  },
  {
    id: 'ssc_chsl_deo',
    title: 'CHSL — DEO',
    description: '8,000 KDPH. 20% errors.',
    href: '/exam/chsl-deo',
    duration: 900,
    wpmTarget: 0,
    lang: 'english',
    icon: 'Keyboard',
  },
  {
    id: 'ssc_chsl_deo_grade_a',
    title: "CHSL — DEO Grade 'A'",
    description: '15,000 KDPH. The fastest bar.',
    href: '/exam/chsl-deo-grade-a',
    duration: 900,
    wpmTarget: 0,
    lang: 'english',
    icon: 'Keyboard',
  },
  {
    id: 'ssc_cgl_dest',
    title: 'CGL — DEST',
    description: '8,000 KDPH. 5% errors.',
    href: '/exam/cgl-dest',
    duration: 900,
    wpmTarget: 0,
    lang: 'english',
    icon: 'Keyboard',
  },
  {
    id: 'ssc_cgl_cpt',
    title: 'CGL — CPT',
    description: '8,000 KDPH. 5% errors.',
    href: '/exam/cgl-cpt',
    duration: 900,
    wpmTarget: 0,
    lang: 'english',
    icon: 'Target',
  },
  {
    id: 'ssc_hindi',
    title: 'SSC Hindi',
    description: '30 WPM. Unicode Hindi.',
    href: '/exam/hindi',
    duration: 600,
    wpmTarget: 30,
    lang: 'hindi',
    icon: 'Keyboard',
  },
  {
    id: 'practice',
    title: 'Practice',
    description: 'Live feedback while you type.',
    href: '/exam/practice',
    duration: 600,
    wpmTarget: 35,
    lang: 'english',
    icon: 'Play',
  },
  {
    id: 'blind',
    title: 'Blind',
    description: 'No feedback. Like the real thing.',
    href: '/exam/blind',
    duration: 600,
    wpmTarget: 35,
    lang: 'english',
    icon: 'Sparkles',
  },
  {
    id: 'mock',
    title: 'Mock test',
    description: 'Full exam conditions.',
    href: '/exam/mock',
    duration: 600,
    wpmTarget: 35,
    lang: 'english',
    icon: 'Target',
  },
  {
    id: 'tcs_ion_replica',
    title: 'Eduquity replica',
    description: 'The vendor screen, exactly.',
    href: '/exam/tcs-ion',
    duration: 600,
    wpmTarget: 35,
    lang: 'english',
    icon: 'Award',
  },
] as const;

// =============================================================================
// TYPOGRAPHY — Design system tokens (CSS custom props in globals.css)
// =============================================================================
export const WOBBLY_RADII = {
  sm: '255px 15px 225px 15px / 15px 225px 15px 255px',
  md: '60px 20px 80px 20px / 20px 60px 20px 80px',
  lg: '120px 30px 150px 30px / 30px 120px 30px 150px',
} as const;

// =============================================================================
// SUBSCRIPTION PLANS
// =============================================================================
export const PLANS = {
  free: { label: 'Free', price: 0, durationDays: Infinity },
  premium_monthly: { label: 'Premium Monthly', price: 299, durationDays: 30 },
  premium_quarterly: {
    label: 'Premium Quarterly',
    price: 799,
    durationDays: 90,
  },
  premium_yearly: { label: 'Premium Yearly', price: 2499, durationDays: 365 },
} as const;

// =============================================================================
// ERROR EVALUATION — SSC thresholds
// =============================================================================
export const SSC_THRESHOLDS = {
  chsl: { wpm: 35, wpmHindi: 30, accuracy: 95 },
  cglDest: { accuracy: 95 },
} as const;

// =============================================================================
// MODE DISPLAY NAMES
// =============================================================================
export const MODE_NAMES: Record<string, string> = {
  ssc_chsl: 'SSC CHSL — LDC / JSA',
  ssc_chsl_deo: 'SSC CHSL — DEO',
  ssc_chsl_deo_grade_a: "SSC CHSL — DEO Grade 'A'",
  ssc_cgl_dest: 'SSC CGL — DEST',
  ssc_cgl_cpt: 'SSC CGL — CPT',
  ssc_hindi: 'SSC Hindi',
  practice: 'Practice',
  blind: 'Blind Mode',
  mock: 'Mock Test',
  tcs_ion_replica: 'Eduquity Replica',
} as const;

// =============================================================================
// LEGAL & BUSINESS IDENTITY
// =============================================================================
// Every legal page reads from here. The fields left empty are the ones only
// the business can supply — they are rendered conditionally, so nothing false
// is ever published, and every page becomes compliant the moment they are set.
//
// REQUIRED BEFORE PAYMENTS GO LIVE (payment aggregators and the Consumer
// Protection (E-Commerce) Rules 2020 both require the registered legal name,
// registered address and a working phone number to be published):
//   legalEntityName, registeredAddress, phone, gstin
// REQUIRED FOR IT Rules 2021 r. 3(2) AND DPDP Act 2023 s. 13:
//   grievanceOfficer (a named person), and ideally a dedicated mailbox for
//   grievanceEmail / privacyEmail instead of the shared support inbox.
// =============================================================================
export const LEGAL = {
  /** Trading name shown in prose. */
  brand: 'Typing Mania',
  /** Publisher of the service. */
  operator: 'Maths Mania',
  /** Registered legal name, e.g. "Maths Mania Edutech Private Limited". */
  legalEntityName: '' as string,
  /** Full registered office address, one line per element. */
  registeredAddress: [] as readonly string[],
  /** Working phone number with country code. */
  phone: '' as string,
  /** GSTIN, printed on invoices and required on the contact page once GST-registered. */
  gstin: '' as string,

  supportEmail: 'support@mathsmania.com',
  /** Point these at dedicated mailboxes when they exist. */
  privacyEmail: 'support@mathsmania.com',
  grievanceEmail: 'support@mathsmania.com',
  telegram: 'https://t.me/mathsmania',

  /** Named grievance officer under IT Rules 2021 r. 3(2)(a) and DPDP s. 13. */
  grievanceOfficer: '' as string,
  /** Support hours, in the site's own timezone. */
  supportHours: 'Monday to Saturday, 10:00–19:00 IST',

  /** Published response commitments. The tighter of the IT Rules (ack 24h,
   *  resolve 15 days) and the E-Commerce Rules (ack 48h, resolve 30 days). */
  ackHours: 24,
  resolveDays: 15,
  /** DPDP Rules 2025 r. 7 — breach notification window. */
  breachNoticeHours: 72,

  /** Seat of jurisdiction. Empty renders as "courts of competent jurisdiction
   *  in India" rather than naming a city we cannot verify. */
  jurisdictionCity: '' as string,
  governingLaw: 'India',

  /** Policy versioning. Bump both when the substance of a policy changes. */
  policyVersion: '1.0',
  effectiveDate: '2026-09-06',
  lastUpdated: '2026-09-06',

  /** Refund window for a first paid subscription, in days. */
  refundWindowDays: 7,
  /** Working days for a sanctioned refund to reach the original method. */
  refundProcessingDays: '5–7 business days',
} as const;

/** "6 September 2026" from an ISO date, without pulling in a formatter. */
export function formatPolicyDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

// =============================================================================
// FOOTER — All footer data. Add/remove links here only.
// =============================================================================
export const FOOTER = {
  description:
    'SSC skill tests, scored the way the Commission scores them.',
  /* Two exams, not nine variants. A candidate picks the exam they have
     applied for; which posts they are in the running for is something the
     result tells them afterwards, from their own score. */
  examLinks: [
    { label: 'SSC CHSL typing test', href: '/exam/chsl' },
    { label: 'SSC CGL typing test', href: '/exam/cgl-dest' },
    { label: 'Marking scheme', href: '/marking-scheme' },
  ],
  quickLinks: [
    { label: 'Learn to type', href: '/learn' },
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Leaderboard', href: '/leaderboard' },
  ],
  companyLinks: [
    { label: 'Contact', href: '/contact' },
    { label: 'Privacy', href: '/privacy' },
    { label: 'Terms', href: '/terms' },
  ],
  socialLinks: [
    {
      label: 'YouTube',
      href: 'https://youtube.com/@mathsmania',
      icon: 'Youtube',
    },
    {
      label: 'Instagram',
      href: 'https://instagram.com/mathsmania',
      icon: 'Instagram',
    },
    {
      label: 'Telegram',
      href: 'https://t.me/mathsmania',
      icon: 'Send',
    },
    {
      label: 'GitHub',
      href: 'https://github.com/mathsmania',
      icon: 'Github',
    },
  ],
  legal: {
    copyright: '© 2026 Typing Mania',
    disclaimer:
      'Not affiliated with, endorsed by or connected to the Staff Selection Commission, Eduquity Careers or TCS iON. Speed and error requirements are reproduced from published SSC notices; always confirm them against the notice for your own examination.',
  },
} as const;

// =============================================================================
// ROUTES — SPA routes used across the app
// =============================================================================
export const ROUTES = {
  home: '/',
  learn: '/learn',
  dashboard: '/dashboard',
  /** Off for now. The page lives at app/_coach — an underscore folder is
   *  private to the router, so the code is kept but the route does not
   *  resolve. Rename the folder back to re-enable it. */
  coach: '/coach',
  leaderboard: '/leaderboard',
  faq: '/faq',
  markingScheme: '/marking-scheme',
  about: '/about',
  contact: '/contact',
  privacy: '/privacy',
  terms: '/terms',
  admin: '/admin',
  refunds: '/refunds',
  authLogin: '/auth/login',
  authRegister: '/auth/register',
  examChsl: '/exam/chsl',
  examChslDeo: '/exam/chsl-deo',
  examChslDeoGradeA: '/exam/chsl-deo-grade-a',
  examCglDest: '/exam/cgl-dest',
  examCglCpt: '/exam/cgl-cpt',
  examHindi: '/exam/hindi',
  examPractice: '/exam/practice',
  examBlind: '/exam/blind',
  examMock: '/exam/mock',
  examTcsIon: '/exam/tcs-ion',
  examLesson: '/exam/lesson',
} as const;

// =============================================================================
// TIME CONSTANTS — durations, intervals, TTLs (all in ms unless noted)
// =============================================================================
export const TIME = {
  cacheDashboard: 3 * 60 * 1000,
  cacheLeaderboard: 2 * 60 * 1000,
  cacheWeakWords: 5 * 60 * 1000,
  cacheReactQueryDefault: 60 * 1000,
  healthCheckInterval: 30 * 1000,
  healthCheckTimeout: 5000,
  toastDuration: 3000,
  errorFlashDuration: 1500,
  capsBlinkDuration: '0.8s',
  tickInterval: 1000,
  debounceLong: 500,
} as const;

// =============================================================================
// CSS TOKENS — shared style constants (use instead of raw strings)
// =============================================================================
export const CSS = {
  radii: WOBBLY_RADII,
  shadows: {
    sm: 'shadow-hard-sm',
    md: 'shadow-hard',
    hover: 'shadow-hard-hover',
    mdHover: 'hover:shadow-hard',
    cardPostit: 'card-postit',
  },
  /* The palette lives in globals.css now, as two colours and the ink between
     them. The eight hues that used to sit here were referenced nowhere. */
  rotations: ['-rotate-1', 'rotate-1', '-rotate-2', 'rotate-2', '-rotate-0.5', 'rotate-0.5'],
} as const;

// =============================================================================
// STORAGE KEYS — localStorage / sessionStorage keys
// =============================================================================
export const STORAGE_KEYS = {
  token: 'token',
  authCache: 'auth_cache',
  dashboard: 'dashboard',
  capsLock: '__caps',
  lessonProgress: 'typing_lesson_progress',
  testResults: 'typing_test_results',
} as const;

// =============================================================================
// PAGINATION
// =============================================================================
export const PAGINATION = {
  dashboardPerPage: 5,
  testHistoryLimit: 20,
  leaderboardLimit: 100,
  recentTestsMax: 20,
  analysisSlowWords: 15,
} as const;

// =============================================================================
// SSC THRESHOLDS (user-facing labels)
// =============================================================================
export const SSC_LABELS = {
  chslWpm: 35,
  chslWpmHindi: 30,
  chslAccuracy: 95,
  cglDestAccuracy: 95,
  cglDestKdph: 8000,
  passageCompletionMin: 50,
} as const;

// =============================================================================
// API ENDPOINTS
// =============================================================================
export const API_ENDPOINTS = {
  dashboard: '/dashboard',
  authLogin: '/auth/login',
  authRegister: '/auth/register',
  authMe: '/auth/me',
  authRefresh: '/auth/refresh',
  analyticsOverview: '/analytics/overview',
  analyticsPredictions: '/analytics/predictions',
  analyticsRecentScores: '/analytics/recent-scores',
  testsHistory: '/tests/history',
  testsStart: '/tests/start',
  testsSubmit: '/tests/submit',
  testsDirectSubmit: '/tests/direct-submit',
  coachFeedback: '/coach/feedback',
  coachWeakWords: '/coach/weak-words',
  leaderboard: '/leaderboard',
  health: '/api/health',
  passages: '/passages',
  passagesRandom: '/passages/random',
  usersProfile: '/users/profile',
  subscription: '/subscription/status',
  paymentHistory: '/subscription/payments',
} as const;

export const ENABLE_NEW_TYPING_ENGINE = true;
