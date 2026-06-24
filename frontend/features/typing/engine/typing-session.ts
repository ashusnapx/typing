import { AttemptRepository } from '@/lib/offline/attempt-repository';
import { ActiveSession } from '@/lib/offline/types';

export class TypingSessionManager {
  private saveInterval: NodeJS.Timeout | null = null;

  startAutoSave(
    sessionId: string,
    passageId: string,
    getTypedText: () => string,
    getPosition: () => number,
    getMistakes: () => number,
    getElapsedMs: () => number,
    startedAt: number
  ) {
    this.stopAutoSave();

    this.saveInterval = setInterval(async () => {
      try {
        const session: ActiveSession = {
          sessionId,
          passageId,
          typedText: getTypedText(),
          currentPosition: getPosition(),
          mistakes: getMistakes(),
          elapsedMs: getElapsedMs(),
          startedAt,
          updatedAt: Date.now(),
        };
        await AttemptRepository.saveSession(session);
      } catch (err) {
        console.error('Failed to auto-save typing session:', err);
      }
    }, 2000);
  }

  stopAutoSave() {
    if (this.saveInterval) {
      clearInterval(this.saveInterval);
      this.saveInterval = null;
    }
  }

  static async recoverSession(sessionId: string): Promise<ActiveSession | undefined> {
    return AttemptRepository.getSession(sessionId);
  }

  static async clearSession(sessionId: string): Promise<void> {
    await AttemptRepository.deleteSession(sessionId);
  }
}
