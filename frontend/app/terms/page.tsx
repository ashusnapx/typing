import type { Metadata } from 'next';
import Link from 'next/link';
import { APP, LEGAL, PLANS } from '@/lib/config';
import {
  Bullets,
  KeyTable,
  LegalPage,
  MailLink,
  Note,
  P,
  RegisteredAddress,
  type LegalSection,
} from '@/components/legal/legal-shell';

export const metadata: Metadata = {
  title: 'Terms of service',
  description: `The agreement between you and ${APP.name}: what the service does, what it does not promise, acceptable use, billing, liability and how disputes are handled.`,
  alternates: { canonical: '/terms' },
  robots: { index: true, follow: true },
};

const operator = LEGAL.legalEntityName || LEGAL.operator;
const forum = LEGAL.jurisdictionCity
  ? `the courts at ${LEGAL.jurisdictionCity}`
  : 'the courts of competent jurisdiction in India';

const SECTIONS: ReadonlyArray<LegalSection> = [
  {
    id: 'agreement',
    title: 'The agreement',
    body: (
      <>
        <P>
          These terms are a binding agreement between you and {operator}, which
          publishes {APP.name} at {APP.url}. By using the site — with or without
          an account — you accept them. If you do not accept them, please do not
          use the service.
        </P>
        <P>
          They should be read together with our{' '}
          <Link href="/privacy" className="font-medium underline underline-offset-4">
            privacy policy
          </Link>{' '}
          and{' '}
          <Link href="/refunds" className="font-medium underline underline-offset-4">
            cancellation and refunds policy
          </Link>
          , which form part of this agreement.
        </P>
        {LEGAL.registeredAddress.length > 0 && (
          <Note title="Registered office">
            <RegisteredAddress />
          </Note>
        )}
      </>
    ),
  },
  {
    id: 'what-this-is',
    title: 'What the service is',
    body: (
      <>
        <P>
          {APP.name} is a practice platform. It provides typing lessons, timed
          skill-test simulations modelled on published SSC requirements, an
          evaluation engine that applies the Commission&rsquo;s full and half
          mistake rules, mistake-by-mistake review, progress tracking and
          coaching feedback.
        </P>
        <Note title="What it is not">
          <Bullets
            items={[
              <>
                We are <strong className="font-semibold text-vast">not affiliated with, endorsed by, or connected to</strong>{' '}
                the Staff Selection Commission, Eduquity Careers, TCS iON, or any
                government body or examination agency. All such names are used
                only to describe the examination a mode is modelled on, and
                remain the property of their owners.
              </>,
              'We do not conduct examinations, issue admit cards, publish results, or influence any selection process in any way.',
              'A score here is an indication of your practice performance. It is not a prediction of your result, not a guarantee of qualification, and carries no official standing.',
              'Speed and error requirements are reproduced from published notices and guidelines and can change. Always confirm them against the notice for your own examination.',
            ]}
          />
        </Note>
      </>
    ),
  },
  {
    id: 'eligibility',
    title: 'Eligibility and your account',
    body: (
      <>
        <Bullets
          items={[
            'You must be 18 or older, or use the service under the supervision of a parent or lawful guardian who accepts these terms on your behalf.',
            'Give accurate account details and keep them current. One person, one account.',
            'You are responsible for everything done through your account. Keep your password to yourself and tell us at once if you suspect it has been compromised.',
            'Accounts are personal. You may not sell, share, rent or transfer yours, and shared logins may be suspended.',
          ]}
        />
      </>
    ),
  },
  {
    id: 'acceptable-use',
    title: 'Acceptable use',
    body: (
      <>
        <P>You agree not to:</P>
        <Bullets
          items={[
            'Use automation, macros, scripts, injected input or any other device to produce keystrokes you did not type — on a test, a lesson or a leaderboard.',
            'Tamper with, falsify or replay results, or otherwise misrepresent your performance.',
            'Copy, scrape, republish or resell passages, lessons, analysis or any other part of the service.',
            'Reverse engineer, decompile or probe the evaluation engine, except where that right cannot lawfully be excluded.',
            'Attack, overload, penetration-test or interfere with the service or the infrastructure it runs on.',
            'Upload or transmit anything unlawful, defamatory, obscene, infringing, or harmful — including in a display name, profile field or support message.',
            'Impersonate anyone, or use the service to breach any Indian law or any third party’s rights.',
          ]}
        />
        <P>
          Leaderboards are moderated. We may remove entries, reset scores or
          suspend accounts where we reasonably believe a result was not honestly
          typed.
        </P>
      </>
    ),
  },
  {
    id: 'plans',
    title: 'Plans, pricing and billing',
    body: (
      <>
        <P>
          Core practice is free. Paid plans unlock additional features and are
          billed in advance for the period you choose. Prices are in Indian
          rupees and include applicable taxes unless stated otherwise at
          checkout.
        </P>
        <KeyTable
          head={['Plan', 'Price']}
          rows={Object.values(PLANS).map(
            (plan) =>
              [
                plan.label,
                plan.price === 0
                  ? 'Free'
                  : `₹${plan.price.toLocaleString('en-IN')} for ${plan.durationDays} days`,
              ] as const
          )}
        />
        <Bullets
          items={[
            'Payments are collected by a PCI-DSS compliant payment gateway. We never receive or store your card, UPI or net-banking credentials.',
            'Where a plan renews automatically, we will say so before you pay and you can cancel renewal at any time from your account.',
            'We may change prices for future periods. A change never affects a period you have already paid for, and we will give notice before it applies to you.',
            'Access to a paid feature may be suspended if a payment fails or is charged back.',
          ]}
        />
        <P>
          Cancellations and refunds are governed by the{' '}
          <Link href="/refunds" className="font-medium underline underline-offset-4">
            cancellation and refunds policy
          </Link>
          .
        </P>
      </>
    ),
  },
  {
    id: 'ip',
    title: 'Intellectual property',
    body: (
      <>
        <P>
          The software, design, curriculum, drills, original passages,
          evaluation logic and all other material we publish belong to{' '}
          {operator} or its licensors and are protected by copyright and other
          laws. Using the service gives you a personal, non-exclusive,
          non-transferable, revocable licence to use it for your own exam
          preparation, and nothing more.
        </P>
        <P>
          Passages drawn from government notices, official publications or other
          public sources remain the property of their respective owners and are
          used for practice purposes. If you own material you believe has been
          used improperly, write to{' '}
          <MailLink
            address={LEGAL.grievanceEmail}
            subject="Copyright notice — Typing Mania"
          />{' '}
          with enough detail to identify it and we will act promptly.
        </P>
      </>
    ),
  },
  {
    id: 'your-content',
    title: 'What you type',
    body: (
      <P>
        Whatever you type in a test stays yours. You give us a limited licence
        to store and process it so that we can score it, show you your review,
        build your progress history and generate coaching feedback — the
        purposes set out in the{' '}
        <Link href="/privacy" className="font-medium underline underline-offset-4">
          privacy policy
        </Link>
        . We do not publish it, and we do not use it to identify you.
      </P>
    ),
  },
  {
    id: 'availability',
    title: 'Availability and changes',
    body: (
      <>
        <P>
          We work to keep the service available and accurate, but we provide it
          on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis. Features may be added,
          changed, moved behind a plan, or withdrawn. Maintenance, outages at our
          providers, or events beyond our reasonable control may interrupt
          access.
        </P>
        <P>
          If we withdraw a paid feature materially and permanently during a
          period you have paid for, you may ask for a pro-rata refund of the
          unused part of that period.
        </P>
        <P>
          The service links to third-party sites, including official SSC pages.
          We do not control them and are not responsible for their content or
          practices.
        </P>
      </>
    ),
  },
  {
    id: 'disclaimers',
    title: 'Disclaimers',
    body: (
      <>
        <P>
          To the fullest extent the law allows, we disclaim all warranties,
          express or implied, including merchantability, fitness for a
          particular purpose and non-infringement. In particular we do not
          warrant that:
        </P>
        <Bullets
          items={[
            'The service will be uninterrupted, timely, error-free or free of harmful components.',
            'Practising here will cause you to qualify in any examination, or produce any particular score.',
            'Every requirement reproduced here matches the notice governing your examination on the day you sit it.',
          ]}
        />
        <P>
          Nothing in these terms excludes any right you have as a consumer under
          the Consumer Protection Act, 2019, or any liability that cannot
          lawfully be excluded.
        </P>
      </>
    ),
  },
  {
    id: 'liability',
    title: 'Limitation of liability and indemnity',
    body: (
      <>
        <P>
          To the extent permitted by law, neither {operator} nor its team will
          be liable for any indirect, incidental, special or consequential loss,
          nor for loss of opportunity, examination outcome, employment, data or
          goodwill, arising out of your use of the service.
        </P>
        <P>
          Our total aggregate liability arising out of or in connection with the
          service is limited to the amount you paid us in the twelve months
          before the event giving rise to the claim, or ₹1,000, whichever is
          higher.
        </P>
        <P>
          You agree to indemnify us against claims, losses and reasonable costs
          arising from your breach of these terms, your misuse of the service,
          or your infringement of anyone else&rsquo;s rights.
        </P>
      </>
    ),
  },
  {
    id: 'termination',
    title: 'Suspension and termination',
    body: (
      <>
        <P>
          You may stop using the service and delete your account at any time
          from your account settings. Deleting an account does not by itself
          entitle you to a refund; the refunds policy governs that.
        </P>
        <P>
          We may suspend or terminate an account, with notice where practicable,
          if these terms are breached, if a result appears to have been
          manipulated, if payment is not made, or if we are required to by law.
          Where we terminate without cause during a paid period, we refund the
          unused part of that period.
        </P>
      </>
    ),
  },
  {
    id: 'grievances',
    title: 'Grievances',
    body: (
      <>
        <P>
          If something about the service, your data or any content on it
          concerns you, raise it with our grievance officer first. Under the
          Information Technology (Intermediary Guidelines and Digital Media
          Ethics Code) Rules, 2021 and the Consumer Protection (E-Commerce)
          Rules, 2020, we will acknowledge your complaint within{' '}
          {LEGAL.ackHours} hours and resolve it within {LEGAL.resolveDays} days.
        </P>
        <P>
          Write to{' '}
          <MailLink
            address={LEGAL.grievanceEmail}
            subject="Grievance — Typing Mania"
          />
          {LEGAL.grievanceOfficer ? `, attention ${LEGAL.grievanceOfficer}` : ''}
          , or use the{' '}
          <Link href="/contact" className="font-medium underline underline-offset-4">
            contact page
          </Link>
          .
        </P>
      </>
    ),
  },
  {
    id: 'law',
    title: 'Governing law and disputes',
    body: (
      <P>
        These terms are governed by the laws of {LEGAL.governingLaw}. Any
        dispute will be subject to the exclusive jurisdiction of {forum}. We
        both agree to try in good faith to settle a dispute through the
        grievance process above before starting proceedings.
      </P>
    ),
  },
  {
    id: 'changes',
    title: 'Changes to these terms',
    body: (
      <P>
        We may update these terms as the service and the law change. The version
        and date at the top of this page always reflect the current text. If a
        change is material we will give notice by email or in the product before
        it takes effect. Continuing to use the service after that means you
        accept the new terms; if you do not, you may close your account and ask
        for a refund of any unused paid period.
      </P>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title={
        <>
          Terms of <em>service</em>
        </>
      }
      lead={`The agreement between you and ${operator}. It covers what ${APP.name} does, what it deliberately does not promise, how accounts and payments work, and how to raise a grievance.`}
      sections={SECTIONS}
    />
  );
}
