'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent';
  size?: 'sm' | 'md' | 'lg';
}

const variantStyles = {
  primary: 'bg-white text-pencil border-pencil hover:bg-accent hover:text-white',
  secondary: 'bg-muted text-pencil border-pencil hover:bg-blue-pen hover:text-white',
  accent: 'bg-accent text-white border-accent hover:bg-accent/90',
};

const sizeStyles = {
  sm: 'px-4 py-2 text-base',
  md: 'px-6 py-3 text-lg',
  lg: 'px-10 py-4 text-xl',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center border-[3px] font-hand shadow-hard transition-all duration-100',
          'hover:shadow-hard-hover hover:translate-x-[2px] hover:translate-y-[2px]',
          'active:shadow-none active:translate-x-[4px] active:translate-y-[4px]',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
