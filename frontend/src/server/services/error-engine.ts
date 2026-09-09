import { getExamBar, type BarCategory } from '@/lib/exam-config';
import { diagnose, diffPassage } from '@/lib/exam-diagnosis';

function levenshteinDistance(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + 1);
    }
  }
  return dp[m][n];
}

function levenshteinRatio(a: string, b: string): number {
  const dist = levenshteinDistance(a, b);
  const maxLen = Math.max(a.length, b.length);
  return maxLen === 0 ? 1.0 : 1.0 - dist / maxLen;
}

interface EditOp {
  type: 'delete' | 'insert' | 'replace';
  origStart: number;
  typedStart: number;
}

function levenshteinEditops(orig: string, typed: string): EditOp[] {
  const m = orig.length, n = typed.length;
  const dp: { dist: number; op: EditOp | null }[][] = Array.from({ length: m + 1 }, () =>
    new Array(n + 1).fill(null).map(() => ({ dist: 0, op: null as EditOp | null }))
  );
  for (let i = 0; i <= m; i++) dp[i][0] = { dist: i, op: i > 0 ? { type: 'delete', origStart: i - 1, typedStart: 0 } as EditOp : null };
  for (let j = 0; j <= n; j++) dp[0][j] = { dist: j, op: j > 0 ? { type: 'insert', origStart: 0, typedStart: j - 1 } as EditOp : null };
  dp[0][0] = { dist: 0, op: null };
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = orig[i - 1] === typed[j - 1] ? 0 : 1;
      const del = dp[i - 1][j].dist + 1;
      const ins = dp[i][j - 1].dist + 1;
      const sub = dp[i - 1][j - 1].dist + cost;
      if (del <= ins && del <= sub) {
        dp[i][j] = { dist: del, op: { type: 'delete', origStart: i - 1, typedStart: j } };
      } else if (ins <= del && ins <= sub) {
        dp[i][j] = { dist: ins, op: { type: 'insert', origStart: i, typedStart: j - 1 } };
      } else {
        dp[i][j] = { dist: sub, op: cost === 1 ? { type: 'replace', origStart: i - 1, typedStart: j - 1 } : null };
      }
    }
  }
  const ops: EditOp[] = [];
  let i = m, j = n;
  while (i > 0 || j > 0) {
    const cell = dp[i][j];
    if (cell.op) {
      ops.unshift(cell.op);
      if (cell.op.type === 'delete') i--;
      else if (cell.op.type === 'insert') j--;
      else { i--; j--; }
    } else {
      i--; j--;
    }
  }
  return ops;
}

export interface CharLevelDiff {
  type: string;
  originalChar: string;
  typedChar: string;
  originalPosition: number;
  typedPosition: number;
}

export interface WordLevelError {
  index: number;
  original: string;
  typed: string;
  isCorrect: boolean;
  errorType: string | null;
  similarity: number;
}

export interface ErrorReport {
  grossWpm: number;
  netWpm: number;
  accuracy: number;
  errorPercentage: number;
  keyDepressionCount: number;
  correctKeyDepressions: number;
  incorrectKeyDepressions: number;
  omissionErrors: number;
  additionErrors: number;
  wrongWordErrors: number;
  substitutionErrors: number;
  formattingErrors: number;
  spaceErrors: number;
  totalErrors: number;
  totalWordsOriginal: number;
  totalWordsTyped: number;
  totalCorrectWords: number;
  fullMistakes: number;
  halfMistakes: number;
  sscNetWpm: number;
  sscAccuracy: number;
  sscErrorPercentage: number;
  errorDetails: CharLevelDiff[];
  wordLevelErrors: WordLevelError[];
  charLevelDiffs: CharLevelDiff[];
}

export class SSCErrorEngine {
  private minimumAccuracyForQualifying = 0.95;

