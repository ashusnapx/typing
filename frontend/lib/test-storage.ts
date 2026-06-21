export interface StoredTestResult {
  id: string;
  date: string;
  wpm: number;
  accuracy: number;
  mode: string;
  qualified: boolean;
  duration: number;
  gross_wpm?: number;
  total_errors?: number;
  key_depression_count?: number;
  backspace_count?: number;
  typed_content?: string;
  xp_earned?: number;
}

const STORAGE_KEY = 'typing_test_results';

function generateId(): string {
  return `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function saveTestResult(result: Omit<StoredTestResult, 'id' | 'date'>): void {
  try {
    const stored = getTestResults();
    const entry: StoredTestResult = {
      id: generateId(),
      date: new Date().toISOString(),
      ...result,
    };
    stored.unshift(entry);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch {
    console.warn('Failed to save test result to localStorage');
  }
}

export function getTestResults(): StoredTestResult[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as StoredTestResult[];
  } catch {
    return [];
  }
}

export function getRecentTestResults(limit = 20): StoredTestResult[] {
  return getTestResults().slice(0, limit);
}

export function clearTestResults(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}
