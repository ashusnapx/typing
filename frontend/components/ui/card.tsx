import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'postit' | 'elevated';
  /** Retained for API compatibility; the paper-craft decorations are retired. */
  decoration?: 'tape' | 'tack' | 'none';
}

const VARIANTS: Record<NonNullable<CardProps['variant']>, string> = {
  default: 'surface',
  postit: 'surface bg-brand-wash',
  elevated: 'surface-raised',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', decoration, children, ...props }, ref) => (
    <div ref={ref} className={cn('relative', VARIANTS[variant], className)} {...props}>
      {children}
    </div>
  )
);

Card.displayName = 'Card';

export function CardContent({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('p-6', className)} {...props}>
      {children}
    </div>
  );
}
