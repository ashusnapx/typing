'use client';

import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import { getFlatLessons } from '@/lib/typing-curriculum';
import { FeatureCarousel } from '@/components/home/feature-carousel';

/** Counted from the curriculum, never typed by hand — a number on the landing
 *  page that can drift from the product is a number that will. */
const LESSON_COUNT = getFlatLessons().length;

/**
 * Three sections.
 *
 * There were six: a hero, a marquee of ten post names, a table of qualifying
 * bars, a grid of six exam cards, four pillars, and a call to action — each
 * with a heading, a paragraph and a link. A candidate landing here wants to
 * know what this is and start a test; everything else was us talking.
 *
 * What is left says what it is, gives the two tests, and offers the course to
 * anyone who has not used a keyboard properly. The posts a score qualifies for
 * are not a landing-page table any more — the result screen works them out
 * from the candidate's own attempt, which is the only place that figure means
 * anything.
 */

const EXAMS = [
  {
    href: '/exam/chsl',
    name: 'SSC CHSL',
    bar: '35 WPM · 10 minutes',
    who: 'LDC, JSA, DEO, Postal Assistant',
  },
  {
    href: '/exam/cgl-dest',
    name: 'SSC CGL',
    bar: '8,000 KDPH · 15 minutes',
    who: 'Tax Assistant, ASO, Inspector',
  },
];

export default function HomePage() {
  return (
    <>
      {/* ══════════════════════════════════════════════════════════ 1. hero */}
      <section className="px-5 pb-16 pt-12 sm:px-8 sm:pb-20 sm:pt-16">
        <div className="mx-auto grid w-full max-w-content items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div>
            {/* Smaller, and carrying the whole claim on its own. The line
                under it — full and half mistakes, the error cap, the lesson —
                listed what the panels to the right now show. */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl">
              The SSC typing test, <em>exactly as it is marked</em>
            </h1>
            <div className="mt-7 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
              <Link href="/exam" className="btn btn-primary btn-lg">
                Take a test
                <ArrowRight className="h-4 w-4" strokeWidth={2.2} aria-hidden />
              </Link>
              <Link href="/learn" className="btn btn-outline btn-lg">
                Learn to type
              </Link>
            </div>
            <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-base text-vast/55">
              {['Free', 'No sign-up to try', 'English & हिंदी'].map((f) => (
                <li key={f} className="flex items-center gap-1.5">
                  <Check className="h-4 w-4" strokeWidth={2.5} aria-hidden />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative">
            <FeatureCarousel />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════ 2. the tests */}
      <section className="slab slab-cream">
        <div className="mx-auto w-full max-w-content px-5 sm:px-8">
          <h2 className="text-4xl sm:text-5xl" data-reveal>
            Two tests
          </h2>
          <p className="mt-4 max-w-md text-lg text-vast/65" data-reveal>
            Pick the exam you applied for. Your result tells you which posts
            that score clears.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {EXAMS.map((exam) => (
              <Link
                key={exam.href}
                href={exam.href}
                data-reveal
                className="card group flex flex-col p-6 transition-transform duration-200 ease-spring hover:-translate-y-1"
              >
                <h3 className="text-3xl">{exam.name}</h3>
                <p className="tnum mt-2 text-base text-vast/70">{exam.bar}</p>
                <p className="mt-4 flex-1 text-base text-vast/55">{exam.who}</p>
                <span className="mt-6 flex items-center gap-1.5 border-t-2 border-vast/10 pt-4 text-base font-semibold">
                  Start
                  <ArrowRight
                    className="h-4 w-4 transition-transform group-hover:translate-x-1"
                    strokeWidth={2.2}
                    aria-hidden
                  />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════ 3. the course */}
      {/* A centred stack of heading, line and button ran to most of a screen
          for three short pieces of text. Side by side they read in one pass and
          cost a quarter of the height. */}
      <section className="slab slab-slate on-dark !py-10 sm:!py-12">
        <div
          className="mx-auto flex w-full max-w-content flex-col items-center gap-6 px-5 text-center sm:px-8 lg:flex-row lg:justify-between lg:gap-10 lg:text-left"
          data-reveal
        >
          <h2 className="text-3xl sm:text-4xl lg:max-w-sm">
            Never used a keyboard <em>properly?</em>
          </h2>
          <p className="text-lg text-white/70">
            {LESSON_COUNT} lessons that assume nothing.
          </p>
          <Link href="/learn" className="btn btn-primary btn-md shrink-0">
            Start the free course
            <ArrowRight className="h-4 w-4" strokeWidth={2.2} aria-hidden />
          </Link>
        </div>
      </section>
    </>
  );
}
