import { STORAGE_KEYS } from '@/lib/config';
import { trpcClient } from './trpc-client';
import { useTypingStore } from '@/store/typing-store';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

class ApiClient {
  private token: string | null = null;
  private refreshing: Promise<boolean> | null = null;
  private pending: Map<string, Promise<any>> = new Map();

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem(STORAGE_KEYS.token);
    }
  }

  private dedupKey(endpoint: string, options: RequestInit = {}): string {
    return `${options.method || 'GET'}:${endpoint}:${options.body || ''}`;
  }

  private async dedupedFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const key = this.dedupKey(endpoint, options);
    const isGet = !options.method || options.method === 'GET';
    if (isGet && this.pending.has(key)) {
      return this.pending.get(key)!;
    }
    const promise = this._request<T>(endpoint, options).finally(() => {
      if (isGet) this.pending.delete(key);
    });
    if (isGet) this.pending.set(key, promise);
    return promise;
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) localStorage.setItem(STORAGE_KEYS.token, token);
      else localStorage.removeItem(STORAGE_KEYS.token);
    }
  }

  getToken(): string | null {
    return this.token;
  }

  async refreshToken(): Promise<boolean> {
    if (this.refreshing) return this.refreshing;
    this.refreshing = this._refresh();
    const result = await this.refreshing;
    this.refreshing = null;
    return result;
  }

  private async _refresh(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.token ? { 'Authorization': `Bearer ${this.token}` } : {}),
        },
        credentials: 'include',
      });
      if (!response.ok) return false;
      const data = await response.json();
      if (data.token) {
        this.setToken(data.token);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    return this.dedupedFetch<T>(endpoint, options);
  }

  private async _request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (response.status === 401 && this.token) {
      const refreshed = await this.refreshToken();
      if (refreshed) {
        headers['Authorization'] = `Bearer ${this.token}`;
        const retryResponse = await fetch(`${API_BASE}${endpoint}`, {
          ...options,
          headers,
          credentials: 'include',
        });
        if (retryResponse.ok) return retryResponse.json();
      }
      this.setToken(null);
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth
  async login(email: string, password: string) {
    if (process.env.NEXT_PUBLIC_ENABLE_TRPC === 'true') {
      const data = await trpcClient.auth.login.mutate({ email, password });
      this.setToken(data.token);
      return {
        token: data.token,
        user: {
          id: data.user.id,
          email: data.user.email,
          full_name: data.user.fullName,
          role: data.user.role,
          xp: 0,
          level: 1,
          is_premium: true,
        }
      };
    }
    const data = await this.request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.token);
    return data;
  }

  async register(email: string, password: string, full_name: string) {
    if (process.env.NEXT_PUBLIC_ENABLE_TRPC === 'true') {
      const data = await trpcClient.auth.register.mutate({ email, password, full_name, confirmPassword: password });
      this.setToken(data.token);
      return {
        token: data.token,
        user: {
          id: data.user.id,
          email: data.user.email,
          full_name: data.user.fullName,
          role: data.user.role,
          xp: 0,
          level: 1,
          is_premium: true,
        }
      };
    }
    const data = await this.request<{ token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, full_name }),
    });
    this.setToken(data.token);
    return data;
  }

  async getMe() {
    if (process.env.NEXT_PUBLIC_ENABLE_TRPC === 'true') {
      const data = await trpcClient.user.profile.query();
      return {
        id: data.id,
        email: data.email,
        full_name: data.fullName,
        role: data.role,
        xp: data.xp,
        level: data.level,
        is_premium: true,
      };
    }
    return this.request<any>('/auth/me');
  }

  // Passages
  async getPassages(params?: Record<string, string>) {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request<any[]>(`/passages${query}`);
  }

  async getRandomPassage(category?: string, difficulty?: string) {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (difficulty) params.set('difficulty', difficulty);
    return this.request<any>(`/passages/random?${params.toString()}`);
  }

  async getPassage(id: string) {
    return this.request<any>(`/passages/${id}`);
  }

  // Tests
  async startTest(mode: string, passage_id?: string, duration_seconds?: number) {
    return this.request<any>('/tests/start', {
      method: 'POST',
      body: JSON.stringify({ mode, passage_id, duration_seconds }),
    });
  }

  async submitTest(testId: string, typed_content: string, keystroke_events: any[], time_taken_seconds: number) {
    if (process.env.NEXT_PUBLIC_ENABLE_TRPC === 'true') {
      const state = useTypingStore.getState();
      const mode = state.mode || 'practice';
      const durationSeconds = state.totalDuration || 600;
      
      const totalChars = typed_content.length;
      let totalErrors = 0;
      const original = state.originalContent;
      if (original) {
        for (let i = 0; i < totalChars; i++) {
          if (typed_content[i] !== original[i]) totalErrors++;
        }
      }
      
      const timeMinutes = time_taken_seconds / 60;
      const grossWpm = timeMinutes > 0 ? Math.round((totalChars / 5) / timeMinutes) : 0;
      const netWpm = timeMinutes > 0 ? Math.max(0, Math.round(((totalChars / 5) - totalErrors) / timeMinutes)) : 0;
      const accuracy = totalChars > 0 ? Math.round(((totalChars - totalErrors) / totalChars) * 10000) / 100 : 100;
      
      const idempotencyKey = testId && testId !== 'local' ? testId : (Math.random().toString(36).substring(2, 15) + Date.now().toString(36));

      const trpcResult = await trpcClient.tests.submit.mutate({
        mode,
        durationSeconds,
        grossWpm,
        netWpm,
        accuracy,
        totalErrors,
        trustScore: 100,
        idempotencyKey,
        keystrokeEvents: keystroke_events.map(e => ({
          key: e.key || '',
          timestamp_ms: e.timestamp_ms || 0,
          duration_ms: e.duration_ms || 0,
          is_error: !!e.is_error,
          is_backspace: !!e.is_backspace,
          cursor_position: e.cursor_position || 0,
          expected_char: e.expected_char || null,
        })),
      });

      return {
        test_id: trpcResult.testId,
        mode: trpcResult.mode,
        gross_wpm: trpcResult.grossWpm,
        net_wpm: trpcResult.netWpm,
        accuracy: trpcResult.accuracy,
        total_errors: trpcResult.totalErrors,
        time_taken_seconds,
        is_qualified: trpcResult.isQualified,
        ssc_net_wpm: trpcResult.netWpm,
        ssc_accuracy: trpcResult.accuracy,
        ssc_error_percentage: 100 - trpcResult.accuracy,
        full_mistakes: trpcResult.totalErrors,
        half_mistakes: 0,
        key_depression_count: totalChars,
        xp_earned: trpcResult.trustScore,
        feedback: 'Nice attempt!',
      };
    }
    return this.request<any>(`/tests/${testId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ typed_content, keystroke_events, time_taken_seconds }),
    });
  }

  async directSubmit(mode: string, passage_id: string, duration_seconds: number, typed_content: string, keystroke_events: any[], time_taken_seconds: number) {
    if (process.env.NEXT_PUBLIC_ENABLE_TRPC === 'true') {
      const state = useTypingStore.getState();
      const totalChars = typed_content.length;
      let totalErrors = 0;
      const original = state.originalContent;
      if (original) {
        for (let i = 0; i < totalChars; i++) {
          if (typed_content[i] !== original[i]) totalErrors++;
        }
      }
      
      const timeMinutes = time_taken_seconds / 60;
      const grossWpm = timeMinutes > 0 ? Math.round((totalChars / 5) / timeMinutes) : 0;
      const netWpm = timeMinutes > 0 ? Math.max(0, Math.round(((totalChars / 5) - totalErrors) / timeMinutes)) : 0;
      const accuracy = totalChars > 0 ? Math.round(((totalChars - totalErrors) / totalChars) * 10000) / 100 : 100;
      
      const idempotencyKey = Math.random().toString(36).substring(2, 15) + Date.now().toString(36);

      const trpcResult = await trpcClient.tests.submit.mutate({
        mode,
        durationSeconds: duration_seconds,
        grossWpm,
        netWpm,
        accuracy,
        totalErrors,
        trustScore: 100,
        idempotencyKey,
        keystrokeEvents: keystroke_events.map(e => ({
          key: e.key || '',
          timestamp_ms: e.timestamp_ms || 0,
          duration_ms: e.duration_ms || 0,
          is_error: !!e.is_error,
          is_backspace: !!e.is_backspace,
          cursor_position: e.cursor_position || 0,
          expected_char: e.expected_char || null,
        })),
      });

      return {
        test_id: trpcResult.testId,
        mode: trpcResult.mode,
        gross_wpm: trpcResult.grossWpm,
        net_wpm: trpcResult.netWpm,
        accuracy: trpcResult.accuracy,
        total_errors: trpcResult.totalErrors,
        time_taken_seconds,
        is_qualified: trpcResult.isQualified,
        ssc_net_wpm: trpcResult.netWpm,
        ssc_accuracy: trpcResult.accuracy,
        ssc_error_percentage: 100 - trpcResult.accuracy,
        full_mistakes: trpcResult.totalErrors,
        half_mistakes: 0,
        key_depression_count: totalChars,
        xp_earned: trpcResult.trustScore,
        feedback: 'Nice attempt!',
      };
    }
    return this.request<any>('/tests/direct-submit', {
      method: 'POST',
      body: JSON.stringify({ mode, passage_id, duration_seconds, typed_content, keystroke_events, time_taken_seconds }),
    });
  }

  async getTestHistory(limit = 20, offset = 0) {
    if (process.env.NEXT_PUBLIC_ENABLE_TRPC === 'true') {
      const data = await trpcClient.tests.history.query({ limit, offset });
      return data.map((t) => ({
        id: t.id,
        user_id: t.userId,
        mode: t.mode,
        duration_seconds: t.durationSeconds,
        gross_wpm: t.grossWpm,
        net_wpm: t.netWpm,
        accuracy: t.accuracy,
        total_errors: t.totalErrors,
        trust_score: t.trustScore,
        created_at: t.createdAt,
      }));
    }
    return this.request<any[]>(`/tests/history?limit=${limit}&offset=${offset}`);
  }

  async getTestResult(testId: string) {
    if (process.env.NEXT_PUBLIC_ENABLE_TRPC === 'true') {
      const t = await trpcClient.tests.result.query({ testId });
      return {
        test_id: t.testId,
        mode: t.mode,
        gross_wpm: t.grossWpm,
        net_wpm: t.netWpm,
        accuracy: t.accuracy,
        total_errors: t.totalErrors,
        is_qualified: t.isQualified,
        ssc_net_wpm: t.netWpm,
        ssc_accuracy: t.accuracy,
        ssc_error_percentage: 100 - t.accuracy,
        time_taken_seconds: 0,
        time_utilization_percentage: 100,
        backspace_count: 0,
        pause_count: 0,
        total_pause_duration_seconds: 0,
        typing_rhythm_score: 100,
        consistency_score: 100,
      };
    }
    return this.request<any>(`/tests/${testId}`);
  }

  async getTestReplay(testId: string) {
    if (process.env.NEXT_PUBLIC_ENABLE_TRPC === 'true') {
      const data = await trpcClient.tests.replay.query({ testId });
      return {
        events: data.events,
        original_content: data.original_content,
        typed_content: data.typed_content,
        total_duration_ms: data.total_duration_ms,
      };
    }
    return this.request<any>(`/tests/${testId}/replay`);
  }

  // Dashboard
  async getDashboard() {
    if (process.env.NEXT_PUBLIC_ENABLE_TRPC === 'true') {
      return trpcClient.user.dashboard.query();
    }
    return this.request<any>('/dashboard');
  }

  // Analytics
  async getAnalyticsOverview() {
    if (process.env.NEXT_PUBLIC_ENABLE_TRPC === 'true') {
      const data = await trpcClient.user.dashboard.query();
      return data.overview;
    }
    return this.request<any>('/analytics/overview');
  }

  async getPredictions() {
    if (process.env.NEXT_PUBLIC_ENABLE_TRPC === 'true') {
      const data = await trpcClient.user.dashboard.query();
      return data.predictions;
    }
    return this.request<any>('/analytics/predictions');
  }

  async getRecentScores() {
    if (process.env.NEXT_PUBLIC_ENABLE_TRPC === 'true') {
      const data = await trpcClient.user.dashboard.query();
      return data.recent_scores;
    }
    return this.request<any[]>('/analytics/recent-scores');
  }

  // Leaderboard
  async getLeaderboard(scope = 'global', limit = 100) {
    if (process.env.NEXT_PUBLIC_ENABLE_TRPC === 'true') {
      const data = await trpcClient.leaderboard.getRankings.query({ scope, limit });
      return data.map((item) => ({
        rank: item.rank,
        user_id: item.userId,
        userId: item.userId,
        score: item.score,
        full_name: item.fullName,
        fullName: item.fullName,
        level: item.level,
      }));
    }
    return this.request<any>(`/leaderboard?scope=${scope}&limit=${limit}`);
  }

  // AI Coach
  async getAIFeedback(testId: string) {
    return this.request<any>(`/coach/feedback/${testId}`);
  }

  async getWeakWords() {
    return this.request<string[]>('/coach/weak-words');
  }

  // Subscription
  async getSubscriptionStatus() {
    return this.request<any>('/subscription/status');
  }

  async getPaymentHistory() {
    return this.request<any[]>('/subscription/payments');
  }

  // Profile
  async updateProfile(data: any) {
    if (process.env.NEXT_PUBLIC_ENABLE_TRPC === 'true') {
      const updated = await trpcClient.user.updateProfile.mutate({
        full_name: data.full_name,
        email: data.email,
      });
      return {
        id: updated.id,
        email: updated.email,
        full_name: updated.fullName,
        role: updated.role,
        xp: updated.xp,
        level: updated.level,
        is_premium: true,
      };
    }
    return this.request<any>('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }
}

export const api = new ApiClient();
