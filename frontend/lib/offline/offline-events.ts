export const OFFLINE_EVENTS = {
  SYNC_STARTED: 'typing-offline-sync-started',
  SYNC_COMPLETED: 'typing-offline-sync-completed',
  SYNC_FAILED: 'typing-offline-sync-failed',
  ATTEMPT_SAVED: 'typing-offline-attempt-saved',
  SESSION_RESTORED: 'typing-offline-session-restored',
} as const;

export function dispatchOfflineEvent(eventName: string, detail?: any) {
  if (typeof window !== 'undefined') {
    const event = new CustomEvent(eventName, { detail });
    window.dispatchEvent(event);
  }
}

export function subscribeOfflineEvent(eventName: string, callback: (e: CustomEvent) => void) {
  if (typeof window === 'undefined') return () => {};
  
  const listener = (e: Event) => callback(e as CustomEvent);
  window.addEventListener(eventName, listener);
  return () => {
    window.removeEventListener(eventName, listener);
  };
}
