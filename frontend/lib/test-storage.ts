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
  original_content?: string;
  full_mistakes?: number;
  half_mistakes?: number;
  ssc_net_wpm?: number;
  ssc_accuracy?: number;
  omission_errors?: number;
  addition_errors?: number;
  substitution_errors?: number;
  wrong_word_errors?: number;
  space_errors?: number;
  consistency_score?: number;
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

export function saveTestResult(result: Omit<StoredTestResult, 'id' | 'date'>, apiId?: string): void {
  try {
    const stored = getTestResults();
    // Use the API UUID as the stored ID so localStorage fallback in analysis page can find it
    const id = apiId || generateId();
    // Remove any existing entry with same API ID to avoid duplicates
    const filtered = apiId ? stored.filter(t => t.id !== apiId) : stored;
    const entry: StoredTestResult = {
      id,
      date: new Date().toISOString(),
      ...result,
    };
    filtered.unshift(entry);
    localStorage.setItem(storageKey(), JSON.stringify(filtered));
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
