// =============================================================================
// TYPING MANIA by Maths Mania — Single Source of Truth
// =============================================================================
// All hardcoded strings, configs, plans, and metadata live here.
// Change NOTHING outside this file for any copy or configuration change.
// =============================================================================

export const APP = {
  name: 'Typing Mania',
  tagline: 'by Maths Mania',
  fullName: 'Typing Mania by Maths Mania',
  tagLineFull: "India's Most Accurate SSC Typing Exam Simulator",
  description:
    "India's Most Accurate SSC Typing Exam Simulator. Practice SSC CHSL, CGL DEST with exact evaluation logic and Ediquity replica experience. Learn typing from scratch with progressive lessons.",
  keywords:
    'SSC Typing Test, SSC CHSL Typing Practice, SSC CGL DEST Practice, SSC Hindi Typing Test, Free SSC Typing Test, Learn Typing, Touch Typing, Typing Lessons',
  url: 'https://typingmania.com',
  logo: '/images/logo.png?v=2',
  ogImage: '/images/logo.png?v=2',
  footer:
    "© 2026 Typing Mania by Maths Mania. India's Most Accurate SSC Typing Exam Simulator.",
  footerDisclaimer:
    'Not affiliated with SSC or Ediquity. This is a practice platform.',
} as const;

// =============================================================================
// EXAM MODES
// =============================================================================
export const EXAM_MODES = [
  {
    id: 'ssc_chsl',
    title: 'SSC CHSL Mode',
    description:
      'Exact SSC CHSL typing simulation. 35 WPM English, 10 minutes, qualifying nature.',
    href: '/exam/chsl',
    duration: 600,
    wpmTarget: 35,
    lang: 'english',
    icon: 'Target',
  },
  {
    id: 'ssc_cgl_dest',
    title: 'SSC CGL DEST',
    description:
      'SSC CGL Data Entry Skill Test. 15 minutes, ~2000 key depressions.',
    href: '/exam/cgl-dest',
    duration: 900,
    wpmTarget: 0,
    lang: 'english',
    icon: 'Keyboard',
  },
  {
    id: 'ssc_hindi',
    title: 'SSC Hindi Typing',
    description:
      'Full Unicode Hindi support. 30 WPM requirement with exact evaluation.',
    href: '/exam/hindi',
    duration: 600,
    wpmTarget: 30,
    lang: 'hindi',
    icon: 'Keyboard',
  },
  {
    id: 'practice',
    title: 'Practice Mode',
    description:
      'Learn at your own pace with real-time feedback and guidance.',
    href: '/exam/practice',
    duration: 600,
    wpmTarget: 35,
    lang: 'english',
    icon: 'Play',
  },
  {
    id: 'blind',
    title: 'Blind Mode',
    description:
      'Advanced practice without seeing the keyboard output.',
    href: '/exam/blind',
    duration: 600,
    wpmTarget: 35,
    lang: 'english',
    icon: 'Sparkles',
  },
  {
    id: 'mock',
    title: 'Mock Test',
    description:
      'Full real examination environment with timer and proctoring.',
    href: '/exam/mock',
    duration: 600,
    wpmTarget: 35,
    lang: 'english',
    icon: 'Target',
  },
  {
    id: 'tcs_ion_replica',
    title: 'Ediquity Replica',
    description:
      'Exact replica of Ediquity exam environment. Same layout, fonts, and experience.',
    href: '/exam/tcs-ion',
    duration: 600,
    wpmTarget: 35,
    lang: 'english',
    icon: 'Award',
  },
] as const;

// =============================================================================
// FEATURES
// =============================================================================
export const FEATURES = [
  {
    title: 'SSC Error Engine v1',
    description:
      'Levenshtein Distance, Character-Level Diff, Word-Level Mapping. Not naive word matching.',
    icon: 'Brain',
  },
  {
    title: 'Touch Typing Curriculum',
    description:
      '10-level progressive system from home row to exam-ready. Designed for absolute beginners.',
    icon: 'GraduationCap',
  },
  {
    title: 'AI Typing Coach',
    description:
      'Personalized feedback after every test. Identifies weaknesses, suggests drills.',
    icon: 'Sparkles',
  },
  {
    title: 'Qualification Prediction',
    description:
      'Predicts your SSC CHSL/CGL qualification probability with 93%+ confidence.',
    icon: 'BarChart3',
  },
  {
    title: 'Typing Replay',
    description:
      'Like Chess.com game review. Replay every keystroke, correction, and pause.',
    icon: 'Play',
  },
  {
    title: 'Ediquity Replica',
    description:
      'Same layout, fonts, timer placement, instructions, and typing area as real exam.',
    icon: 'Award',
  },
  {
    title: 'Smart Practice Generator',
    description:
      'If you struggle with words, generates passages focused on your weak areas.',
    icon: 'Target',
  },
  {
    title: 'Leaderboards',
    description:
      'Global, State, District, City, College, and Friends leaderboards.',
    icon: 'BarChart3',
  },
  {
    title: 'Enterprise Grade',
    description:
      '99.99% uptime, Kubernetes, Redis cluster, horizontal scaling.',
    icon: 'Award',
  },
] as const;

