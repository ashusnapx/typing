'use client';

import { useId } from 'react';
import { type FieldError, type UseFormRegisterReturn } from 'react-hook-form';

interface FormFieldProps {
  label: string;
  type?: string;
  placeholder?: string;
  error?: FieldError;
  registration: UseFormRegisterReturn;
  autoComplete?: string;
}

export function FormField({
  label,
  type = 'text',
  placeholder,
  error,
  registration,
  autoComplete,
}: FormFieldProps) {
  const id = useId();
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        type={type}
        placeholder={placeholder || label}
        autoComplete={autoComplete}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className="field"
        {...registration}
      />
      {error && (
        <p id={`${id}-error`} className="text-xs text-err" role="alert">
          {error.message}
        </p>
      )}
    </div>
  );
}
