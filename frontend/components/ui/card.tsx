import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'postit' | 'elevated';
  decoration?: 'tape' | 'tack' | 'none';
}

const variantStyles = {
  default: 'bg-white border-pencil shadow-hard-sm',
  postit: 'bg-postit border-pencil shadow-hard-sm',
  elevated: 'bg-white border-pencil shadow-hard',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', decoration = 'none', children, style, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'border-2 relative',
          variantStyles[variant],
          className
        )}
        style={{
          borderRadius: '60px 20px 80px 20px / 20px 60px 20px 80px',
          ...style,
        }}
        {...props}
      >
        {decoration === 'tape' && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-6 bg-black/10 rotate-[-3deg]" />
        )}
        {decoration === 'tack' && (
          <div
            className="absolute -top-3 left-1/2 -translate-x-1/2 w-5 h-5 bg-accent rounded-full border-2 border-pencil shadow-hard-sm"
          />
        )}
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export function CardContent({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('p-6', className)} {...props}>
      {children}
    </div>
  );
}
