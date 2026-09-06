import { FingerZone } from '@/components/learn/keyboard-layout';

/**
 * SSC TYPING CURRICULUM
 * =====================
 *
 * The previous curriculum was a generic typing tutor — home row, top row,
 * bottom row, numbers, words, passages — with SSC branding on top. Every
 * competitor ships that same sequence. It teaches typing. It does not teach
 * passing the SSC skill test, which is a different skill.
 *
 * What actually fails candidates, per the Commission's own evaluation
 * guidelines, is not raw speed. It is errors they do not know are errors:
 *
 *   - HALF MISTAKES (0.5 each) they were never taught to see — capitalisation,
 *     punctuation, spacing, transposed words, and using spaces instead of Tab
 *     at a paragraph start.
 *   - FULL MISTAKES (1 each) from omitting a figure, or leaving a word
 *     half-typed when the timer runs out mid-word.
 *   - LOSING THEIR PLACE, because the real TCS-iON interface offers no word
 *     highlighting and no auto-scroll.
 *   - ENDURANCE COLLAPSE in the last third of a 10 or 15 minute passage.
 *
 * No typing tutor drills any of that. So the curriculum is organised in six
 * stages, and the whole middle of it — Stage 3 — is error mechanics.
 *
 * Key order in Stage 1 is by LETTER FREQUENCY rather than by keyboard row.
 * E T A O I N make up roughly half of written English, so a frequency order
 * reaches real words by the fourth lesson instead of the twelfth, which is
 * where beginners usually quit.
 */

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

/** Which SSC error a Stage 3 drill is engineered to expose. */
export type MistakeFocus =
  | 'capitalisation'
  | 'punctuation'
  | 'spacing'
  | 'figures'
  | 'paragraph'
  | 'transposition'
  | 'spelling'
  | 'omission';

export interface Lesson {
  id: string;
  title: string;
  instruction: string;
  keys: string[];
  sampleText: string;
  targetWpm: number;
  minAccuracy: number;
  durationSec: number;
  xpReward: number;
  fingerZones: FingerZone[];
  newKeys: string[];
  drillType:
    | 'letters'
    | 'bigrams'
    | 'trigrams'
    | 'words'
    | 'sentences'
    | 'passage'
    | 'exam';
  psychTip: string;
  warmupText: string;

  /* ---- SSC-specific ---- */

  /** The error type this drill trains against, for Stage 3 lessons. */
  focus?: MistakeFocus;
  /** The rule as the Commission states it. Shown before the drill starts. */
  rule?: string;
  /** The specific trap planted in `sampleText`, revealed in the debrief. */
  trap?: string;
  /** Disable backspace, reproducing the stricter exam interfaces. */
  noBackspace?: boolean;
  /** Hide the word highlight, as the real TCS-iON interface does. */
  hidePositionHighlight?: boolean;
}

export interface Level {
  id: number;
  name: string;
  subtitle: string;
  description: string;
  icon: string;
  /** Which of the six stages this level belongs to. */
  stage: 0 | 1 | 2 | 3 | 4 | 5;
  lessons: Lesson[];
}

export const STAGES = [
  {
    id: 0,
    name: 'Shuruaat',
    english: 'Getting set up',
    blurb: 'Never touched a keyboard? Start here. Posture, hand position, home row.',
  },
  {
    id: 1,
    name: 'Keyboard',
    english: 'Learn every key',
    blurb:
      'Keys in order of how often they appear in real passages, so you reach real words fast.',
  },
  {
    id: 2,
    name: 'Fluency',
    english: 'Build rhythm',
    blurb: 'The words and letter pairs that make up most of an SSC passage.',
  },
  {
    id: 3,
    name: 'Mistake Mechanics',
    english: 'Stop losing marks',
    blurb:
      'The half and full mistakes that fail candidates who type fast enough. Nobody else teaches this.',
  },
  {
    id: 4,
    name: 'Exam Conditions',
    english: 'Type like it is the real thing',
    blurb:
      'No highlighting, no backspace, full duration. Trains what the real interface takes away.',
  },
  {
    id: 5,
    name: 'Your Post',
    english: 'Hit your actual bar',
    blurb: 'Full mocks scored against the speed and error cap for the post you applied to.',
  },
] as const;

/* -------------------------------------------------------------------------- */
/*  Helper to keep lesson definitions readable                                */
/* -------------------------------------------------------------------------- */

type LessonInput = Partial<Lesson> &
  Pick<Lesson, 'id' | 'title' | 'instruction' | 'sampleText'>;

function lesson(input: LessonInput): Lesson {
  return {
    keys: [],
    targetWpm: 0,
    minAccuracy: 90,
    durationSec: 120,
    xpReward: 20,
    fingerZones: [],
    newKeys: [],
    drillType: 'words',
    psychTip: '',
    warmupText: '',
    ...input,
  };
}

/* -------------------------------------------------------------------------- */
/*  The curriculum                                                            */
/* -------------------------------------------------------------------------- */

