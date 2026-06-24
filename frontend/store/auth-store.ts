'use client';

import { create } from 'zustand';
import { api } from '@/lib/api';
import { STORAGE_KEYS } from '@/lib/config';
import { clearLessonProgress } from '@/lib/lesson-storage';
import { clearTestResults } from '@/lib/test-storage';

interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  xp: number;
  level: number;
  is_premium: boolean;
}

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, full_name: string) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
  updateUser: (data: Partial<AuthUser>) => void;
}

const CACHE_KEY = STORAGE_KEYS.authCache;

function getCachedUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { user, token } = JSON.parse(raw);
    if (api.getToken() !== token) return null;
    return user;
  } catch {
    return null;
  }
}

function setCachedUser(user: AuthUser) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ user, token: api.getToken() }));
  } catch {}
}

function clearCachedUser() {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {}
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    const { user } = await api.login(email, password);
    setCachedUser(user);
    set({ user, isAuthenticated: true, isLoading: false });
  },

  register: async (email: string, password: string, full_name: string) => {
    const { user } = await api.register(email, password, full_name);
    setCachedUser(user);
    set({ user, isAuthenticated: true, isLoading: false });
  },

  logout: () => {
    api.setToken(null);
    clearCachedUser();
    clearLessonProgress();
    clearTestResults();
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  loadUser: async () => {
    const token = api.getToken();
    if (!token) {
      set({ isLoading: false, isAuthenticated: false });
      return;
    }

    const cached = getCachedUser();
    if (cached) {
      set({ user: cached, isAuthenticated: true, isLoading: false });
    }

    try {
      const user = await api.getMe();
      setCachedUser(user);
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      // Token might be expired — try to refresh
      try {
        const refreshed = await api.refreshToken();
        if (refreshed) {
          const user = await api.getMe();
          setCachedUser(user);
          set({ user, isAuthenticated: true, isLoading: false });
          return;
        }
      } catch {}
      // If we have cached user data, keep it rather than force-logout
      if (cached) {
        set({ isLoading: false });
        return;
      }
      api.setToken(null);
      clearCachedUser();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  updateUser: (data: Partial<AuthUser>) => {
    const current = get().user;
    if (current) {
      const updated = { ...current, ...data };
      setCachedUser(updated);
      set({ user: updated });
    }
  },
}));
