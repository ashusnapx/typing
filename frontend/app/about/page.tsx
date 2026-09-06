import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Check, X } from 'lucide-react';
import { APP, LEGAL, FOOTER } from '@/lib/config';
import { STAGES, getFlatLessons } from '@/lib/typing-curriculum';
import { SSC_POSTS } from '@/lib/ssc-posts';
import { FULL_MISTAKES, HALF_MISTAKES } from '@/lib/exam-config';

export const metadata: Metadata = {
  title: 'About us',
  description: `Why ${APP.name} exists, how it is built, what it refuses to do, and who is behind it. An SSC typing simulator scored the way the Commission scores.`,
  alternates: { canonical: '/about' },
  robots: { index: true, follow: true },
};

const operator = LEGAL.legalEntityName || LEGAL.operator;

/* Every figure on this page is computed from the data the product actually
 * runs on. Nothing here is a marketing number, and nothing goes stale when
 * a lesson or a post is added. */
const LESSON_COUNT = getFlatLessons().length;
const STAGE_COUNT = STAGES.length;
const POST_COUNT = SSC_POSTS.length;
const MISTAKE_COUNT = FULL_MISTAKES.length + HALF_MISTAKES.length;

const FACTS = [
  { value: String(POST_COUNT), label: 'SSC posts with their own speed and error cap' },
  { value: String(LESSON_COUNT), label: `Lessons, across ${STAGE_COUNT} stages` },
  { value: String(MISTAKE_COUNT), label: 'Mistake types classified, full and half' },
  { value: '₹0', label: 'To take a full scored mock test' },
] as const;

const PRINCIPLES = [
  {
    title: 'The requirement belongs to the post',
    body: `An ASO candidate is marked against a 5% error cap. A data-entry candidate against 20%. Practising to the wrong one is how a confident candidate fails. So you pick your post and your category once, and every target, timer and verdict in the product follows from the notification for that post — including the five minutes of compensatory time a scribe-eligible candidate is entitled to.`,
  },
  {
    title: 'A score you can trust more than you like',
    body: `Net speed comes from the Commission's formula — key depressions over five, less full mistakes and half of the half mistakes, over the duration. Most practice sites report gross speed and quietly inflate you by several words a minute. We would rather show you 31 WPM today than 38 WPM and a rejection later.`,
  },
  {
    title: 'Practise what the interface takes away',
    body: `The real screen does not colour your mistakes as you make them. Blind mode does the same, so the confidence you build is the kind that survives exam day. Where a post's interface disables backspace, the mode disables it too.`,
  },
  {
    title: 'Free where it matters',
    body: `Lessons, full-length mocks, the evaluation engine and your mistake review cost nothing and need no account. An aspirant who cannot pay should not be practising on a worse simulation than one who can.`,
  },
] as const;

/* Stated as a promise rather than a feature list, because these are the things
 * a paid product is most tempted to do. */
const NEVER = [
  'Inflate a score to make the product feel good.',
  'Sell, rent or broker your personal data.',
  'Run behavioural advertising or third-party trackers.',
  'Claim an affiliation with SSC, Eduquity or TCS iON that we do not have.',
  'Make an account mandatory before you can take a test.',
  'Hide the cancellation link, or make a refund harder than the purchase.',
] as const;

