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

  evaluate(
    original: string,
    typed: string,
    durationSeconds: number,
    _mode: string = 'ssc_chsl',
  ): ErrorReport {
    const originalClean = original.trim();
    const typedClean = typed.trim();

    let originalForCompare: string;
    if (typedClean) {
      const typedWordCount = typedClean.split(/\s+/).length;
      const originalWords = originalClean.split(/\s+/);
      originalForCompare = originalWords.slice(0, typedWordCount).join(' ');
    } else {
      originalForCompare = '';
    }

    const charDiffs = this.characterLevelDiff(originalForCompare, typedClean);
    const wordErrors = this.wordLevelMapping(originalForCompare, typedClean);

    const omissionErrors = charDiffs.filter(d => d.type === 'omission').length;
    const additionErrors = charDiffs.filter(d => d.type === 'addition').length;
    const substitutionErrors = charDiffs.filter(d => d.type === 'substitution').length;
    const spaceErrors = charDiffs.filter(d => d.type === 'space').length;

    const wrongWordErrors = wordErrors.filter(w => !w.isCorrect).length;

    const keyDepressionCount = typedClean.length;
    const incorrectKeyDepressions = omissionErrors + additionErrors + substitutionErrors + spaceErrors;
    const correctKeyDepressions = Math.max(0, keyDepressionCount - incorrectKeyDepressions);

    const grossWpm = this.calculateGrossWpm(typedClean, durationSeconds);
    const netWpm = this.calculateNetWpm(typedClean, durationSeconds, incorrectKeyDepressions);

    const totalErrors = omissionErrors + additionErrors + substitutionErrors + spaceErrors;
    const accuracy = keyDepressionCount > 0
      ? this.calculateAccuracy(correctKeyDepressions, keyDepressionCount)
      : 0;
    const errorPercentage = accuracy > 0 ? Math.round((100 - accuracy) * 100) / 100 : 0;

    const originalWords = originalClean.split(/\s+/);
    const typedWords = typedClean.split(/\s+/);
    const totalCorrectWords = wordErrors.filter(w => w.isCorrect).length;

    const [fullMistakes, halfMistakes] = this.calculateFullHalfMistakes(
      originalClean, typedClean, charDiffs, wordErrors,
    );

    const minutes = durationSeconds > 0 ? durationSeconds / 60 : 1;
    const sscNetWpm = this.calculateSscNetWpm(keyDepressionCount, fullMistakes, halfMistakes, minutes);

    const sscTotalErrors = fullMistakes + halfMistakes / 2;
    const sscAccuracy = this.calculateSscAccuracy(keyDepressionCount, sscTotalErrors);
    const sscErrorPct = sscAccuracy > 0 ? Math.round((100 - sscAccuracy) * 100) / 100 : 0;

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

  private calculateFullHalfMistakes(
    _original: string,
    _typed: string,
    charDiffs: CharLevelDiff[],
    wordErrors: WordLevelError[],
  ): [number, number] {
    let fullMistakes = 0;
    let halfMistakes = 0;

    for (const we of wordErrors) {
      if (we.isCorrect) continue;

      const orig = we.original;
      const typedW = we.typed;
      const errType = we.errorType;

      if (errType === 'omission' || errType === 'addition' || errType === 'wrong_word') {
        fullMistakes += 1;
      } else if (errType === 'typo') {
        if (orig.toLowerCase() === typedW.toLowerCase()) {
          halfMistakes += 1;
        } else {
          const levDist = levenshteinDistance(orig, typedW);
          if (levDist <= 2) {
            const origClean = orig.replace(/[^a-zA-Z0-9\s]/g, '');
            const typedCleanW = typedW.replace(/[^a-zA-Z0-9\s]/g, '');
            if (origClean === typedCleanW) {
              halfMistakes += 1;
            } else {
              fullMistakes += 1;
            }
          } else {
            fullMistakes += 1;
          }
        }
      }
    }

    for (const cd of charDiffs) {
      if (cd.type === 'space') {
        let isPartial = true;
        for (const we of wordErrors) {
          if (!we.isCorrect && (we.errorType === 'omission' || we.errorType === 'addition')) {
            isPartial = false;
            break;
          }
        }
        if (isPartial) {
          halfMistakes += 1;
        }
      }
    }

    return [fullMistakes, halfMistakes];
  }

  private characterLevelDiff(original: string, typed: string): CharLevelDiff[] {
    const diffs: CharLevelDiff[] = [];
    const ops = levenshteinEditops(original, typed);

    for (const op of ops) {
      if (op.type === 'delete') {
        diffs.push({
          type: 'omission',
          originalChar: original[op.origStart] ?? '',
          typedChar: '',
          originalPosition: op.origStart,
          typedPosition: op.typedStart,
        });
      } else if (op.type === 'insert') {
        diffs.push({
          type: 'addition',
          originalChar: '',
          typedChar: typed[op.typedStart] ?? '',
          originalPosition: op.origStart,
          typedPosition: op.typedStart,
        });
      } else if (op.type === 'replace') {
        const origC = original[op.origStart] ?? '';
        const typedC = typed[op.typedStart] ?? '';
        diffs.push({
          type: (origC === ' ' || typedC === ' ') ? 'space' : 'substitution',
          originalChar: origC,
          typedChar: typedC,
          originalPosition: op.origStart,
          typedPosition: op.typedStart,
        });
      }
    }

    return diffs;
  }

  private wordLevelMapping(original: string, typed: string): WordLevelError[] {
    const originalWords = original.split(/\s+/);
    const typedWords = typed.split(/\s+/);
    const result: WordLevelError[] = [];
    const maxLen = Math.max(originalWords.length, typedWords.length);

    for (let i = 0; i < maxLen; i++) {
      const origWord = originalWords[i] ?? '';
      const typedWord = typedWords[i] ?? '';

      if (origWord === '' && typedWord === '') continue;

      if (origWord === typedWord) {
        result.push({ index: i, original: origWord, typed: typedWord, isCorrect: true, errorType: null, similarity: 1.0 });
      } else {
        const errorType = this.classifyWordError(origWord, typedWord);
        const similarity = origWord && typedWord ? levenshteinRatio(origWord, typedWord) : 0;
        result.push({ index: i, original: origWord, typed: typedWord, isCorrect: false, errorType, similarity: Math.round(similarity * 10000) / 10000 });
      }
    }

    return result;
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

  private calculateSscAccuracy(keyDepressions: number, totalErrors: number): number {
    if (keyDepressions <= 0) return 0;
    return Math.max(0, ((keyDepressions - totalErrors) / keyDepressions) * 100);
  }

  isQualifiedChsl(wpm: number, accuracy: number, mode: string = 'english'): boolean {
    if (mode === 'hindi') return wpm >= 30 && accuracy >= 95;
    return wpm >= 35 && accuracy >= 95;
  }

  isQualifiedCglDest(wpm: number, accuracy: number): boolean {
    return accuracy >= 95;
  }

  isQualified(wpm: number, accuracy: number, testMode: string): boolean {
    if (testMode === 'ssc_hindi') return this.isQualifiedChsl(wpm, accuracy, 'hindi');
    if (testMode === 'ssc_cgl_dest') return this.isQualifiedCglDest(wpm, accuracy);
    return this.isQualifiedChsl(wpm, accuracy);
  }

  isQualifiedFromReport(report: ErrorReport, testMode: string): boolean {
    if (['ssc_chsl', 'ssc_hindi', 'ssc_cgl_dest'].includes(testMode)) {
      if (testMode === 'ssc_cgl_dest') return report.sscAccuracy >= 95;
      const wpmTarget = testMode === 'ssc_hindi' ? 30 : 35;
      return report.sscNetWpm >= wpmTarget && report.sscAccuracy >= 95;
    }
    return this.isQualified(report.netWpm, report.accuracy, testMode);
  }
}

export const errorEngine = new SSCErrorEngine();