// =============================================================================
// PAIN POINTS — Problems aspirants face + how we solve them
// =============================================================================
export const PAIN_POINTS = [
  {
    problem: 'Mock tests look nothing like the real Ediquity exam',
    problemShort: 'Wrong Interface',
    solution:
      'Exact Ediquity replica — same split-screen layout, timer placement, fonts, instructions, and typing area. What you practice is what you get on exam day.',
    icon: 'Monitor',
  },
  {
    problem: 'Wrong speed calculation (Gross WPM instead of SSC Net WPM)',
    problemShort: 'Wrong Formula',
    solution:
      'Official SSC Net WPM formula: (Total Keystrokes ÷ 5 − Full Mistakes − Half Mistakes ÷ 2) ÷ Time. Other sites inflate your score. We show the real number.',
    icon: 'Calculator',
  },
  {
    problem: 'No blind mode — real Ediquity hides errors during the test',
    problemShort: 'No Blind Mode',
    solution:
      'Blind Mode hides all error feedback while typing. Mistakes only revealed at the end — exactly like the real exam. Builds real confidence, not false comfort.',
    icon: 'EyeOff',
  },
  {
    problem: 'No structured plan — just thrown into 35 WPM tests',
    problemShort: 'No Curriculum',
    solution:
      '10-level progressive curriculum from home row basics to exam-ready. Designed for absolute beginners who have never touched a keyboard.',
    icon: 'GraduationCap',
  },
  {
    problem: 'No personalized feedback — just a score with no guidance',
    problemShort: 'No Feedback',
    solution:
      'AI Typing Coach analyzes every keystroke. Identifies weak keys, error patterns, fatigue zones. Generates custom drills to fix your specific mistakes.',
    icon: 'Brain',
  },
  {
    problem: 'No progress tracking — cant see improvement over weeks',
    problemShort: 'No Tracking',
    solution:
      'Dashboard with 30-day history, WPM trends, accuracy graphs, qualification prediction. See exactly how much you improved every day.',
    icon: 'BarChart3',
  },
] as const;

// =============================================================================
// TESTIMONIALS — Social proof (aspirant stories)
// =============================================================================
export const TESTIMONIALS = [
  {
    quote:
      'Pehle 3 mock platforms pe 40+ WPM aata tha but real exam mein fail ho gaya. Maths Mania pe pata chala ki Gross WPM dikha rahe the. Yahan real SSC formula hai.',
    name: 'Rahul S.',
    role: 'SSC CHSL 2025 Qualified',
    wpm: '42 WPM',
  },
  {
    quote:
      'Main toh typing bilkul nahi aati thi. 10 levels ka course hai — home row se start kiya, 2 mahine mein 35 WPM hit kiya. Aj exam clear kiya!',
    name: 'Priya M.',
    role: 'SSC CHSL 2025 Qualified',
    wpm: '36 WPM',
  },
  {
    quote:
      'AI Coach ne bataya ki main left hand pe zyada dependent hoon aur number row weak hai. Usne khusus drills di. 2 hafte mein accuracy 88% se 96% ho gayi.',
    name: 'Amit K.',
    role: 'SSC CGL DEST Qualified',
    wpm: '40 WPM',
  },
  {
    quote:
      'Ediquity replica bilkul same hai. Timer ka placement, font, split-screen — sab. Exam hall mein baithke laga ki pehle bhi de chuka hoon. Game changer.',
    name: 'Neha J.',
    role: 'SSC CHSL 2025 Qualified',
    wpm: '38 WPM',
  },
] as const;

// =============================================================================
// HERO STATS
// =============================================================================
export const HERO_STATS = [
  { value: '2M+', label: 'Students', icon: 'Award' },
  { value: '99.9%', label: 'Uptime', icon: 'BarChart3' },
  { value: '50K+', label: 'Tests Daily', icon: 'Keyboard' },
  { value: '95%', label: 'Accuracy Match', icon: 'Target' },
] as const;

// =============================================================================
// SSC OFFICIAL RULES
// =============================================================================
export const SSC_RULES = {
  chsl: {
    title: 'SSC CHSL Typing Test',
    rules: [
      'English: 35 WPM',
      'Hindi: 30 WPM',
      'Duration: 10 Minutes',
      'Nature: Qualifying',
      'Evaluation: Speed + Accuracy',
    ],
  },
  cgl: {
    title: 'SSC CGL DEST',
    rules: [
      'Duration: 15 Minutes',
      '~2000 Key Depressions',
      'Nature: Qualifying',
      'Environment: SSC Computer Based Skill Test',
    ],
  },
} as const;

