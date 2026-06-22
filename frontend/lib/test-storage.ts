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

function storageKey(): string {
  try {
    const raw = localStorage.getItem('token');
    if (raw) {
      const payload = raw.split('.')[1];
      const decoded = JSON.parse(atob(payload));
      return `typing_test_results_${decoded.sub}`;
    }
  } catch {}
  return 'typing_test_results';
}

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
    localStorage.setItem(storageKey(), JSON.stringify(stored));
  } catch {
    console.warn('Failed to save test result to localStorage');
  }
}

export function getTestResults(): StoredTestResult[] {
  try {
    const raw = localStorage.getItem(storageKey());
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
    localStorage.removeItem(storageKey());
  } catch {}
}
