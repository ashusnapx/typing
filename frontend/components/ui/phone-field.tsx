'use client';

import { type FieldError, type UseFormRegisterReturn } from 'react-hook-form';

/**
 * Ten-digit Indian mobile number with a printed +91.
 *
 * The country code is chrome, not content: it is rendered beside the field
 * rather than sitting in the value, so there is no prefix to type, none to
 * strip, and no way to submit "+91" twice. Non-digits are removed as they are
 * typed and the field stops at ten, which turns most of the validation
 * messages into things the user never sees — they remain in `phoneSchema`
 * because a paste, an autofill or a disabled-JS submit can still reach them.
 *
 * Shared by sign-up and the profile-completion modal so the rule and the
 * presentation cannot drift apart.
 */
export function PhoneField({
  id,
  label = 'Phone number',
  registration,
  error,
  disabled,
  autoFocus,
  hint = 'We use this only to identify your account.',
}: {
  id: string;
  label?: string;
  registration: UseFormRegisterReturn;
  error?: FieldError;
  disabled?: boolean;
  autoFocus?: boolean;
  hint?: string;
}) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-sm font-medium text-vast/70"
      >
        {label}
      </label>

      <div
        className={`flex items-center gap-2 border-b-2 transition-colors focus-within:border-b-[3px] ${
          error ? 'border-err' : 'border-vast'
        }`}
      >
        {/* Not a select: the product is SSC-only, so every candidate is +91. */}
        <span
          aria-hidden="true"
          className="tnum shrink-0 pb-[2px] pl-1 text-lg text-vast/50"
        >
          +91
        </span>
        <input
          id={id}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          maxLength={10}
          placeholder="98765 43210"
          disabled={disabled}
          autoFocus={autoFocus}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : hintId}
          className="field-line !border-0 tnum"
          {...registration}
          onChange={(e) => {
            // Rewrite before react-hook-form reads it, so the stored value and
            // the visible value are always the same ten digits.
            e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
            registration.onChange(e);
          }}
        />
      </div>

      {error ? (
        <p id={errorId} role="alert" className="mt-2 text-sm text-err">
          {error.message}
        </p>
      ) : (
        <p id={hintId} className="mt-2 text-sm text-vast/45">
          {hint}
        </p>
      )}
    </div>
  );
}
