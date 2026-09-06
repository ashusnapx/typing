'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Check } from 'lucide-react';
import { APP } from '@/lib/config';
import { PeekingTypist } from './peeking-typist';

/**
 * Split layout for sign in and sign up.
 *
 * A single centred card pushed the submit button below the fold on sign-up,
 * once name, email, password and the benefit list were stacked — you had to
 * scroll to reach the thing you came to press. Splitting the screen moves
 * everything that is not the form onto its own panel, which keeps the form
 * short enough to fit at any normal viewport height.
 *
 * The panel is hidden below `lg`, where a second column would only push the
 * form down again.
 */

const PROOF = [
  'Scored with the official SSC error engine',
  'Your speed history and full mistake report',
  'Free — and you can practise without an account',
];

export function AuthShell({
  title,
  subtitle,
  panelTitle,
  children,
  footer,
}: {
  title: React.ReactNode;
  subtitle?: string;
  /** Headline for the illustration panel. */
  panelTitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* ------------------------------------------------------------ panel */}
      <aside className="on-dark relative hidden flex-col justify-between overflow-hidden bg-fathom p-12 lg:flex xl:p-16">
        <Link href="/" className="relative z-10 flex items-center gap-2.5">
          <Image
            src={APP.logo}
            alt=""
            width={32}
            height={32}
            className="h-8 w-8 rounded-md"
          />
          <span className="font-display text-2xl leading-none text-lumen">
            {APP.name}
          </span>
        </Link>

        <div className="relative z-10 max-w-md">
          <h2 className="text-4xl text-lumen xl:text-5xl">
            {panelTitle ?? (
              <>
                Find out where you <em>really stand</em>
              </>
            )}
          </h2>
          <ul className="mt-8 space-y-3.5">
            {PROOF.map((p) => (
              <li key={p} className="flex items-start gap-3">
                <Check
                  className="mt-1 h-4 w-4 shrink-0 text-lumen"
                  strokeWidth={2.5}
                  aria-hidden
                />
                <span className="text-base leading-relaxed text-lumen/80">
                  {p}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Bled off the bottom-right corner so it frames the panel rather than
            sitting in the middle of it. */}
        <PeekingTypist className="pointer-events-none absolute -bottom-14 -right-14 h-auto w-72 select-none xl:w-80" />
      </aside>

      {/* ------------------------------------------------------------- form */}
      <div className="flex items-center justify-center bg-lumen px-5 py-12 sm:px-10">
        <div className="w-full max-w-sm">
          {/* The mark only appears here on small screens, where the panel that
              normally carries it is hidden. */}
          <Link
            href="/"
            className="mb-9 flex items-center justify-center gap-2.5 lg:hidden"
          >
            <Image
              src={APP.logo}
              alt=""
              width={30}
              height={30}
              className="h-[30px] w-[30px] rounded-md"
            />
            <span className="font-display text-xl leading-none">{APP.name}</span>
          </Link>

          <h1 className="text-4xl sm:text-5xl">{title}</h1>
          {subtitle && <p className="mt-3 text-base text-vast/60">{subtitle}</p>}

          <div className="mt-9">{children}</div>

          {footer && <div className="mt-8">{footer}</div>}

          <p className="mt-8 text-sm text-vast/50">
            You don&rsquo;t need an account to practise.{' '}
            <Link
              href="/exam"
              className="underline underline-offset-4 hover:text-vast"
            >
              Take a test without signing in
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
