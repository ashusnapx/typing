'use client';

interface PasswordStrengthProps {
  password: string;
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const len = password.length;
  const minLen = 6;
  const maxLen = 16;
  const valid = len >= minLen && len <= maxLen;

  if (!password) return null;

  const ratio = len <= maxLen ? len / maxLen : Math.max(0, 1 - (len - maxLen) / maxLen);
  const barColor = valid ? 'bg-green-400' : 'bg-red-400';
  const label = valid ? 'OK' : len < minLen ? 'Too short' : 'Too long';
  const labelColor = valid ? 'text-green-600' : 'text-red-500';

  return (
    <div className="mt-2 font-hand">
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-gray-200 rounded overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${barColor}`}
            style={{ width: `${Math.min(ratio, 1) * 100}%` }}
          />
        </div>
        <span className={`text-sm font-bold ${labelColor} min-w-[4rem] text-right whitespace-nowrap`}>
          {label}
        </span>
      </div>
      <p className="text-xs text-pencil/60 mt-1">
        {len < minLen
          ? `Minimum ${minLen} characters needed`
          : len > maxLen
            ? `Maximum ${maxLen} characters`
            : 'Password length is good'}
      </p>
    </div>
  );
}
