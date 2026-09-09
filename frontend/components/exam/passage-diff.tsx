'use client';

import { useState } from 'react';
import { diffPassage } from '@/lib/exam-diagnosis';

const levenshteinDistance = (() => {
  const cache = new Map<string, number>();
  return function ld(a: string, b: string): number {
    const key = `${a}\0${b}`;
    if (cache.has(key)) return cache.get(key)!;
    const m = a.length, n = b.length;
    const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++)
      for (let j = 1; j <= n; j++)
        dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    const result = dp[m][n];
    cache.set(key, result);
    return result;
  };
})();

interface WordInfo {
  text: string;
  status: 'correct' | 'partial' | 'wrong' | 'missed' | 'extra' | 'unreached';
}

/** Token classes, not hexes — the result screen renders a legend from the same
 *  vocabulary, and hardcoded colours here meant the legend named one colour
 *  while the passage painted another. */
const STATUS_CLASS: Record<WordInfo['status'], string> = {
  // Correct is plain: there is nothing to look at, and that is the point. The
  // accent marks what cost marks, in two strengths — soft for a half mistake,
  // full for a whole one — so the weight on the page matches the weight in the
  // marking.
  correct: '',
  partial: 'bg-accent-soft font-semibold underline decoration-2',
  wrong: 'bg-accent font-semibold',
  missed: 'text-vast/35 font-semibold line-through',
  extra: 'bg-accent font-semibold line-through',
  // Not a mistake: the clock stopped here. Shown faintly and without a strike,
  // because painting the rest of the passage as errors is what made a candidate
  // who ran out of time think they had typed it all wrong.
  unreached: 'text-vast/25',
};

function renderWords(words: WordInfo[], plain = false) {
  if (plain) {
    // Render original passage as plain text — no colors, no strikethrough, no markers
    return words.map((w, i) => (
      <span key={i} className="mr-1 whitespace-pre-wrap">
        {w.text}{' '}
      </span>
    ));
  }
  return words.map((w, i) => (
    <span
      key={i}
      className={`mr-1 whitespace-pre-wrap ${STATUS_CLASS[w.status]}`}
    >
      {w.text || (w.status === 'missed' ? '___' : '')}{' '}
    </span>
  ));
}

/**
 * Both columns of the side-by-side view, aligned.
 *
 * This compared word `i` against word `i`. Skipping one word shifted every
 * word after it, so the whole rest of the passage came out red — in front of a
 * candidate whose score said they had made one mistake.
 */
export function buildWordDisplay(original: string, typed: string) {
  const { cells, unreached } = diffPassage(original, typed);

  const origDisplay: WordInfo[] = [];
  const typedDisplay: WordInfo[] = [];

  for (const cell of cells) {
    const status: WordInfo['status'] =
      cell.status === 'correct'
        ? 'correct'
        : cell.status === 'missed'
          ? 'missed'
          : cell.status === 'extra'
            ? 'extra'
            : cell.status === 'half'
              ? 'partial'
              : 'wrong';
    origDisplay.push({ text: cell.expected ?? '', status });
    typedDisplay.push({ text: cell.typed ?? '', status });
  }

  for (const word of unreached) {
    origDisplay.push({ text: word, status: 'unreached' });
    typedDisplay.push({ text: '', status: 'unreached' });
  }

  return { origDisplay, typedDisplay };
}

export function getWordTiming(
  original: string,
  typed: string,
  keystrokeEvents?: { key: string; timestamp_ms: number; cursor_position?: number }[]
) {
  // Classified by the same aligned comparison that produces the score, so the
  // list of wrong words cannot contradict the number of mistakes beside it.
  const { cells } = diffPassage(original, typed);
  const maxLen = cells.length;

  const result: {
    index: number;
    original: string;
    typed: string;
    isCorrect: boolean;
    errorType: string | null;
    similarity: number;
    wordDurationMs: number;
    pauseBeforeMs: number;
  }[] = [];

  let prevWordEndMs = 0;
  let typedCharOffset = 0;
  for (let i = 0; i < maxLen; i++) {
    const cell = cells[i];
    const orig = cell.expected ?? '';
    const t = cell.typed ?? '';

    const isCorrect = cell.status === 'correct';
    const errorType = isCorrect ? null : cell.kind;

    const similarity = orig && t ? 1 - levenshteinDistance(orig, t) / Math.max(orig.length, t.length) : 0;

    let wordDurationMs = 0;
    let pauseBeforeMs = 0;
    if (keystrokeEvents && keystrokeEvents.length > 0) {
      const events = keystrokeEvents.filter(e => !e.key.startsWith('Backspace') && !e.key.startsWith('Delete'));

      // Walked forward as the cells are consumed, because a cell the candidate
      // skipped occupies no characters in what they typed.
      const charStart = typedCharOffset;
      const charEnd = charStart + t.length;

      const wordEvents = events.filter(e => {
        const cp = e.cursor_position;
        return cp !== undefined && cp >= charStart && cp < charEnd;
      });

      if (wordEvents.length > 0) {
        const times = wordEvents.map(e => e.timestamp_ms);
        wordDurationMs = Math.max(...times) - Math.min(...times);
        pauseBeforeMs = Math.min(...times) - prevWordEndMs;
        prevWordEndMs = Math.max(...times);
      }
    }

    if (cell.typed !== null) typedCharOffset += t.length + 1;

    result.push({
      index: i,
      original: orig,
      typed: t,
      isCorrect,
      errorType,
      similarity,
      wordDurationMs,
      pauseBeforeMs,
    });
  }
  return result;
}

export function formatMs(ms: number): string {
  if (ms <= 0) return '-';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export default function PassageDiffView({
  original,
  typed,
  lang = 'english',
}: {
  original: string;
  typed: string;
  lang?: 'english' | 'hindi';
}) {
  /* One column, not two.
  
     Both were rendered side by side in full, so a 400-word passage put eight
     hundred words on the screen and the handful that were actually wrong were
     lost in it. What a candidate needs is their own typing with the mistakes
     marked in it; the passage is there to check against, so it is one click
     away rather than always open. */
  const [showOriginal, setShowOriginal] = useState(false);
  const { origDisplay, typedDisplay } = buildWordDisplay(original, typed);
  const diffFont =
    lang === 'hindi'
      ? 'var(--font-devanagari), "Noto Sans Devanagari", "Mangal", sans-serif'
      : "'Courier New', monospace";

  const box =
    'max-h-80 overflow-y-auto rounded-lg border-2 border-vast/10 bg-lumen p-3 text-sm leading-loose';

  return (
    <div>
      <div className={showOriginal ? 'grid gap-5 sm:grid-cols-2' : ''}>
        <div className="min-w-0">
          <div className="eyebrow mb-2">What you typed</div>
          <div className={box} style={{ fontFamily: diffFont }}>
            {renderWords(typedDisplay)}
          </div>
        </div>

        {showOriginal && (
          <div className="min-w-0">
            <div className="eyebrow mb-2">Original passage</div>
            <div className={box} style={{ fontFamily: diffFont }}>
              {renderWords(origDisplay, true)}
            </div>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => setShowOriginal((v) => !v)}
        aria-expanded={showOriginal}
        className="mt-3 text-[13px] font-bold underline"
      >
        {showOriginal ? 'Hide the original passage' : 'Show the original passage'}
      </button>
    </div>
  );
}
