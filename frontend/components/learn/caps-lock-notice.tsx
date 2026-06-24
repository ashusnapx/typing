'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { Keyboard } from 'lucide-react';
import { CSS } from '@/lib/config';
import { getCapsLocked, subscribeCapsLock } from '@/lib/caps-lock-tracker';

interface CapsLockNoticeProps {
  lessonNeedsUppercase?: boolean;
  compact?: boolean;
}

/**
 * Simple Caps Lock indicator:
 * - lessonNeedsUppercase=true  → Caps Lock should be ON
 * - lessonNeedsUppercase=false → Caps Lock should be OFF
 */
export function CapsLockNotice({ lessonNeedsUppercase = false, compact = false }: CapsLockNoticeProps) {
  const [mounted, setMounted] = useState(false);
  const capsOn = useSyncExternalStore(subscribeCapsLock, getCapsLocked, () => null);

  useEffect(() => { setMounted(true); }, []);
  if (!mounted || capsOn === null) return null;

  const isCorrect = lessonNeedsUppercase ? capsOn === true : capsOn === false;

  if (isCorrect) {
    if (compact) return null;
    return (
      <div className="bg-green-50 border-2 border-green-300 p-3 flex items-center gap-3"
        style={{ borderRadius: CSS.radii.sm }}>
        <div className="w-8 h-8 flex items-center justify-center bg-green-100 border-2 border-green-300 rounded-full shrink-0">
          <Keyboard className="w-4 h-4 text-green-700" strokeWidth={3} />
        </div>
        <p className="font-bold text-green-800 font-marker text-sm">
          {lessonNeedsUppercase ? 'Caps Lock is ON ✓' : 'Caps Lock is OFF ✓'}
        </p>
      </div>
    );
  }

  // Wrong state — warn
  const wantText = lessonNeedsUppercase ? 'ON' : 'OFF';

  if (compact) {
    return (
      <div className="bg-red-50 border-2 border-red-400 px-3 py-2 flex items-center gap-2"
        style={{ borderRadius: CSS.radii.sm, animation: 'caps-blink 1.5s ease-in-out infinite' }}>
        <style>{`@keyframes caps-blink { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
        <div className="w-6 h-6 flex items-center justify-center bg-red-100 border-2 border-red-400 rounded-full shrink-0">
          <Keyboard className="w-3 h-3 text-red-700" strokeWidth={3} />
        </div>
        <p className="font-bold text-red-800 font-marker text-xs">
          Turn Caps Lock {wantText}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-red-50 border-2 border-red-400 p-4 shadow-hard-sm flex items-start gap-3"
      style={{ borderRadius: CSS.radii.sm, animation: 'caps-blink 1.5s ease-in-out infinite' }}>
      <style>{`@keyframes caps-blink { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
      <div className="w-10 h-10 flex items-center justify-center bg-red-100 border-2 border-red-400 rounded-full shrink-0">
        <Keyboard className="w-5 h-5 text-red-700" strokeWidth={3} />
      </div>
      <div>
        <p className="font-bold text-red-800 font-marker text-base">
          Turn Caps Lock {wantText}
        </p>
        <p className="text-red-600 font-hand text-sm mt-1">
          Press <kbd className="px-1.5 py-0.5 bg-white border border-red-400 rounded text-red-800 font-mono text-xs">Caps Lock</kbd> key to turn it {wantText}
        </p>
      </div>
    </div>
  );
}
