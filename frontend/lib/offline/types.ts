export interface SerializedAttempt {
  mode: string;
  durationSeconds: number;
  typedContent: string;
  keystrokeEvents: any[];
  timeTakenSeconds: number;
  grossWpm?: number;
  netWpm?: number;
  accuracy?: number;
  totalErrors?: number;
  backspaceCount?: number;
}

export interface OfflineAttempt {
  id: string; // UUIDv7
  userId: string;
  mode: string;
  passageId: string;
  isDirectSubmit: boolean;
  grossWpm: number;
  netWpm: number;
  accuracy: number;
  totalErrors: number;
  trustScore: number;
  idempotencyKey: string;
  synced: 0 | 1;
  retryCount: number;
  createdAt: number;
  payload: SerializedAttempt;
}

export interface ActiveSession {
  sessionId: string;
  passageId: string;
  typedText: string;
  currentPosition: number;
  mistakes: number;
  elapsedMs: number;
  startedAt: number;
  updatedAt: number;
}
