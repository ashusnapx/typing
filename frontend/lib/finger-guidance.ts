import { fingerFor } from '@/components/learn/hand-guide';
import { FINGER_NAMES, HAND, type FingerZone } from '@/components/learn/keyboard-layout';

/**
 * The coach speaks the language the rest of the app speaks.
 *
 * Every lesson instruction, rule and tip in the curriculum is Hinglish,
 * because that is what this audience reads. A coach explaining those same
 * lessons in English was the one voice in the product talking past the person
 * it was built for.
 */
export type CoachLang = 'en' | 'hi';

/** Finger names as a Hindi speaker would say them. */
const FINGER_NAMES_HI: Record<FingerZone, string> = {
  lp: 'Baayan chhoti ungli',
  lr: 'Baayan ring ungli',
  lm: 'Baayan middle ungli',
  li: 'Baayan index ungli',
  ri: 'Daayan index ungli',
  rm: 'Daayan middle ungli',
  rr: 'Daayan ring ungli',
  rp: 'Daayan chhoti ungli',
  thumb: 'Angootha',
};

/**
 * What to say about a key: which finger, which hand, and how it gets there.
 *
 * Pure, and shared. The strip on screen and the voice in the learner's ear
 * have to agree about every key, and the surest way to make two things agree
 * is to have them ask the same function.
 */

/** The key each finger returns to between reaches. */
export const HOME_KEY: Record<Exclude<FingerZone, 'thumb'>, string> = {
  lp: 'A',
  lr: 'S',
  lm: 'D',
  li: 'F',
  ri: 'J',
  rm: 'K',
  rr: 'L',
  rp: ';',
};

/** Which row a key sits on, so guidance can say "up" or "down". */
const ROW_OF: Record<string, 'number' | 'top' | 'home' | 'bottom'> = {};
for (const k of '1234567890') ROW_OF[k] = 'number';
for (const k of 'qwertyuiop[]\\') ROW_OF[k] = 'top';
for (const k of "asdfghjkl;'") ROW_OF[k] = 'home';
for (const k of 'zxcvbnm,./') ROW_OF[k] = 'bottom';

/**
 * The shifted characters and the key actually pressed for each.
 *
 * Someone typing an exclamation mark is not hunting for a "!" key — there
 * isn't one. They have to be told it is Shift and the 1.
 */
const SHIFTED: Record<string, string> = {
  '!': '1', '@': '2', '#': '3', $: '4', '%': '5',
  '^': '6', '&': '7', '*': '8', '(': '9', ')': '0',
  _: '-', '+': '=', '{': '[', '}': ']', '|': '\\',
  ':': ';', '"': "'", '<': ',', '>': '.', '?': '/',
  '~': '`',
};

/** The base key for a character, and whether Shift is held to reach it. */
export function resolve(ch: string): { base: string; shift: boolean } {
  if (ch >= 'A' && ch <= 'Z') return { base: ch.toLowerCase(), shift: true };
  if (ch in SHIFTED) return { base: SHIFTED[ch], shift: true };
  return { base: ch, shift: false };
}

/**
 * Shift is held by the hand that is *not* typing the letter.
 *
 * This is the detail self-taught typists almost always get wrong — they hold
 * the near Shift with the same hand, which drags it off home row and costs the
 * next two keystrokes.
 */
export function shiftHand(zone: FingerZone): 'left' | 'right' {
  return HAND[zone] === 'left' ? 'right' : 'left';
}

/** How the finger gets there from where it rests. */
export function reachHint(
  base: string,
  zone: Exclude<FingerZone, 'thumb'>,
  lang: CoachLang = 'en',
): string {
  const home = HOME_KEY[zone];
  const hi = lang === 'hi';

  if (base.toUpperCase() === home) {
    return hi ? `Yeh pehle se ${home} par hi hai.` : `It is already resting on ${home}.`;
  }

  const row = ROW_OF[base];
  if (row === ROW_OF[home.toLowerCase()]) {
    return hi
      ? `${home} se bagal mein khiskaayein, phir wapas ${home} par.`
      : `Slide sideways from ${home}, then back to ${home}.`;
  }
  if (row === 'top' || row === 'number') {
    return hi
      ? `${home} se upar jaayein, phir seedha wapas ${home} par.`
      : `Reach up from ${home}, then straight back to ${home}.`;
  }
  if (row === 'bottom') {
    return hi
      ? `${home} se neeche jaayein, phir seedha wapas ${home} par.`
      : `Reach down from ${home}, then straight back to ${home}.`;
  }
  return hi ? `Baad mein ${home} par wapas aayein.` : `Come back to ${home} afterwards.`;
}

export interface KeyGuidance {
  zone: Exclude<FingerZone, 'thumb'> | null;
  /** "Left Middle", or null for the space bar. */
  fingerName: string | null;
  /** The key to press, with Shift resolved: "E", "1" for "!", "Space". */
  base: string;
  shift: boolean;
  /** The full sentence a teacher would say. */
  sentence: string;
}

/** Everything worth saying about one character. */
export function guidanceFor(ch: string, lang: CoachLang = 'en'): KeyGuidance {
  const hi = lang === 'hi';

  if (ch === ' ') {
    return {
      zone: null,
      fingerName: hi ? 'Angootha' : 'Thumb',
      base: hi ? 'Space' : 'Space',
      shift: false,
      sentence: hi
        ? 'Space bar ko jo angootha paas ho usse dabaayein. Baaki ungliyaan home row par hi rahein.'
        : 'Tap the space bar with whichever thumb is closer. The other fingers stay on the home row.',
    };
  }

  const { base, shift } = resolve(ch);
  const zone = fingerFor(base);

  if (!zone || zone === 'thumb') {
    return {
      zone: null,
      fingerName: null,
      base: ch,
      shift,
      sentence: hi ? `${ch} type karein.` : `Type ${ch}.`,
    };
  }

  const name = hi ? FINGER_NAMES_HI[zone] : FINGER_NAMES[zone];
  const upper = base.toUpperCase();

  let sentence: string;
  if (shift) {
    const shiftSide = shiftHand(zone) === 'left' ? (hi ? 'baayein' : 'left') : hi ? 'daayein' : 'right';
    sentence = hi
      ? `Shift ko ${shiftSide} chhoti ungli se dabaayein, phir ${upper} ko ${name.toLowerCase()} se. ${reachHint(base, zone, lang)}`
      : `Hold Shift with your ${shiftSide} little finger, then press ${upper} with the ${FINGER_NAMES[zone].toLowerCase()}. ${reachHint(base, zone, lang)}`;
  } else if (hi) {
    sentence = `${name}. ${reachHint(base, zone, lang)}`;
  } else {
    const hand = HAND[zone] === 'left' ? 'Left' : 'Right';
    const bare = FINGER_NAMES[zone].replace(/^(Left|Right) /, '').toLowerCase();
    sentence = `${hand} hand, ${bare} finger. ${reachHint(base, zone, lang)}`;
  }

  return { zone, fingerName: name, base: upper, shift, sentence };
}
