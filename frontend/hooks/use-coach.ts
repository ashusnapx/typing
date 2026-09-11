'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { KeystrokeEvent } from '@/types';
import { guidanceFor, type CoachLang } from '@/lib/finger-guidance';

/**
 * The person sitting beside the learner.
 *
 * The first version of this said the same sentence on every single keystroke.
 * That is not what someone teaching you does — it is what a label does. A
 * teacher watches, stays quiet while you are managing, and speaks when
 * something has actually happened: a key you have not met, a mistake you have
 * now made twice, a stretch you got right, a pause that has gone on long
 * enough to mean you are lost.
 *
 * So this is mostly silent. It holds what it has seen — which keys are new,
 * which ones you keep missing, how long the good run is — and produces a line
 * only when that state changes in a way worth remarking on. Silence is the
 * default and the point: guidance that never stops is noise, and noise is the
 * thing a learner tunes out first.
 *
 * It writes, it does not speak. This did read its lines aloud through the
 * browser's speech synthesis, and the voice turned out to be the problem
 * rather than the idea: those voices are flat and mechanical, and an English
 * one reading romanised Hindi made it worse. A synthetic voice mispronouncing
 * the instruction is further from a person beside you than plain text is.
 */

export type CoachTone = 'teach' | 'correct' | 'praise' | 'nudge' | 'quiet';

export interface CoachLine {
  /** Increments on every new line, so the view can animate a change. */
  id: number;
  tone: CoachTone;
  text: string;
}

/** How long a pause has to run before it means "stuck" rather than "thinking". */
const HESITATION_MS = 2600;

/** Runs of correct keys worth saying something about. */
const PRAISE_AT = [18, 45, 90, 160];

/* The rest of the product speaks Hinglish, so the coach does too. Language is
   shared with the marking scheme and the lesson videos through `tm-lang`, and
   defaults to Hinglish because that is who this is for. */
const LANG_KEY = 'tm-lang';

const PRAISE: Record<CoachLang, string[]> = {
  en: [
    'That is the rhythm. Keep the fingers home between keys.',
    'Good run — you are not looking down. That is the whole skill.',
    'Steady. Accuracy first, and the speed follows on its own.',
    'Nicely held. Same hands, same place, keep going.',
  ],
  hi: [
    'Yahi rhythm hai. Ungliyaan har key ke baad home row par wapas.',
    'Achha chal raha hai — aap neeche nahi dekh rahe. Yahi poora hunar hai.',
    'Shaandaar. Pehle shuddhta, speed apne aap aa jaayegi.',
    'Bahut sahi. Haath wahin rakhein, aise hi chalte rahein.',
  ],
};

const NUDGE: Record<CoachLang, string[]> = {
  en: [
    'Take your time. No rush here.',
    'Still there? Find the key, then press it.',
    'Slowly is fine. Right finger matters more than fast.',
  ],
  hi: [
    'Aaram se. Koi jaldi nahi hai.',
    'Rukiye mat — key dhoondhiye, phir dabaiye.',
    'Dheere chalna theek hai. Sahi ungli zyada zaroori hai, tez nahi.',
  ],
};

export interface UseCoachOptions {
  /** The character the drill wants next. */
  expectedChar: string | null;
  /** The engine's keystroke log, including the wrong keys it refused. */
  keystrokeEvents: KeystrokeEvent[];
  /** Only coach while the drill is actually running. */
  active: boolean;
}

