import { AttemptRepository } from './attempt-repository';
import { api } from '@/lib/api';
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
    this.isSyncing = true;
    dispatchOfflineEvent(OFFLINE_EVENTS.SYNC_STARTED);

    try {
      const unsynced = await AttemptRepository.getUnsyncedAttempts();
      
      for (const attempt of unsynced) {
        if (attempt.retryCount >= MAX_RETRIES) {
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
      if (attempt.isDirectSubmit) {
        // Direct submit flow
        await api.request('/tests/direct-submit', {
          method: 'POST',
          headers: {
            'Idempotency-Key': attempt.idempotencyKey,
          },
          body: JSON.stringify({
            mode: attempt.mode,
            passage_id: attempt.passageId,
            duration_seconds: attempt.payload.durationSeconds,
            typed_content: attempt.payload.typedContent,
            keystroke_events: attempt.payload.keystrokeEvents,
            time_taken_seconds: attempt.payload.timeTakenSeconds,
            idempotency_key: attempt.idempotencyKey,
          }),
        });
      } else {
        // Standard submit flow (previously started online)
        await api.request(`/tests/${attempt.id}/submit`, {
          method: 'POST',
          headers: {
            'Idempotency-Key': attempt.idempotencyKey,
          },
          body: JSON.stringify({
            typed_content: attempt.payload.typedContent,
            keystroke_events: attempt.payload.keystrokeEvents,
            time_taken_seconds: attempt.payload.timeTakenSeconds,
            idempotency_key: attempt.idempotencyKey,
          }),
        });
      }

      // Success
      await AttemptRepository.markAttemptSynced(attempt.id);
      dispatchOfflineEvent(OFFLINE_EVENTS.SYNC_COMPLETED, attempt);
      toast.success('Offline typing test synced successfully!');
    } catch (err: any) {
      console.error(`Failed to sync attempt ${attempt.id}:`, err);
      
      const isValidationError = err.message?.includes('400') || err.message?.includes('Validation');
      
      if (isValidationError) {
        // Mark as permanently failed
        attempt.retryCount = MAX_RETRIES;
        await AttemptRepository.saveAttempt(attempt);
        dispatchOfflineEvent(OFFLINE_EVENTS.SYNC_FAILED, { attempt, error: err.message });
        toast.error(`Offline sync failed validation: ${err.message}`);
        return;
      }

      // Increment retry and schedule backoff
      const retryCount = await AttemptRepository.incrementRetryCount(attempt.id);
      dispatchOfflineEvent(OFFLINE_EVENTS.SYNC_FAILED, { attempt, error: err.message });

      if (retryCount >= MAX_RETRIES) {
        toast.error('Offline test sync failed permanently after 10 attempts.');
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
