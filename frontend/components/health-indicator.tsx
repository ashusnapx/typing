'use client';

import { useEffect, useState } from 'react';
import { WOBBLY_RADII } from '@/lib/config';

const HEALTH_URL = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/health`
  : '/api/health';

interface HealthStatus {
  backend: 'checking' | 'up' | 'down';
  api: 'checking' | 'up' | 'down';
}

export function HealthIndicator() {
  const [status, setStatus] = useState<HealthStatus>({
    backend: 'checking',
    api: 'checking',
  });

  useEffect(() => {
    async function check() {
      try {
        const res = await fetch(HEALTH_URL, { signal: AbortSignal.timeout(5000) });
        if (res.ok) {
          setStatus({ backend: 'up', api: 'up' });
        } else {
          setStatus({ backend: 'up', api: 'down' });
        }
      } catch {
        setStatus({ backend: 'down', api: 'down' });
      }
    }
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, []);

  const dot = (state: HealthStatus[keyof HealthStatus]) => {
    const colors = { checking: 'bg-yellow-400', up: 'bg-green-500', down: 'bg-red-500' };
    return (
      <span
        className={`inline-block w-2 h-2 rounded-full ${colors[state]} ${state === 'checking' ? 'animate-pulse' : ''}`}
      />
    );
  };

  return (
    <div
      className="inline-flex items-center space-x-3 px-3 py-1 bg-white border border-pencil/30 text-xs"
      style={{ borderRadius: WOBBLY_RADII.sm }}
    >
      <span className="flex items-center space-x-1 font-hand text-pencil/60">
        {dot(status.backend)} <span>Backend</span>
      </span>
      <span className="text-pencil/20">|</span>
      <span className="flex items-center space-x-1 font-hand text-pencil/60">
        {dot(status.api)} <span>API</span>
      </span>
    </div>
  );
}