export const LEVELS: Level[] = [
  /* ══════════════════════ STAGE 0 — SHURUAAT ══════════════════════════════ */
  {
    id: 0,
    stage: 0,
    name: 'Bilkul Shuruaat',
    subtitle: 'Kabhi keyboard nahi chhua? Yahan se shuru karein',
    description:
      'Baithne ka tareeka, haath ki position, aur home row. Yeh teen cheezein theek ho gayin to speed apne aap aayegi.',
    icon: 'Monitor',
    lessons: [
      lesson({
        id: 's0-posture',
        title: 'Baithne ka sahi tareeka',
        instruction:
          'Seedhe baithein. Kohni 90 degree par. Kalaai (wrist) table par tiki na ho — hawa mein rahe. Screen aankhon ke level par.',
        rule: 'Galat posture 10 minute ke baad speed 20% tak gira deta hai. Yeh sabse sasta sudhaar hai.',
        keys: ['A', 'S', 'D', 'F', 'J', 'K', 'L', ';'],
        sampleText: 'asdf jkl; asdf jkl; asdf jkl;',
        warmupText: 'asdf jkl;',
        durationSec: 90,
        minAccuracy: 70,
        xpReward: 10,
        drillType: 'letters',
        fingerZones: ['lp', 'lr', 'lm', 'li', 'ri', 'rm', 'rr', 'rp'],
        newKeys: ['a', 's', 'd', 'f', 'j', 'k', 'l', ';'],
        psychTip:
          'Har 20 minute par 20 second ke liye 20 feet door dekhein. Aankhein thakengi nahi.',
      }),
      lesson({
        id: 's0-anchor',
        title: 'F aur J — bina dekhe wapas aana',
        instruction:
          'F aur J par chhote ubhaar (bumps) hote hain. Index ungliyaan wahan rakhein. Aankh band karke bhi wapas wahin aana seekhein.',
        rule:
          'Exam mein keyboard dekhne ka waqt nahi milta. F aur J hi aapka anchor hain.',
        keys: ['F', 'J'],
        sampleText: 'ff jj ff jj fj fj jf jf ffjj jjff fj jf',
        warmupText: 'ff jj',
        durationSec: 90,
        minAccuracy: 80,
        xpReward: 10,
        drillType: 'letters',
        fingerZones: ['li', 'ri'],
        newKeys: [],
        psychTip:
          'Ungli key par rakhein, dabayein nahi. Halka sa touch — muscle memory isi se banti hai.',
      }),
      lesson({
        id: 's0-home',
        title: 'Home row — aath ungliyaan',
        instruction:
          'Baayan haath A S D F par, daayan haath J K L ; par. Angootha (thumb) spacebar par. Keyboard neeche mat dekhein.',
        keys: ['A', 'S', 'D', 'F', 'J', 'K', 'L', ';'],
        sampleText:
          'as df jk l; sad lad fad ask lass fall half glass sash flask',
        warmupText: 'asdf jkl; asdf jkl;',
        durationSec: 120,
        minAccuracy: 85,
        targetWpm: 10,
        xpReward: 15,
        drillType: 'letters',
        fingerZones: ['lp', 'lr', 'lm', 'li', 'ri', 'rm', 'rr', 'rp'],
        newKeys: ['g', 'h'],
        psychTip:
          'Speed abhi bilkul mat sochein. Sirf sahi ungli, sahi key. Speed baad mein free mein milegi.',
      }),
    ],
  },

  /* ══════════════════════ STAGE 1 — KEYBOARD ══════════════════════════════ */
  {
    id: 1,
    stage: 1,
    name: 'Sabse Zaroori Akshar',
    subtitle: 'E T A O I N — aadhi English inhi se banti hai',
    description:
      'Row ke hisaab se nahi, istemal ke hisaab se. In chhe akshar ke baad aap asli shabd type kar payenge.',
    icon: 'Zap',
    lessons: [
      lesson({
        id: 's1-e-t',
        title: 'E aur T',
        instruction:
          'E aur T English ke sabse zyada istemal hone wale akshar hain. Baayein haath ki middle aur index ungli upar jaati hai — home row par turant wapas.',
        keys: ['e', 't'],
        newKeys: ['e', 't'],
        sampleText:
          'ee tt et te teet tea eat ate the set let get feet tell tale state',
        warmupText: 'ee tt et te',
        durationSec: 120,
        minAccuracy: 88,
        targetWpm: 12,
        drillType: 'letters',
        fingerZones: ['lm', 'li'],
        psychTip:
          'Ungli upar jaakar wapas home row par aani chahiye. Wahan tik mat jaayein.',
      }),
      lesson({
        id: 's1-a-o-i-n',
        title: 'O, I aur N',
        instruction:
          'Daayan haath ab kaam karega. O aur I upar, N neeche. E T A ke saath milakar aadhi English tayyar.',
        keys: ['o', 'i', 'n'],
        newKeys: ['o', 'i', 'n'],
        sampleText:
          'on in no not one ten tin ion note into lion lost line loan intent nation',
        warmupText: 'oo ii nn on in no',
        durationSec: 120,
        minAccuracy: 88,
        targetWpm: 14,
        drillType: 'words',
        fingerZones: ['rr', 'rm', 'ri'],
        psychTip:
          'Ab aap asli shabd type kar rahe hain. Yeh 12 lesson baad nahi, abhi ho raha hai.',
      }),
      lesson({
        id: 's1-r-s-h',
        title: 'R, S aur H',
        instruction:
          'R baayein index ki reach hai, S home row par, H daayein index ki inward reach.',
        keys: ['r', 's', 'h'],
        newKeys: ['r'],
        sampleText:
          'her his has she the this that there their share short north earth honest',
        warmupText: 'rr ss hh her his has',
        durationSec: 120,
        minAccuracy: 88,
        targetWpm: 16,
        drillType: 'words',
        fingerZones: ['li', 'lr', 'ri'],
        psychTip:
          '"the", "this", "that", "there" — SSC passage mein yeh shabd sabse zyada aate hain.',
      }),
      lesson({
        id: 's1-l-d-c-u',
        title: 'L, D, C aur U',
        instruction:
          'C neeche ki taraf middle ungli se, U daayein index ki upar reach.',
        keys: ['l', 'd', 'c', 'u'],
        newKeys: ['c', 'u'],
        sampleText:
          'could should would include conduct district council culture educate current',
        warmupText: 'cc uu dd ll cud clue',
        durationSec: 150,
        minAccuracy: 88,
        targetWpm: 18,
        drillType: 'words',
        fingerZones: ['lm', 'ri', 'rr'],
        psychTip:
          'C ke liye ungli andar aur neeche mudti hai. Poora haath mat hilayein.',
      }),
      lesson({
        id: 's1-m-p-g-w',
        title: 'M, P, G aur W',
        instruction:
          'W baayein ring ungli upar, P daayein chhoti ungli (pinky) upar — yeh sabse mushkil reach hai.',
        keys: ['m', 'p', 'g', 'w'],
        newKeys: ['m', 'p', 'w'],
        sampleText:
          'programme employment government management improve support power group we',
        warmupText: 'mm pp gg ww map pug',
        durationSec: 150,
        minAccuracy: 87,
        targetWpm: 20,
        drillType: 'words',
        fingerZones: ['rm', 'rp', 'li', 'lr'],
        psychTip:
          'Pinky se P dabate waqt poora haath mat ghumayein. Sirf ungli badhayein.',
      }),
      lesson({
        id: 's1-y-b-v-k',
        title: 'Y, B, V aur K',
        instruction:
          'B aur Y dono index ungli ki lambi reach hain — inhi par log sabse zyada galti karte hain.',
        keys: ['y', 'b', 'v', 'k'],
        newKeys: ['y', 'b', 'v'],
        sampleText:
          'by very body every may your they above believe available develop budget',
        warmupText: 'yy bb vv kk buy vary',
        durationSec: 150,
        minAccuracy: 87,
        targetWpm: 20,
        drillType: 'words',
        fingerZones: ['ri', 'li', 'lm', 'rm'],
        psychTip:
          'B ke liye baayan index andar aur neeche jaata hai. Daayein haath se B mat dabayein.',
      }),
      lesson({
        id: 's1-f-j-x-q-z',
        title: 'X, Q, J aur Z — akhri paanch',
        instruction:
          'Yeh sabse kam istemal hote hain, par exam ke passage mein aa sakte hain. Chhod diye to poori mistake.',
        keys: ['x', 'q', 'j', 'z'],
        newKeys: ['x', 'q', 'z'],
        sampleText:
          'tax quality equal require export index adjust major project zone size quota',
        warmupText: 'xx qq jj zz tax zoo',
        durationSec: 150,
        minAccuracy: 87,
        targetWpm: 20,
        drillType: 'words',
        fingerZones: ['lr', 'lp', 'ri', 'lp'],
        psychTip:
          'Q aur Z pinky se. Pinky kamzor hoti hai — isliye inhe alag se practise karna padta hai.',
      }),
      lesson({
        id: 's1-shift',
        title: 'Shift — capital akshar',
        instruction:
          'Ulte haath ka Shift dabayein. Baayan akshar chahiye to daayan Shift, daayan akshar chahiye to baayan Shift.',
        rule:
          'Galat capital ya chhota akshar = AADHI mistake (0.5). Hindi mein yeh laagu nahi hota.',
        keys: ['Shift'],
        newKeys: ['Shift'],
        sampleText:
          'India Delhi Parliament Supreme Court Reserve Bank of India Ministry of Finance',
        warmupText: 'Aa Bb Cc Dd Ee',
        durationSec: 150,
        minAccuracy: 90,
        targetWpm: 22,
        drillType: 'words',
        fingerZones: ['lp', 'rp'],
        psychTip:
          'Ek hi haath se Shift aur akshar dono dabana speed todta hai. Ulta haath istemal karein.',
      }),
      lesson({
        id: 's1-numbers',
        title: 'Number row — 0 se 9',
        instruction:
          'Numbers ke liye ungli home row se seedhi upar jaati hai. Bina dekhe. Yeh mushkil hai — dheere shuru karein.',
        rule:
          'Passage ka koi bhi ank (figure) chhod dena POORI mistake hai (1). Numbers sabse mehngi galti hain.',
        keys: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
        newKeys: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
        sampleText:
          '2026 1947 15 minutes 8000 key depressions 35 wpm 10500 per hour 7% 20%',
        warmupText: '12345 67890',
        durationSec: 180,
        minAccuracy: 92,
        targetWpm: 20,
        drillType: 'letters',
        fingerZones: ['lp', 'lr', 'lm', 'li', 'ri', 'rm', 'rr', 'rp'],
        psychTip:
          'Number type karte waqt log neeche dekh lete hain. Wahin se place kho jaati hai.',
      }),
      lesson({
        id: 's1-punctuation-keys',
        title: 'Chinh (punctuation) keys',
        instruction:
          'Comma, full stop, semicolon, hyphen, brackets aur inverted commas. Sab pinky aur ring ungli se.',
        rule:
          'Chinh chhootna, extra lagana ya galat lagana = AADHI mistake (0.5) har baar.',
        keys: [',', '.', ';', ':', '-', '(', ')', "'", '"', '?'],
        newKeys: [',', '.', ';', ':', '-', '(', ')', '?'],
        sampleText:
          'the Act, 1950; sub-section (2) of section 4: "law and order" — is it clear?',
        warmupText: ', . ; : - ( ) ?',
        durationSec: 180,
        minAccuracy: 90,
        targetWpm: 22,
        drillType: 'sentences',
        fingerZones: ['rm', 'rr', 'rp'],
        psychTip:
          'Legal aur government passage chinh se bhare hote hain. Yahi sabse zyada aadhi mistake deta hai.',
      }),
    ],
  },

  /* ══════════════════════ STAGE 2 — FLUENCY ═══════════════════════════════ */
  {
    id: 2,
    stage: 2,
    name: 'Rawaani',
    subtitle: 'Shabd aur jodiyaan jo baar baar aati hain',
    description:
      'Ab akshar nahi, poore shabd ek jhatke mein. SSC passage ke 60% shabd inhi 200 mein se hote hain.',
    icon: 'Waves',
    lessons: [
      lesson({
        id: 's2-top100',
        title: 'Top 100 shabd',
        instruction:
          'Yeh 100 shabd har passage mein aate hain. Inhe sochna nahi padna chahiye — ungliyaan apne aap chalein.',
        sampleText:
          'the of and to in a is that it for was as with be by on not he this are but from or have an they which one you were all we there her she him has been would their said each',
        warmupText: 'the of and to in',
        durationSec: 180,
        minAccuracy: 93,
        targetWpm: 25,
        xpReward: 25,
        drillType: 'words',
        psychTip:
          'In shabdon par sochna band karein. Jaise apna naam likhte hain — bina soche.',
      }),
      lesson({
        id: 's2-bigrams',
        title: 'Do-akshar jodiyaan',
        instruction:
          'th, he, in, er, an, re, on, at, en, nd — yeh jodiyaan ek hi movement mein aani chahiye.',
        sampleText:
          'th he in er an re on at en nd ti es or te of ed is it al ar st to nt ng se ha as ou io',
        warmupText: 'th he in er an',
        durationSec: 150,
        minAccuracy: 92,
        targetWpm: 28,
        drillType: 'bigrams',
        psychTip:
          'Jodi ko ek unit maanein, do alag key nahi. Yahi se 30+ WPM aati hai.',
      }),
      lesson({
        id: 's2-govt-vocab',
        title: 'Sarkari shabdavali',
        instruction:
          'Governance, economy aur policy ke shabd — SSC passage inhi se bhare hote hain.',
        sampleText:
          'government development implementation administration commission department policy scheme beneficiary infrastructure sustainable employment agriculture education healthcare',
        warmupText: 'government policy scheme',
        durationSec: 180,
        minAccuracy: 92,
        targetWpm: 28,
        xpReward: 25,
        drillType: 'words',
        psychTip:
          'Lambe shabd dar lagte hain par unme rhythm hota hai. Tukdon mein todein: im-ple-men-ta-tion.',
      }),
      lesson({
        id: 's2-legal-vocab',
        title: 'Kanooni aur samvaidhanik shabd',
        instruction:
          'Constitution, judiciary aur legal terms — CGL ke passage mein aksar aate hain.',
        sampleText:
          'constitution judiciary legislature jurisdiction amendment fundamental provisions tribunal petitioner respondent ordinance parliamentary sovereignty',
        warmupText: 'constitution judiciary',
        durationSec: 180,
        minAccuracy: 92,
        targetWpm: 28,
        xpReward: 25,
        drillType: 'words',
        psychTip:
          'Yeh shabd spelling mistake ke liye khatarnak hain — aur spelling POORI mistake hai.',
      }),
      lesson({
        id: 's2-sentences',
        title: 'Poore vaakya',
        instruction:
          'Ab poore vaakya. Capital akshar, comma aur full stop sab dhyaan se.',
        sampleText:
          'The Government of India launched the scheme in 2015. It aims to provide affordable housing to all citizens by the year 2026. The Ministry has allocated funds for this purpose.',
        warmupText: 'The Government of India',
        durationSec: 180,
        minAccuracy: 93,
        targetWpm: 30,
        xpReward: 30,
        drillType: 'sentences',
        psychTip:
          'Vaakya ke aakhir mein full stop, phir EK space. Do space aadhi mistake hai.',
      }),
    ],
  },

  /* ══════════════════════ STAGE 3 — MISTAKE MECHANICS ═════════════════════ */
  {
    id: 3,
    stage: 3,
    name: 'Galti Ki Mechanics',
    subtitle: 'Jo galtiyaan aapko pata hi nahi ki galti hain',
    description:
      'Speed theek hone ke baad bhi log fail hote hain — half mistakes ki wajah se. Yeh stage sirf yahan hai. Kisi aur platform par nahi milega.',
    icon: 'Target',
    lessons: [
      lesson({
        id: 's3-capitals',
        title: 'Capital akshar',
        focus: 'capitalisation',
        instruction:
          'Har proper noun, har vaakya ka pehla akshar. Passage mein jaisa hai bilkul waisa.',
        rule:
          'Chhote ki jagah capital ya capital ki jagah chhota = AADHI mistake (0.5). Hindi mein laagu nahi.',
        trap:
          'Is drill mein 14 capital akshar hain. Log aam taur par 3-4 chhod dete hain — beech ke shabdon mein.',
        sampleText:
          'The Reserve Bank of India, in consultation with the Ministry of Finance, issued the Master Circular on Priority Sector Lending in New Delhi on Monday.',
        warmupText: 'The Reserve Bank of India',
        durationSec: 150,
        minAccuracy: 96,
        targetWpm: 28,
        xpReward: 35,
        drillType: 'sentences',
        psychTip:
          'Speed badhte hi Shift chhoot jaata hai. Yahan speed se zyada capital par dhyaan dein.',
      }),
      lesson({
        id: 's3-punctuation',
        title: 'Chinh — comma, full stop, semicolon',
        focus: 'punctuation',
        instruction:
          'Har chinh wahi, waisa hi. Ek bhi chhoota ya extra laga to aadhi mistake.',
        rule:
          'Chinh chhootna, extra lagana ya galat jagah lagana = AADHI mistake (0.5) har baar.',
        trap:
          'Is vaakya mein 19 chinh hain, semicolon aur colon sameth. Semicolon sabse zyada chhootta hai.',
        sampleText:
          'Under section 3(1), the following persons are eligible: officers of Group "A"; employees with five years\' service; and, subject to approval, contractual staff — provided they apply before 31.03.2026.',
        warmupText: ', . ; : ( ) " \' -',
        durationSec: 180,
        minAccuracy: 96,
        targetWpm: 26,
        xpReward: 35,
        drillType: 'sentences',
        psychTip:
          'Chinh par ungli slow ho jaati hai — theek hai. Ek chhoota chinh ek aadhi mistake hai.',
      }),
      lesson({
        id: 's3-spacing',
        title: 'Space — ek, hamesha ek',
        focus: 'spacing',
        instruction:
          'Har shabd ke beech thik ek space. Chinh ke baad bhi ek. Shabd ke beech mein space bilkul nahi.',
        rule:
          'Shabdon ke beech space na hona ("Ihope"), ya shabd ke andar extra space ("I h ave") = AADHI mistake.',
        trap:
          'Full stop ke baad do space dabana sabse aam aadat hai — typewriter zamane se. Yahan har baar aadhi mistake.',
        sampleText:
          'He said that the policy would be reviewed. The committee met on Tuesday. It submitted its report. The Ministry accepted the recommendations. Work began immediately.',
        warmupText: 'one two three four',
        durationSec: 150,
        minAccuracy: 97,
        targetWpm: 30,
        xpReward: 35,
        drillType: 'sentences',
        psychTip:
          'Angootha ek baar. Purani typing class mein do space sikhaya jaata tha — SSC mein wo galat hai.',
      }),
      lesson({
        id: 's3-figures',
        title: 'Ank aur aankde',
        focus: 'figures',
        instruction:
          'Har number, har percentage, har taareekh bilkul waisi. Ek ank chhoota to poori mistake.',
        rule:
          'Koi bhi shabd, ank ya aankda chhod dena = POORI mistake (1). Yeh sabse mehngi galti hai.',
        trap:
          'Is passage mein 16 alag ank hain. Number type karte waqt log keyboard dekh lete hain aur agla shabd chhod dete hain.',
        sampleText:
          'The budget for 2025-26 allocated Rs. 1,48,000 crore, an increase of 12.5% over the revised estimate of Rs. 1,31,500 crore for 2024-25, covering 28 States and 8 Union Territories.',
        warmupText: '2026 12.5% 1,48,000',
        durationSec: 180,
        minAccuracy: 97,
        targetWpm: 24,
        xpReward: 40,
        drillType: 'sentences',
        psychTip:
          'Number aate hi speed 30% girayein. Ek ank ki galti poori mistake hai — risk mat lein.',
      }),
      lesson({
        id: 's3-paragraph',
        title: 'Paragraph — Tab, space nahi',
        focus: 'paragraph',
        instruction:
          'Naya paragraph shuru karte waqt Tab key dabayein. Space bar se indent karna galat hai.',
        rule:
          'Paragraph ke shuru mein Tab ki jagah manual space = AADHI mistake.',
        trap:
          'Is drill mein teen paragraph hain. Har ek Tab se shuru hona chahiye.',
        sampleText:
          'The scheme was launched to support small farmers.\n\tIt provides direct income support to eligible beneficiaries.\n\tThe amount is transferred in three equal instalments every year.',
        warmupText: 'Tab dabayein, phir likhein',
        durationSec: 150,
        minAccuracy: 95,
        targetWpm: 26,
        xpReward: 35,
        drillType: 'passage',
        psychTip:
          'Tab ek baar. Chaar space nahi. Yeh chhoti baat har paragraph par aadhi mistake bachati hai.',
      }),
      lesson({
        id: 's3-transposition',
        title: 'Shabdon ka kram',
        focus: 'transposition',
        instruction:
          'Shabd usi kram mein jis kram mein passage mein hain. Aage-peeche karna bhi galti hai.',
        rule:
          'Shabdon ka kram badalna ("hope I" jagah "I hope") = AADHI mistake.',
        trap:
          'Jab aap aage padhte hain aur peeche type karte hain, dimaag shabd swap kar deta hai. Yahan wahi hota hai.',
        sampleText:
          'It is hereby notified that the said order shall come into force with effect from the date on which it is published in the Official Gazette of India.',
        warmupText: 'It is hereby notified',
        durationSec: 150,
        minAccuracy: 96,
        targetWpm: 28,
        xpReward: 35,
        drillType: 'sentences',
        psychTip:
          'Ek-do shabd aage padhein, us se zyada nahi. Zyada aage padhoge to kram gadbada jaayega.',
      }),
      lesson({
        id: 's3-spelling',
        title: 'Spelling — poori mistake',
        focus: 'spelling',
        instruction:
          'Lambe sarkari shabd sahi spelling ke saath. Ek akshar galat, poori mistake.',
        rule:
          'Spelling ki galti (akshar dohrana, chhodna ya badalna) = POORI mistake (1), aadhi nahi.',
        trap:
          '"accommodation", "recommendation", "committee" — double letters wale shabd sabse zyada galat hote hain.',
        sampleText:
          'The committee recommended immediate accommodation for the personnel. The recommendation was accepted and the necessary arrangements were made accordingly.',
        warmupText: 'committee recommendation accommodation',
        durationSec: 150,
        minAccuracy: 97,
        targetWpm: 26,
        xpReward: 40,
        drillType: 'words',
        psychTip:
          'Double letter wale shabd dheere type karein. Spelling aadhi nahi, POORI mistake hai.',
      }),
      lesson({
        id: 's3-gauntlet',
        title: 'Half-mistake gauntlet',
        focus: 'omission',
        instruction:
          'Is passage mein har tarah ka jaal hai — capital, chinh, space, ank, paragraph, kram. Sab ek saath.',
        rule:
          'Kul galti = poori mistakes + (aadhi mistakes ÷ 2). Error % = (kul galti ÷ key depressions) × 100.',
        trap:
          'Yahan ek saath sab kuch hai. Pehli baar mein 95% se upar aana mushkil hai — yahi asli exam hai.',
        sampleText:
          'The Union Cabinet, chaired by the Prime Minister, approved the proposal on 14.02.2026.\n\tUnder the revised scheme, Rs. 2,340 crore will be released in two instalments; the first instalment (60%) is due by 30th June, and the balance thereafter.\n\tState Governments must submit utilisation certificates within 90 days, failing which further releases shall be withheld.',
        warmupText: 'The Union Cabinet approved',
        durationSec: 240,
        minAccuracy: 95,
        targetWpm: 28,
        xpReward: 60,
        drillType: 'passage',
        psychTip:
          'Yeh lesson jaan bujh kar mushkil hai. Yahan ki har galti exam mein bachi hui mistake hai.',
      }),
    ],
  },

  /* ══════════════════════ STAGE 4 — EXAM CONDITIONS ═══════════════════════ */
  {
    id: 4,
    stage: 4,
    name: 'Exam Jaisi Halat',
    subtitle: 'Jo cheezein asli exam cheen leta hai',
    description:
      'Asli TCS-iON interface mein word highlight nahi hota, auto-scroll nahi hota. Yeh stage wahi haalat banata hai.',
    icon: 'ShieldAlert',
    lessons: [
      lesson({
        id: 's4-no-highlight',
        title: 'Bina highlight ke — apni jagah khud yaad rakhein',
        instruction:
          'Ab passage mein aapka current shabd highlight nahi hoga. Asli exam mein bhi nahi hota.',
        rule:
          'Asli interface mein na word highlight hai, na error highlight, na auto-scroll. Jagah aapko khud yaad rakhni hai.',
        hidePositionHighlight: true,
        sampleText:
          'Digital governance has changed the way citizens interact with the administration. Services that once required a visit to a government office are now available online. This shift has reduced both cost and delay for the common citizen.',
        warmupText: 'Digital governance has changed',
        durationSec: 180,
        minAccuracy: 94,
        targetWpm: 30,
        xpReward: 40,
        drillType: 'passage',
        psychTip:
          'Ungli screen par mat rakhein. Aankh se line pakadna seekhein — exam mein yahi kaam aayega.',
      }),
      lesson({
        id: 's4-no-backspace',
        title: 'Bina backspace ke',
        instruction:
          'Backspace band hai. Jo type ho gaya, ho gaya. Pehli baar mein sahi likhna hi ekmatra rasta hai.',
        rule:
          'Kuch exam interface mein backspace band hota hai. Aur jahan chaalu hai, wahan bhi har correction waqt kha jaata hai.',
        noBackspace: true,
        hidePositionHighlight: true,
        sampleText:
          'The National Education Policy seeks to make learning more flexible and multidisciplinary. It emphasises critical thinking over rote memorisation and gives students greater choice in subjects.',
        warmupText: 'The National Education Policy',
        durationSec: 180,
        minAccuracy: 93,
        targetWpm: 28,
        xpReward: 45,
        drillType: 'passage',
        psychTip:
          'Galti ho jaaye to ruko mat. Aage badho. Ek galti do ban jaati hai jab aap ghabra jaate ho.',
      }),
      lesson({
        id: 's4-endurance-5',
        title: 'Sahansheelta — 5 minute',
        instruction:
          'Paanch minute lagatar. Speed nahi, sthirta (consistency) dekhi jaayegi.',
        rule:
          'Log pehle 2 minute tez chalte hain aur baaki mein girte hain. Exam 10-15 minute ka hai.',
        hidePositionHighlight: true,
        sampleText:
          'India has made significant progress in expanding access to healthcare over the past decade. The Ayushman Bharat scheme provides health cover to crores of families across the country. Primary health centres have been upgraded, and the number of medical colleges has increased substantially. Despite this progress, challenges remain in rural areas where the shortage of trained personnel continues to affect service delivery. Sustained investment in medical education and public health infrastructure will be necessary to address these gaps in the coming years.',
        warmupText: 'India has made significant progress',
        durationSec: 300,
        minAccuracy: 94,
        targetWpm: 30,
        xpReward: 50,
        drillType: 'passage',
        psychTip:
          'Shuru mein tez mat bhagein. Ek hi raftaar rakhein — jeet aakhri teen minute mein hoti hai.',
      }),
      lesson({
        id: 's4-endurance-10',
        title: 'Sahansheelta — 10 minute (CHSL ki poori lambai)',
        instruction:
          'Poore das minute. Yeh CHSL typing test ki asli lambai hai.',
        rule:
          'CHSL Typing Test: 10 minute, 35 WPM English ya 30 WPM Hindi.',
        hidePositionHighlight: true,
        sampleText:
          'The Constitution of India is the longest written constitution of any sovereign country in the world. It lays down the framework defining fundamental political principles, establishes the structure, procedures, powers and duties of government institutions, and sets out fundamental rights, directive principles and the duties of citizens. It was adopted by the Constituent Assembly on 26 November 1949 and came into effect on 26 January 1950. The document declares India a sovereign, socialist, secular and democratic republic, assuring its citizens justice, equality and liberty. Over the decades it has been amended more than a hundred times to meet the changing needs of a growing nation, yet its basic structure has been held by the Supreme Court to be beyond the amending power of Parliament. This doctrine, established in a landmark judgment, remains one of the most significant contributions of the Indian judiciary to constitutional law.',
        warmupText: 'The Constitution of India',
        durationSec: 600,
        minAccuracy: 93,
        targetWpm: 32,
        xpReward: 80,
        drillType: 'passage',
        psychTip:
          'Saatvein minute mein dimaag bhatakta hai. Us waqt saans lein aur raftaar pakde rakhein.',
      }),
      lesson({
        id: 's4-recovery',
        title: 'Galti ke baad sambhalna',
        instruction:
          'Is passage mein mushkil shabd jaan bujh kar rakhe hain. Maqsad hai — galti ke baad rukna nahi.',
        rule:
          'Ek galti par ghabrakar rukna aam taur par 3-4 aur galtiyaan paida karta hai.',
        noBackspace: true,
        hidePositionHighlight: true,
        sampleText:
          'The Comptroller and Auditor-General submitted its report on the implementation of the centrally sponsored scheme, highlighting irregularities in the utilisation of Rs. 4,72,000 crore across 17 States during 2023-24.',
        warmupText: 'Comptroller and Auditor-General',
        durationSec: 180,
        minAccuracy: 92,
        targetWpm: 28,
        xpReward: 45,
        drillType: 'passage',
        psychTip:
          'Galti hui? Aage badho. Peeche mat dekho. Exam mein ek mistake se test nahi jaata — ghabrahat se jaata hai.',
      }),
    ],
  },

  /* ══════════════════════ STAGE 5 — YOUR POST ═════════════════════════════ */
  {
    id: 5,
    stage: 5,
    name: 'Aapki Post',
    subtitle: 'Apne asli bar par mock test',
    description:
      'Har post ka alag speed aur alag error cap hai. Yahan aapki hi post ke hisaab se jaanch hoti hai.',
    icon: 'Award',
    lessons: [
      lesson({
        id: 's5-mock-ldc',
        title: 'LDC / JSA mock — 35 WPM, 7% cap',
        instruction:
          'Poora 10 minute ka CHSL Typing Test. UR ke liye 7% se kam error chahiye.',
        rule: 'LDC/JSA: 35 WPM English, 10 minute. Error cap 7% (UR), 10% (OBC/EWS/SC/ST).',
        hidePositionHighlight: true,
        sampleText:
          'Financial inclusion has been a central objective of economic policy in India. The opening of bank accounts for previously unbanked households has brought millions of citizens into the formal financial system. Direct benefit transfers now reach beneficiaries without intermediaries, reducing leakage and delay. Digital payment systems have grown rapidly, with transactions rising every year. Small merchants in towns and villages now accept payments electronically, a change that would have seemed unlikely a decade ago. The next challenge is to convert access into meaningful usage, ensuring that account holders also gain access to credit, insurance and pension products suited to their needs.',
        warmupText: 'Financial inclusion has been',
        durationSec: 600,
        minAccuracy: 93,
        targetWpm: 35,
        xpReward: 100,
        drillType: 'exam',
        psychTip:
          'Yeh asli lambai aur asli bar hai. Yahan pass ho gaye to exam mein bhi honge.',
      }),
      lesson({
        id: 's5-mock-dest',
        title: 'DEST mock — 8,000 KDPH, 15 minute',
        instruction:
          'Poora 15 minute ka DEST. Lagbhag 2,000 key depressions sahi type karne hain.',
        rule:
          'DEST: 8,000 key depressions per hour, 15 minute, 2000-2200 KD ka passage. English only.',
        hidePositionHighlight: true,
        sampleText:
          'Urbanisation in India is proceeding at a pace that will reshape the country over the coming decades. Cities generate a large share of national output and attract migrants seeking employment and better services. This growth places pressure on housing, transport, water supply and waste management. Planned development, supported by adequate municipal finance, is essential if cities are to remain liveable. The Smart Cities Mission sought to demonstrate how technology and better governance could improve urban services. Its lessons are now being applied more widely. Municipal bodies are being encouraged to strengthen their own revenue base through property tax reform and user charges, reducing dependence on transfers from higher levels of government. At the same time, attention is turning to smaller towns, where the majority of future urban growth is expected to occur and where planning capacity is weakest.',
        warmupText: 'Urbanisation in India',
        durationSec: 900,
        minAccuracy: 90,
        targetWpm: 27,
        xpReward: 120,
        drillType: 'exam',
        psychTip:
          'Pandrah minute lambe lagte hain. Raftaar ek rakhein — DEST mein sthirta hi jeet hai.',
      }),
      lesson({
        id: 's5-mock-cpt',
        title: 'CPT post mock — 5% cap (ASO, Inspector)',
        instruction:
          'Wahi 15 minute, par error cap sirf 5%. ASO aur Inspector ke liye yahi bar hai.',
        rule:
          'CPT post (ASO CSS/MEA/AFHQ, Inspector CBIC): error cap 5% (UR), 7% (OBC/EWS/SC/ST), 10% (PwBD).',
        noBackspace: false,
        hidePositionHighlight: true,
        sampleText:
          'The doctrine of separation of powers, while not expressly stated in the Constitution of India, is implicit in its scheme. The legislature makes the law, the executive implements it, and the judiciary interprets it and adjudicates disputes. Each organ is expected to function within its own sphere without encroaching upon the domain of the others. In practice, a rigid separation is neither possible nor desirable in a parliamentary system, where the executive is drawn from and remains accountable to the legislature. What the Constitution establishes instead is a system of checks and balances. Judicial review permits the courts to examine whether legislative and executive action conforms to constitutional limits, and this power has been held to form part of the basic structure of the Constitution.',
        warmupText: 'The doctrine of separation of powers',
        durationSec: 900,
        minAccuracy: 95,
        targetWpm: 30,
        xpReward: 150,
        drillType: 'exam',
        psychTip:
          '5% cap ka matlab hai lagbhag 20 se kam kul galti. Speed se zyada shuddhata (accuracy).',
      }),
    ],
  },
];

