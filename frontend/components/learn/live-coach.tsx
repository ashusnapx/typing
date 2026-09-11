'use client';

import { fingerFor } from './hand-guide';
import { FINGER_COLORS, FINGER_NAMES, HAND, type FingerZone } from './keyboard-layout';

/**
 * The instructor standing at your shoulder.
 *
 * The board already glowed the next key in its finger's colour, which tells a
 * learner *where* to go and never *how*. Someone who has not touched a
 * keyboard cannot read a glowing square as "left middle finger, reach up one
 * row, come back to D" — that sentence has to be said out loud, every
 * keystroke, until it is not needed any more.
 *
 * So this says it. Which finger, which hand, where it starts from, and what to
 * do about the mistake just made. It is deliberately the plainest language on
 * the page: a candidate reading it is mid-drill and has no attention to spare
 * for cleverness.
 */

/* -------------------------------------------------------------------------- */
/* What a finger rests on, and what it does to reach                          */
/* -------------------------------------------------------------------------- */

/** The key each finger returns to between reaches. */
const HOME_KEY: Record<Exclude<FingerZone, 'thumb'>, string> = {
  lp: 'A',
  lr: 'S',
  lm: 'D',
  li: 'F',
  ri: 'J',
  rm: 'K',
  rr: 'L',
  rp: ';',
};

/** Which row a key sits on, so the coach can say "up" or "down". */
const ROW_OF: Record<string, 'number' | 'top' | 'home' | 'bottom'> = {};
for (const k of '1234567890') ROW_OF[k] = 'number';
for (const k of 'qwertyuiop[]\\') ROW_OF[k] = 'top';
for (const k of "asdfghjkl;'") ROW_OF[k] = 'home';
for (const k of 'zxcvbnm,./') ROW_OF[k] = 'bottom';

/**
 * The shifted characters and the key you actually press for each.
 *
 * A learner typing an exclamation mark is not looking for a "!" key — there
 * isn't one. They need to be told it is Shift and the 1.
 */
const SHIFTED: Record<string, string> = {
  '!': '1', '@': '2', '#': '3', $: '4', '%': '5',
  '^': '6', '&': '7', '*': '8', '(': '9', ')': '0',
  _: '-', '+': '=', '{': '[', '}': ']', '|': '\\',
  ':': ';', '"': "'", '<': ',', '>': '.', '?': '/',
  '~': '`',
};

/** The base key for any character, and whether Shift is held to reach it. */
function resolve(ch: string): { base: string; shift: boolean } {
  if (ch >= 'A' && ch <= 'Z') return { base: ch.toLowerCase(), shift: true };
  if (ch in SHIFTED) return { base: SHIFTED[ch], shift: true };
  return { base: ch, shift: false };
}

/**
 * Shift is held by the hand that is *not* typing the letter.
 *
 * This is the detail self-taught typists almost always get wrong — they hold
 * the near Shift with the same hand, which drags that hand off home row and
 * costs the next two keystrokes.
 */
function shiftHand(zone: FingerZone): 'left' | 'right' {
  return HAND[zone] === 'left' ? 'right' : 'left';
}

/** How the finger gets there from where it rests. */
function reachHint(base: string, zone: Exclude<FingerZone, 'thumb'>): string {
  const home = HOME_KEY[zone];
  if (base.toUpperCase() === home) return `It is already resting on ${home}.`;

  const row = ROW_OF[base];
  const homeRow = ROW_OF[home.toLowerCase()];
  if (row === homeRow) return `Slide sideways from ${home}, then back to ${home}.`;
  if (row === 'top' || row === 'number') {
    return `Reach up from ${home}, then straight back to ${home}.`;
  }
  if (row === 'bottom') return `Reach down from ${home}, then straight back to ${home}.`;
  return `Come back to ${home} afterwards.`;
}

/* -------------------------------------------------------------------------- */

export interface LiveCoachProps {
  /** The character the drill wants next. */
  expectedChar: string | null;
  /** What the learner actually typed last, when it was wrong. */
  wrongChar?: string | null;
}

