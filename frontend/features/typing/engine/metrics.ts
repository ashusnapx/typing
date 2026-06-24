import { EngineMetrics } from './types';

export function calculateRealtimeMetrics(
  typedText: string,
  originalText: string,
  elapsedSeconds: number,
  backspaceCount: number
): EngineMetrics {
  const totalChars = typedText.length;
  const correctChars = typedText.split('').filter((c, i) => c === originalText[i]).length;
  const errors = totalChars - correctChars;
  
  const minutes = elapsedSeconds > 0 ? elapsedSeconds / 60 : 1 / 60;
  
  // Gross WPM
  const wpm = totalChars > 0 ? Math.round((totalChars / 5) / minutes) : 0;
  const accuracy = totalChars > 0 ? Math.round((correctChars / totalChars) * 10000) / 100 : 100;

  return {
    wpm,
    accuracy,
    errors,
    backspaces: backspaceCount,
    elapsedSeconds,
  };
}