  /**
   * @param durationSeconds  The test's allotted window.
   * @param timeTakenSeconds How long the candidate actually typed for. Speed is
   *   measured against this: scoring a passage finished in six minutes as
   *   though it took ten under-reported every fast candidate by 40%. It is
   *   clamped to the window, so a clock that over-runs cannot inflate anyone,
   *   and floored at one second so an instant submit cannot divide by zero.
   *   Omitted, it falls back to the window — which is what an expired timer
   *   means anyway.
   */
  evaluate(
    original: string,
    typed: string,
    durationSeconds: number,
    _mode: string = 'ssc_chsl',
    timeTakenSeconds?: number,
  ): ErrorReport {
    /* The elapsed reading is the suspect, not the keystrokes.
    
       Nobody produces 1,200 characters in six seconds, so a submission that
       claims to has a broken clock — a throttled tab, a paste, a scripted
       client. Taken at face value it reported 2,083 WPM, which told the
       candidate nothing, cleared posts they had not cleared, and would have
       set a leaderboard best.
    
       Rather than clamp the speed afterwards and show a number the inputs do
       not support, the elapsed time is floored at the fastest a person could
       physically have typed that many keys. Speed then tops out at
       MAX_HUMAN_CPS on its own, and every figure derived from it — KDPH, the
       posts table, the personal best — stays consistent with it. */
    const MAX_HUMAN_CPS = 17; // ~200 WPM, beyond any sustained human record.
    const reported = Math.max(1, timeTakenSeconds ?? durationSeconds);
    const physicalFloor = typed.trim().length / MAX_HUMAN_CPS;

    /* Flooring the impossible clock still left the attempt sitting on the
       ceiling: a submission claiming one second for 1,609 keys was marked at
       204 WPM, stored as qualified, and paid the full XP award — a leaderboard
       best, from a clock nobody could have kept.

       A reading below the floor is not a fast candidate, it is a broken one —
       a throttled tab, a paste, a scripted client — and there is nothing in it
       worth keeping. So it is discarded rather than salvaged, and the window
       stands in for it, exactly as it does when no clock is sent at all. In
       the hall the clock runs for the whole window anyway. */
    const clockIsCredible = reported >= physicalFloor;
    const trustedElapsed = clockIsCredible
      ? reported
      : durationSeconds > 0
        ? durationSeconds
        : physicalFloor;

    const originalClean = original.trim();
    const typedClean = typed.trim();
    const diagnosis = diagnose(originalClean, typedClean);

    /* Stopping early does not shorten the exam.
    
       In the hall the clock runs for the whole window whatever the candidate
       does, so time is only saved by finishing the passage. Dividing by
       whatever they chose to type for meant three lines typed quickly and then
       abandoned scored as a very high speed and a pass — which is what the
       invented "at least 50% of the passage" rule existed to paper over, and
       that rule was then shown to candidates as though the Commission had
       written it.
    
       Finish the passage and the time you saved counts for you; give up and
       the rest of the window counts against you. Nothing has to be made up. */
    const reachedTheEnd = diagnosis.wordsUnreached === 0;
    const window = durationSeconds > 0 ? durationSeconds : Number.MAX_SAFE_INTEGER;
    const elapsedSeconds = reachedTheEnd
      ? Math.min(window, Math.max(trustedElapsed, 1))
      : window === Number.MAX_SAFE_INTEGER
        ? Math.max(trustedElapsed, 1)
        : window;

    /* Against the whole passage, not a prefix of it cut to the number of words
       typed. That prefix was built by index, so one skipped word shifted every
       word after it and the counts below disagreed with the marks awarded. The
       alignment inside these two decides what was reached. */
    const charDiffs = this.characterLevelDiff(originalClean, typedClean);
    const wordErrors = this.wordLevelMapping(originalClean, typedClean);

    const omissionErrors = charDiffs.filter(d => d.type === 'omission').length;
    const additionErrors = charDiffs.filter(d => d.type === 'addition').length;
    const substitutionErrors = charDiffs.filter(d => d.type === 'substitution').length;
    /* Spacing is a word-level judgement — two words run together, or one split
       in half — so it comes from the diagnosis rather than from a character
       that happened to be a space. */
    const spaceErrors =
      diagnosis.findings.find((f) => f.kind === 'spacing')?.count ?? 0;

    const wrongWordErrors = wordErrors.filter(w => !w.isCorrect).length;

    const keyDepressionCount = typedClean.length;
    const incorrectKeyDepressions = omissionErrors + additionErrors + substitutionErrors + spaceErrors;
    const correctKeyDepressions = Math.max(0, keyDepressionCount - incorrectKeyDepressions);

    const grossWpm = this.calculateGrossWpm(typedClean, elapsedSeconds);
    const netWpm = this.calculateNetWpm(typedClean, elapsedSeconds, incorrectKeyDepressions);

    const totalErrors = omissionErrors + additionErrors + substitutionErrors + spaceErrors;
    const accuracy = keyDepressionCount > 0
      ? this.calculateAccuracy(correctKeyDepressions, keyDepressionCount)
      : 0;
    // NOT `accuracy > 0 ? 100 - accuracy : 0`. That guard turned the worst
    // possible attempt — 0% accurate — into a report of 0% errors, which then
    // passed every error cap it was checked against.
    const errorPercentage =
      keyDepressionCount > 0 ? Math.round((100 - accuracy) * 100) / 100 : 0;

    const originalWords = originalClean.split(/\s+/);
    const typedWords = typedClean.split(/\s+/);
    const totalCorrectWords = wordErrors.filter(w => w.isCorrect).length;

    /* Full and half mistakes come from the aligned diagnosis, not from the
       index-by-index word mapping below.
    
       That mapping compared originalWords[i] against typedWords[i]. Skip one
       word and every word after it lines up against its neighbour: in a
       nine-word sentence, dropping a single word was scored as seven mistakes.
       Real attempts collapsed to 0 WPM and 0% accuracy, which is what made the
       whole report untrustworthy.
    
       Sharing `diagnose` also means the figure the candidate is scored on and
       the breakdown they are shown are the same calculation, so the report can
       never explain a number the score disagrees with. */
    const fullMistakes = diagnosis.fullMistakes;
    const halfMistakes = diagnosis.halfMistakes;

    const minutes = elapsedSeconds > 0 ? elapsedSeconds / 60 : 1;
    const sscNetWpm = this.calculateSscNetWpm(keyDepressionCount, fullMistakes, halfMistakes, minutes);

    const grossWords = keyDepressionCount / 5;
    const sscAccuracy = this.calculateSscAccuracy(grossWords, fullMistakes, halfMistakes);
    /* An attempt with no key depressions scores nought accuracy, so it is
       nought accuracy and a hundred per cent error — not nought and nought.
       The guard here forced the error to zero while `calculateSscAccuracy`
       returned zero above it, so a candidate who submitted only whitespace was
       shown "0.00% mistakes — met" against the error cap, while submitting a
       genuinely empty box was shown 100%. The same attempt, marked two ways. */
    const sscErrorPct = Math.round((100 - sscAccuracy) * 100) / 100;

    return {
      grossWpm: Math.round(grossWpm * 100) / 100,
      netWpm: Math.round(netWpm * 100) / 100,
      accuracy: Math.round(accuracy * 100) / 100,
      errorPercentage: Math.round(errorPercentage * 100) / 100,
      keyDepressionCount,
      correctKeyDepressions,
      incorrectKeyDepressions,
      omissionErrors,
      additionErrors,
      wrongWordErrors,
      substitutionErrors,
      formattingErrors: 0,
      spaceErrors,
      totalErrors,
      totalWordsOriginal: originalWords.length,
      totalWordsTyped: typedWords.length,
      totalCorrectWords,
      fullMistakes,
      halfMistakes,
      sscNetWpm: Math.round(sscNetWpm * 100) / 100,
      sscAccuracy: Math.round(sscAccuracy * 100) / 100,
      sscErrorPercentage: sscErrorPct,
      errorDetails: charDiffs.slice(0, 50),
      wordLevelErrors: wordErrors,
      charLevelDiffs: charDiffs,
    };
  }

