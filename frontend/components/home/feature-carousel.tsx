'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

/**
 * The product, in its own screenshots.
 *
 * The hero carried one panel — a replica of the exam chrome — which sells
 * fidelity to the real screen and nothing else. A visitor could not tell from
 * it that the attempt comes back marked the Commission's way, that there is a
 * course underneath for someone who has never touched a keyboard, or that the
 * marking is written down anywhere. Those are the reasons to choose this over
 * a generic WPM counter, and all of them were below the fold.
 *
 * These are real captures of the running pages, taken at one size against a
 * signed-out or throwaway account so nothing personal and no leaderboard
 * figure rides along in a marketing image.
 */

export interface Shot {
  src: string;
  alt: string;
  label: string;
  href: string;
}

const SHOTS: Shot[] = [
  {
    src: '/showcase/exam.png',
    label: 'The exam screen, not an approximation',
    alt: 'The SSC skill test interface with the passage, the typing box and the countdown running',
    href: '/exam',
  },
  {
    src: '/showcase/report.png',
    label: 'Marked the way the Commission marks',
    alt: 'A report showing the speed and mistake bars, and every mistake with what it cost',
    href: '/marking-scheme',
  },
  {
    src: '/showcase/lesson.png',
    label: 'Lessons that show you how to sit and where the fingers go',
    alt: 'A lesson showing how to sit at the keyboard and where the fingers rest',
    href: '/learn',
  },
  {
    src: '/showcase/marking.png',
    label: 'Every rule, with examples',
    alt: 'A table of half mistakes with what the passage said and what was typed',
    href: '/marking-scheme',
  },
  {
    src: '/showcase/hindi.png',
    label: 'हिंदी too, at its own 30 WPM bar',
    alt: 'The same exam screen running a Hindi passage, with a 30 words per minute target',
    href: '/exam/hindi',
  },
  {
    src: '/showcase/learn.png',
    label: 'Your post, your category, your bar',
    alt: 'The course page with the exam and category chosen, showing the speed and error limits that follow',
    href: '/learn',
  },
];

const ADVANCE_MS = 5000;

export function FeatureCarousel({ className = '' }: { className?: string }) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  /* Loading the first slide eagerly and the rest only once they have been
     reached keeps the hero's largest paint to one image instead of four. */
  const [seen, setSeen] = useState<number[]>([0]);

  const go = useCallback((next: number) => {
    const i = (next + SHOTS.length) % SHOTS.length;
    setIndex(i);
    setSeen((s) => (s.includes(i) ? s : [...s, i]));
  }, []);

  const reduced = useRef(false);
  useEffect(() => {
    reduced.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced.current) setPlaying(false);
  }, []);

  useEffect(() => {
    if (!playing) return;
    const t = window.setTimeout(() => go(index + 1), ADVANCE_MS);
    return () => window.clearTimeout(t);
  }, [playing, index, go]);

  const shot = SHOTS[index];

  return (
    <div
      className={`select-none ${className}`}
      /* Stops while it is being looked at, and while a keyboard is inside it,
         so a slide cannot move out from under whoever is reading it. */
      onMouseEnter={() => setPlaying(false)}
      onMouseLeave={() => !reduced.current && setPlaying(true)}
      onFocusCapture={() => setPlaying(false)}
    >
      <div
        role="group"
        aria-roledescription="carousel"
        aria-label="What the product does"
        className="overflow-hidden rounded-xl border-2 border-vast bg-white"
      >
        <div className="relative aspect-[1200/800] w-full">
          {/* Only slides that have actually been reached are mounted, so the
              hero costs one image on arrival rather than four. A slide that is
              merely transparent is still fetched. */}
          {SHOTS.map((s, i) =>
            seen.includes(i) ? (
              <Image
                key={s.src}
                src={s.src}
                alt={s.alt}
                fill
                sizes="(min-width: 1024px) 46vw, 100vw"
                priority={i === 0}
                className={`object-cover object-top transition-opacity duration-500 ${
                  i === index ? 'opacity-100' : 'opacity-0'
                }`}
                aria-hidden={i !== index}
              />
            ) : null,
          )}
        </div>

        <Link
          href={shot.href}
          className="flex items-center gap-2 border-t-2 border-vast bg-lumen-dark px-3 py-2 text-[13px] font-bold hover:bg-accent-soft sm:text-sm"
        >
          <span className="min-w-0 flex-1 truncate">{shot.label}</span>
          <ArrowRight className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} aria-hidden />
        </Link>
      </div>

      {/* Dots, and the only controls. Arrows either side would be two more
          things to look at beside a heading that is doing the selling. */}
      <div className="mt-3 flex items-center justify-center gap-2">
        {SHOTS.map((s, i) => (
          <button
            key={s.src}
            type="button"
            onClick={() => go(i)}
            aria-label={s.label}
            aria-current={i === index}
            className={`h-2 rounded-full border-2 border-vast transition-all ${
              i === index ? 'w-6 bg-vast' : 'w-2 bg-transparent hover:bg-accent'
            }`}
          />
        ))}
      </div>

      {/* So a screen reader is told the slide changed, without the image
          swap itself stealing focus. */}
      <p aria-live="polite" className="sr-only">
        {shot.label} — slide {index + 1} of {SHOTS.length}
      </p>
    </div>
  );
}