/* -------------------------------------------------------------------------- */
/*  Derived helpers                                                           */
/* -------------------------------------------------------------------------- */

export interface FlatLesson extends Lesson {
  levelId: number;
  levelName: string;
  stage: number;
  index: number;
}

export function getFlatLessons(): FlatLesson[] {
  const out: FlatLesson[] = [];
  let index = 0;
  for (const level of LEVELS) {
    for (const l of level.lessons) {
      out.push({
        ...l,
        levelId: level.id,
        levelName: level.name,
        stage: level.stage,
        index: index++,
      });
    }
  }
  return out;
}

export function getLessonById(id: string): FlatLesson | undefined {
  return getFlatLessons().find((l) => l.id === id);
}

export function getNextLessonId(currentId: string): string | null {
  const flat = getFlatLessons();
  const i = flat.findIndex((l) => l.id === currentId);
  if (i === -1 || i === flat.length - 1) return null;
  return flat[i + 1].id;
}

/** Every lesson is open. Gating a struggling learner out of the drill that
 *  would help them is the fastest way to lose them; the recommended next
 *  lesson does the sequencing instead. */
export function isLessonUnlocked(
  _lessonId: string,
  _progress: Record<string, any>
): boolean {
  return true;
}

export const LEVEL_NAMES = [
  'Rookie',
  'Novice',
  'Learner',
  'Typist',
  'Operator',
  'Clerk',
  'Assistant',
  'Officer',
  'Expert',
  'Master',
] as const;

