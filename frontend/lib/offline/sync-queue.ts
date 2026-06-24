import { AttemptRepository } from './attempt-repository';
import { OfflineAttempt, SerializedAttempt } from './types';
import { generateUUIDv7 } from './uuid';
import { OFFLINE_EVENTS, dispatchOfflineEvent } from './offline-events';

export class SyncQueue {
  static async enqueue(params: {
    userId: string;
    mode: string;
    passageId: string;
    isDirectSubmit: boolean;
    grossWpm: number;
    netWpm: number;
    accuracy: number;
    totalErrors: number;
    trustScore: number;
    payload: SerializedAttempt;
  }): Promise<OfflineAttempt> {
    const id = generateUUIDv7();
    const attempt: OfflineAttempt = {
      id,
      userId: params.userId,
      mode: params.mode,
      passageId: params.passageId,
      isDirectSubmit: params.isDirectSubmit,
      grossWpm: params.grossWpm,
      netWpm: params.netWpm,
      accuracy: params.accuracy,
      totalErrors: params.totalErrors,
      trustScore: params.trustScore,
      idempotencyKey: id, // Idempotency key generated using UUIDv7
      synced: 0,
      retryCount: 0,
      createdAt: Date.now(),
      payload: {
        ...params.payload,
        grossWpm: params.grossWpm,
        netWpm: params.netWpm,
        accuracy: params.accuracy,
        totalErrors: params.totalErrors,
      },
    };

    await AttemptRepository.saveAttempt(attempt);
    dispatchOfflineEvent(OFFLINE_EVENTS.ATTEMPT_SAVED, attempt);
    return attempt;
  }

  static async getUnsynced(): Promise<OfflineAttempt[]> {
    return AttemptRepository.getUnsyncedAttempts();
  }
}
