import type { Metadata } from 'next';
import Link from 'next/link';
import { APP, LEGAL } from '@/lib/config';
import {
  Bullets,
  KeyTable,
  LegalPage,
  MailLink,
  Note,
  P,
  type LegalSection,
} from '@/components/legal/legal-shell';

export const metadata: Metadata = {
  title: 'Cancellation & refunds',
  description: `How to cancel a ${APP.name} subscription, when a refund is due, how to ask for one, and how long it takes to reach you.`,
  alternates: { canonical: '/refunds' },
  robots: { index: true, follow: true },
};

const operator = LEGAL.legalEntityName || LEGAL.operator;

/* Required by the Consumer Protection (E-Commerce) Rules, 2020 (r. 5 — clear
 * cancellation, refund and grievance terms) and by payment aggregator
 * onboarding, which will not approve a merchant without a published policy
 * carrying explicit timelines. */
const SECTIONS: ReadonlyArray<LegalSection> = [
  {
    id: 'scope',
    title: 'What this covers',
    body: (
      <>
        <P>
          This policy applies to every paid subscription bought from {APP.name}{' '}
          at {APP.url}. It sits alongside our{' '}
          <Link href="/terms" className="font-medium underline underline-offset-4">
            terms of service
          </Link>
          , and nothing in it takes away rights you have under the Consumer
          Protection Act, 2019.
        </P>
        <Note title="In short">
          <Bullets
            items={[
              `A first subscription can be refunded in full within ${LEGAL.refundWindowDays} days of payment.`,
              'You can cancel renewal at any time and keep access until the period you paid for runs out.',
              `Approved refunds go back to the original payment method in ${LEGAL.refundProcessingDays}.`,
            ]}
          />
        </Note>
      </>
    ),
  },
  {
    id: 'free-plan',
    title: 'The free plan',
    body: (
      <P>
        Lessons, timed tests, the evaluation engine and your result review are
        free and need no payment, so there is nothing to cancel and nothing to
        refund. You can stop using the service or delete your account at any
        time from your account settings.
      </P>
    ),
  },
  {
    id: 'cancelling',
    title: 'Cancelling a subscription',
    body: (
      <>
        <P>
          Cancel from your account settings, or write to{' '}
          <MailLink
            address={LEGAL.supportEmail}
            subject="Cancel subscription — Typing Mania"
          />{' '}
          from your registered email address. Cancellation takes effect at the
          end of the period you have already paid for.
        </P>
        <Bullets
          items={[
            'Cancelling stops any future renewal. It is not itself a request for a refund — ask for one separately if you want your money back.',
            'You keep full access to paid features until the paid period ends.',
            'Your account, history and progress stay intact after a subscription ends. You drop back to the free plan.',
          ]}
        />
      </>
    ),
  },
  {
    id: 'refund-window',
    title: 'When a refund is due',
    body: (
      <>
        <KeyTable
          head={['Situation', 'What you get']}
          rows={[
            [
              `First subscription, cancelled within ${LEGAL.refundWindowDays} days`,
              'A full refund of what you paid, no reason needed.',
            ],
            [
              'Charged twice for the same period',
              'The duplicate charge refunded in full.',
            ],
            [
              'Money debited but the plan was never activated',
              'A full refund, or activation — your choice.',
            ],
            [
              'A paid feature was withdrawn permanently mid-period',
              'A pro-rata refund of the unused part of the period.',
            ],
            [
              'We terminate your account without cause mid-period',
              'A pro-rata refund of the unused part of the period.',
            ],
            [
              'Renewal you did not intend, reported within 48 hours and unused',
              'A full refund of that renewal.',
            ],
          ]}
        />
      </>
    ),
  },
  {
    id: 'no-refund',
    title: 'When it is not',
    body: (
      <>
        <P>
          We would rather say this plainly than bury it. A refund is not
          available where:
        </P>
        <Bullets
          items={[
            `More than ${LEGAL.refundWindowDays} days have passed since the payment, other than in the situations listed above.`,
            'The request is for a renewal of a plan you have already used through a previous period.',
            'The account was suspended or terminated for breaching the terms — for example, automated or falsified test results.',
            'The complaint is that practice did not produce a particular score or an examination result. We are a practice platform and say so throughout.',
            'The problem is with your own device, browser, keyboard or internet connection, and the service itself was available.',
          ]}
        />
        <P>
          If your case does not fit neatly into either list, write to us anyway.
          We would rather look at it than have you argue with a table.
        </P>
      </>
    ),
  },
  {
    id: 'how-to-ask',
    title: 'How to ask for a refund',
    body: (
      <>
        <P>
          Email{' '}
          <MailLink
            address={LEGAL.supportEmail}
            subject="Refund request — Typing Mania"
          />{' '}
          from the email address on the account, with:
        </P>
        <Bullets
          items={[
            'The transaction or order reference from your receipt.',
            'The date and amount of the payment.',
            'The plan you bought.',
            'One line on why you are asking — it helps us fix whatever went wrong.',
          ]}
        />
        <P>
          We acknowledge within {LEGAL.ackHours} hours and decide within{' '}
          {LEGAL.resolveDays} days, and we tell you the reason either way.
        </P>
      </>
    ),
  },
  {
    id: 'how-paid',
    title: 'How the money comes back',
    body: (
      <>
        <P>
          Approved refunds are sent to the original payment method — the same
          card, UPI handle or bank account the payment came from. We cannot
          redirect a refund to a different account, because the payment gateway
          will not permit it.
        </P>
        <KeyTable
          head={['Step', 'Time']}
          rows={[
            ['We acknowledge your request', `Within ${LEGAL.ackHours} hours`],
            ['We decide and tell you', `Within ${LEGAL.resolveDays} days`],
            [
              'We initiate the refund after approval',
              'Within 2 business days',
            ],
            [
              'Your bank credits it',
              `${LEGAL.refundProcessingDays} after initiation`,
            ],
          ]}
        />
        <P>
          The last leg is your bank&rsquo;s, not ours. If the credit has not
          appeared a week after we send you the refund reference, send us that
          reference and we will chase the gateway with you.
        </P>
        <P>
          Refunds are of the amount you actually paid. Where taxes were
          collected they are refunded with it. We do not charge a cancellation
          or processing fee.
        </P>
      </>
    ),
  },
  {
    id: 'failed-payments',
    title: 'Failed and pending payments',
    body: (
      <P>
        If money left your account but the plan did not activate, the payment is
        usually pending rather than lost, and gateways reverse it automatically
        within 5&ndash;7 business days. Tell us anyway — send the transaction
        reference and we will either activate the plan or confirm the reversal,
        rather than leaving you to wait and wonder.
      </P>
    ),
  },
  {
    id: 'chargebacks',
    title: 'Chargebacks',
    body: (
      <P>
        Please talk to us before raising a chargeback with your bank. A
        chargeback freezes the amount for weeks and usually suspends the account
        while it is investigated, which helps nobody. Almost everything is
        faster by email. Where a chargeback is raised on a payment we have
        already refunded, or on a plan that was used, we will contest it with
        the transaction record.
      </P>
    ),
  },
  {
    id: 'grievance',
    title: 'If you are not satisfied',
    body: (
      <>
        <P>
          Escalate to our grievance officer at{' '}
          <MailLink
            address={LEGAL.grievanceEmail}
            subject="Refund grievance — Typing Mania"
          />
          {LEGAL.grievanceOfficer ? `, attention ${LEGAL.grievanceOfficer}` : ''}
          . Complaints are acknowledged within {LEGAL.ackHours} hours and
          resolved within {LEGAL.resolveDays} days, as the Consumer Protection
          (E-Commerce) Rules, 2020 require.
        </P>
        <P>
          If we still cannot settle it, you may approach the National Consumer
          Helpline (1915) or the consumer forum with jurisdiction over you. This
          policy is published by {operator}; the{' '}
          <Link href="/contact" className="font-medium underline underline-offset-4">
            contact page
          </Link>{' '}
          carries our full business details.
        </P>
      </>
    ),
  },
];

export default function RefundsPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title={
        <>
          Cancellation &amp; <em>refunds</em>
        </>
      }
      lead={`How to cancel, when your money comes back, how long it takes, and what to do if you disagree with our answer. Free practice needs none of this — it stays free.`}
      sections={SECTIONS}
    />
  );
}
