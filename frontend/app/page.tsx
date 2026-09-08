'use client';

import Link from 'next/link';
import {
  ArrowRight,
  Clock,
  Target,
  Check,
} from 'lucide-react';
import { EXAM_MODES } from '@/lib/config';
import { EXAM_VARIANTS } from '@/lib/exam-config';
import { getFlatLessons } from '@/lib/typing-curriculum';

/** Counted from the curriculum, never typed by hand — a number on the landing
 *  page that can drift from the product is a number that will. */
const LESSON_COUNT = getFlatLessons().length;
import { ExamPreview } from '@/components/home/exam-preview';
import { SpinningBadge } from '@/components/home/spinning-badge';

/* -------------------------------------------------------------------------- */

/** Real post names, run as a marquee. No borrowed company logos — the honest
 *  version of a social-proof strip for a product with no logos to show. */
const POSTS_TICKER = [
  'SSC CHSL — LDC / JSA',
  'SSC CHSL — DEO',
  "DEO Grade 'A'",
  'SSC CGL — DEST',
  'ASO — CSS / MEA / AFHQ',
  'Inspector — CBIC',
  'Tax Assistant',
  'UDC / SSA',
  'Postal Assistant',
  'Sorting Assistant',
];

const QUALIFYING_BAR = [
  { post: 'CHSL — LDC / JSA', speed: '35 WPM', errors: '7%' },
  { post: "CHSL — DEO / Grade 'A'", speed: '8,000–15,000 KDPH', errors: '20%' },
  { post: 'CGL — Tax Assistant', speed: '8,000 KDPH', errors: '20%' },
  { post: 'CGL — ASO, Inspector', speed: '8,000 KDPH', errors: '5%', strict: true },
];

/** The five official post variants plus Hindi — exactly six, which fills a
 *  3-column grid without orphaning a card. Training modes live on /exam. */
const HOME_MODE_IDS = new Set([
  ...EXAM_VARIANTS.map((v) => v.mode),
  'ssc_hindi',
]);
const HOME_MODES = EXAM_MODES.filter((m) => HOME_MODE_IDS.has(m.id));

/** Requirement in the post's own unit — a KDPH post shown as "0 WPM" is worse
 *  than showing nothing. */
function requirementFor(id: string, wpmTarget: number): string {
  return (
    EXAM_VARIANTS.find((v) => v.mode === id)?.requirement ||
    (wpmTarget > 0 ? `${wpmTarget} WPM` : 'KDPH')
  );
}

const PILLARS = [
  { title: 'The official error engine', body: 'Full and half mistakes, the Commission\u2019s own formula.' },
  { title: 'Mistake-by-mistake review', body: 'Every keystroke replayed against the passage.' },
  {
    title: 'Zero to exam-ready',
    body: `${LESSON_COUNT} lessons. Home row to full passages.`,
  },
  { title: 'Your bar, not a generic one', body: 'Every verdict follows your post\u2019s real cap.' },
];

/* -------------------------------------------------------------------------- */

