'use client';

import Image from 'next/image';
import { CSS, WOBBLY_RADII } from '@/lib/config';

interface LogoSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

const sizeMap = {
  sm: { img: 20, icon: 'w-5 h-5', border: 'border' },
  md: { img: 28, icon: 'w-7 h-7', border: 'border-2' },
  lg: { img: 48, icon: 'w-12 h-12', border: 'border-2' },
};

export function LogoSpinner({ size = 'sm', text, className = '' }: LogoSpinnerProps) {
  const s = sizeMap[size];
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span className="inline-block animate-spin">
        <Image
          src="/images/logo.png?v=2"
          alt=""
          width={s.img}
          height={s.img}
          className={`${s.icon} ${s.border} border-pencil/30 shrink-0`}
          style={{ borderRadius: CSS.radii.sm }}
        />
      </span>
      {text && <span className="font-hand text-pencil/70">{text}</span>}
    </span>
  );
}

export function ButtonSpinner() {
  return <LogoSpinner size="sm" text="Please wait..." />;
}

export function LoadingOverlay({ text = 'Please wait...' }: { text?: string }) {
  return (
    <div className="absolute inset-0 z-10 bg-white/80 flex items-center justify-center"
         style={{ borderRadius: CSS.radii.sm }}
         role="status" aria-live="polite">
      <LogoSpinner size="md" text={text} className="flex-col" />
    </div>
  );
}

export function LoadingLogo() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] bg-paper">
      <div className="flex flex-col items-center space-y-4">
        <LogoSpinner size="lg" />
        <p className="text-lg text-pencil/60 font-hand">Loading...</p>
      </div>
    </div>
  );
}

export function FullPageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-paper">
      <div className="flex flex-col items-center space-y-4">
        <LogoSpinner size="lg" />
        <p className="text-lg text-pencil/60 font-hand">Loading...</p>
      </div>
    </div>
  );
}
