'use client';

export function HealthIndicator() {
  return (
    <div className="flex items-center gap-3 px-3 py-1 bg-white border border-pencil/30 text-xs rounded-sm">
      <span className="flex items-center gap-1 font-hand text-pencil/60">
        <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
        <span>Backend</span>
      </span>
      <span className="text-pencil/20">|</span>
      <span className="flex items-center gap-1 font-hand text-pencil/60">
        <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
        <span>API</span>
      </span>
    </div>
  );
}
