import { getDB } from './indexed-db';
import { OfflineAttempt, ActiveSession } from './types';

export class AttemptRepository {
  // --- Completed Test Attempts ---

  static async saveAttempt(attempt: OfflineAttempt): Promise<void> {
    const db = await getDB();
    await db.put('typing_attempts', attempt);
  }

  static async getAttempt(id: string): Promise<OfflineAttempt | undefined> {
    const db = await getDB();
    return db.get('typing_attempts', id);
  }

  static async getUnsyncedAttempts(): Promise<OfflineAttempt[]> {
    const db = await getDB();
    const attempts = await db.getAll('typing_attempts');
    return attempts.filter((a) => !a.synced);
  }

  static async getAllAttempts(): Promise<OfflineAttempt[]> {
    const db = await getDB();
    return db.getAll('typing_attempts');
  }

  static async deleteAttempt(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('typing_attempts', id);
  }

  static async markAttemptSynced(id: string): Promise<void> {
    const db = await getDB();
    const tx = db.transaction('typing_attempts', 'readwrite');
    const store = tx.objectStore('typing_attempts');
    const attempt = await store.get(id);
    if (attempt) {
      attempt.synced = 1;
      await store.put(attempt);
    }
    await tx.done;
  }

  static async incrementRetryCount(id: string): Promise<number> {
    const db = await getDB();
    const tx = db.transaction('typing_attempts', 'readwrite');
    const store = tx.objectStore('typing_attempts');
    const attempt = await store.get(id);
    let retries = 0;
    if (attempt) {
      attempt.retryCount = (attempt.retryCount || 0) + 1;
      retries = attempt.retryCount;
      await store.put(attempt);
    }
    await tx.done;
    return retries;
  }

  // --- Active Sessions (Crash/Refresh Recovery) ---

  static async saveSession(session: ActiveSession): Promise<void> {
    const db = await getDB();
    await db.put('active_sessions', session);
  }

  static async getSession(sessionId: string): Promise<ActiveSession | undefined> {
    const db = await getDB();
    return db.get('active_sessions', sessionId);
  }

  static async getActiveSessions(): Promise<ActiveSession[]> {
    const db = await getDB();
    return db.getAll('active_sessions');
  }

  static async deleteSession(sessionId: string): Promise<void> {
    const db = await getDB();
    await db.delete('active_sessions', sessionId);
  }
}
