'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Youtube, Instagram, Send, Github, ExternalLink } from 'lucide-react';
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
    <footer className="slab bg-accent text-vast !pb-10 !pt-14">
      <div className="mx-auto w-full max-w-content px-5 sm:px-8">
        <div className="grid gap-8 sm:grid-cols-3">
          {groups.map((group) => (
            <div key={group.title}>
              <h2 className="eyebrow">{group.title}</h2>
              <ul className="mt-3 space-y-2">
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
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-t-2 border-vast/20 pt-5">
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

        <p className="mt-3 text-xs leading-relaxed text-vast/60">
          {APP.name} is not affiliated with the Staff Selection Commission.
        </p>
      </div>
    </footer>
  );
}
