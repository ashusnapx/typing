import { STORAGE_KEYS } from '@/lib/config';

let _capsLocked: boolean | null = null;
const _subs = new Set<() => void>();
let _initialized = false;

function broadcast(v: boolean) {
  if (_capsLocked === v) return;
  _capsLocked = v;
  try { sessionStorage.setItem(STORAGE_KEYS.capsLock, String(v)); } catch {}
  _subs.forEach((fn) => fn());
}

function handleEvent(e: Event) {
  if (typeof (e as any).getModifierState === 'function') {
    const now = (e as KeyboardEvent | MouseEvent).getModifierState('CapsLock');
    broadcast(now);
  }
}

export function initCapsLockTracker() {
  if (typeof window === 'undefined') return;
  if (_initialized) return;
  _initialized = true;

  try {
    const v = sessionStorage.getItem(STORAGE_KEYS.capsLock);
    if (v === 'true') _capsLocked = true;
    else if (v === 'false') _capsLocked = false;
  } catch {}

  window.addEventListener('keydown', handleEvent, { capture: true, passive: true });
  window.addEventListener('keyup', handleEvent, { capture: true, passive: true });
  window.addEventListener('mousedown', handleEvent, { capture: true, passive: true });
  window.addEventListener('pointerdown', handleEvent, { capture: true, passive: true });
}

export function getCapsLocked(): boolean | null {
  return _capsLocked;
}

export function subscribeCapsLock(fn: () => void): () => void {
  _subs.add(fn);
  return () => { _subs.delete(fn); };
}
