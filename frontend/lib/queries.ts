import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import { saveTestResult } from '@/lib/test-storage';
import { saveLessonProgress } from '@/lib/lesson-storage';
import type { TestMode } from '@/types';

// =============================================================================
// Auth
// =============================================================================
export function useCurrentUser() {
  const { user, isLoading, isAuthenticated, loadUser, logout: storeLogout } = useAuthStore();

  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      await loadUser();
      return useAuthStore.getState().user;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: Infinity,
    retry: false,
    enabled: !isLoading && !isAuthenticated && !!api.getToken(),
  });
}

// =============================================================================
// Passages
// =============================================================================
// The client-side `usePassage` hook and its Supabase query are gone. Passages
// are now fetched once on the server (lib/passages/server.ts), cached, and
// handed to the exam as a prop — so there is nothing to query from the
// browser, and no second Supabase client to construct.

// =============================================================================
// Dashboard
// =============================================================================
export function useDashboard() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.getDashboard(),
    staleTime: 3 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    enabled: isAuthenticated,
    refetchOnWindowFocus: true,
  });
}

// =============================================================================
// Test History
// =============================================================================
export function useTestHistory(limit = 20, offset = 0) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: ['tests', 'history', limit, offset],
    queryFn: () => api.getTestHistory(limit, offset),
    staleTime: 60 * 1000,
    enabled: isAuthenticated,
  });
}

export function useTestResult(testId: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: ['tests', testId],
    queryFn: () => api.getTestResult(testId),
    staleTime: 5 * 60 * 1000,
    enabled: isAuthenticated && !!testId,
    retry: 2,
  });
}

export function useTestReplay(testId: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: ['tests', testId, 'replay'],
    queryFn: () => api.getTestReplay(testId),
    staleTime: 5 * 60 * 1000,
    enabled: isAuthenticated && !!testId,
    retry: 1,
  });
}

// =============================================================================
// Leaderboard
// =============================================================================
export function useLeaderboard(scope: string = 'global') {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: ['leaderboard', scope],
    queryFn: () => api.getLeaderboard(scope),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    enabled: isAuthenticated,
    refetchOnWindowFocus: false,
  });
}

// =============================================================================
// Coach / AI
// =============================================================================
export function useWeakWords() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: ['coach', 'weak-words'],
    queryFn: () => api.getWeakWords(),
    staleTime: 5 * 60 * 1000,
    enabled: isAuthenticated,
  });
}

export function useAIFeedback(testId: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: ['coach', 'feedback', testId],
    queryFn: () => api.getAIFeedback(testId),
    staleTime: 10 * 60 * 1000,
    enabled: isAuthenticated && !!testId,
    retry: 1,
  });
}

// =============================================================================
// Analytics
// =============================================================================
export function useAnalyticsOverview() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: ['analytics', 'overview'],
    queryFn: () => api.getAnalyticsOverview(),
    staleTime: 5 * 60 * 1000,
    enabled: isAuthenticated,
  });
}

export function usePredictions() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: ['analytics', 'predictions'],
    queryFn: () => api.getPredictions(),
    staleTime: 5 * 60 * 1000,
    enabled: isAuthenticated,
  });
}

// =============================================================================
// Admin
// =============================================================================
export function useAdminDashboard() {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => api.request<any>('/admin/dashboard'),
    staleTime: 60 * 1000,
    enabled: user?.role === 'admin',
  });
}

export function useAdminUsers() {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => api.request<any[]>('/admin/users'),
    staleTime: 60 * 1000,
    enabled: user?.role === 'admin',
  });
}

// =============================================================================
// Mutations
// =============================================================================
export function useStartTest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ mode, passage_id, duration_seconds }: { mode: string; passage_id?: string; duration_seconds?: number }) =>
      api.startTest(mode, passage_id, duration_seconds),
    onSuccess: (data) => {
      queryClient.setQueryData(['tests', data.test_id], data);
    },
  });
}

export function useSubmitTest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ testId, typed_content, keystroke_events, time_taken_seconds }: {
      testId: string;
      typed_content: string;
      keystroke_events: any[];
      time_taken_seconds: number;
    }) => api.submitTest(testId, typed_content, keystroke_events, time_taken_seconds),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(['tests', variables.testId], data);
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['tests', 'history'] });
    },
    retry: 1,
  });
}

export function useDirectSubmit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      mode: string;
      passage_id: string;
      duration_seconds: number;
      typed_content: string;
      keystroke_events: any[];
      time_taken_seconds: number;
    }) => api.directSubmit(
      params.mode,
      params.passage_id,
      params.duration_seconds,
      params.typed_content,
      params.keystroke_events,
      params.time_taken_seconds,
    ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['tests', 'history'] });
    },
    retry: 1,
  });
}

export function useSaveLessonResult() {
  return useMutation({
    mutationFn: async ({ lessonId, wpm, acc, qualified }: {
      lessonId: string;
      wpm: number;
      acc: number;
      qualified: boolean;
    }) => {
      saveTestResult({
        wpm,
        accuracy: acc,
        mode: 'lesson',
        qualified,
        duration: 0,
        total_errors: 0,
        key_depression_count: 0,
      });
      saveLessonProgress(lessonId, wpm, acc, qualified);
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => api.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });
}
