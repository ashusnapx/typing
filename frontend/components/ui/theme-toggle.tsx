'use client';

import { useCallback, useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

const STORAGE_KEY = 'tm-theme';

/** Reads the class the pre-paint script already applied, so the button never
 *  disagrees with what is on screen. */
function currentTheme(): 'light' | 'dark' {
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

export function ThemeToggle({ className = '' }: { className?: string }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTheme(currentTheme());
    setMounted(true);
  }, []);

  const toggle = useCallback(() => {
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    document.documentElement.classList.toggle('dark', next === 'dark');
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* private mode — the choice just won't persist */
    }
    setTheme(next);
  }, []);

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
      className={`btn btn-ghost h-9 w-9 shrink-0 !px-0 ${className}`}
    >
      {/* Before mount both icons would be a guess, so render the frame only. */}
      {mounted &&
        (theme === 'dark' ? (
          <Sun className="h-[18px] w-[18px]" strokeWidth={1.8} />
        ) : (
          <Moon className="h-[18px] w-[18px]" strokeWidth={1.8} />
        ))}
    </button>
  );
}
