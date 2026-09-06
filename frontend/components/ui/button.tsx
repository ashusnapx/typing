'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

/** Thin wrapper over the .btn classes in globals.css so that markup written
 *  either way stays visually identical. */
const VARIANTS: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  accent: 'btn-brand',
  ghost: 'btn-ghost',
  danger: 'btn-danger',
};

const SIZES: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'btn-sm',
  md: 'btn-md',
  lg: 'btn-lg',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn('btn', VARIANTS[variant], SIZES[size], className)}
      {...props}
    >
      {children}
    </button>
  )
);

Button.displayName = 'Button';