export function LiveCoach({ expectedChar, wrongChar }: LiveCoachProps) {
  if (!expectedChar) {
    return (
      <div className="flex min-h-[4.5rem] items-center justify-center rounded-xl border-2 border-vast/10 px-4 text-sm text-vast/50">
        Fingers on the home row — <strong className="mx-1">F</strong> and{' '}
        <strong className="mx-1">J</strong> have the bumps.
      </div>
    );
  }

  /* Space is the one key with no finger of its own: either thumb takes it, and
     saying "right thumb" to a left-handed learner is a correction they do not
     need. */
  if (expectedChar === ' ') {
    return (
      <Shell tone="neutral" swatch={FINGER_COLORS.thumb} finger="Thumb" keyLabel="Space">
        Tap the space bar with whichever thumb is closer. The other fingers stay
        on the home row.
      </Shell>
    );
  }

  const { base, shift } = resolve(expectedChar);
  const zone = fingerFor(base);

  if (!zone || zone === 'thumb') {
    return (
      <Shell tone="neutral" swatch={FINGER_COLORS.thumb} finger="—" keyLabel={expectedChar}>
        Type <strong>{expectedChar}</strong>.
      </Shell>
    );
  }

  const name = FINGER_NAMES[zone];
  const hand = HAND[zone] === 'left' ? 'Left' : 'Right';

  /* A wrong keystroke is the moment the learner is actually listening, so it
     gets the whole strip and names both fingers — the one they used and the
     one they should have. */
  if (wrongChar) {
    const wrongZone = fingerFor(resolve(wrongChar).base);
    return (
      <Shell
        tone="wrong"
        swatch={FINGER_COLORS[zone]}
        finger={name}
        keyLabel={expectedChar === ' ' ? 'Space' : expectedChar}
      >
        You pressed <strong>{wrongChar === ' ' ? 'space' : wrongChar}</strong>
        {wrongZone && wrongZone !== 'thumb' ? (
          <>
            {' '}
            — that is the {FINGER_NAMES[wrongZone].toLowerCase()}.
          </>
        ) : (
          '.'
        )}{' '}
        <strong>{expectedChar}</strong> is the {name.toLowerCase()}.{' '}
        {reachHint(base, zone)}
      </Shell>
    );
  }

  return (
    <Shell
      tone="normal"
      swatch={FINGER_COLORS[zone]}
      finger={name}
      keyLabel={expectedChar}
    >
      {shift ? (
        <>
          Hold <strong>Shift</strong> with your {shiftHand(zone)} little finger,
          then press <strong>{base.toUpperCase()}</strong> with the{' '}
          {name.toLowerCase()}. {reachHint(base, zone)}
        </>
      ) : (
        <>
          {hand} hand, {name.replace(/^(Left|Right) /, '').toLowerCase()} finger.{' '}
          {reachHint(base, zone)}
        </>
      )}
    </Shell>
  );
}

/* -------------------------------------------------------------------------- */

/** The strip itself. One shape, three tones, so nothing moves as it changes. */
function Shell({
  tone,
  swatch,
  finger,
  keyLabel,
  children,
}: {
  tone: 'normal' | 'wrong' | 'neutral';
  swatch: string;
  finger: string;
  keyLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex min-h-[4.5rem] items-center gap-4 rounded-xl border-2 px-4 py-3 transition-colors ${
        tone === 'wrong' ? 'border-err/40 bg-err-bg' : 'border-vast/15 bg-lumen'
      }`}
    >
      {/* The key, in the colour of the finger that owns it — the same colour it
          is wearing on the board below, so the two read as one instruction. */}
      <span
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border-2 border-vast text-lg font-bold"
        style={{ backgroundColor: swatch }}
        aria-hidden="true"
      >
        {keyLabel === ' ' ? '␣' : keyLabel}
      </span>

      <span className="min-w-0">
        <span className="eyebrow block">{finger}</span>
        <span className="mt-1 block text-[15px] leading-snug text-vast/75">
          {children}
        </span>
      </span>
    </div>
  );
}
