export interface LessonProgress {
  lessonId: string;
  bestWpm: number;
  bestAccuracy: number;
  qualified: boolean;
  attempts: number;
  lastDate: string;
  completedDates: string[];
}

function storageKey(): string {
  try {
    const raw = localStorage.getItem('token');
    if (raw) {
      const payload = raw.split('.')[1];
      const decoded = JSON.parse(atob(payload));
      return `typing_lesson_progress_${decoded.sub}`;
    }
  } catch {}
  return 'typing_lesson_progress';
}

function getAll(): Record<string, LessonProgress> {
  try {
    const raw = localStorage.getItem(storageKey());
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, LessonProgress>;
  } catch {
    return {};
  }
}

function save(all: Record<string, LessonProgress>): void {
  try {
    localStorage.setItem(storageKey(), JSON.stringify(all));
  } catch {}
}

export function saveLessonProgress(
  lessonId: string,
  wpm: number,
  accuracy: number,
  qualified: boolean,
): LessonProgress {
  const all = getAll();
  const current = all[lessonId];
  const now = new Date().toISOString();

  if (current) {
    const isBetter = wpm > current.bestWpm || (wpm === current.bestWpm && accuracy > current.bestAccuracy);
    if (isBetter) {
      current.bestWpm = wpm;
      current.bestAccuracy = accuracy;
      current.qualified = qualified;
      current.attempts += 1;
      current.lastDate = now;
      current.completedDates.push(now);
    } else {
      current.attempts += 1;
      current.lastDate = now;
    }
    all[lessonId] = current;
    save(all);
    return current;
  }

  const entry: LessonProgress = {
    lessonId,
    bestWpm: wpm,
    bestAccuracy: accuracy,
    qualified,
    attempts: 1,
    lastDate: now,
    completedDates: [now],
  };
  all[lessonId] = entry;
  save(all);
  return entry;
}

export function getLessonProgress(lessonId: string): LessonProgress | null {
  const all = getAll();
  return all[lessonId] || null;
}

export function getAllLessonProgress(): Record<string, LessonProgress> {
  return getAll();
}

export function getOverallProgress(): { completed: number; total: number; avgWpm: number; avgAccuracy: number; qualifiedCount: number } {
  const all = getAll();
  const entries = Object.values(all);
  const total = 33;
  const completed = entries.length;
  const avgWpm = entries.length > 0 ? entries.reduce((s, e) => s + e.bestWpm, 0) / entries.length : 0;
  const avgAccuracy = entries.length > 0 ? entries.reduce((s, e) => s + e.bestAccuracy, 0) / entries.length : 0;
  const qualifiedCount = entries.filter(e => e.qualified).length;
  return { completed, total, avgWpm, avgAccuracy, qualifiedCount };
}

export function getCompletionTimeline(): { lessonId: string; wpm: number; accuracy: number; date: string; qualified: boolean }[] {
  const all = getAll();
  return Object.values(all)
    .filter(e => e.completedDates.length > 0)
    .map(e => ({
      lessonId: e.lessonId,
      wpm: e.bestWpm,
      accuracy: e.bestAccuracy,
      date: e.completedDates[0],
      qualified: e.qualified,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export function clearLessonProgress(): void {
  try {
    localStorage.removeItem(storageKey());
  } catch {}
}
