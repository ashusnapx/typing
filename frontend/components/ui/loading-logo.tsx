'use client';

/**
 * Loading states for a typing product.
 *
 * A rotating logo says nothing about what the app does and reads as a stock
 * spinner. These are built from the one mark this product actually owns — the
 * caret — plus a row of keys depressing in sequence. Both are pure CSS on
 * existing tokens, so they cost nothing and inherit whichever ground they land
 * on, expressive or exam.
 */

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

const CARET_SIZE = {
  sm: 'h-4 w-[2px]',
  md: 'h-5 w-[2px]',
  lg: 'h-8 w-[3px]',
} as const;

/** A blinking caret. Inline, so it sits inside buttons and label rows. */
export function LogoSpinner({ size = 'sm', text, className = '' }: SpinnerProps) {
  return (
    <span
      className={`inline-flex items-center gap-2 ${className}`}
      role="status"
      aria-live="polite"
    >
      <span
        aria-hidden
        className={`${CARET_SIZE[size]} shrink-0 animate-blink rounded-[1px] bg-flare`}
      />
      {text && <span>{text}</span>}
      {!text && <span className="sr-only">Loading</span>}
    </span>
  );
}

export function ButtonSpinner() {
  return <LogoSpinner size="sm" text="Please wait…" />;
}

/**
 * Five keys depressing left to right, like a hand rolling across the home row.
 * The stagger is what makes it read as typing rather than as a generic pulse.
 */
export function KeyLoader({ className = '' }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`inline-flex items-end gap-1.5 ${className}`}
    >
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className="h-7 w-7 rounded-md border-2 border-vast bg-lumen"
          style={{
            animation: 'keypress 1.1s cubic-bezier(0.4, 0, 0.2, 1) infinite',
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
    </span>
  );
}

export function LoadingOverlay({ text = 'Please wait…' }: { text?: string }) {
  return (
    <div
      className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-xl bg-lumen/90"
      role="status"
      aria-live="polite"
    >
      <KeyLoader />
      <p className="text-base text-vast/60">{text}</p>
    </div>
  );
}

/** Inline block loader — used where a section is still resolving. */
export function LoadingLogo({ text = 'Loading' }: { text?: string }) {
  return (
    <div
      className="flex min-h-[50vh] flex-col items-center justify-center gap-5"
      role="status"
      aria-live="polite"
    >
      <KeyLoader />
      <p className="text-base text-vast/50">{text}</p>
    </div>
  );
}

/** Whole-route loader. */
export function FullPageLoader({ text = 'Loading' }: { text?: string }) {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-5 bg-lumen"
      role="status"
      aria-live="polite"
    >
      <KeyLoader />
      <p className="text-base text-vast/50">{text}</p>
    </div>
  );
}

/**
 * Skeleton of the exam screen itself.
 *
 * Shown while a test is being prepared instead of a spinner on an empty page:
 * the layout is already in place, so nothing jumps when the passage arrives,
 * and the candidate can see what is coming.
 */
export function ExamSkeleton() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6" role="status" aria-live="polite">
      <span className="sr-only">Preparing your test</span>
      <div className="skeleton h-5 w-40" />
      <div className="mt-6 overflow-hidden rounded border-2 border-exam-panel-edge">
        <div className="skeleton h-9 w-full rounded-none" />
        <div className="space-y-3 bg-white p-5">
          {[100, 97, 99, 94, 62].map((w, i) => (
            <div key={i} className="skeleton h-4" style={{ width: `${w}%` }} />
          ))}
        </div>
      </div>
      <div className="mt-4 overflow-hidden rounded border-2 border-exam-panel-edge">
        <div className="skeleton h-9 w-full rounded-none" />
        <div className="h-40 bg-white" />
      </div>
    </div>
  );
}
