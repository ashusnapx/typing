import { useState } from 'react';
import { useQuery, useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import { saveTestResult } from '@/lib/test-storage';
import { saveLessonProgress } from '@/lib/lesson-storage';
import { readDashboardCache, writeDashboardCache } from '@/lib/dashboard-cache';
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

/**
 * Start the dashboard request before navigating to it.
 *
 * Called the moment sign-in resolves, so the round trip overlaps the route
 * transition instead of starting after the page has mounted. Fire and forget —
 * a failure here just means the page fetches normally.
 */
export function prefetchDashboard(queryClient: QueryClient) {
  void queryClient.prefetchQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const data = await api.getDashboard();
      writeDashboardCache(data);
      return data;
    },
    staleTime: 3 * 60 * 1000,
  });
}

export function useDashboard() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [cached] = useState(readDashboardCache);

  const query = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const data = await api.getDashboard();
      writeDashboardCache(data);
      return data;
    },
    staleTime: 3 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    // A token is proof enough to start fetching. Waiting for `isAuthenticated`
    // meant queuing behind the profile read, which is the round trip that made
    // the dashboard feel slow after sign-in.
    enabled: isAuthenticated || !!api.getToken(),
    refetchOnWindowFocus: true,
    // placeholderData, NOT initialData. initialData seeds the query cache as
    // real data carrying the stored timestamp, so on a fresh page load a copy
    // younger than staleTime counted as fresh and was never revalidated — XP
    // earned a minute earlier stayed invisible until the cache aged out.
    // placeholderData paints the same figures instantly and always refetches.
    placeholderData: cached?.data,
  });

  return query;
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
      mode: TestMode;
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

/**
 * Record a finished lesson: local progress, plus the XP award on the server.
 *
 * The XP half used to go through useUpdateProfile, which sends only a name and
 * an email — the call failed validation, threw, and the award was lost in both
 * places. It has its own mutation now, and the auth store takes the total the
 * server returns rather than one the client guessed at.
 */
export function useSaveLessonResult() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      lessonId,
      wpm,
      acc,
      qualified,
      durationSec = 0,
      totalErrors = 0,
      keyDepressions = 0,
      xpEarned = 0,
      keystrokeEvents,
    }: {
      lessonId: string;
      wpm: number;
      acc: number;
      qualified: boolean;
      durationSec?: number;
      totalErrors?: number;
      keyDepressions?: number;
      xpEarned?: number;
      /** Fed to the mastery engine for the per-key heatmap. */
      keystrokeEvents?: any[];
    }) => {
      saveTestResult({
        wpm,
        accuracy: acc,
        mode: 'lesson',
        qualified,
        duration: durationSec,
        total_errors: totalErrors,
        key_depression_count: keyDepressions,
        xp_earned: xpEarned,
      });
      saveLessonProgress(lessonId, wpm, acc, qualified, keystrokeEvents);

      // Guests keep their progress locally; there is no account to credit.
      if (!useAuthStore.getState().isAuthenticated) return null;
      return api.awardLessonXp(lessonId, qualified, {
        wpm,
        accuracy: acc,
        durationSeconds: durationSec,
        totalErrors,
        keyDepressions,
      });
    },
    onSuccess: (award) => {
      if (!award) return;
      useAuthStore.getState().updateUser({ xp: award.xp, level: award.level });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

/**
 * Save the fields an older account is missing.
 *
 * The auth store is updated from the row the server returns rather than from
 * what was typed, so what the app believes and what the database holds cannot
 * drift — the same rule the lesson XP award follows.
 */
export function useCompleteProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ father_name, phone }: { father_name: string; phone: string }) =>
      api.completeProfile(father_name, phone),
    onSuccess: (saved) => {
      useAuthStore.getState().updateUser({
        full_name: saved.fullName,
        father_name: saved.fatherName,
        phone: saved.phone,
      });
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
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
