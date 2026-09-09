/**
 * What is worth keeping from a candidate's keystrokes.
 *
 * Every key was stored as its own row: about 2,200 rows and 300 KB for one
 * ten-minute attempt. At a thousand candidates doing twenty practice tests
 * each that is six gigabytes — more than the paid database tier — to power one
 * panel on the report that lists where somebody paused.
 *
 * The panel needs a word and a number of milliseconds. So the pauses are
 * worked out once, when the attempt is submitted and the keystrokes are
 * already in hand, and what is stored is the answer rather than the raw
 * material: about a kilobyte, three hundred times smaller, and the report
 * reads it without recomputing anything.
 */

export interface RawKeystroke {
  key: string;
  timestamp_ms: number;
  duration_ms: number;
  is_error: boolean;
  is_backspace: boolean;
  cursor_position: number;
  expected_char?: string | null;
}

export interface Hesitation {
  /** The word as the candidate typed it. */
  word: string;
  /** How long they paused before starting it. */
  pauseMs: number;
}

export interface KeystrokeSummary {
  version: 1;
  keystrokes: number;
  backspaces: number;
  errors: number;
  /** Median gap between keys, in milliseconds — the candidate's rhythm. */
  medianGapMs: number;
  /** Longest pauses first. Capped, because nobody reads past the first few. */
  hesitations: Hesitation[];
}

/** A pause worth showing. Below this it is just the rhythm of typing. */
const PAUSE_THRESHOLD_MS = 700;
const MAX_HESITATIONS = 12;

const median = (xs: number[]): number => {
  if (xs.length === 0) return 0;
  const sorted = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
};

/**
 * Reduce an attempt's keystrokes to the few facts the report uses.
 *
 * Words are located by their character offset in what was typed, and a word's
 * pause is the gap between the last key of the word before it and its own
 * first key.
 */
export function summariseKeystrokes(
  typedContent: string,
  events: RawKeystroke[],
): KeystrokeSummary {
  const typing = events
    .filter((e) => !e.is_backspace)
    .sort((a, b) => a.timestamp_ms - b.timestamp_ms);

  const gaps: number[] = [];
  for (let i = 1; i < typing.length; i++) {
    const gap = typing[i].timestamp_ms - typing[i - 1].timestamp_ms;
    // A gap of a whole second is a pause, not a rhythm, and would drag the
    // median away from what the candidate's hands were actually doing.
    if (gap > 0 && gap < 1000) gaps.push(gap);
  }

  const hesitations: Hesitation[] = [];
  const text = typedContent ?? '';

  if (typing.length > 0 && text.trim()) {
    /* Walk the typed text, and for each word find the first keystroke at or
       past its opening character. The pause before that word is the gap from
       the previous word's last keystroke. */
    let offset = 0;
    let cursor = 0;
    let previousEnd: number | null = null;

    for (const word of text.split(/(\s+)/)) {
      if (!word.trim()) {
        offset += word.length;
        continue;
      }
      const start = offset;
      const end = offset + word.length;
      offset = end;

      while (cursor < typing.length && typing[cursor].cursor_position < start) cursor++;
      const first = typing[cursor];
      if (!first || first.cursor_position >= end) {
        previousEnd = null;
        continue;
      }

      let last = first.timestamp_ms;
      for (let i = cursor; i < typing.length && typing[i].cursor_position < end; i++) {
        last = typing[i].timestamp_ms;
      }

      if (previousEnd !== null) {
        const pauseMs = first.timestamp_ms - previousEnd;
        if (pauseMs >= PAUSE_THRESHOLD_MS) hesitations.push({ word, pauseMs });
      }
      previousEnd = last;
    }
  }

  hesitations.sort((a, b) => b.pauseMs - a.pauseMs);

  return {
    version: 1,
    keystrokes: events.length,
    backspaces: events.filter((e) => e.is_backspace).length,
    errors: events.filter((e) => e.is_error).length,
    medianGapMs: median(gaps),
    hesitations: hesitations.slice(0, MAX_HESITATIONS),
  };
}
