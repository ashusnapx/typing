'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { Keyboard } from 'lucide-react';
import { CSS, TIME } from '@/lib/config';
import { getCapsLocked, subscribeCapsLock } from '@/lib/caps-lock-tracker';

export function CapsLockNotice({ expectedChar, requireCapsLock = false }: { expectedChar?: string | null; requireCapsLock?: boolean }) {
  const [mounted, setMounted] = useState(false);

  const capsOn = useSyncExternalStore(
    subscribeCapsLock,
    getCapsLocked,
    () => null,
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || capsOn === null) return null;

  if (requireCapsLock) {
    const needsCaps = expectedChar ? /[A-Z]/.test(expectedChar) : false;
    if (!needsCaps) return null;
    const isCapsOff = capsOn === false;
    if (!isCapsOff) return null;
    return (
      <div className="bg-red-50 border-2 border-red-400 p-4 shadow-hard-sm flex flex-col items-center text-center"
        style={{ borderRadius: CSS.radii.sm, animation: `caps-blink ${TIME.capsBlinkDuration} ease-in-out infinite` }}>
        <style>{`@keyframes caps-blink { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
        <div className="w-10 h-10 flex items-center justify-center bg-red-100 border-2 border-red-400 rounded-full shrink-0 mb-2">
          <Keyboard className="w-5 h-5 text-red-700" strokeWidth={3} />
        </div>
        <p className="font-bold text-red-800 font-marker text-base">
          Turn ON Caps Lock
        </p>
        <p className="text-red-700 font-hand text-sm mt-1">
          Press <kbd className="px-1.5 py-0.5 bg-white border border-red-500 rounded text-red-800 text-xs font-mono">Caps Lock</kbd> to type <kbd className="px-1.5 py-0.5 bg-white border border-red-500 rounded text-red-800 text-xs font-mono">{expectedChar}</kbd>
        </p>
      </div>
    );
  }

  if (capsOn === true) {
    return (
      <div className="bg-yellow-50 border-2 border-yellow-500 p-3 shadow-hard-sm flex items-center gap-3"
        style={{ borderRadius: CSS.radii.sm, animation: `caps-blink ${TIME.capsBlinkDuration} ease-in-out infinite` }}>
        <style>{`@keyframes caps-blink { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
        <div className="w-8 h-8 flex items-center justify-center bg-yellow-100 border-2 border-yellow-500 rounded-full shrink-0">
          <Keyboard className="w-4 h-4 text-yellow-800" strokeWidth={3} />
        </div>
        <p className="font-bold text-yellow-900 font-marker text-sm">
          Caps Lock is ON
        </p>
        <p className="text-yellow-800 font-hand text-xs">
          Turn it OFF for accurate typing
        </p>
      </div>
    );
  }

  return null;
}
