'use client';

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
  return (
    <div>
      <label className="block text-sm font-bold font-hand text-pencil mb-1">
        {label}
      </label>
      <input
        type={type}
        placeholder={placeholder || label}
        autoComplete={autoComplete}
        className={`w-full px-4 py-2.5 bg-white border-2 font-hand text-pencil placeholder:text-pencil/30 outline-none transition-colors ${
          error ? 'border-red-400 focus:border-red-500' : 'border-pencil/30 focus:border-pencil'
        }`}
        {...registration}
      />
      {error && (
        <p className="mt-1 text-xs font-hand text-red-500" role="alert">
          {error.message}
        </p>
      )}
    </div>
  );
}
