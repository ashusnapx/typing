import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calculateWPM(charCount: number, timeSeconds: number): number {
  if (timeSeconds <= 0) return 0;
  const minutes = timeSeconds / 60;
  return Math.round((charCount / 5) / minutes);
}

export function calculateAccuracy(correct: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((correct / total) * 100 * 100) / 100;
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function getModeDisplayName(mode: string): string {
  const names: Record<string, string> = {
    ssc_chsl: 'SSC CHSL',
    ssc_cgl_dest: 'SSC CGL DEST',
    ssc_hindi: 'SSC Hindi',
    practice: 'Practice',
    blind: 'Blind Mode',
    mock: 'Mock Test',
    tcs_ion_replica: 'TCS iON Replica',
  };
  return names[mode] || mode;
}

export function getQualificationColor(probability: number): string {
  if (probability >= 90) return 'text-green-600';
  if (probability >= 70) return 'text-yellow-600';
  return 'text-red-600';
}

export const LEVEL_NAMES = [
  { name: 'Rookie', minXp: 0 },
  { name: 'Novice', minXp: 250 },
  { name: 'Amateur', minXp: 750 },
  { name: 'Expert', minXp: 2000 },
  { name: 'Candidate Master', minXp: 4500 },
  { name: 'Master', minXp: 7500 },
  { name: 'Grandmaster', minXp: 11000 },
  { name: 'Goated', minXp: 16000 },
] as const;

export function getLevelFromXP(xp: number): string {
  let name: string = LEVEL_NAMES[0].name;
  for (const l of LEVEL_NAMES) {
    if (xp >= l.minXp) name = l.name;
  }
  return name;
}

export function getLevelIndex(xp: number): number {
  let idx = 0;
  for (let i = 0; i < LEVEL_NAMES.length; i++) {
    if (xp >= LEVEL_NAMES[i].minXp) idx = i;
  }
  return idx;
}

export function getLevelProgress(xp: number): { current: string; next: string | null; currentXp: number; nextXp: number; progress: number } {
  const idx = getLevelIndex(xp);
  const current = LEVEL_NAMES[idx];
  const next = idx < LEVEL_NAMES.length - 1 ? LEVEL_NAMES[idx + 1] : null;
  const progress = next ? ((xp - current.minXp) / (next.minXp - current.minXp)) * 100 : 100;
  return {
    current: current.name,
    next: next?.name || null,
    currentXp: current.minXp,
    nextXp: next?.minXp || current.minXp,
    progress: Math.min(100, Math.max(0, progress)),
  };
}

export function normalizeCase(text: string): string {
  if (!text || text.length < 5) return text;
  const upperCount = (text.match(/\b[A-Z][a-z]/g) || []).length;
  const wordCount = (text.match(/\b\w+/g) || []).length;
  if (wordCount < 3 || upperCount < wordCount * 0.4) return text;
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

export const wobblyStyle = {
  borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px',
};

export const wobblyMdStyle = {
  borderRadius: '60px 20px 80px 20px / 20px 60px 20px 80px',
};

export function getRotation(index: number): string {
  const rotations = ['-rotate-1', 'rotate-1', '-rotate-2', 'rotate-2', '-rotate-0.5', 'rotate-0.5'];
  return rotations[index % rotations.length];
}
