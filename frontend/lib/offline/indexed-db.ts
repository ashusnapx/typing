import { openDB, type IDBPDatabase } from 'idb';

const DATABASE_NAME = 'typing-platform-offline-db';
const DATABASE_VERSION = 1;

let dbPromise: Promise<IDBPDatabase> | null = null;

export function getDB(): Promise<IDBPDatabase> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('IndexedDB is only available in the browser'));
  }

  if (!dbPromise) {
    dbPromise = openDB(DATABASE_NAME, DATABASE_VERSION, {
      upgrade(db) {
        // Completed attempts store
        if (!db.objectStoreNames.contains('typing_attempts')) {
          const attemptStore = db.createObjectStore('typing_attempts', { keyPath: 'id' });
          attemptStore.createIndex('synced', 'synced', { unique: false });
          attemptStore.createIndex('createdAt', 'createdAt', { unique: false });
          attemptStore.createIndex('userId', 'userId', { unique: false });
        }

        // Active sessions store for crash recovery
        if (!db.objectStoreNames.contains('active_sessions')) {
          db.createObjectStore('active_sessions', { keyPath: 'sessionId' });
        }
      },
    });
  }

  return dbPromise;
}