export function getTotalXp(): number {
  return LEVELS.reduce(
    (sum, level) => sum + level.lessons.reduce((s, l) => s + l.xpReward, 0),
    0
  );
}

function xpThreshold(index: number): number {
  // Quadratic curve: early ranks come fast, later ones take real work.
  return index * index * 100;
}

export function getLevelIndex(xp: number): number {
  let i = 0;
  while (i + 1 < LEVEL_NAMES.length && xp >= xpThreshold(i + 1)) i++;
  return i;
}

export function getLevelName(xp: number): string {
  return LEVEL_NAMES[getLevelIndex(xp)];
}

export function getLevelProgress(xp: number): {
  current: string;
  next: string | null;
  currentXp: number;
  nextXp: number;
  progress: number;
} {
  const i = getLevelIndex(xp);
  const currentXp = xpThreshold(i);
  const isLast = i === LEVEL_NAMES.length - 1;
  const nextXp = isLast ? currentXp : xpThreshold(i + 1);
  return {
    current: LEVEL_NAMES[i],
    next: isLast ? null : LEVEL_NAMES[i + 1],
    currentXp,
    nextXp,
    progress: isLast
      ? 100
      : Math.min(100, ((xp - currentXp) / (nextXp - currentXp)) * 100),
  };
}

export default LEVELS;
