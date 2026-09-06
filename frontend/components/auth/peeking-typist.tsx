import Image from 'next/image';

/**
 * The character leaning over the auth card's top-right corner.
 *
 * Sized and positioned by its wrapper; `priority` is deliberately off since it
 * is decoration and should never compete with the form for bandwidth.
 */
export function PeekingTypist({ className = '' }: { className?: string }) {
  return (
    <Image
      src="/images/image.png"
      alt=""
      aria-hidden
      width={709}
      height={723}
      className={className}
      sizes="(min-width: 1024px) 224px, 192px"
    />
  );
}