  /**
   * Character-level counts, taken word by word from the aligned pairs.
   *
   * This used to run one Levenshtein over the whole passage against the whole
   * attempt, filling an m x n table of objects. A 4,000-depression DEO Grade
   * 'A' passage allocated 772 MB and half a second before it had scored
   * anything, and a longer one exhausted the heap — which on a serverless
   * function means the candidate loses the attempt they just sat.
   *
   * It also inherited the shift, because the two strings were built by index:
   * a single skipped word made every character after it look wrong, which is
   * why the character counts never agreed with the mistakes beside them.
   *
   * Diffing only the words that actually differ costs the sum of a few short
   * words squared, and counts what genuinely differs.
   */
  private characterLevelDiff(original: string, typed: string): CharLevelDiff[] {
    const { cells } = diffPassage(original, typed);
    const diffs: CharLevelDiff[] = [];

    let origPos = 0;
    let typedPos = 0;

    for (const cell of cells) {
      const o = cell.expected ?? '';
      const t = cell.typed ?? '';

      if (o !== t) {
        for (const op of levenshteinEditops(o, t)) {
          if (op.type === 'delete') {
            diffs.push({
              type: 'omission',
              originalChar: o[op.origStart] ?? '',
              typedChar: '',
              originalPosition: origPos + op.origStart,
              typedPosition: typedPos + op.typedStart,
            });
          } else if (op.type === 'insert') {
            diffs.push({
              type: 'addition',
              originalChar: '',
              typedChar: t[op.typedStart] ?? '',
              originalPosition: origPos + op.origStart,
              typedPosition: typedPos + op.typedStart,
            });
          } else {
            diffs.push({
              type: 'substitution',
              originalChar: o[op.origStart] ?? '',
              typedChar: t[op.typedStart] ?? '',
              originalPosition: origPos + op.origStart,
              typedPosition: typedPos + op.typedStart,
            });
          }
        }
      }

      // A word the candidate never typed takes up no room in what they typed,
      // and vice versa — so the two cursors move independently.
      if (cell.expected !== null) origPos += o.length + 1;
      if (cell.typed !== null) typedPos += t.length + 1;
    }

    return diffs;
  }

