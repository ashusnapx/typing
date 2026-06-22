'use client';

interface PasswordStrengthProps {
  password: string;
}

interface StrengthResult {
  score: number;
  label: string;
  color: string;
  barColor: string;
  checks: { key: string; label: string; passed: boolean }[];
}

const COMMON_PATTERNS = [
  'password', '123456', 'qwerty', 'admin', 'letmein',
  'welcome', 'monkey', 'dragon', 'master', 'secret', 'abc123',
];

function calculateEntropy(password: string): number {
  let charset = 0;
  if (/[a-z]/.test(password)) charset += 26;
  if (/[A-Z]/.test(password)) charset += 26;
  if (/\d/.test(password)) charset += 10;
  if (/[!@#$%^&*(),.?":{}|<>_\-]/.test(password)) charset += 32;
  return charset > 0 ? password.length * Math.log2(charset) : 0;
}

function analyzeStrength(password: string): StrengthResult {
  const checks = [
    { key: 'length', label: 'At least 16 characters', passed: password.length >= 16 },
    { key: 'uppercase', label: 'One uppercase letter', passed: /[A-Z]/.test(password) },
    { key: 'lowercase', label: 'One lowercase letter', passed: /[a-z]/.test(password) },
    { key: 'digit', label: 'One digit', passed: /\d/.test(password) },
    { key: 'special', label: 'One special character', passed: /[!@#$%^&*(),.?":{}|<>_\-]/.test(password) },
    { key: 'repeats', label: 'No 4+ repeated characters', passed: !/(.)\1{3,}/.test(password) },
    { key: 'common', label: 'No common patterns', passed: !COMMON_PATTERNS.some((p) => password.toLowerCase().includes(p)) },
  ];

  const entropy = calculateEntropy(password);
  const entropyOk = entropy >= 80;

  const passedCount = checks.filter((c) => c.passed).length;
  const totalChecks = checks.length;

  let score: number;
  let label: string;
  let color: string;
  let barColor: string;

  if (password.length === 0) {
    score = 0;
    label = '';
    color = 'text-pencil/40';
    barColor = 'bg-gray-200';
  } else if (passedCount < 3) {
    score = 1;
    label = 'Weak';
    color = 'text-red-500';
    barColor = 'bg-red-400';
  } else if (passedCount < 5 || !entropyOk) {
    score = 2;
    label = 'Fair';
    color = 'text-orange-500';
    barColor = 'bg-orange-400';
  } else if (passedCount < 7) {
    score = 3;
    label = 'Good';
    color = 'text-yellow-600';
    barColor = 'bg-yellow-400';
  } else {
    score = 4;
    label = 'Strong';
    color = 'text-green-600';
    barColor = 'bg-green-400';
  }

  return { score, label, color, barColor, checks };
}

function getRecommendation(result: StrengthResult): string | null {
  if (result.score >= 4) return null;
  const failed = result.checks.filter((c) => !c.passed);
  if (failed.length === 0) return null;

  if (result.checks.find((c) => c.key === 'length' && !c.passed)) {
    return 'Use a passphrase-like password (e.g. "CorrectHorseBatteryStaple1!") — longer is stronger.';
  }
  if (result.checks.find((c) => c.key === 'common' && !c.passed)) {
    return 'Avoid common words like "password" or patterns like "123456".';
  }
  if (result.checks.find((c) => c.key === 'repeats' && !c.passed)) {
    return 'Avoid repeating the same character 4+ times in a row.';
  }
  if (failed.length <= 2) {
    return 'Mix uppercase, lowercase, digits, and special characters for a stronger password.';
  }
  return 'Use a mix of uppercase, lowercase, numbers, and special characters. Longer is better.';
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const result = analyzeStrength(password);

  if (!password) return null;

  return (
    <div className="mt-2 space-y-2 font-hand">
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-gray-200 rounded overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${result.barColor}`}
            style={{ width: `${(result.score / 4) * 100}%` }}
          />
        </div>
        {result.label && (
          <span className={`text-sm font-bold ${result.color} min-w-[3rem] text-right`}>
            {result.label}
          </span>
        )}
      </div>

      <ul className="space-y-0.5">
        {result.checks.map((check) => (
          <li
            key={check.key}
            className={`text-xs flex items-center gap-1 ${
              check.passed ? 'text-green-600' : 'text-pencil/50'
            }`}
          >
            <span className="text-sm">{check.passed ? '✓' : '○'}</span>
            <span>{check.label}</span>
          </li>
        ))}
      </ul>

      {result.score < 4 && (
        <p className="text-xs text-pencil/60 italic mt-1">
          💡 {getRecommendation(result)}
        </p>
      )}
    </div>
  );
}
