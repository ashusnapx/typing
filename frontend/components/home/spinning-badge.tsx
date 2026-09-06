'use client';

/**
 * Circular rotating label.
 *
 * The one piece of pure ornament on the page, and it earns its place by
 * carrying the offer — free, no signup — in a form nobody reads as an ad.
 * Text on a circular path is the signature gesture of the design language this
 * product follows.
 */
export function SpinningBadge({
  text = 'free · no sign-up · scored like the real exam · ',
  className = '',
}: {
  text?: string;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`} aria-hidden>
      <svg
        viewBox="0 0 200 200"
        className="h-full w-full motion-safe:animate-[spin_22s_linear_infinite]"
      >
        <defs>
          {/* Starts at the bottom and runs clockwise so the text reads
              upright at the top of the circle. */}
          <path
            id="badge-arc"
            d="M100,100 m-74,0 a74,74 0 1,1 148,0 a74,74 0 1,1 -148,0"
            fill="none"
          />
        </defs>
        <text
          className="fill-vast font-mono uppercase"
          style={{ fontSize: '15px', letterSpacing: '0.16em', fontWeight: 500 }}
        >
          <textPath href="#badge-arc" startOffset="0%">
            {text.repeat(2)}
          </textPath>
        </text>
      </svg>

      {/* The still centre — a caret, the product's own mark. */}
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="h-8 w-[3px] animate-blink rounded-[2px] bg-flare" />
      </span>
    </div>
  );
}
