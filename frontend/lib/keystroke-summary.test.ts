import { describe, it, expect } from 'vitest';
import { summariseKeystrokes, type RawKeystroke } from './keystroke-summary';

/** Keystrokes for `text`, one per character, `gap` ms apart, with an optional
 *  extra pause before the character at each given offset. */
function typeOut(
  text: string,
  gap = 100,
  pauses: Record<number, number> = {},
): RawKeystroke[] {
  let t = 0;
  return [...text].map((ch, i) => {
    t += (i === 0 ? 0 : gap) + (pauses[i] ?? 0);
    return {
      key: ch,
      timestamp_ms: t,
      duration_ms: 40,
      is_error: false,
      is_backspace: false,
      cursor_position: i,
      expected_char: ch,
    };
  });
}

describe('an attempt is stored as its answer, not its raw material', () => {
  it('counts what happened', () => {
    const events = typeOut('the quick brown fox');
    events.push({ key: 'Backspace', timestamp_ms: 9999, duration_ms: 30, is_error: false, is_backspace: true, cursor_position: 5 });
    events.push({ key: 'x', timestamp_ms: 10050, duration_ms: 30, is_error: true, is_backspace: false, cursor_position: 5 });

    const s = summariseKeystrokes('the quick brown fox', events);
    expect(s.keystrokes).toBe(21);
    expect(s.backspaces).toBe(1);
    expect(s.errors).toBe(1);
    expect(s.version).toBe(1);
  });

  it('finds the words the candidate stopped before', () => {
    // A second and a half of thought before "brown", nothing unusual elsewhere.
    const text = 'the quick brown fox';
    const s = summariseKeystrokes(text, typeOut(text, 100, { 10: 1500 }));
    expect(s.hesitations.map((h) => h.word)).toEqual(['brown']);
    expect(s.hesitations[0].pauseMs).toBeGreaterThan(1500);
  });

  it('puts the longest pause first and keeps the list short', () => {
    const words = Array.from({ length: 30 }, (_, i) => `word${i}`);
    const text = words.join(' ');
    const pauses: Record<number, number> = {};
    let offset = 0;
    words.forEach((w, i) => {
      if (i > 0) pauses[offset] = 800 + i * 40;
      offset += w.length + 1;
    });
    const s = summariseKeystrokes(text, typeOut(text, 60, pauses));

    expect(s.hesitations.length).toBeLessThanOrEqual(12);
    const ms = s.hesitations.map((h) => h.pauseMs);
    expect(ms).toEqual([...ms].sort((a, b) => b - a));
  });

  it('ignores the ordinary rhythm of typing', () => {
    const text = 'the quick brown fox jumps over the lazy dog';
    const s = summariseKeystrokes(text, typeOut(text, 120));
    expect(s.hesitations).toEqual([]);
  });

  it('reports the rhythm without letting a long pause distort it', () => {
    const text = 'the quick brown fox';
    const s = summariseKeystrokes(text, typeOut(text, 120, { 10: 4000 }));
    // The four-second think does not become part of the median.
    expect(s.medianGapMs).toBe(120);
  });

  it('is small enough to store on the row', () => {
    // The point of the whole exercise: about 2,200 keystrokes for a real
    // ten-minute attempt used to be 2,200 rows and roughly 300 KB.
    const text = Array.from({ length: 400 }, (_, i) => `word${i}`).join(' ');
    const s = summariseKeystrokes(text, typeOut(text, 90));
    expect(JSON.stringify(s).length).toBeLessThan(2048);
  });

  it('survives an attempt with nothing in it', () => {
    expect(summariseKeystrokes('', [])).toMatchObject({
      keystrokes: 0,
      backspaces: 0,
      hesitations: [],
      medianGapMs: 0,
    });
  });

  it('survives keystrokes arriving out of order', () => {
    const text = 'one two three';
    const shuffled = [...typeOut(text, 150, { 4: 1200 })].reverse();
    const s = summariseKeystrokes(text, shuffled);
    expect(s.hesitations.map((h) => h.word)).toContain('two');
  });

  it('does not invent a pause before the first word', () => {
    const text = 'hello world';
    const s = summariseKeystrokes(text, typeOut(text, 100));
    expect(s.hesitations.some((h) => h.word === 'hello')).toBe(false);
  });
});
