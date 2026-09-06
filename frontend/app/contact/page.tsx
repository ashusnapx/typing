import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Mail,
  Send,
  LifeBuoy,
  CreditCard,
  ShieldCheck,
  Bug,
  Building2,
  Clock,
  Phone,
  ArrowRight,
} from 'lucide-react';
import { APP, LEGAL, FOOTER } from '@/lib/config';

export const metadata: Metadata = {
  title: 'Contact us',
  description: `Reach the ${APP.name} team — support, billing, privacy and grievance channels, response times, and our business details.`,
  alternates: { canonical: '/contact' },
  robots: { index: true, follow: true },
};

const operator = LEGAL.legalEntityName || LEGAL.operator;

const mailto = (subject: string) =>
  `mailto:${LEGAL.supportEmail}?subject=${encodeURIComponent(subject)}`;

/** One card per reason someone writes to us, each opening a pre-titled email.
 *  A subject line that already says "Billing" is the cheapest routing there
 *  is — no ticket form, no dropdown, no account required. */
const CHANNELS = [
  {
    icon: LifeBuoy,
    title: 'Help with the product',
    body: 'A test that would not start, a lesson that will not unlock, a score you think is wrong.',
    action: LEGAL.supportEmail,
    href: mailto('Support — Typing Mania'),
    tag: `Reply within ${LEGAL.ackHours} hours`,
  },
  {
    icon: CreditCard,
    title: 'Billing and refunds',
    body: 'Payments, invoices, cancellations and refund requests. Include your transaction reference.',
    action: LEGAL.supportEmail,
    href: mailto('Billing — Typing Mania'),
    tag: 'See the refunds policy',
  },
  {
    icon: ShieldCheck,
    title: 'Privacy and your data',
    body: 'Access, correction, erasure, consent withdrawal, or nominating someone under the DPDP Act.',
    action: LEGAL.privacyEmail,
    href: mailto('Data Principal request — Typing Mania'),
    tag: `Resolved within ${LEGAL.resolveDays} days`,
  },
  {
    icon: Bug,
    title: 'A mistake in our exam data',
    body: 'A speed, duration or error cap that does not match your notification. Send the notice and the paragraph.',
    action: LEGAL.supportEmail,
    href: mailto('Exam data correction — Typing Mania'),
    tag: 'Fixed fastest of all',
  },
] as const;

/** What to include so the first reply can actually solve the problem. */
const INCLUDE = [
  'The email address on your account, if you have one.',
  'Which mode or lesson you were on, and roughly when.',
  'What you expected to happen, and what happened instead.',
  'Your browser and device — and for a payment question, the transaction reference.',
];