export function useCoach({ expectedChar, keystrokeEvents, active }: UseCoachOptions) {
  const [line, setLine] = useState<CoachLine | null>(null);
  const [lang, setLang] = useState<CoachLang>('hi');

  /* Everything the coach remembers. Refs, not state: this changes on every
     keystroke and none of it should cause a render on its own — the drill is
     the thing that has to stay responsive. */
  const seen = useRef<Set<string>>(new Set());
  const misses = useRef<Map<string, number>>(new Map());
  const streak = useRef(0);
  const praised = useRef(0);
  const strokeCount = useRef(0);
  const lineId = useRef(0);
  const lastText = useRef('');
  const rotate = useRef(0);

  const say = useCallback((tone: CoachTone, text: string) => {
    /* Saying the same thing twice running is how a person sounds when they
       are not listening. */
    if (text === lastText.current) return;
    lastText.current = text;
    lineId.current += 1;
    setLine({ id: lineId.current, tone, text });
  }, []);

  /* ── Language ─────────────────────────────────────────────────────────── */

  useEffect(() => {
    try {
      const savedLang = window.localStorage.getItem(LANG_KEY);
      if (savedLang === 'en' || savedLang === 'hi') setLang(savedLang);
    } catch {
      /* Hinglish stands. */
    }
  }, []);

  /* ── Watching ─────────────────────────────────────────────────────────── */

  /* A key the learner has not met yet is worth introducing; one they have
     already typed is not worth repeating. */
  useEffect(() => {
    if (!active || !expectedChar) return;
    const k = expectedChar.toLowerCase();
    if (seen.current.has(k)) return;
    seen.current.add(k);
    const g = guidanceFor(expectedChar, lang);
    const what = expectedChar === ' ' ? (lang === 'hi' ? 'space bar' : 'the space bar') : g.base;
    say(
      'teach',
      lang === 'hi' ? `Naya akshar — ${what}. ${g.sentence}` : `New one — ${what}. ${g.sentence}`,
    );
  }, [expectedChar, active, lang, say]);

  /* Every keystroke, right or wrong. */
  useEffect(() => {
    if (!active) return;
    if (keystrokeEvents.length <= strokeCount.current) {
      strokeCount.current = keystrokeEvents.length;
      return;
    }
    strokeCount.current = keystrokeEvents.length;

    const last = keystrokeEvents[keystrokeEvents.length - 1];
    if (!last || last.is_backspace) return;

    if (last.is_error) {
      streak.current = 0;
      praised.current = 0;

      const wanted = last.expected_char || expectedChar || '';
      if (!wanted) return;

      const key = wanted.toLowerCase();
      const count = (misses.current.get(key) ?? 0) + 1;
      misses.current.set(key, count);

      const g = guidanceFor(wanted, lang);
      const typed = last.key === ' ' ? 'space' : last.key;
      const wantedLabel = wanted === ' ' ? 'space' : g.base;

      if (count >= 2) {
        /* Naming the pattern is the thing a person does and a label cannot:
           it means someone has been watching across the whole drill, not just
           this keystroke. Counted, never ordinal — "the 2th time" is what
           building an ordinal out of a number gets you. */
        const text =
          lang === 'hi'
            ? `${wantedLabel} phir se — ab tak ${count} baar. ${g.sentence} Ispar thoda dheere chalein.`
            : `${wantedLabel} again — ${count} times now. ${g.sentence} Slow down on this one.`;
        say('correct', text);
      } else {
        const other = guidanceFor(typed, lang);
        const blame = other.fingerName && typed !== wantedLabel
          ? lang === 'hi'
            ? ` Woh ${other.fingerName.toLowerCase()} thi.`
            : ` That was your ${other.fingerName.toLowerCase()}.`
          : '';
        const text =
          lang === 'hi'
            ? `Aapne ${typed} dabaya.${blame} Chahiye ${wantedLabel}. ${g.sentence}`
            : `You pressed ${typed}.${blame} You want ${wantedLabel}. ${g.sentence}`;
        say('correct', text);
      }
      return;
    }

    /* Correct. Say nothing, unless the run has become worth mentioning. */
    streak.current += 1;
    const milestone = PRAISE_AT.find((m) => streak.current === m);
    if (milestone && praised.current < PRAISE_AT.length) {
      say('praise', PRAISE[lang][praised.current % PRAISE[lang].length]);
      praised.current += 1;
    }
  }, [keystrokeEvents, expectedChar, active, lang, say]);

  /* A pause long enough to mean the learner is hunting rather than thinking.
     Not before the first keystroke: at the start of a drill they are reading
     the passage, and being told to take their time before they have done
     anything is the coach talking over them. */
  useEffect(() => {
    if (!active || !expectedChar || strokeCount.current === 0) return;
    const t = window.setTimeout(() => {
      const g = guidanceFor(expectedChar, lang);
      const pool = NUDGE[lang];
      const pick = pool[rotate.current % pool.length];
      rotate.current += 1;
      say('nudge', `${pick} ${g.sentence}`);
    }, HESITATION_MS);
    return () => window.clearTimeout(t);
  }, [expectedChar, keystrokeEvents.length, active, lang, say]);

  /* A fresh drill is a fresh session: forget the keys, the misses and the run. */
  useEffect(() => {
    if (active) return;
    seen.current.clear();
    misses.current.clear();
    streak.current = 0;
    praised.current = 0;
    strokeCount.current = 0;
    lastText.current = '';
    setLine(null);
  }, [active]);

  return { line, lang, streak: streak.current };
}
