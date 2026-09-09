import { AttemptRepository } from './attempt-repository';
import { api } from '@/lib/api';
import { trpcClient } from '@/lib/trpc-client';
import { OFFLINE_EVENTS, dispatchOfflineEvent } from './offline-events';
import toast from 'react-hot-toast';

const BACKOFF_SCHEDULE = [1000, 2000, 5000, 10000, 30000, 60000, 300000];
const MAX_RETRIES = 10;

class SyncManager {
  private isSyncing = false;
  private retryTimers: Map<string, NodeJS.Timeout> = new Map();

  init() {
    if (typeof window === 'undefined') return;

    // Listeners
    window.addEventListener('online', () => {
      this.syncPendingAttempts();
    });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        this.syncPendingAttempts();
      }
    });

    // Boot recovery
    this.syncPendingAttempts();
  }

  async syncPendingAttempts() {
    if (this.isSyncing || !navigator.onLine) return;
    // Nothing queued can succeed without an account to attribute it to, and
    // every attempt would 401. A signed-out visitor on the landing page has no
    // business running this at all.
    if (!api.getToken()) return;
    this.isSyncing = true;
    dispatchOfflineEvent(OFFLINE_EVENTS.SYNC_STARTED);

    try {
      const unsynced = await AttemptRepository.getUnsyncedAttempts();
      
      for (const attempt of unsynced) {
        // Exhausted attempts are dropped rather than skipped. Left in the
        // store they were re-read on every page load, and each pass announced
        // the same permanent failure again — which is how a stale queue item
        // ended up shouting at people opening the landing page.
        if ((attempt.retryCount ?? 0) >= MAX_RETRIES) {
          await AttemptRepository.deleteAttempt(attempt.id);
          continue;
        }

        await this.syncAttempt(attempt);
      }
    } catch (err) {
      console.error('Offline sync process encountered errors:', err);
    } finally {
      this.isSyncing = false;
    }
  }

  private async syncAttempt(attempt: any) {
    if (this.retryTimers.has(attempt.id)) return;

    try {
      const typedContent = attempt.payload?.typedContent || '';
      const keystrokeEvents = attempt.payload?.keystrokeEvents || [];
      const timeTakenSeconds = attempt.payload?.timeTakenSeconds || 0;
      const durationSeconds = attempt.payload?.durationSeconds || 600;

      const totalChars = typedContent.length;
      const timeMinutes = timeTakenSeconds / 60;
      const grossWpm = timeMinutes > 0 ? Math.round((totalChars / 5) / timeMinutes) : 0;
      const netWpm = grossWpm;
      const accuracy = totalChars > 0 ? 100 : 100;

      const keystrokeEventsMapped = keystrokeEvents.map((e: any) => ({
        key: e.key || '',
        timestamp_ms: e.timestamp_ms || 0,
        duration_ms: e.duration_ms || 0,
        is_error: !!e.is_error,
        is_backspace: !!e.is_backspace,
        cursor_position: e.cursor_position || 0,
        expected_char: e.expected_char || null,
      }));

      await trpcClient.tests.submit.mutate({
        mode: attempt.mode || 'practice',
        durationSeconds,
        grossWpm,
        netWpm,
        accuracy,
        totalErrors: 0,
        trustScore: 100,
        idempotencyKey: attempt.idempotencyKey || attempt.id,
        keystrokeEvents: keystrokeEventsMapped,
      });

      // Success
      await AttemptRepository.markAttemptSynced(attempt.id);
      dispatchOfflineEvent(OFFLINE_EVENTS.SYNC_COMPLETED, attempt);
      toast.success('Offline typing test synced successfully!');
    } catch (err: any) {
      console.error(`Failed to sync attempt ${attempt.id}:`, err);
      
      const isValidationError = err.message?.includes('400') || err.message?.includes('Validation') || err.message?.includes('UNAUTHORIZED');
      
      if (isValidationError) {
        // Rejected on its content or its credentials — retrying cannot change
        // either, so it goes rather than sitting in the queue forever.
        await AttemptRepository.deleteAttempt(attempt.id);
        dispatchOfflineEvent(OFFLINE_EVENTS.SYNC_FAILED, { attempt, error: err.message });
        return;
      }

      const retryCount = await AttemptRepository.incrementRetryCount(attempt.id);
      dispatchOfflineEvent(OFFLINE_EVENTS.SYNC_FAILED, { attempt, error: err.message });

      if (retryCount >= MAX_RETRIES) {
        // Deliberately silent. A background retry budget is an internal
        // detail; there is no action a candidate can take on being told it ran
        // out, and it was firing on every refresh of the landing page.
        console.warn('Offline attempt abandoned after retries:', attempt.id);
        await AttemptRepository.deleteAttempt(attempt.id);
        return;
      }

      const backoffMs = BACKOFF_SCHEDULE[Math.min(retryCount - 1, BACKOFF_SCHEDULE.length - 1)];
      const timer = setTimeout(() => {
        this.retryTimers.delete(attempt.id);
        if (navigator.onLine) {
          this.syncAttempt(attempt);
        }
      }, backoffMs);

      this.retryTimers.set(attempt.id, timer);
    }
  }
}

export const syncManager = new SyncManager();
export default syncManager;
