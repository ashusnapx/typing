const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

class ApiClient {
  private token: string | null = null;
  private refreshing: Promise<boolean> | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('token');
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) localStorage.setItem('token', token);
      else localStorage.removeItem('token');
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
    const data = await this.request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.token);
    return data;
  }

  async register(email: string, password: string, full_name: string) {
    const data = await this.request<{ token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, full_name }),
    });
    this.setToken(data.token);
    return data;
  }

  async getMe() {
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
    return this.request<any>(`/tests/${testId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ typed_content, keystroke_events, time_taken_seconds }),
    });
  }

  async directSubmit(mode: string, passage_id: string, duration_seconds: number, typed_content: string, keystroke_events: any[], time_taken_seconds: number) {
    return this.request<any>('/tests/direct-submit', {
      method: 'POST',
      body: JSON.stringify({ mode, passage_id, duration_seconds, typed_content, keystroke_events, time_taken_seconds }),
    });
  }

  async getTestHistory(limit = 20, offset = 0) {
    return this.request<any[]>(`/tests/history?limit=${limit}&offset=${offset}`);
  }

  async getTestResult(testId: string) {
    return this.request<any>(`/tests/${testId}`);
  }

  async getTestReplay(testId: string) {
    return this.request<any>(`/tests/${testId}/replay`);
  }

  // Analytics
  async getAnalyticsOverview() {
    return this.request<any>('/analytics/overview');
  }

  async getPredictions() {
    return this.request<any>('/analytics/predictions');
  }

  async getRecentScores() {
    return this.request<any[]>('/analytics/recent-scores');
  }

  // Leaderboard
  async getLeaderboard(scope = 'global', limit = 100) {
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
    return this.request<any>('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }
}

export const api = new ApiClient();
