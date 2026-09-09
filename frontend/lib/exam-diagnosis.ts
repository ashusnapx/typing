import { getFlatLessons } from '@/lib/typing-curriculum';

/**
 * What actually went wrong, in words a candidate can act on.
 *
 * The previous evaluation compared the passage to the typed text word by
 * index. Skip a single word and every word after it lines up against its
 * neighbour, so one omission was scored as dozens of mistakes — in a nine-word
 * sentence, dropping one word marked seven wrong. Real attempts came back as
 * "0 WPM, 0% accuracy" and the report was noise.
 *
 * So the passage and the attempt are aligned first, the way a diff aligns two
 * files, and only then compared. What falls out is a small set of findings —
 * capitalisation, spacing, punctuation, figures, word order, spelling, skipped
 * and extra words — each carrying what it cost under the Commission's own
 * full/half rule, and each pointing at the lesson that drills it.
 *
 * The point is not to show a candidate more numbers. It is to end the report
 * with one sentence they can act on: this is what you lost marks to, and here
 * is where to practise it.
 */

export type MistakeKind =
  | 'capitalisation'
  | 'spacing'
  | 'punctuation'
  | 'figures'
  | 'wordOrder'
  | 'spelling'
  | 'skipped'
  | 'extra';

export interface Finding {
  kind: MistakeKind;
  /** Plain label. No "substitution error", no "Levenshtein". */
  label: string;
  /** A full mistake costs 1, a half costs 0.5 — the Commission's own rule. */
  weight: 'full' | 'half';
  count: number;
  /** Marks lost to this one kind. */
  cost: number;
  /** Up to three real pairs from the attempt, so the advice is concrete. */
  examples: { expected: string; typed: string }[];
  /** One sentence, in the second person, saying what to do differently. */
  advice: string;
  /** The lesson that drills exactly this. */
  lessonId: string;
  lessonTitle: string;
  href: string;
}

export interface Diagnosis {
  findings: Finding[];
  fullMistakes: number;
  halfMistakes: number;
  /** full + half/2, the figure every SSC error cap is measured against. */
  totalMistakes: number;
  /** Words of the passage the candidate actually reached. */
  wordsAttempted: number;
  wordsCorrect: number;
}

/* -------------------------------------------------------------------------- */
/* Word alignment                                                             */
/* -------------------------------------------------------------------------- */

export interface AlignedPair {
  /** null when the candidate typed a word that is not in the passage. */
  expected: string | null;
  /** null when the candidate skipped a word. */
  typed: string | null;
}

/**
 * Align two word lists the way a diff does, so an omission costs one mistake
 * rather than shifting every word after it.
 *
 * Plain Levenshtein over words. A passage is a few hundred words, so the
 * quadratic table is trivial to fill and there is nothing to gain from a
 * cleverer algorithm.
 */
export function alignWords(
  expectedWords: string[],
  typedWords: string[]
): AlignedPair[] {
  const m = expectedWords.length;
  const n = typedWords.length;

  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array<number>(n + 1).fill(0)
  );
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const same = expectedWords[i - 1] === typedWords[j - 1];
      dp[i][j] = same
        ? dp[i - 1][j - 1]
        : Math.min(dp[i - 1][j - 1] + 1, dp[i - 1][j] + 1, dp[i][j - 1] + 1);
    }
  }

  // Walk back through the table. Substitution is preferred over a
  // delete/insert pair at equal cost, because a mistyped word is one mistake
  // rather than a skip plus an addition.
  const pairs: AlignedPair[] = [];
  let i = m;
  let j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0) {
      const same = expectedWords[i - 1] === typedWords[j - 1];
      if (same || dp[i][j] === dp[i - 1][j - 1] + 1) {
        pairs.unshift({ expected: expectedWords[i - 1], typed: typedWords[j - 1] });
        i--;
        j--;
        continue;
      }
    }
    if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) {
      pairs.unshift({ expected: expectedWords[i - 1], typed: null });
      i--;
      continue;
    }
    pairs.unshift({ expected: null, typed: typedWords[j - 1] });
    j--;
  }

  return pairs;
}

/* -------------------------------------------------------------------------- */
/* Classification                                                             */
/* -------------------------------------------------------------------------- */

const stripPunctuation = (w: string) => w.replace(/[^\p{L}\p{N}]/gu, '');
const hasDigit = (w: string) => /\p{N}/u.test(w);

function editDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i, ...new Array<number>(n).fill(0)];
    for (let j = 1; j <= n; j++) {
      cur[j] =
        a[i - 1] === b[j - 1]
          ? prev[j - 1]
          : Math.min(prev[j - 1], prev[j], cur[j - 1]) + 1;
    }
    prev = cur;
  }
  return prev[n];
}

