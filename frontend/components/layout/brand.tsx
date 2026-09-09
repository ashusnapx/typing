import Image from 'next/image';
import { APP } from '@/lib/config';

/**
 * The lockup: the mark, the product, and the house it comes from.
 *
 * It was set three different ways in three places — a serif at 20px in the
 * navbar, a semibold at 24px in the footer, and not at all in the loader,
 * which showed five grey rectangles instead. One component now, so the top of
 * the page, the bottom of it and the moment before it loads are plainly the
 * same product.
 */
export function Brand({
  size = 'md',
  className = '',
}: {
  size?: 'md' | 'lg';
  className?: string;
}) {
  const mark = size === 'lg' ? 64 : 34;
  return (
    <span className={`flex items-center gap-3 ${className}`}>
      <Image
        src={APP.logo}
        alt=""
        width={mark}
        height={mark}
        style={{ width: mark, height: mark }}
        priority
      />
      <span className="text-right leading-none">
        <span className={`block font-semibold ${size === 'lg' ? 'text-4xl' : 'text-2xl'}`}>
          {APP.name}
        </span>
        <span
          className={`mt-1 block italic text-vast/50 ${
            size === 'lg' ? 'text-sm' : 'text-[11px]'
          }`}
        >
          {APP.tagline}
        </span>
      </span>
    </span>
  );
}
