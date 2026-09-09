import type { MistakeKind } from '@/lib/exam-diagnosis';

/**
 * Every way an SSC typing mistake can happen, with a worked example.
 *
 * A rule without an example is unreadable to someone who has just sat down at
 * a computer. "Transposition — words typed in wrong order" means nothing;
 * "passage says `I hope` and you typed `hope I` — half a mistake" is
 * immediately obvious.
 *
 * These are not illustrations written beside the marking. They ARE the
 * marking: marking-scheme-examples.test.ts runs every row through the same
 * `diagnose()` the exam uses and asserts it produces the kind and cost claimed
 * here. If the engine's behaviour ever drifts from the page that explains it,
 * the test fails rather than the candidate being misled.
 */

export interface MistakeExample {
  /** What the printed passage contains. */
  passage: string;
  /** What the candidate typed. */
  typed: string;
  /** The kind `diagnose()` must classify this as. */
  kind: MistakeKind;
  /** Marks it costs. Asserted against the engine. */
  cost: number;
  /** Why, in one line. */
  why: { en: string; hi: string };
}

export interface MistakeGroup {
  kind: MistakeKind;
  weight: 'full' | 'half';
  title: { en: string; hi: string };
  /** What this category is, before any example. */
  meaning: { en: string; hi: string };
  /** The habit that prevents it. */
  fix: { en: string; hi: string };
  lessonId: string;
  examples: MistakeExample[];
}

/* -------------------------------------------------------------------------- */

