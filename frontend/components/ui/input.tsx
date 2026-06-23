import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { CSS, WOBBLY_RADII } from '@/lib/config';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, id, ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && (
          <label htmlFor={id} className="block text-base font-bold text-pencil font-hand">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            'w-full px-4 py-3 bg-white border-2 border-pencil font-hand text-lg text-pencil placeholder:text-pencil/40',
            'transition-all duration-100 focus:border-blue-pen focus:outline-none focus:ring-2 focus:ring-blue-pen/20',
            className
          )}
          style={{ borderRadius: CSS.radii.sm }}
          {...props}
        />
      </div>
    );
  }
);

Input.displayName = 'Input';
