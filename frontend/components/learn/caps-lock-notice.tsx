'use client';

import { useEffect, useState } from 'react';
import { Keyboard } from 'lucide-react';

export function CapsLockNotice({ showDuringLesson = false }: { showDuringLesson?: boolean }) {
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

  if (!showDuringLesson) {
    return (
      <div className="bg-yellow-50 border-2 border-yellow-400 p-4 mb-6 shadow-hard-sm"
        style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 flex items-center justify-center bg-yellow-100 border-2 border-yellow-400 rounded-full shrink-0">
            <Keyboard className="w-5 h-5 text-yellow-700" strokeWidth={3} />
          </div>
          <div>
            <p className="font-bold text-yellow-800 font-marker text-lg">Caps Lock Required</p>
            <p className="text-yellow-700 font-hand text-base mt-1">
              Please turn <strong>ON Caps Lock</strong> before starting this lesson. Lessons use capital letters for finger guidance.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!capsOn) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-yellow-400 border-2 border-yellow-600 px-3 py-1.5 shadow-hard-sm animate-pulse"
      style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
    >
      <Keyboard className="w-4 h-4 text-yellow-800" strokeWidth={3} />
      <span className="text-sm font-bold text-yellow-800 font-hand">Caps Lock ON</span>
    </div>
  );
}