export const MISTAKE_GROUPS: MistakeGroup[] = [
  /* ---------------------------------------------------------- half mistakes */
  {
    kind: 'capitalisation',
    weight: 'half',
    lessonId: 's3-capitals',
    title: { en: 'Capital letters', hi: 'Capital akshar' },
    meaning: {
      en: 'A capital where the passage has a small letter, or a small letter where the passage has a capital.',
      hi: 'Jahan passage mein chhota akshar hai wahan capital, ya jahan capital hai wahan chhota.',
    },
    fix: {
      en: 'Use Shift for capitals. Never leave Caps Lock on — it flips every letter and turns one mistake into fifty.',
      hi: 'Capital ke liye Shift dabayein. Caps Lock kabhi on mat rakhein — woh har akshar ulta kar deta hai.',
    },
    examples: [
      {
        passage: 'The Reserve Bank',
        typed: 'the Reserve Bank',
        kind: 'capitalisation',
        cost: 0.5,
        why: {
          en: 'Sentence starts with a capital in the passage.',
          hi: 'Passage mein vaakya capital se shuru hota hai.',
        },
      },
      {
        passage: 'the reserve bank',
        typed: 'the Reserve bank',
        kind: 'capitalisation',
        cost: 0.5,
        why: {
          en: 'An extra capital is a mistake too, not just a missing one.',
          hi: 'Extra capital bhi galti hai, sirf chhoot jaana nahi.',
        },
      },
      {
        passage: 'india is growing',
        typed: 'INDIA is growing',
        kind: 'capitalisation',
        cost: 0.5,
        why: {
          en: 'A whole word in capitals is still one word wrong — half a mistake.',
          hi: 'Poora shabd capital mein ho tab bhi ek hi shabd galat — aadhi galti.',
        },
      },
    ],
  },
  {
    kind: 'spacing',
    weight: 'half',
    lessonId: 's3-spacing',
    title: { en: 'Spacing', hi: 'Space — ek, hamesha ek' },
    meaning: {
      en: 'Two words run together, or one word split by a space in the middle.',
      hi: 'Do shabd jud gaye, ya ek shabd ke beech space aa gaya.',
    },
    fix: {
      en: 'Exactly one space between words and after every punctuation mark. Never two.',
      hi: 'Shabdon ke beech aur har chinh ke baad exactly ek space. Do kabhi nahi.',
    },
    examples: [
      {
        passage: 'I hope so',
        typed: 'Ihope so',
        kind: 'spacing',
        cost: 0.5,
        why: {
          en: 'Two words joined — the classic missed space.',
          hi: 'Do shabd jud gaye — sabse aam galti.',
        },
      },
      {
        passage: 'I have it',
        typed: 'I h ave it',
        kind: 'spacing',
        cost: 0.5,
        why: {
          en: 'One word split in two by a stray space.',
          hi: 'Ek shabd beech mein space se do tukdon mein bat gaya.',
        },
      },
    ],
  },
  {
    kind: 'punctuation',
    weight: 'half',
    lessonId: 's3-punctuation',
    title: { en: 'Punctuation', hi: 'Chinh — comma, full stop' },
    meaning: {
      en: 'A comma, full stop, semicolon or hyphen missing, added, or replaced by another.',
      hi: 'Comma, full stop, semicolon ya hyphen chhoot gaya, extra lag gaya, ya galat lag gaya.',
    },
    fix: {
      en: 'Punctuation is marked exactly like letters. Read the mark, do not assume it.',
      hi: 'Chinh bhi akshar ki tarah check hota hai. Dekh kar type karein, andaaza mat lagayein.',
    },
    examples: [
      {
        passage: 'growth, and jobs',
        typed: 'growth and jobs',
        kind: 'punctuation',
        cost: 0.5,
        why: { en: 'Comma dropped.', hi: 'Comma chhoot gaya.' },
      },
      {
        passage: 'growth and jobs',
        typed: 'growth, and jobs',
        kind: 'punctuation',
        cost: 0.5,
        why: { en: 'Comma added where there was none.', hi: 'Extra comma laga diya.' },
      },
      {
        passage: 'ended.',
        typed: 'ended,',
        kind: 'punctuation',
        cost: 0.5,
        why: {
          en: 'Wrong mark — a comma instead of a full stop.',
          hi: 'Galat chinh — full stop ki jagah comma.',
        },
      },
    ],
  },
  {
    kind: 'wordOrder',
    weight: 'half',
    lessonId: 's3-transposition',
    title: { en: 'Word order', hi: 'Shabdon ka kram' },
    meaning: {
      en: 'Two neighbouring words typed the wrong way round.',
      hi: 'Do paas-paas ke shabd ulte kram mein type ho gaye.',
    },
    fix: {
      en: 'It happens when your eyes run ahead of your hands. Stay one word ahead, not one line.',
      hi: 'Yeh tab hota hai jab aankhein haathon se aage nikal jaati hain. Ek shabd aage rahein, ek line nahi.',
    },
    examples: [
      {
        passage: 'I hope you',
        typed: 'hope I you',
        kind: 'wordOrder',
        cost: 0.5,
        why: {
          en: 'Both words are correct — only the order is wrong, so it is half a mistake, not two.',
          hi: 'Dono shabd sahi hain — sirf kram galat, isliye aadhi galti, do nahi.',
        },
      },
    ],
  },

  /* ---------------------------------------------------------- full mistakes */
  {
    kind: 'spelling',
    weight: 'full',
    lessonId: 's3-spelling',
    title: { en: 'Spelling', hi: 'Spelling — poori galti' },
    meaning: {
      en: 'Any wrong, missing, extra or repeated letter inside a word.',
      hi: 'Shabd ke andar koi akshar galat, chhoota, extra ya do baar.',
    },
    fix: {
      en: 'The most expensive mistake on the list. Accuracy first — speed follows on its own.',
      hi: 'Sabse mehngi galti. Pehle accuracy — speed apne aap aa jaayegi.',
    },
    examples: [
      {
        passage: 'the government said',
        typed: 'the goverment said',
        kind: 'spelling',
        cost: 1,
        why: { en: 'A letter missing inside the word.', hi: 'Shabd ke andar ek akshar chhoot gaya.' },
      },
      {
        passage: 'committee',
        typed: 'commitee',
        kind: 'spelling',
        cost: 1,
        why: { en: 'A double letter typed once.', hi: 'Double akshar ek hi baar type hua.' },
      },
      {
        passage: 'nation',
        typed: 'natione',
        kind: 'spelling',
        cost: 1,
        why: { en: 'An extra letter added.', hi: 'Ek extra akshar lag gaya.' },
      },
    ],
  },
  {
    kind: 'figures',
    weight: 'full',
    lessonId: 's3-figures',
    title: { en: 'Numbers and figures', hi: 'Ank aur aankde' },
    meaning: {
      en: 'Any digit wrong, missing or extra in a number.',
      hi: 'Number mein koi ank galat, chhoota ya extra.',
    },
    fix: {
      en: 'Numbers carry no meaning to guess from, so nothing warns you. Slow down and read them twice.',
      hi: 'Number ka koi matlab nahi hota jisse galti pakdi jaaye. Dheere chalein, do baar padhein.',
    },
    examples: [
      {
        passage: 'in 2019 the',
        typed: 'in 2018 the',
        kind: 'figures',
        cost: 1,
        why: {
          en: 'One digit wrong is a full mistake — the same as a wrong word.',
          hi: 'Ek ank galat = poori galti, galat shabd jitni.',
        },
      },
      {
        passage: 'about 15000 crore',
        typed: 'about 1500 crore',
        kind: 'figures',
        cost: 1,
        why: { en: 'A digit dropped from a figure.', hi: 'Aankde se ek ank chhoot gaya.' },
      },
    ],
  },
  {
    kind: 'skipped',
    weight: 'full',
    lessonId: 's3-gauntlet',
    title: { en: 'Skipped word', hi: 'Shabd chhoot jaana' },
    meaning: {
      en: 'A word in the passage that you never typed.',
      hi: 'Passage ka koi shabd jo aapne type hi nahi kiya.',
    },
    fix: {
      en: 'Usually happens after a line break. Follow the line with your eyes, not your memory.',
      hi: 'Aksar line badalne par hota hai. Line ko aankhon se follow karein, yaad se nahi.',
    },
    examples: [
      {
        passage: 'the quick brown fox',
        typed: 'the quick fox',
        kind: 'skipped',
        cost: 1,
        why: {
          en: 'One word missed costs one mistake — not every word after it.',
          hi: 'Ek shabd chhootne par ek hi galti — uske baad ke sab shabd nahi.',
        },
      },
    ],
  },
  {
    kind: 'extra',
    weight: 'full',
    lessonId: 's3-gauntlet',
    title: { en: 'Extra word', hi: 'Extra shabd' },
    meaning: {
      en: 'A word you typed that is not in the passage — including a word typed twice.',
      hi: 'Aisa shabd jo passage mein hai hi nahi — ya wahi shabd do baar.',
    },
    fix: {
      en: 'Repeating a word ("the the") counts here. Re-read the last three words before continuing.',
      hi: 'Shabd do baar likhna ("the the") bhi isi mein aata hai. Aage badhne se pehle pichhle teen shabd dobara dekhein.',
    },
    examples: [
      {
        passage: 'the quick fox',
        typed: 'the quick brown fox',
        kind: 'extra',
        cost: 1,
        why: { en: 'A word that is not in the passage.', hi: 'Aisa shabd jo passage mein nahi tha.' },
      },
      {
        passage: 'the quick fox',
        typed: 'the the quick fox',
        kind: 'extra',
        cost: 1,
        why: { en: 'The same word typed twice.', hi: 'Wahi shabd do baar type ho gaya.' },
      },
    ],
  },
];

