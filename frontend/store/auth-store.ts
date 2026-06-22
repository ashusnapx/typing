'use client';

import { create } from 'zustand';
import { api } from '@/lib/api';
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

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    const { user } = await api.login(email, password);
    set({ user, isAuthenticated: true, isLoading: false });
  },

  register: async (email: string, password: string, full_name: string) => {
    const { user } = await api.register(email, password, full_name);
    set({ user, isAuthenticated: true, isLoading: false });
  },

  logout: () => {
    api.setToken(null);
    clearLessonProgress();
    clearTestResults();
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  loadUser: async () => {
    const { user: currentUser } = get();
    const token = api.getToken();
    if (!token) {
      set({ isLoading: false, isAuthenticated: false });
      return;
    }
    if (currentUser) {
      set({ isLoading: false });
      return;
    }
    try {
      const user = await api.getMe();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      api.setToken(null);
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  updateUser: (data: Partial<AuthUser>) => {
    const current = get().user;
    if (current) {
      set({ user: { ...current, ...data } });
    }
  },
}));
