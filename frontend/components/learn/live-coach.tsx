'use client';

import { guidanceFor, type CoachLang } from '@/lib/finger-guidance';
import { FINGER_COLORS } from './keyboard-layout';
import type { CoachLine } from '@/hooks/use-coach';

/**
 * The coach, on screen.
 *
 * Two things at once, and they work differently on purpose. The key and the
 * finger are always there, because a learner glancing down mid-word needs the
 * answer without waiting for anyone to speak. The sentence underneath is the
 * teacher's voice, and it is only filled when there is something to say — a
 * new key, a repeated mistake, a good run, a pause that has gone on too long.
 *
 * When there is nothing to say it says nothing. A strip that reprints the same
 * instruction on every keystroke stops being read by about the twentieth one.
 */

export interface LiveCoachProps {
  /** The character the drill wants next. */
  expectedChar: string | null;
  /** What the coach has decided to say, if anything. */
  line: CoachLine | null;
  lang: CoachLang;
}

export function LiveCoach({ expectedChar, line, lang }: LiveCoachProps) {
  const g = expectedChar ? guidanceFor(expectedChar, lang) : null;
  const swatch = g?.zone ? FINGER_COLORS[g.zone] : FINGER_COLORS.thumb;

  const wrong = line?.tone === 'correct';
  const praise = line?.tone === 'praise';

  return (
    <div
      className={`flex min-h-[5.25rem] items-center gap-4 rounded-xl border-2 px-4 py-3 transition-colors ${
        wrong ? 'border-err/40 bg-err-bg' : praise ? 'border-ok/40 bg-ok-bg' : 'border-vast/15 bg-lumen'
      }`}
    >
      {/* The key, in the colour of the finger that owns it — the same colour it
          wears on the board below, so the two read as one instruction. */}
      <span
        key={expectedChar ?? 'none'}
        className="animate-rise flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border-2 border-vast text-lg font-bold"
        style={{ backgroundColor: swatch }}
        aria-hidden="true"
      >
        {expectedChar === ' ' ? '␣' : (expectedChar ?? '·')}
      </span>

      <span className="min-w-0 flex-1">
        <span className="eyebrow block">
          {g?.fingerName ?? (expectedChar ? (lang === 'hi' ? 'Type karein' : 'Type it') : lang === 'hi' ? 'Taiyaar' : 'Ready')}
        </span>

        {/* Politely empty when the coach has nothing to add. The row keeps its
            height either way, so the panel below never jumps. */}
        <span
          key={line?.id ?? 0}
          role="status"
          aria-live="polite"
          className="animate-rise mt-1 block text-[15px] leading-snug text-vast/75"
        >
          {line?.text ??
            (g
              ? g.sentence
              : lang === 'hi'
                ? 'Ungliyaan home row par — F aur J par ubhaar hain.'
                : 'Fingers on the home row — F and J have the bumps.')}
        </span>
      </span>
    </div>
  );
}