/** Ordered: the first rule that matches wins, so "Delhi," vs "delhi," is
 *  reported as capitalisation rather than as a spelling error. */
function classifyPair(expected: string, typed: string): MistakeKind {
  if (expected.toLowerCase() === typed.toLowerCase()) return 'capitalisation';

  const e = stripPunctuation(expected);
  const t = stripPunctuation(typed);
  if (e === t) return 'punctuation';
  if (e.toLowerCase() === t.toLowerCase()) return 'capitalisation';

  // A figure typed wrong is its own kind of error: it reads as a small slip
  // and costs a full mistake, and it is the one people never check.
  if (hasDigit(expected) || hasDigit(typed)) return 'figures';

  return 'spelling';
}

/** The Commission's rule, not ours. */
const WEIGHT: Record<MistakeKind, 'full' | 'half'> = {
  capitalisation: 'half',
  spacing: 'half',
  punctuation: 'half',
  wordOrder: 'half',
  figures: 'full',
  spelling: 'full',
  skipped: 'full',
  extra: 'full',
};

const COPY: Record<
  MistakeKind,
  { label: string; advice: string; lessonId: string }
> = {
  capitalisation: {
    label: 'Capital letters',
    advice:
      'Type capitals with Shift, and only where the passage has them. Each one costs half a mistake.',
    lessonId: 's3-capitals',
  },
  spacing: {
    label: 'Spacing',
    advice:
      'One space between words, always one. Running two words together or splitting one costs half a mistake.',
    lessonId: 's3-spacing',
  },
  punctuation: {
    label: 'Punctuation',
    advice:
      'Commas, full stops and semicolons are marked. A missing or extra one costs half a mistake.',
    lessonId: 's3-punctuation',
  },
  figures: {
    label: 'Numbers and figures',
    advice:
      'Numbers are marked digit by digit and cost a full mistake. Slow down on them and read them twice.',
    lessonId: 's3-figures',
  },
  wordOrder: {
    label: 'Word order',
    advice:
      'Two words typed the wrong way round costs half a mistake. It usually means you read ahead of your hands.',
    lessonId: 's3-transposition',
  },
  spelling: {
    label: 'Spelling',
    advice:
      'A wrong letter is a full mistake — the most expensive thing on this list. Accuracy first, speed second.',
    lessonId: 's3-spelling',
  },
  skipped: {
    label: 'Skipped words',
    advice:
      'Every word you miss is a full mistake. Keep your eyes one word ahead, not one line ahead.',
    lessonId: 's3-gauntlet',
  },
  extra: {
    label: 'Extra words',
    advice:
      'A word that is not in the passage costs a full mistake, the same as missing one.',
    lessonId: 's3-gauntlet',
  },
};

/* -------------------------------------------------------------------------- */

/**
 * Reclassify what a plain alignment cannot see on its own.
 *
 * Two patterns matter and both are half mistakes, so getting them wrong
 * doubles the cost the candidate is shown:
 *
 *  - a merged or split word ("Ihope" for "I hope") aligns as a substitution
 *    plus a skip, which would read as one and a half mistakes instead of half;
 *  - a transposed pair ("hope I" for "I hope") aligns as two substitutions,
 *    which would read as two mistakes instead of half.
 */
function refine(pairs: AlignedPair[]): { kind: MistakeKind; expected: string; typed: string }[] {
  const out: { kind: MistakeKind; expected: string; typed: string }[] = [];
  const norm = (w: string) => stripPunctuation(w).toLowerCase();

  for (let i = 0; i < pairs.length; i++) {
    const p = pairs[i];
    const next = pairs[i + 1];

    if (p.expected !== null && p.typed !== null && p.expected === p.typed) continue;

    if (next) {
      // The alignment is free to put the null side of a merge or split either
      // before or after the substitution, so both orders are checked. Reading
      // only one of them reported "Ihope" as a skipped word plus a misspelling
      // — two full mistakes for what the Commission charges half a mistake.
      const expectedParts = [p.expected, next.expected].filter(
        (w): w is string => w !== null
      );
      const typedParts = [p.typed, next.typed].filter(
        (w): w is string => w !== null
      );

      // Two passage words typed as one.
      if (
        expectedParts.length === 2 &&
        typedParts.length === 1 &&
        norm(expectedParts[0] + expectedParts[1]) === norm(typedParts[0])
      ) {
        out.push({
          kind: 'spacing',
          expected: `${expectedParts[0]} ${expectedParts[1]}`,
          typed: typedParts[0],
        });
        i++;
        continue;
      }

      // One passage word typed as two.
      if (
        expectedParts.length === 1 &&
        typedParts.length === 2 &&
        norm(expectedParts[0]) === norm(typedParts[0] + typedParts[1])
      ) {
        out.push({
          kind: 'spacing',
          expected: expectedParts[0],
          typed: `${typedParts[0]} ${typedParts[1]}`,
        });
        i++;
        continue;
      }

      // A swapped pair: each is the other's answer.
      if (
        p.expected !== null &&
        p.typed !== null &&
        next.expected !== null &&
        next.typed !== null &&
        p.expected === next.typed &&
        next.expected === p.typed
      ) {
        out.push({
          kind: 'wordOrder',
          expected: `${p.expected} ${next.expected}`,
          typed: `${p.typed} ${next.typed}`,
        });
        i++;
        continue;
      }
    }

    if (p.expected === null && p.typed !== null) {
      out.push({ kind: 'extra', expected: '', typed: p.typed });
      continue;
    }
    if (p.typed === null && p.expected !== null) {
      out.push({ kind: 'skipped', expected: p.expected, typed: '' });
      continue;
    }
    if (p.expected !== null && p.typed !== null) {
      out.push({
        kind: classifyPair(p.expected, p.typed),
        expected: p.expected,
        typed: p.typed,
      });
    }
  }

  return out;
}