  /**
   * Every word of the passage against the word the candidate actually typed
   * for it, rather than against whatever happened to sit at the same index.
   */
  private wordLevelMapping(original: string, typed: string): WordLevelError[] {
    const { cells } = diffPassage(original, typed);

    return cells.map((cell, index) => {
      const orig = cell.expected ?? '';
      const typedWord = cell.typed ?? '';

      if (cell.status === 'correct') {
        return { index, original: orig, typed: typedWord, isCorrect: true, errorType: null, similarity: 1.0 };
      }

      return {
        index,
        original: orig,
        typed: typedWord,
        isCorrect: false,
        errorType: this.classifyWordError(orig, typedWord),
        similarity:
          orig && typedWord
            ? Math.round(levenshteinRatio(orig, typedWord) * 10000) / 10000
            : 0,
      };
    });
  }

  private classifyWordError(original: string, typed: string): string {
    if (!original) return 'addition';
    if (!typed) return 'omission';
    if (original.toLowerCase() === typed.toLowerCase()) return 'typo';
    const levDist = levenshteinDistance(original, typed);
    if (levDist <= 2) return 'typo';
    return 'wrong_word';
  }

  private calculateGrossWpm(typed: string, durationSeconds: number): number {
    const charCount = typed.length;
    const minutes = durationSeconds / 60;
    if (minutes <= 0) return 0;
    return (charCount / 5) / minutes;
  }

