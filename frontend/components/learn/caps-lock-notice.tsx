'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { AlertTriangle } from 'lucide-react';
import { getCapsLocked, subscribeCapsLock } from '@/lib/caps-lock-tracker';

interface CapsLockNoticeProps {
  /** The drill text, used to decide whether Caps Lock is actually wanted. */
  text?: string;
  /** @deprecated Pass `text` instead — see the note below. */
  lessonNeedsUppercase?: boolean;
  compact?: boolean;
}

/**
 * Caps Lock warning.
 *
 * The previous version demanded "Turn Caps Lock ON" whenever the drill text
 * contained any capital letter at all. That is wrong and actively harmful:
 * sentence-case text like "The Reserve Bank of India" is typed with Shift, and
 * Caps Lock ON would produce "tHE rESERVE bANK OF iNDIA" — turning a
 * capitalisation lesson into a guaranteed failure.
 *
 * Caps Lock is only wanted when the text is essentially ALL CAPS. Otherwise the
 * only thing worth saying is: Caps Lock is on, and it shouldn't be.
 */
function wantsCapsLock(text: string): boolean {
  const letters = text.replace(/[^A-Za-z]/g, '');
  if (letters.length < 8) return false;
  const upper = letters.replace(/[^A-Z]/g, '').length;
  return upper / letters.length > 0.85;
}

export function CapsLockNotice({
  text,
  lessonNeedsUppercase,
  compact = false,
}: CapsLockNoticeProps) {
  const [mounted, setMounted] = useState(false);
  const capsOn = useSyncExternalStore(subscribeCapsLock, getCapsLocked, () => null);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || capsOn === null) return null;

  const needsCaps =
    typeof text === 'string' ? wantsCapsLock(text) : !!lessonNeedsUppercase;

  // Nothing to say when the state already matches.
  if (needsCaps === capsOn) return null;

  const message = needsCaps
    ? 'This drill is in capitals — turn Caps Lock on.'
    : 'Caps Lock is on. Turn it off and use Shift for capitals.';

  return (
    <div
      role="status"
      className={`flex items-center gap-2 rounded-lg border-2 border-warn/25 bg-warn-bg text-warn ${
        compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2.5 text-sm'
      }`}
    >
      <AlertTriangle
        className={compact ? 'h-3.5 w-3.5 shrink-0' : 'h-4 w-4 shrink-0'}
        strokeWidth={2}
      />
      <span>{message}</span>
    </div>
  );
}