const LESSONS = () => getFlatLessons();

/**
 * Diagnose one attempt.
 *
 * `expected` is trimmed to the words the candidate actually reached — an
 * unfinished passage is a completion problem, reported separately, not several
 * hundred spelling mistakes.
 */
export function diagnose(original: string, typed: string): Diagnosis {
  const typedWords = typed.trim() ? typed.trim().split(/\s+/) : [];
  const allExpected = original.trim() ? original.trim().split(/\s+/) : [];

  // An empty attempt has nothing to diagnose. Listing every word of the
  // passage as "skipped" would bury the only thing worth saying, which is that
  // nothing was typed.
  if (typedWords.length === 0) {
    return {
      findings: [],
      fullMistakes: 0,
      halfMistakes: 0,
      totalMistakes: 0,
      wordsAttempted: 0,
      wordsCorrect: 0,
    };
  }

  /* Align against the whole passage, then drop the tail the candidate never
     reached.

     The reach used to be guessed as `typedWords * 1.15 + 2`, which charged
     every unfinished attempt about fifteen percent of its length in phantom
     "skipped word" mistakes — typing 66% of a passage perfectly was reported
     as 32 skipped words. The words after the last one you typed were never
     attempted, and that is a completion figure the result screen reports on
     its own, not thirty-two separate mistakes. A word skipped in the middle
     still has a typed word after it, so it survives this trim and is still
     charged. */
  const allPairs = alignWords(allExpected, typedWords);
  let end = allPairs.length;
  while (end > 0 && allPairs[end - 1].typed === null) end--;
  const pairs = allPairs.slice(0, end);

  const mistakes = refine(pairs);

  const grouped = new Map<MistakeKind, { expected: string; typed: string }[]>();
  for (const m of mistakes) {
    const list = grouped.get(m.kind) ?? [];
    list.push({ expected: m.expected, typed: m.typed });
    grouped.set(m.kind, list);
  }

  const lessons = LESSONS();
  const findings: Finding[] = [];

  for (const [kind, occurrences] of grouped) {
    const copy = COPY[kind];
    const weight = WEIGHT[kind];
    const lesson = lessons.find((l) => l.id === copy.lessonId);
    findings.push({
      kind,
      label: copy.label,
      weight,
      count: occurrences.length,
      cost: occurrences.length * (weight === 'full' ? 1 : 0.5),
      examples: occurrences.slice(0, 3),
      advice: copy.advice,
      lessonId: copy.lessonId,
      lessonTitle: lesson?.title ?? copy.label,
      href: `/exam/lesson/${copy.lessonId}`,
    });
  }

  // Most marks lost first — that is the order a candidate should fix them in.
  findings.sort((a, b) => b.cost - a.cost || b.count - a.count);

  const fullMistakes = findings
    .filter((f) => f.weight === 'full')
    .reduce((s, f) => s + f.count, 0);
  const halfMistakes = findings
    .filter((f) => f.weight === 'half')
    .reduce((s, f) => s + f.count, 0);

  const wordsCorrect = pairs.filter(
    (p) => p.expected !== null && p.expected === p.typed
  ).length;

  return {
    findings,
    fullMistakes,
    halfMistakes,
    totalMistakes: fullMistakes + halfMistakes / 2,
    wordsAttempted: typedWords.length,
    wordsCorrect,
  };
}
