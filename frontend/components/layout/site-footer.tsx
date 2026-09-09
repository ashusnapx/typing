'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Youtube, Instagram, Send, Github, ExternalLink } from 'lucide-react';
import { Brand } from '@/components/layout/brand';
import { APP, FOOTER } from '@/lib/config';

const SOCIAL_ICONS = { Youtube, Instagram, Send, Github } as const;

/** Screens that own the whole viewport. A footer under a live timed exam is
 *  both a distraction and an escape hatch out of the test; under an auth form
 *  it is a wall of links away from the one thing the page is for. */
function isImmersive(pathname: string): boolean {
  return pathname.startsWith('/exam/') || pathname.startsWith('/auth/');
}

/**
 * The footer, in yellow.
 *
 * It was a dark slab carrying four columns and twenty-one links — every exam
 * variant, an account column duplicating the navbar, a health indicator, a
 * logo, a strapline and a disclaimer. Most of it was there because footers
 * usually have it, not because anyone needed it.
 *
 * Nine links now, in three groups a candidate would actually go looking for,
 * and it is the one place the accent runs at full size: the end of the page is
 * where a block of yellow costs nothing and marks the edge clearly.
 */
export function SiteFooter() {
  const pathname = usePathname();
  if (isImmersive(pathname)) return null;

  const groups = [
    { title: 'Tests', links: FOOTER.examLinks },
    { title: 'Practice', links: FOOTER.quickLinks },
    { title: 'Company', links: FOOTER.companyLinks },
  ];

  return (
    /* A slab like every other section, so it carries the same rounded seam.
       Butted against the section above as a plain rectangle it read as cut
       off. */
    /* `[&::after]:hidden` kills the skirt.

       Every slab paints five rems of its own colour below itself, so the next
       section's rounded corners reveal it rather than the page background.
       Nothing follows the footer, so on this one the skirt was simply eighty
       pixels of yellow hanging off the bottom of every page — the empty band
       under the disclaimer. */
    <footer className="slab bg-accent text-vast !pb-4 !pt-8 sm:!pt-9 [&::after]:hidden">
      <div className="mx-auto w-full max-w-content px-5 sm:px-8">
        {/* Three link groups, and the mark in the space to their right.

            On a phone the three groups stacked into one column and the mark
            took a row of its own — nine links and a lockup end to end, which
            ran to three quarters of the viewport. Two columns fit the labels
            at 390px and leave a fourth cell, which is exactly where the mark
            goes, so nothing is dropped to buy the height back. */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-3 sm:gap-x-8 sm:gap-y-6 lg:grid-cols-[repeat(3,auto)_1fr]">
          {groups.map((group) => (
            <div key={group.title}>
              <h2 className="eyebrow">{group.title}</h2>
              <ul className="mt-2.5 space-y-1.5">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-[15px] underline-offset-4 hover:underline"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <Link
            href="/"
            aria-label={`${APP.name} — home`}
            className="flex items-center gap-3 justify-self-end self-end sm:col-span-3 sm:self-start lg:col-span-1"
          >
            <Brand />
          </Link>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 border-t-2 border-vast/20 pt-3.5">
          <p className="text-sm">{FOOTER.legal.copyright}</p>
          <div className="ml-auto flex items-center gap-3">
            {FOOTER.socialLinks.map((link) => {
              const Icon =
                SOCIAL_ICONS[link.icon as keyof typeof SOCIAL_ICONS] ?? ExternalLink;
              return (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={link.label}
                  className="transition-opacity hover:opacity-60"
                >
                  <Icon className="h-4 w-4" strokeWidth={1.8} aria-hidden />
                </a>
              );
            })}
          </div>
        </div>

        <p className="mt-2 text-xs leading-relaxed text-vast/60">
          {APP.name} is not affiliated with the Staff Selection Commission.
        </p>
      </div>
    </footer>
  );
}
