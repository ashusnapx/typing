'use client';

import { useEffect, useState } from 'react';

type Status = 'checking' | 'up' | 'down';

/** Live service status. Previously two hardcoded green dots, which is worse
 *  than showing nothing — it tells a user their attempt will sync when it
 *  may not. */
export function HealthIndicator() {
  const [status, setStatus] = useState<Status>('checking');

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      try {
        const res = await fetch('/health', { cache: 'no-store' });
        if (!cancelled) setStatus(res.ok ? 'up' : 'down');
      } catch {
        if (!cancelled) setStatus('down');
      }
    };

    check();
    const id = window.setInterval(check, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  const label =
    status === 'up'
      ? 'All systems operational'
      : status === 'down'
        ? 'Offline — attempts sync later'
        : 'Checking status';

  return (
    <div className="flex items-center gap-2 text-xs text-lumen/50" title={label}>
      <span
        aria-hidden
        className={`inline-block h-1.5 w-1.5 rounded-full ${
          status === 'up'
            ? 'bg-ok-bg'
            : status === 'down'
              ? 'bg-flare'
              : 'bg-lumen/40'
        }`}
      />
      <span>{label}</span>
    </div>
  );
}
