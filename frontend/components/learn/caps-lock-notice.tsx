'use client';

import { useEffect, useState } from 'react';
import { Keyboard } from 'lucide-react';

export function CapsLockNotice({ expectedChar }: { expectedChar?: string | null }) {
  const [capsOn, setCapsOn] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      setCapsOn(e.getModifierState('CapsLock'));
    };
    window.addEventListener('keydown', handler);
    window.addEventListener('keyup', handler);
    return () => {
      window.removeEventListener('keydown', handler);
      window.removeEventListener('keyup', handler);
    };
  }, []);

  const needsCaps = expectedChar ? /[A-Z]/.test(expectedChar) : false;

  return needsCaps && !capsOn ? (
    <div className="bg-red-50 border-2 border-red-400 p-4 shadow-hard-sm flex flex-col items-center text-center"
      style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px', animation: 'caps-blink 0.8s ease-in-out infinite' }}>
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
  ) : null;
}
