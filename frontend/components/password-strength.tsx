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
  const barColor = valid ? 'bg-ok' : 'bg-err';
  const label = valid ? 'OK' : len < minLen ? 'Too short' : 'Too long';
  const labelColor = valid ? 'text-ok' : 'text-err';

  return (
    <div className="mt-2">
      <div className="flex items-center gap-2">
        {/* Decorative: the verdict is carried by the label beside it. */}
        <div className="h-2 flex-1 overflow-hidden rounded bg-lumen-dark" aria-hidden="true">
          <div
            className={`h-full transition-all duration-300 ${barColor}`}
            style={{ width: `${Math.min(ratio, 1) * 100}%` }}
          />
        </div>
        <span className={`min-w-[4rem] whitespace-nowrap text-right text-sm font-semibold ${labelColor}`}>
          {label}
        </span>
      </div>
      <p className="mt-1 text-xs text-vast/60">
        {len < minLen
          ? `Minimum ${minLen} characters needed`
          : len > maxLen
            ? `Maximum ${maxLen} characters`
            : 'Password length is good'}
      </p>
    </div>
  );
}
