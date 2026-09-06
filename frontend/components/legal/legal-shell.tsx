import type { ReactNode } from 'react';
import Link from 'next/link';
import { LEGAL, formatPolicyDate } from '@/lib/config';

/* -------------------------------------------------------------------------- */
/*  Prose primitives                                                          */
/* -------------------------------------------------------------------------- */
/*  Legal copy is long, so it gets its own small set of typographic pieces
 *  rather than a `prose` plugin — the design system has no shadows, no blue
 *  links and a 2px border language that a generic typography reset fights. */

export function P({ children }: { children: ReactNode }) {
  return (
    <p className="mt-4 text-base leading-relaxed text-vast/70 first:mt-0">
      {children}
    </p>
  );
}

export function Bullets({ items }: { items: ReadonlyArray<ReactNode> }) {
  return (
    <ul className="mt-4 space-y-2.5">
      {items.map((item, i) => (
        <li
          key={i}
          className="relative pl-6 text-base leading-relaxed text-vast/70"
        >
          <span
            aria-hidden="true"
            className="absolute left-0 top-[0.6em] h-1.5 w-1.5 rounded-full bg-vast/40"
          />
          {item}
        </li>
      ))}
    </ul>
  );
}

/** A two-column table for anything with a shape — data categories, retention
 *  periods, refund cases. Scrolls on its own rather than breaking the page. */
