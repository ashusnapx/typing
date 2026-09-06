'use client';

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
  status: 'correct' | 'partial' | 'wrong' | 'missed' | 'extra';
}

/** Token classes, not hexes — the result screen renders a legend from the same
 *  vocabulary, and hardcoded colours here meant the legend named one colour
 *  while the passage painted another. */
const STATUS_CLASS: Record<WordInfo['status'], string> = {
  correct: 'text-ok',
  partial: 'text-warn font-semibold line-through',
  wrong: 'text-err font-semibold line-through',
  missed: 'text-vast/35 font-semibold line-through',
  extra: 'text-err font-semibold underline',
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

export function buildWordDisplay(original: string, typed: string) {
  const origWords = original.split(' ');
  const typedWords = typed.split(' ');
  const maxLen = Math.max(origWords.length, typedWords.length);

  const origDisplay: WordInfo[] = [];
  const typedDisplay: WordInfo[] = [];

  for (let i = 0; i < maxLen; i++) {
    const o = origWords[i] || '';
    const t = typedWords[i] || '';
    if (!o) {
      origDisplay.push({ text: '', status: 'extra' });
      typedDisplay.push({ text: t, status: 'extra' });
      continue;
    }
    if (!t) {
      origDisplay.push({ text: o, status: 'missed' });
      typedDisplay.push({ text: '', status: 'missed' });
      continue;
    }
    if (o === t) {
      origDisplay.push({ text: o, status: 'correct' });
      typedDisplay.push({ text: t, status: 'correct' });
      continue;
    }
    const dist = levenshteinDistance(o, t);
    if (o.toLowerCase() === t.toLowerCase() || dist <= 2) {
      origDisplay.push({ text: o, status: 'partial' });
      typedDisplay.push({ text: t, status: 'partial' });
      continue;
    }
    origDisplay.push({ text: o, status: 'wrong' });
    typedDisplay.push({ text: t, status: 'wrong' });
  }

  return { origDisplay, typedDisplay };
}

export function getWordTiming(
  original: string,
  typed: string,
  keystrokeEvents?: { key: string; timestamp_ms: number; cursor_position?: number }[]
) {
  const origWords = original.split(' ');
  const typedWords = typed.split(' ');
  const maxLen = Math.max(origWords.length, typedWords.length);

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
  for (let i = 0; i < maxLen; i++) {
    const orig = origWords[i] || '';
    const t = typedWords[i] || '';

    const isCorrect = orig === t;
    let errorType: string | null = null;
    if (!isCorrect) {
      if (!orig) errorType = 'addition';
      else if (!t) errorType = 'omission';
      else if (orig.toLowerCase() === t.toLowerCase()) errorType = 'capitalization';
      else {
        const dist = levenshteinDistance(orig, t);
        if (dist <= 2) errorType = 'typo';
        else errorType = 'wrong_word';
      }
    }

    const similarity = orig && t ? 1 - levenshteinDistance(orig, t) / Math.max(orig.length, t.length) : 0;

    let wordDurationMs = 0;
    let pauseBeforeMs = 0;
    if (keystrokeEvents && keystrokeEvents.length > 0) {
      const events = keystrokeEvents.filter(e => !e.key.startsWith('Backspace') && !e.key.startsWith('Delete'));

      let charStart = 0;
      for (let j = 0; j < i; j++) {
        const prevTyped = typedWords[j] || '';
        charStart += prevTyped.length + 1;
      }
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

export default function PassageDiffView({ original, typed, lang = 'english' }: { original: string; typed: string; lang?: 'english' | 'hindi' }) {
  const { origDisplay, typedDisplay } = buildWordDisplay(original, typed);
  const diffFont = lang === 'hindi'
    ? 'var(--font-devanagari), "Noto Sans Devanagari", "Mangal", sans-serif'
    : "'Courier New', monospace";

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <div className="min-w-0">
        <div className="eyebrow mb-2">Original passage</div>
        <div
          className="rounded-lg border-2 border-vast/10 bg-lumen p-3 text-sm leading-loose"
          style={{ fontFamily: diffFont }}
        >
          {renderWords(origDisplay, true)}
        </div>
      </div>
      <div className="min-w-0">
        <div className="eyebrow mb-2">You typed</div>
        <div
          className="rounded-lg border-2 border-vast/10 bg-lumen p-3 text-sm leading-loose"
          style={{ fontFamily: diffFont }}
        >
          {renderWords(typedDisplay)}
        </div>
      </div>
    </div>
  );
}