// =============================================================================
// TYPOGRAPHY — Design system tokens (CSS custom props in globals.css)
// =============================================================================
export const WOBBLY_RADII = {
  sm: '255px 15px 225px 15px / 15px 225px 15px 255px',
  md: '60px 20px 80px 20px / 20px 60px 20px 80px',
  lg: '120px 30px 150px 30px / 30px 120px 30px 150px',
} as const;

// =============================================================================
// NAVIGATION
// =============================================================================
export const NAV_LINKS = [
  { label: 'SSC CHSL', href: '/exam/chsl' },
  { label: 'SSC CGL', href: '/exam/cgl-dest' },
  { label: 'Practice', href: '/exam/practice' },
  { label: 'Learn', href: '/learn' },
  { label: 'Leaderboard', href: '/leaderboard' },
  { label: 'AI Coach', href: '/coach' },
] as const;

// =============================================================================
// LEADERBOARD SCOPES
// =============================================================================
export const LEADERBOARD_SCOPES = [
  { id: 'global', label: 'Global' },
  { id: 'state', label: 'State' },
  { id: 'college', label: 'College' },
] as const;

// =============================================================================
// DASHBOARD QUICK ACTIONS
// =============================================================================
export const DASHBOARD_ACTIONS = [
  {
    href: '/exam/chsl',
    title: 'SSC CHSL Practice',
    description: '10 min, 35 WPM target',
    icon: 'Target',
  },
  {
    href: '/exam/mock',
    title: 'Mock Test',
    description: 'Full exam simulation',
    icon: 'Timer',
  },
  {
    href: '/learn',
    title: 'Learn Typing',
    description: 'Start from scratch',
    icon: 'GraduationCap',
  },
  {
    href: '/coach',
    title: 'AI Coach',
    description: 'Personalized feedback',
    icon: 'Brain',
  },
] as const;

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
  ssc_chsl: 'SSC CHSL',
  ssc_cgl_dest: 'SSC CGL DEST',
  ssc_hindi: 'SSC Hindi',
  practice: 'Practice',
  blind: 'Blind Mode',
  mock: 'Mock Test',
  tcs_ion_replica: 'Ediquity Replica',
} as const;

// =============================================================================
// FOOTER — All footer data. Add/remove links here only.
// =============================================================================
export const FOOTER = {
  description:
    "India's Most Accurate SSC Typing Exam Simulator. Learn typing from scratch with progressive lessons, practice with real SSC exam patterns, and qualify with confidence.",
  examLinks: [
    { label: 'SSC CHSL Typing', href: '/exam/chsl' },
    { label: 'SSC CGL DEST', href: '/exam/cgl-dest' },
    { label: 'SSC Hindi Typing', href: '/exam/hindi' },
    { label: 'Practice Mode', href: '/exam/practice' },
    { label: 'Blind Mode', href: '/exam/blind' },
    { label: 'Mock Test', href: '/exam/mock' },
    { label: 'Ediquity Replica', href: '/exam/tcs-ion' },
  ],
  quickLinks: [
    { label: 'Learn Typing', href: '/learn' },
    { label: 'AI Coach', href: '/coach' },
    { label: 'Leaderboard', href: '/leaderboard' },
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'FAQ', href: '/faq' },
  ],
  accountLinks: [
    { label: 'Login', href: '/auth/login' },
    { label: 'Register', href: '/auth/register' },
  ],
  companyLinks: [
    { label: 'About Us', href: '/about' },
    { label: 'FAQ', href: '/faq' },
    { label: 'Contact', href: '/contact' },
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
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
    copyright: '© 2026 Typing Mania by Maths Mania',
    disclaimer: 'Not affiliated with SSC or Ediquity. This is a practice platform.',
  },
} as const;

// =============================================================================
// ROUTES — SPA routes used across the app
// =============================================================================
export const ROUTES = {
  home: '/',
  learn: '/learn',
  dashboard: '/dashboard',
  coach: '/coach',
  leaderboard: '/leaderboard',
  faq: '/faq',
  about: '/about',
  contact: '/contact',
  privacy: '/privacy',
  terms: '/terms',
  admin: '/admin',
  authLogin: '/auth/login',
  authRegister: '/auth/register',
  examChsl: '/exam/chsl',
  examCglDest: '/exam/cgl-dest',
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
  colors: {
    blue: '#2F5BFF',
    teal: '#4ec5df',
    green: '#4caf50',
    orange: '#ff9800',
    red: '#e53935',
    bg: '#f5f5f5',
    text: '#333333',
    border: '#dcdcdc',
  },
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
