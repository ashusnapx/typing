'use client';

import {
  type FieldErrors,
  type UseFormRegister,
  type Path,
} from 'react-hook-form';
import { PhoneField } from '@/components/ui/phone-field';

/**
 * Who the candidate is: their name, their father's name, their number.
 *
 * The same three questions are asked in two places — on the sign-up page, and
 * in the modal that appears when someone tries to sign in with an email that
 * has no account yet. Sharing the fieldset is what keeps the labels, the
 * placeholders and the +91 handling identical between them.
 */
export interface IdentityValues {
  full_name: string;
  father_name: string;
  phone: string;
}

export function IdentityFields<T extends IdentityValues>({
  register,
  errors,
  disabled,
  idPrefix,
  autoFocus,
}: {
  register: UseFormRegister<T>;
  errors: FieldErrors<T>;
  disabled?: boolean;
  /** Ids must be unique per form instance, since both can be mounted at once. */
  idPrefix: string;
  autoFocus?: boolean;
}) {
  const nameError = errors.full_name as { message?: string } | undefined;
  const fatherError = errors.father_name as { message?: string } | undefined;

  return (
    <>
      <div>
        <label
          htmlFor={`${idPrefix}-name`}
          className="mb-1.5 block text-sm font-medium text-vast/70"
        >
          Your name
        </label>
        <input
          id={`${idPrefix}-name`}
          type="text"
          {...register('full_name' as Path<T>)}
          className="field-line"
          placeholder="Priya Sharma"
          autoComplete="name"
          autoFocus={autoFocus}
          disabled={disabled}
          aria-invalid={!!nameError}
          aria-describedby={nameError ? `${idPrefix}-name-error` : undefined}
        />
        {nameError && (
          <p
            id={`${idPrefix}-name-error`}
            role="alert"
            className="mt-2 text-sm text-err"
          >
            {nameError.message}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor={`${idPrefix}-father`}
          className="mb-1.5 block text-sm font-medium text-vast/70"
        >
          Father&rsquo;s name
        </label>
        <input
          id={`${idPrefix}-father`}
          type="text"
          {...register('father_name' as Path<T>)}
          className="field-line"
          placeholder="Rajesh Sharma"
          autoComplete="off"
          disabled={disabled}
          aria-invalid={!!fatherError}
          aria-describedby={fatherError ? `${idPrefix}-father-error` : undefined}
        />
        {fatherError && (
          <p
            id={`${idPrefix}-father-error`}
            role="alert"
            className="mt-2 text-sm text-err"
          >
            {fatherError.message}
          </p>
        )}
      </div>

      <PhoneField
        id={`${idPrefix}-phone`}
        registration={register('phone' as Path<T>)}
        error={errors.phone as any}
        disabled={disabled}
      />
    </>
  );
}