export default function HomePage() {
  return (
    <>
      {/* ═══════════════════════════════════════════════════ hero — cream */}
      <section className="relative overflow-hidden px-5 pb-20 pt-12 sm:px-8 sm:pb-24 sm:pt-16">
        <div className="mx-auto grid w-full max-w-content items-center gap-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-16">
          <div>
            <p className="eyebrow">SSC typing &amp; skill test</p>

            <h1 className="mt-5 text-5xl sm:text-6xl lg:text-7xl">
              Don&rsquo;t guess. <em>Know your speed.</em>
            </h1>

            <p className="mt-7 max-w-md text-lg text-vast/70 sm:text-xl">
              SSC CHSL, CGL and Hindi skill tests, scored the way the Commission
              scores them.
            </p>

            <div className="mt-9 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
              <Link href="/exam/chsl" className="btn btn-primary btn-lg">
                Start free test
                <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
              </Link>
              <Link href="/learn" className="btn btn-outline btn-lg">
                Learn from zero
              </Link>
            </div>

            <p className="mt-6 text-base text-vast/50">
              No sign-up &middot; English &amp;{' '}
              <span className="font-hindi">हिंदी</span> &middot; Free
            </p>
          </div>

          {/* The product, alive. Tilted so it reads as an object on the page
              rather than a screenshot pasted into it. */}
          <div className="relative">
            <SpinningBadge className="absolute -left-10 -top-10 z-10 hidden h-28 w-28 lg:block" />
            <ExamPreview className="rotate-[1.5deg] shadow-lg transition-transform duration-500 ease-out hover:rotate-0" />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════ ticker — ink slab */}
      <section className="on-dark slab slab-ink !pt-14">
        <p className="eyebrow mb-8 text-center">Built for these posts</p>
        <div className="marquee">
          <div className="marquee-track">
            {[0, 1].map((copy) => (
              <div key={copy} className="flex shrink-0" aria-hidden={copy === 1}>
                {POSTS_TICKER.map((p) => (
                  <span
                    key={p}
                    className="whitespace-nowrap px-8 font-display text-2xl text-lumen/70 sm:text-3xl"
                  >
                    {p}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ the bar — green slab */}
      <section className="on-dark slab slab-green">
        <div className="mx-auto w-full max-w-content px-5 sm:px-8">
          <div className="mx-auto max-w-3xl text-center" data-reveal>
            <h2 className="text-4xl sm:text-6xl">
              One exam, <em>four different bars</em>
            </h2>
            <p className="mx-auto mt-6 max-w-md text-lg text-lumen/75">
              The requirement belongs to the post, not the exam. ASO is capped
              at 5% errors and DEO at 20% — the same test, marked four times
              stricter.
            </p>
          </div>

          <div
            className="mx-auto mt-12 max-w-2xl overflow-hidden rounded-2xl border-2 border-lumen/20"
            data-reveal
          >
            <table className="w-full text-left">
              <caption className="sr-only">
                Speed and error requirements by post
              </caption>
              <thead>
                <tr className="border-b-2 border-lumen/20 bg-lumen/5">
                  <th scope="col" className="eyebrow !text-cream/50 px-5 py-3">
                    Post
                  </th>
                  <th scope="col" className="eyebrow !text-cream/50 px-3 py-3 text-right">
                    Speed
                  </th>
                  <th scope="col" className="eyebrow !text-cream/50 px-5 py-3 text-right">
                    Max errors
                  </th>
                </tr>
              </thead>
              <tbody>
                {QUALIFYING_BAR.map((row) => (
                  <tr key={row.post} className="border-b border-lumen/10 last:border-0">
                    <th scope="row" className="px-5 py-3.5 text-base font-medium">
                      {row.post}
                    </th>
                    <td className="tnum px-3 py-3.5 text-right text-base text-lumen/70">
                      {row.speed}
                    </td>
                    <td
                      className={`tnum px-5 py-3.5 text-right text-base font-semibold ${
                        row.strict ? 'text-glow' : 'text-lumen/70'
                      }`}
                    >
                      {row.errors}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8 text-center" data-reveal>
            <Link href="/learn" className="btn btn-cream btn-lg">
              Set your post
              <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ modes — cream slab */}
      <section className="slab slab-cream">
        <div className="mx-auto w-full max-w-content px-5 sm:px-8">
          <div className="mb-12 flex flex-wrap items-end justify-between gap-4" data-reveal>
            <h2 className="max-w-xl text-4xl sm:text-5xl">
              Every SSC skill test, <em>to spec</em>
            </h2>
            <Link
              href="/exam"
              className="inline-flex items-center gap-1.5 text-base font-medium underline underline-offset-4"
            >
              All tests
              <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {HOME_MODES.map((mode) => {
              const minutes = Math.floor(mode.duration / 60);
              return (
                <Link
                  key={mode.id}
                  href={mode.href}
                  data-reveal
                  className="card group flex flex-col p-6 transition-transform duration-200 ease-spring hover:-translate-y-1"
                >
                  <div className="flex items-start gap-2">
                    <h3 className="text-2xl">{mode.title}</h3>
                    {mode.lang === 'hindi' && (
                      <span className="chip chip-lilac ml-auto shrink-0 font-hindi">
                        हिंदी
                      </span>
                    )}
                  </div>
                  <p className="mt-3 flex-1 text-base leading-relaxed text-vast/60">
                    {mode.description}
                  </p>
                  <div className="mt-6 flex items-center gap-4 border-t-2 border-vast/10 pt-4 text-sm text-vast/50">
                    <span className="tnum flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" strokeWidth={2} />
                      {minutes} min
                    </span>
                    <span className="tnum flex items-center gap-1.5">
                      <Target className="h-3.5 w-3.5" strokeWidth={2} />
                      {requirementFor(mode.id, mode.wpmTarget)}
                    </span>
                    <ArrowRight
                      className="ml-auto h-4 w-4 transition-transform group-hover:translate-x-1"
                      strokeWidth={2.2}
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ pillars — white slab */}
      <section className="slab slab-white">
        <div className="mx-auto w-full max-w-content px-5 sm:px-8">
          <h2 className="max-w-xl text-4xl sm:text-5xl" data-reveal>
            Built from the <em>notification</em>
          </h2>

          <div className="mt-14 grid gap-x-12 gap-y-12 sm:grid-cols-2">
            {PILLARS.map((p, i) => (
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

      {/* ═══════════════════════════════════════════ cta — lilac slab */}
      <section className="slab slab-lilac">
        <div className="mx-auto w-full max-w-content px-5 text-center sm:px-8">
          <h2 className="mx-auto max-w-2xl text-4xl sm:text-6xl" data-reveal>
            Never used a keyboard <em>properly?</em>
          </h2>
          <p className="mx-auto mt-6 max-w-sm text-lg text-vast/70" data-reveal>
            {LESSON_COUNT} lessons that assume nothing.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3" data-reveal>
            <Link href="/learn" className="btn btn-ink btn-lg">
              Start the free course
              <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
            </Link>
          </div>
          <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-base text-vast/60">
            {['No sign-up', 'Free forever', 'English & Hindi'].map((f) => (
              <li key={f} className="flex items-center gap-1.5">
                <Check className="h-4 w-4" strokeWidth={2.5} />
                {f}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