/* -------------------------------------------------------------------------- */

/**
 * Two mistakes in the same sentence, to show they simply add up.
 *
 * Candidates assume mistakes compound or cancel. They do neither — the totals
 * are plain addition, and half plus half is exactly one.
 */
export interface CombinationExample {
  passage: string;
  typed: string;
  /** The kinds the engine must find, in any order. */
  kinds: MistakeKind[];
  full: number;
  half: number;
  total: number;
  note: { en: string; hi: string };
}

export const COMBINATIONS: CombinationExample[] = [
  {
    passage: 'The bank said growth, would rise',
    typed: 'the bank said growth would rise',
    kinds: ['capitalisation', 'punctuation'],
    full: 0,
    half: 2,
    total: 1,
    note: {
      en: 'Two half mistakes make one whole mistake. This is the pair that catches most people.',
      hi: 'Do aadhi galtiyan milkar ek poori galti. Yahi jodi sabse zyada logon ko le doobti hai.',
    },
  },
  {
    passage: 'growth rose by 2019 percent',
    typed: 'growth rose by 2018 percant',
    kinds: ['figures', 'spelling'],
    full: 2,
    half: 0,
    total: 2,
    note: {
      en: 'Two full mistakes in one line — a wrong figure and a wrong spelling.',
      hi: 'Ek hi line mein do poori galtiyan — galat ank aur galat spelling.',
    },
  },
  {
    passage: 'The Reserve Bank of India said',
    typed: 'the Reserve Bank of India siad',
    kinds: ['capitalisation', 'spelling'],
    full: 1,
    half: 1,
    total: 1.5,
    note: {
      en: 'One full and one half: 1 + 0.5 = 1.5 mistakes.',
      hi: 'Ek poori aur ek aadhi: 1 + 0.5 = 1.5 galtiyan.',
    },
  },
];