export default function ContactPage() {
  const telegram = FOOTER.socialLinks.find((s) => s.icon === 'Send');

  return (
    <>
      {/* ═══════════════════════════════════════════════════ hero — cream */}
      <section className="px-5 pb-14 pt-10 sm:px-8 sm:pb-16 sm:pt-16">
        <div className="mx-auto w-full max-w-content">
          <div className="max-w-3xl">
            <p className="eyebrow">Contact</p>
            <h1 className="mt-5 text-5xl sm:text-6xl lg:text-7xl">
              Write to us. <em>A person replies.</em>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-vast/70">
              There is no ticket queue and no bot. Pick the channel that matches
              your question — the subject line comes filled in — and we
              acknowledge within {LEGAL.ackHours} hours,{' '}
              {LEGAL.supportHours.toLowerCase()}.
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ channels — white slab */}
      <section className="slab slab-white">
        <div className="mx-auto w-full max-w-content px-5 sm:px-8">
          <div className="grid gap-4 sm:grid-cols-2">
            {CHANNELS.map((c) => (
              <a
                key={c.title}
                href={c.href}
                data-reveal
                className="card group flex flex-col p-6 transition-transform duration-200 ease-spring hover:-translate-y-1"
              >
                <c.icon className="h-6 w-6" strokeWidth={1.8} aria-hidden="true" />
                <h2 className="mt-4 text-2xl">{c.title}</h2>
                <p className="mt-2 flex-1 text-base leading-relaxed text-vast/60">
                  {c.body}
                </p>
                <div className="mt-6 flex items-center gap-3 border-t-2 border-vast/10 pt-4">
                  <span className="text-base font-medium underline underline-offset-4">
                    {c.action}
                  </span>
                  <ArrowRight
                    className="ml-auto h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1"
                    strokeWidth={2.2}
                    aria-hidden="true"
                  />
                </div>
                <p className="mt-3 text-sm text-vast/45">{c.tag}</p>
              </a>
            ))}
          </div>

          {/* Two things that answer faster than we can. */}
          <div className="mt-10 grid gap-4 sm:grid-cols-2" data-reveal>
            <Link
              href="/faq"
              className="card-flat flex items-center gap-4 p-5 transition-colors hover:border-vast"
            >
              <Mail className="h-5 w-5 shrink-0" strokeWidth={1.8} aria-hidden="true" />
              <span className="flex-1">
                <span className="block text-base font-medium">
                  Check the FAQ first
                </span>
                <span className="block text-sm text-vast/55">
                  Exam rules, scoring and account questions, answered.
                </span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0" strokeWidth={2.2} aria-hidden="true" />
            </Link>
            {telegram && (
              <a
                href={telegram.href}
                target="_blank"
                rel="noopener noreferrer"
                className="card-flat flex items-center gap-4 p-5 transition-colors hover:border-vast"
              >
                <Send className="h-5 w-5 shrink-0" strokeWidth={1.8} aria-hidden="true" />
                <span className="flex-1">
                  <span className="block text-base font-medium">
                    Ask the Telegram group
                  </span>
                  <span className="block text-sm text-vast/55">
                    Other aspirants, usually awake before we are.
                  </span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0" strokeWidth={2.2} aria-hidden="true" />
              </a>
            )}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════ what to send — cream */}
      <section className="slab slab-cream">
        <div className="mx-auto w-full max-w-content px-5 sm:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <div data-reveal>
              <h2 className="text-4xl sm:text-5xl">
                Four lines that save <em>four emails</em>
              </h2>
              <p className="mt-5 max-w-md text-base leading-relaxed text-vast/60">
                Most support threads are long only because the first message was
                short. Include these and the first reply is usually the last
                one.
              </p>
            </div>
            <ol className="space-y-6" data-reveal>
              {INCLUDE.map((line, i) => (
                <li key={line} className="flex gap-4">
                  <span className="tnum eyebrow shrink-0 pt-1">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="text-base leading-relaxed text-vast/70">
                    {line}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════ business details — ink */}
      <section className="on-dark slab slab-ink">
        <div className="mx-auto w-full max-w-content px-5 sm:px-8">
          <div className="grid gap-12 md:grid-cols-2 lg:gap-16">
            <div>
              <p className="eyebrow !text-cream/50">Business details</p>
              <h2 className="mt-4 text-4xl sm:text-5xl">Who you are dealing with</h2>
              <p className="mt-5 max-w-md text-base leading-relaxed text-lumen/70">
                Published under the Consumer Protection (E-Commerce) Rules, 2020
                and the Information Technology (Intermediary Guidelines and
                Digital Media Ethics Code) Rules, 2021.
              </p>
              <p className="mt-5 max-w-md text-sm leading-relaxed text-lumen/45">
                {FOOTER.legal.disclaimer}
              </p>
            </div>

            <dl className="space-y-6">
              <div className="flex gap-4">
                <Building2
                  className="mt-1 h-5 w-5 shrink-0 text-lumen/50"
                  strokeWidth={1.8}
                  aria-hidden="true"
                />
                <div>
                  <dt className="eyebrow !text-cream/50">Operated by</dt>
                  <dd className="mt-1 text-base text-lumen/80">{operator}</dd>
                  {LEGAL.registeredAddress.length > 0 && (
                    <dd className="mt-2">
                      <address className="not-italic text-base leading-relaxed text-lumen/70">
                        {LEGAL.registeredAddress.map((line) => (
                          <span key={line} className="block">
                            {line}
                          </span>
                        ))}
                      </address>
                    </dd>
                  )}
                  {LEGAL.gstin && (
                    <dd className="tnum mt-2 text-sm text-lumen/60">
                      GSTIN {LEGAL.gstin}
                    </dd>
                  )}
                </div>
              </div>

              <div className="flex gap-4">
                <Mail
                  className="mt-1 h-5 w-5 shrink-0 text-lumen/50"
                  strokeWidth={1.8}
                  aria-hidden="true"
                />
                <div>
                  <dt className="eyebrow !text-cream/50">Email</dt>
                  <dd className="mt-1">
                    <a
                      href={`mailto:${LEGAL.supportEmail}`}
                      className="text-base text-lumen/80 underline underline-offset-4 hover:text-lumen"
                    >
                      {LEGAL.supportEmail}
                    </a>
                  </dd>
                </div>
              </div>

              {LEGAL.phone && (
                <div className="flex gap-4">
                  <Phone
                    className="mt-1 h-5 w-5 shrink-0 text-lumen/50"
                    strokeWidth={1.8}
                    aria-hidden="true"
                  />
                  <div>
                    <dt className="eyebrow !text-cream/50">Phone</dt>
                    <dd className="mt-1">
                      <a
                        href={`tel:${LEGAL.phone.replace(/\s/g, '')}`}
                        className="tnum text-base text-lumen/80 underline underline-offset-4 hover:text-lumen"
                      >
                        {LEGAL.phone}
                      </a>
                    </dd>
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <Clock
                  className="mt-1 h-5 w-5 shrink-0 text-lumen/50"
                  strokeWidth={1.8}
                  aria-hidden="true"
                />
                <div>
                  <dt className="eyebrow !text-cream/50">Support hours</dt>
                  <dd className="mt-1 text-base text-lumen/80">
                    {LEGAL.supportHours}
                  </dd>
                </div>
              </div>

              <div className="flex gap-4">
                <ShieldCheck
                  className="mt-1 h-5 w-5 shrink-0 text-lumen/50"
                  strokeWidth={1.8}
                  aria-hidden="true"
                />
                <div>
                  <dt className="eyebrow !text-cream/50">Grievance officer</dt>
                  {LEGAL.grievanceOfficer && (
                    <dd className="mt-1 text-base text-lumen/80">
                      {LEGAL.grievanceOfficer}
                    </dd>
                  )}
                  <dd className="mt-1">
                    <a
                      href={mailto('Grievance — Typing Mania')}
                      className="text-base text-lumen/80 underline underline-offset-4 hover:text-lumen"
                    >
                      {LEGAL.grievanceEmail}
                    </a>
                  </dd>
                  <dd className="mt-2 text-sm leading-relaxed text-lumen/55">
                    Complaints acknowledged within {LEGAL.ackHours} hours and
                    resolved within {LEGAL.resolveDays} days. If our answer does
                    not satisfy you, you may approach the Data Protection Board
                    of India for a data grievance, or the National Consumer
                    Helpline on 1915 for a service one.
                  </dd>
                </div>
              </div>
            </dl>
          </div>

          <div className="mt-14 flex flex-wrap gap-x-6 gap-y-3 border-t border-lumen/15 pt-6 text-base">
            {[
              { href: '/privacy', label: 'Privacy policy' },
              { href: '/terms', label: 'Terms of service' },
              { href: '/refunds', label: 'Cancellation & refunds' },
              { href: '/about', label: 'About us' },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-lumen/70 transition-colors hover:text-lumen"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