  private calculateNetWpm(typed: string, durationSeconds: number, errors: number): number {
    const gross = this.calculateGrossWpm(typed, durationSeconds);
    const minutes = durationSeconds / 60;
    if (minutes <= 0) return 0;
    return Math.max(0, gross - (errors / minutes));
  }

  private calculateAccuracy(correct: number, total: number): number {
    if (total <= 0) return 0;
    return (correct / total) * 100;
  }

  private calculateSscNetWpm(keyDepressions: number, fullMistakes: number, halfMistakes: number, minutes: number): number {
    if (minutes <= 0) return 0;
    const grossWords = keyDepressions / 5;
    const totalErrors = fullMistakes + halfMistakes / 2;
    return Math.max(0, grossWords - totalErrors) / minutes;
  }

  private calculateSscAccuracy(grossWords: number, fullMistakes: number, halfMistakes: number): number {
    // Nothing typed is not a perfect score. This returned 100, so submitting
    // an empty attempt reported "100% accuracy" on the result screen while the
    // same report's plain accuracy said 0.
    if (grossWords <= 0) return 0;
    const totalErrors = fullMistakes + halfMistakes / 2;
    return Math.max(0, ((grossWords - totalErrors) / grossWords) * 100);
  }

  isQualifiedChsl(wpm: number, accuracy: number, mode: string = 'english'): boolean {
    if (mode === 'hindi') return wpm >= 30 && accuracy >= 95;
    return wpm >= 35 && accuracy >= 95;
  }

  isQualifiedCglDest(wpm: number, accuracy: number): boolean {
    return accuracy >= 95;
  }

  isQualified(wpm: number, accuracy: number, testMode: string): boolean {
    const errorPct = accuracy > 0 ? Math.round((100 - accuracy) * 100) / 100 : 0;
    if (testMode === 'ssc_hindi') return wpm >= 30 && errorPct <= 7;
    if (testMode === 'ssc_chsl') return wpm >= 35 && errorPct <= 7;
    if (testMode === 'ssc_cgl_dest') return errorPct <= 20;
    return wpm >= 35 && accuracy >= 95;
  }

  /**
   * Judged against the bar for the post, not a hardcoded 35 WPM.
   *
   * The post-wise variants — CHSL DEO at 8,000 KDPH, DEO Grade 'A' at 15,000,
   * CGL CPT at a 5% error cap — were not in the list this used to check, so
   * every one of them fell through to a default that belonged to LDC/JSA. A
   * DEO candidate was told they had failed a 35 WPM bar that does not apply to
   * them.
   *
   * `getExamBar` is the same table the instructions screen and the result
   * screen read, and it resolves the language too — Hindi LDC/JSA qualifies at
   * 30 WPM, and marking it at 35 failed candidates the instructions had just
   * told they needed 30. The verdict here cannot disagree with what the
   * candidate was shown before they started.
   */
  isQualifiedFromReport(
    report: ErrorReport,
    testMode: string,
    category: BarCategory = 'ur',
  ): boolean {
    const bar = getExamBar(testMode, category);

    if (!bar) {
      // Training modes have no official bar; hold them to the LDC/JSA one so
      // practice still means something.
      return report.sscNetWpm >= 35 && report.sscErrorPercentage <= 7;
    }

    const errorsOk = report.sscErrorPercentage <= bar.errorCap;

    if (bar.nature === 'speed_wpm') {
      return report.sscNetWpm >= bar.speedWpm && errorsOk;
    }

    // KDPH posts are judged on key depressions per hour, which is what the
    // notification states — not on a words-per-minute figure derived from it.
    const kdph = report.sscNetWpm * 5 * 60;
    return kdph >= bar.kdph && errorsOk;
  }
}

export const errorEngine = new SSCErrorEngine();
