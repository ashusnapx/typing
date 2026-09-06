import type { Metadata } from 'next';
import Link from 'next/link';
import { APP, LEGAL } from '@/lib/config';
import {
  Bullets,
  Cite,
  KeyTable,
  LegalPage,
  MailLink,
  Note,
  P,
  RegisteredAddress,
  type LegalSection,
} from '@/components/legal/legal-shell';

export const metadata: Metadata = {
  title: 'Privacy policy',
  description: `How ${APP.name} collects, uses, shares and protects your personal data under India's Digital Personal Data Protection Act, 2023, and your rights as a Data Principal.`,
  alternates: { canonical: '/privacy' },
  robots: { index: true, follow: true },
};

const operator = LEGAL.legalEntityName || LEGAL.operator;

/* Drafted against the Digital Personal Data Protection Act, 2023 and the DPDP
 * Rules, 2025 (notified 13 November 2025). The Act's notice requirements —
 * itemised data, one purpose per activity, an equally easy way to withdraw
 * consent, the five Data Principal rights and a named grievance channel — are
 * why this document is structured the way it is rather than as generic prose. */
const SECTIONS: ReadonlyArray<LegalSection> = [
  {
    id: 'who-we-are',
    title: 'Who we are',
    body: (
      <>
        <P>
          {APP.name} is a typing practice and skill-test simulator for SSC
          examinations, published by {operator}. In the language of the Digital
          Personal Data Protection Act, 2023, we are the{' '}
          <strong className="font-semibold text-vast">Data Fiduciary</strong>{' '}
          for the personal data described here, and you are the{' '}
          <strong className="font-semibold text-vast">Data Principal</strong>.
        </P>
        <P>
          This policy covers {APP.url} and every page under it. It applies
          whether you use the site signed out, with a free account, or on a paid
          plan.
        </P>
        {LEGAL.registeredAddress.length > 0 && (
          <Note title="Registered office">
            <RegisteredAddress />
          </Note>
        )}
        <Note title="In one paragraph">
          <P>
            We collect the minimum needed to run a typing test and show you your
            progress: an email address if you make an account, and what you
            typed while a test was running. We do not sell personal data, we do
            not run advertising networks on the site, and you can delete your
            account and its data at any time.
          </P>
        </Note>
      </>
    ),
  },
  {
    id: 'what-we-collect',
    title: 'What we collect',
    body: (
      <>
        <P>
          Each row below is a category we actually store, not a catch-all list
          copied from a template. If a category is not listed, we do not collect
          it.
        </P>
        <KeyTable
          head={['Category', 'What it contains']}
          rows={[
            [
              'Account data',
              'Email address, display name, and a securely hashed password (or the identifier returned by your sign-in provider). Optional profile fields such as your state, city or institution, only if you enter them.',
            ],
            [
              'Exam preferences',
              'The post you are preparing for, your category, medium (English or Hindi) and whether you are eligible for compensatory time. These drive your targets.',
            ],
            [
              'Test data',
              'The passage served, the text you typed, per-keystroke timings, corrections and pauses, and the resulting speed, error and accuracy figures.',
            ],
            [
              'Progress data',
              'Lessons completed, practice history, streaks, experience points and per-key accuracy built up over time.',
            ],
            [
              'Technical data',
              'IP address, browser and device type, and timestamps in server and security logs. Used for reliability and abuse prevention, and kept for a short period.',
            ],
            [
              'Payment data',
              'If you buy a plan: the plan, amount, date and the transaction reference from our payment gateway. Card numbers, UPI credentials and net-banking details are entered on the gateway and are never received or stored by us.',
            ],
            [
              'Support data',
              'The content of emails or messages you send us, so we can answer them.',
            ],
          ]}
        />
        <Note title="Sensitive by nature">
          <P>
            Keystroke timing is detailed data. It exists so that mistake-by-
            mistake review and weak-key analysis are possible at all — it is
            never used to identify you by typing pattern, and it is deleted with
            the test it belongs to.
          </P>
        </Note>
      </>
    ),
  },
  {
    id: 'why-we-process',
    title: 'Why we process it',
    body: (
      <>
        <P>
          The DPDP Act requires a specific purpose for each processing activity
          rather than one blanket permission. Ours are:
        </P>
        <KeyTable
          head={['Purpose', 'Data used']}
          rows={[
            ['Create and secure your account', 'Account data, technical data'],
            [
              'Run a test and score it against your post’s requirement',
              'Exam preferences, test data',
            ],
            [
              'Show your result, mistake review and progress over time',
              'Test data, progress data',
            ],
            [
              'Generate coaching feedback and targeted drills',
              'Test data, progress data',
            ],
            [
              'Show leaderboard rankings, where you have opted in',
              'Display name, chosen scope (state, city, institution), best scores',
            ],
            [
              'Take payment, issue receipts and honour refunds',
              'Account data, payment data',
            ],
            [
              'Keep the service available and prevent abuse',
              'Technical data',
            ],
            [
              'Answer your questions and grievances',
              'Support data, account data',
            ],
            [
              'Meet legal, tax and accounting obligations',
              'Payment data, account data',
            ],
          ]}
        />
        <P>
          We do not use your data for behavioural advertising, we do not build
          advertising profiles, and we do not sell or rent personal data to
          anyone.
        </P>
      </>
    ),
  },
  {
    id: 'consent',
    title: 'Consent, and withdrawing it',
    body: (
      <>
        <P>
          Where the law requires consent, we ask for it by a clear affirmative
          action — an unticked box you tick, or a button you press. We never
          treat silence, a pre-ticked box or continued browsing as consent.
        </P>
        <P>
          Some processing does not run on consent but on a{' '}
          <em>legitimate use</em> recognised by the Act: keeping your account
          secure, preventing fraud, and meeting obligations under tax and other
          Indian law.
        </P>
        <P>
          Withdrawing consent is as easy as giving it. You can do it from your
          account settings, or by writing to{' '}
          <MailLink
            address={LEGAL.privacyEmail}
            subject="Withdraw consent — Typing Mania"
          />
          . Withdrawal takes effect for future processing; anything already done
          lawfully stays lawful, and we may keep the minimum needed for records
          the law requires us to keep.
        </P>
        <Note title="What withdrawal costs you">
          <P>
            Practice history, coaching and leaderboards depend on the data they
            analyse. If you withdraw consent for them, those features stop
            working, but you can still take tests signed out.
          </P>
        </Note>
      </>
    ),
  },
  {
    id: 'sharing',
    title: 'Who else sees it',
    body: (
      <>
        <P>
          We share personal data only with service providers who process it on
          our written instructions, for the purposes above, and who are not
          permitted to use it for their own ends.
        </P>
        <KeyTable
          head={['Kind of provider', 'What they see']}
          rows={[
            [
              'Cloud hosting and database',
              'Account, exam, test and progress data, stored and served on our behalf.',
            ],
            [
              'Caching and background jobs',
              'Short-lived copies of session and result data while a job runs.',
            ],
            [
              'Payment gateway',
              'Your name, email, amount and transaction reference. They collect your payment credentials directly; we never see them.',
            ],
            [
              'Email delivery',
              'Your email address and the message being sent — sign-in links, receipts, replies.',
            ],
            [
              'Error and performance monitoring',
              'Technical data and diagnostic traces, used to fix faults.',
            ],
          ]}
        />
        <P>
          Beyond that, we disclose personal data only where a law, a court or a
          lawful government order requires it, or to establish or defend a legal
          claim. If the business is ever transferred, the acquirer is bound by
          this policy until it publishes one no less protective, and you will be
          told before anything changes.
        </P>
        <P>
          Leaderboard entries are public by design. Only the display name and
          score you chose to publish appear there — never your email, and never
          your test content.
        </P>
      </>
    ),
  },
  {
    id: 'retention',
    title: 'How long we keep it',
    body: (
      <>
        <P>
          The Act requires that personal data be erased once the purpose it was
          collected for is served. Our periods:
        </P>
        <KeyTable
          head={['Data', 'Kept for']}
          rows={[
            ['Account data', 'For as long as your account exists'],
            [
              'Test and progress data',
              'For as long as your account exists, because the whole point is a long trend line. Individual tests can be deleted at any time.',
            ],
            [
              'Keystroke timings',
              'With the test they belong to, and deleted with it',
            ],
            ['Technical and security logs', 'Up to 180 days'],
            [
              'Payment records',
              'Eight years, as required by Indian tax and company law',
            ],
            [
              'Support correspondence',
              'Three years from the close of the query',
            ],
          ]}
        />
        <P>
          When you delete your account we erase your personal data within 30
          days, other than what the law obliges us to retain. Anonymous,
          aggregated figures that can no longer identify you — for example the
          average speed across all practice tests — may be kept.
        </P>
      </>
    ),
  },
  {
    id: 'security',
    title: 'How we protect it',
    body: (
      <>
        <Bullets
          items={[
            'Everything travels over TLS, and stored data is encrypted at rest by our hosting providers.',
            'Passwords are stored only as salted hashes. Nobody at our end can read your password.',
            'Access to production data is restricted to the people who need it to run the service, and is logged.',
            'Payment credentials never reach our servers — the gateway collects them directly on PCI-DSS compliant infrastructure.',
            'Backups are taken regularly and restore procedures are exercised.',
          ]}
        />
        <Note title="If something goes wrong">
          <P>
            If a personal data breach occurs, we will notify every affected Data
            Principal and the Data Protection Board of India without delay and
            in any case within {LEGAL.breachNoticeHours} hours, with the nature
            and extent of the breach, its likely consequences, what we have done
            about it, and what you should do.{' '}
            <Cite>DPDP Rules, 2025, rule 7.</Cite>
          </P>
        </Note>
        <P>
          No system is perfectly secure. Please use a strong, unique password
          and tell us immediately if you think your account has been accessed by
          someone else.
        </P>
      </>
    ),
  },
  {
    id: 'your-rights',
    title: 'Your rights',
    body: (
      <>
        <P>
          As a Data Principal under the DPDP Act, 2023, you have the following
          rights, and exercising any of them is free.
        </P>
        <KeyTable
          head={['Right', 'What it means here']}
          rows={[
            [
              'Access',
              'A summary of the personal data we hold about you, what we do with it, and who we have shared it with. Section 11.',
            ],
            [
              'Correction and erasure',
              'Have inaccurate data corrected, incomplete data completed, and data erased where it is no longer needed. Section 12.',
            ],
            [
              'Grievance redressal',
              'Complain to us first, through the channel below, before approaching the Data Protection Board. Section 13.',
            ],
            [
              'Nominate',
              'Name another person to exercise these rights on your behalf if you die or become incapacitated. Section 14.',
            ],
            [
              'Withdraw consent',
              'Stop consent-based processing at any time, as easily as you gave it. Section 6(4)–(6).',
            ],
          ]}
        />
        <P>
          Most of this you can do yourself from your account settings —
          download your data, delete individual tests, or delete the account
          outright. For anything else, write to{' '}
          <MailLink
            address={LEGAL.privacyEmail}
            subject="Data Principal request — Typing Mania"
          />{' '}
          from your registered email address. We acknowledge within{' '}
          {LEGAL.ackHours} hours and respond within {LEGAL.resolveDays} days.
        </P>
        <P>
          If our answer does not satisfy you, you may complain to the Data
          Protection Board of India.
        </P>
      </>
    ),
  },
  {
    id: 'children',
    title: 'Students under 18',
    body: (
      <>
        <P>
          The service is built for candidates sitting SSC examinations, who are
          adults. We do not knowingly create accounts for anyone under 18
          without verifiable consent from a parent or lawful guardian, as
          section 9 of the Act and rule 10 of the DPDP Rules, 2025 require.
        </P>
        <P>
          We do not track, monitor or profile children for advertising, and we
          serve no behavioural advertising to anyone. If you believe a child has
          an account with us without that consent, write to{' '}
          <MailLink
            address={LEGAL.privacyEmail}
            subject="Child account — Typing Mania"
          />{' '}
          and we will delete it.
        </P>
      </>
    ),
  },
  {
    id: 'cookies',
    title: 'Cookies and on-device storage',
    body: (
      <>
        <P>
          We use the smallest set of cookies and browser storage that lets the
          product work. There are no advertising or cross-site tracking cookies.
        </P>
        <KeyTable
          head={['What', 'Why']}
          rows={[
            [
              'Session cookies',
              'Keep you signed in and protect forms against cross-site request forgery. Strictly necessary — the site cannot work without them.',
            ],
            [
              'Local storage',
              'Remembers your chosen post, category, medium, lesson progress and unsent test results so nothing is lost if you go offline. It stays in your browser.',
            ],
            [
              'Preference storage',
              'Small settings such as your theme choice.',
            ],
          ]}
        />
        <P>
          Clearing site data in your browser removes all of this. Signed-out
          practice results live only in local storage — clearing it deletes them
          permanently.
        </P>
      </>
    ),
  },
  {
    id: 'transfers',
    title: 'Where your data is processed',
    body: (
      <P>
        We host primarily in India. Some providers listed above may process data
        in other countries; where that happens we rely on contractual safeguards
        and transfer only what the provider needs. We do not transfer personal
        data to any country that the Central Government has restricted under
        section 16 of the DPDP Act.
      </P>
    ),
  },
  {
    id: 'changes',
    title: 'Changes to this policy',
    body: (
      <P>
        When this policy changes we update the version and date at the top of
        the page. If a change materially affects how we use your data, we will
        tell you by email or an in-product notice before it takes effect, and
        ask again for consent where the law requires it. Earlier versions are
        available on request.
      </P>
    ),
  },
  {
    id: 'grievance',
    title: 'Grievance officer',
    body: (
      <>
        <P>
          Under section 13 of the DPDP Act, 2023 and rule 3(2) of the
          Information Technology (Intermediary Guidelines and Digital Media
          Ethics Code) Rules, 2021, you can raise any concern about your data or
          about content on this site with our grievance officer.
        </P>
        <KeyTable
          head={['Detail', '']}
          rows={[
            ...(LEGAL.grievanceOfficer
              ? ([['Officer', LEGAL.grievanceOfficer]] as const)
              : []),
            [
              'Email',
              <MailLink
                key="mail"
                address={LEGAL.grievanceEmail}
                subject="Grievance — Typing Mania"
              />,
            ],
            ...(LEGAL.phone ? ([['Phone', LEGAL.phone]] as const) : []),
            ['Hours', LEGAL.supportHours],
            [
              'Response',
              `Acknowledged within ${LEGAL.ackHours} hours, resolved within ${LEGAL.resolveDays} days`,
            ],
          ]}
        />
        <P>
          The <Link href="/contact" className="font-medium underline underline-offset-4">contact page</Link>{' '}
          lists every way to reach us and what to include so we can act on the
          first reply.
        </P>
      </>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title={
        <>
          Privacy <em>policy</em>
        </>
      }
      lead={`What ${APP.name} collects, why, who else sees it, how long we keep it, and how to make us delete it. Written to India's Digital Personal Data Protection Act, 2023 and the DPDP Rules, 2025.`}
      sections={SECTIONS}
    />
  );
}