export function KeyTable({
  head,
  rows,
}: {
  head: readonly [string, string];
  rows: ReadonlyArray<readonly [ReactNode, ReactNode]>;
}) {
  return (
    <div className="mt-5 overflow-x-auto rounded-xl border-2 border-vast/15">
      <table className="w-full min-w-[30rem] text-left">
        <thead>
          <tr className="border-b-2 border-vast/15 bg-vast/[0.03]">
            {head.map((h) => (
              <th key={h} scope="col" className="eyebrow px-4 py-3">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-vast/10 last:border-0">
              <th
                scope="row"
                className="w-2/5 px-4 py-3.5 align-top text-base font-medium"
              >
                {row[0]}
              </th>
              <td className="px-4 py-3.5 align-top text-base leading-relaxed text-vast/70">
                {row[1]}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Anything a reader must not skim past — a disclaimer, a deadline, a limit. */
export function Note({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <div className="card-flat mt-5 p-5">
      {title && <p className="eyebrow">{title}</p>}
      <div className={title ? 'mt-2' : undefined}>{children}</div>
    </div>
  );
}

/** Statutory references are cited inline so a reader can check the claim. */
export function Cite({ children }: { children: ReactNode }) {
  return <span className="text-vast/45">{children}</span>;
}

export function MailLink({
  address,
  subject,
  children,
}: {
  address: string;
  subject?: string;
  children?: ReactNode;
}) {
  const href = subject
    ? `mailto:${address}?subject=${encodeURIComponent(subject)}`
    : `mailto:${address}`;
  return (
    <a href={href} className="font-medium underline underline-offset-4">
      {children ?? address}
    </a>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page shell                                                                */
/* -------------------------------------------------------------------------- */

export type LegalSection = {
  /** Anchor id — also what the contents list links to. */
  id: string;
  title: string;
  body: ReactNode;
};

/** The address block only renders the lines that exist, so an unfilled
 *  registered address never ships as an empty heading or a placeholder. */
export function RegisteredAddress() {
  if (LEGAL.registeredAddress.length === 0) return null;
  return (
    <address className="mt-1 not-italic text-base leading-relaxed text-vast/70">
      {LEGAL.registeredAddress.map((line) => (
        <span key={line} className="block">
          {line}
        </span>
      ))}
    </address>
  );
}

export function LegalPage({
  eyebrow,
  title,
  lead,
  sections,
}: {
  eyebrow: string;
  title: ReactNode;
  lead: string;
  sections: ReadonlyArray<LegalSection>;
}) {
  return (
    <>
      <section className="px-5 pb-14 pt-10 sm:px-8 sm:pb-20 sm:pt-16">
        <div className="mx-auto w-full max-w-content">
          <div className="max-w-3xl">
            <p className="eyebrow">{eyebrow}</p>
            <h1 className="mt-5 text-5xl sm:text-6xl lg:text-7xl">{title}</h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-vast/70">
              {lead}
            </p>
            <dl className="mt-8 flex flex-wrap gap-x-8 gap-y-3 border-t-2 border-vast/10 pt-6 text-sm">
              <div>
                <dt className="eyebrow">Version</dt>
                <dd className="tnum mt-1 text-base">{LEGAL.policyVersion}</dd>
              </div>
              <div>
                <dt className="eyebrow">Effective</dt>
                <dd className="mt-1 text-base">
                  {formatPolicyDate(LEGAL.effectiveDate)}
                </dd>
              </div>
              <div>
                <dt className="eyebrow">Last updated</dt>
                <dd className="mt-1 text-base">
                  {formatPolicyDate(LEGAL.lastUpdated)}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <section className="slab slab-white">
        <div className="mx-auto w-full max-w-content px-5 sm:px-8">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] lg:gap-16">
            {/* Plain anchors — the contents work with JS off, and on mobile
                they simply sit above the document instead of sticking. */}
            <nav aria-label="On this page" className="lg:sticky lg:top-24 lg:self-start">
              <h2 className="eyebrow">On this page</h2>
              <ol className="mt-4 space-y-2">
                {sections.map((s, i) => (
                  <li key={s.id} className="flex gap-3">
                    <span className="tnum shrink-0 text-sm text-vast/35">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <a
                      href={`#${s.id}`}
                      className="text-base leading-snug text-vast/60 underline-offset-4 transition-colors hover:text-vast hover:underline"
                    >
                      {s.title}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>

            <div className="max-w-2xl">
              {sections.map((s, i) => (
                <section
                  key={s.id}
                  id={s.id}
                  className="scroll-mt-24 border-t-2 border-vast/10 pt-10 first:border-0 first:pt-0 [&+section]:mt-12"
                >
                  <span className="tnum eyebrow">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h2 className="mt-3 text-3xl sm:text-4xl">{s.title}</h2>
                  <div className="mt-5">{s.body}</div>
                </section>
              ))}
            </div>
          </div>
        </div>
      </section>

      <LegalFooterStrip />
    </>
  );
}

/** Every policy ends the same way: who to write to, and where the other
 *  policies are. Repeated per page because readers arrive by deep link. */
export function LegalFooterStrip() {
  const others = [
    { href: '/privacy', label: 'Privacy policy' },
    { href: '/terms', label: 'Terms of service' },
    { href: '/refunds', label: 'Cancellation & refunds' },
    { href: '/contact', label: 'Contact & grievances' },
  ];

  return (
    <section className="on-dark slab slab-ink">
      <div className="mx-auto w-full max-w-content px-5 sm:px-8">
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <h2 className="text-3xl sm:text-4xl">Questions about this policy?</h2>
            <p className="mt-4 max-w-md text-base leading-relaxed text-lumen/70">
              Write to us and we will acknowledge within {LEGAL.ackHours} hours
              and resolve within {LEGAL.resolveDays} days.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={`mailto:${LEGAL.supportEmail}`}
                className="btn btn-cream btn-md"
              >
                {LEGAL.supportEmail}
              </a>
              <Link href="/contact" className="btn btn-outline btn-md">
                Contact page
              </Link>
            </div>
          </div>
          <div className="md:justify-self-end">
            <h3 className="eyebrow !text-cream/50">Other policies</h3>
            <ul className="mt-4 space-y-2.5">
              {others.map((o) => (
                <li key={o.href}>
                  <Link
                    href={o.href}
                    className="text-base text-lumen/70 transition-colors hover:text-lumen"
                  >
                    {o.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
