'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Youtube, Instagram, Send, Github, ExternalLink } from 'lucide-react';
import { APP, FOOTER } from '@/lib/config';
import { HealthIndicator } from '@/components/health-indicator';

const SOCIAL_ICONS = { Youtube, Instagram, Send, Github } as const;

/** Screens that own the whole viewport. A footer under a live timed exam is
 *  both a distraction and an escape hatch out of the test; under an auth form
 *  it is a wall of links away from the one thing the page is for. */
function isImmersive(pathname: string): boolean {
  return pathname.startsWith('/exam/') || pathname.startsWith('/auth/');
}

function LinkColumn({
  title,
  links,
}: {
  title: string;
  links: ReadonlyArray<{ readonly label: string; readonly href: string }>;
}) {
  return (
    <div>
      <h3 className="eyebrow !text-cream/50">{title}</h3>
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <li key={link.href + link.label}>
            <Link
              href={link.href}
              className="text-base text-lumen/70 transition-colors hover:text-lumen"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SiteFooter() {
  const pathname = usePathname();
  if (isImmersive(pathname)) return null;

  return (
    <footer className="on-dark slab slab-ink !pb-10">
      <div className="mx-auto w-full max-w-content px-5 sm:px-8">
        <div className="grid gap-12 md:grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(0,1fr))]">
          <div className="max-w-sm">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <Image
                src={APP.logo}
                alt=""
                width={30}
                height={30}
                className="h-[30px] w-[30px] rounded-md"
              />
              <span className="font-display text-2xl leading-none">
                {APP.name}
              </span>
            </Link>
            <p className="mt-4 text-base leading-relaxed text-lumen/70">
              {FOOTER.description}
            </p>
            <div className="mt-6 flex items-center gap-2">
              {FOOTER.socialLinks.map((link) => {
                const Icon =
                  SOCIAL_ICONS[link.icon as keyof typeof SOCIAL_ICONS] ??
                  ExternalLink;
                return (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={link.label}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-lumen/25 text-lumen/70 transition-colors hover:border-lumen hover:text-lumen"
                  >
                    <Icon className="h-4 w-4" strokeWidth={1.8} />
                  </a>
                );
              })}
            </div>
          </div>

          <LinkColumn title="Exams" links={FOOTER.examLinks} />
          <LinkColumn title="Practice" links={FOOTER.quickLinks} />
          <LinkColumn title="Company" links={FOOTER.companyLinks} />
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-lumen/15 pt-6 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm text-lumen/60">{FOOTER.legal.copyright}</p>
            <p className="mt-1 max-w-prose text-xs leading-relaxed text-lumen/40">
              {FOOTER.legal.disclaimer}
            </p>
          </div>
          <HealthIndicator />
        </div>
      </div>
    </footer>
  );
}