export default function AboutPage() {
  return (
    <>
      {/* ═══════════════════════════════════════════════════ hero — cream */}
      <section className="px-5 pb-16 pt-10 sm:px-8 sm:pb-20 sm:pt-16">
        <div className="mx-auto w-full max-w-content">
          <div className="max-w-3xl">
            <p className="eyebrow">About</p>
            <h1 className="mt-5 text-5xl sm:text-6xl lg:text-7xl">
              A typing test that <em>tells you the truth</em>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-vast/70">
              {APP.name} is a skill-test simulator for SSC candidates, built by{' '}
              {operator}. It exists because most typing practice tells aspirants
              they are ready when they are not — and the first honest number
              they see is the one on the result sheet.
            </p>
          </div>

          <dl className="mt-14 grid gap-x-8 gap-y-10 border-t-2 border-vast/10 pt-10 sm:grid-cols-2 lg:grid-cols-4">
            {FACTS.map((f) => (
              <div key={f.label} data-reveal>
                <dt className="sr-only">{f.label}</dt>
                <dd>
                  <span className="tnum block font-display text-5xl leading-none sm:text-6xl">
                    {f.value}
                  </span>
                  <span className="mt-3 block max-w-[16rem] text-base leading-snug text-vast/55">
                    {f.label}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ the problem — green */}
      <section className="on-dark slab slab-green">
        <div className="mx-auto w-full max-w-content px-5 sm:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <div data-reveal>
              <p className="eyebrow !text-cream/50">Why we built it</p>
              <h2 className="mt-4 text-4xl sm:text-5xl">
                The typing test fails people who <em>can type</em>
              </h2>
            </div>
            <div className="max-w-xl space-y-5 text-lg leading-relaxed text-lumen/75" data-reveal>
              <p>
                Every year, candidates clear the written stage and then lose the
                post at the skill test. Not usually because they are slow —
                because nobody told them that a missing comma is half a mistake,
                that a transposed pair costs the same, or that their post is
                marked against a cap four times stricter than the one their
                practice site assumed.
              </p>
              <p>
                We started by reading the notice of examination and the
                Commission&rsquo;s evaluation guidelines line by line, and
                writing the rules down —{' '}
                {MISTAKE_COUNT} mistake types, {POST_COUNT} posts, each with its
                own speed, duration, medium and category-wise error cap. The
                product is what fell out of that document.
              </p>
              <p>
                Then we made the interface behave like the real one, so the last
                surprise on exam day is not the screen.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════ principles — white slab */}
      <section className="slab slab-white">
        <div className="mx-auto w-full max-w-content px-5 sm:px-8">
          <h2 className="max-w-2xl text-4xl sm:text-5xl" data-reveal>
            Four decisions everything else <em>follows from</em>
          </h2>
          <div className="mt-14 grid gap-x-12 gap-y-12 sm:grid-cols-2">
            {PRINCIPLES.map((p, i) => (
              <div key={p.title} data-reveal>
                <span className="tnum eyebrow">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="mt-3 text-3xl">{p.title}</h3>
                <p className="mt-3 max-w-md text-base leading-relaxed text-vast/60">
                  {p.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═════════════════════════════════════════ the promise — cream */}
      <section className="slab slab-cream">
        <div className="mx-auto w-full max-w-content px-5 sm:px-8">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-16">
            <div data-reveal>
              <p className="eyebrow">Our commitments</p>
              <h2 className="mt-4 text-4xl sm:text-5xl">
                What we will <em>never</em> do
              </h2>
              <p className="mt-5 max-w-md text-base leading-relaxed text-vast/60">
                Written down so you can hold us to it. Each one is also a term
                of the agreement you get — see the{' '}
                <Link href="/privacy" className="font-medium underline underline-offset-4">
                  privacy policy
                </Link>{' '}
                and{' '}
                <Link href="/refunds" className="font-medium underline underline-offset-4">
                  refunds policy
                </Link>
                .
              </p>
            </div>
            <ul className="space-y-4" data-reveal>
              {NEVER.map((n) => (
                <li key={n} className="card-flat flex items-start gap-3 p-4">
                  <X
                    className="mt-0.5 h-5 w-5 shrink-0 text-flare"
                    strokeWidth={2.4}
                    aria-hidden="true"
                  />
                  <span className="text-base leading-relaxed text-vast/70">{n}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════ who we are — ink slab */}
      <section className="on-dark slab slab-ink">
        <div className="mx-auto w-full max-w-content px-5 sm:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <div data-reveal>
              <p className="eyebrow !text-cream/50">Who we are</p>
              <h2 className="mt-4 text-4xl sm:text-5xl">
                {operator}, and a <em>keyboard</em>
              </h2>
              <p className="mt-5 max-w-md text-base leading-relaxed text-lumen/70">
                {operator} has spent years teaching candidates preparing for
                Indian government examinations. {APP.name} is the part of that
                work that had to be software: a skill test cannot be taught in a
                video, only practised, and only usefully if the practice is
                marked the way the real one is.
              </p>
              <p className="mt-4 max-w-md text-base leading-relaxed text-lumen/70">
                It is built and maintained by a small team. When you write to
                support, the reply comes from someone who worked on the thing
                you are asking about.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/exam/chsl" className="btn btn-primary btn-lg">
                  Take a scored test
                  <ArrowRight className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />
                </Link>
                <Link href="/contact" className="btn btn-outline btn-lg">
                  Contact us
                </Link>
              </div>
            </div>

            <div className="lg:justify-self-end" data-reveal>
              <h3 className="eyebrow !text-cream/50">Where to go next</h3>
              <ul className="mt-5 space-y-3">
                {[
                  { href: '/learn', label: 'The curriculum', hint: `${LESSON_COUNT} lessons from zero` },
                  { href: '/exam', label: 'Every exam mode', hint: 'Official patterns and training modes' },
                  { href: '/faq', label: 'Exam rules, answered', hint: 'Speeds, caps, formulas' },
                  { href: '/terms', label: 'Terms of service', hint: 'What we do and do not promise' },
                ].map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="group flex items-center gap-4 rounded-xl border-2 border-lumen/20 p-4 transition-colors hover:border-lumen"
                    >
                      <span className="flex-1">
                        <span className="block text-base font-medium">{l.label}</span>
                        <span className="block text-sm text-lumen/55">{l.hint}</span>
                      </span>
                      <ArrowRight
                        className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1"
                        strokeWidth={2.2}
                        aria-hidden="true"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-14 flex items-start gap-3 border-t border-lumen/15 pt-6">
            <Check
              className="mt-0.5 h-4 w-4 shrink-0 text-lumen/40"
              strokeWidth={2.4}
              aria-hidden="true"
            />
            <p className="max-w-3xl text-sm leading-relaxed text-lumen/45">
              {FOOTER.legal.disclaimer}
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
