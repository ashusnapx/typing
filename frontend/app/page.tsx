'use client';

import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import { getFlatLessons } from '@/lib/typing-curriculum';
import { ExamPreview } from '@/components/home/exam-preview';

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
            <h1 className="text-5xl sm:text-6xl lg:text-7xl">
              The SSC typing test, <em>exactly as it is marked</em>
            </h1>
            <p className="mt-6 max-w-md text-lg text-vast/70">
              Full and half mistakes, your post&rsquo;s real error cap, and the
              lesson to fix what cost you marks.
            </p>
            <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
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
            <ExamPreview />
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
      <section className="slab slab-ink on-dark">
        <div className="mx-auto w-full max-w-content px-5 text-center sm:px-8">
          <h2 className="mx-auto max-w-2xl text-4xl sm:text-6xl" data-reveal>
            Never used a keyboard <em>properly?</em>
          </h2>
          <p className="mx-auto mt-5 max-w-sm text-lg text-white/70" data-reveal>
            {LESSON_COUNT} lessons that assume nothing.
          </p>
          <div className="mt-8" data-reveal>
            <Link href="/learn" className="btn btn-primary btn-lg">
              Start the free course
              <ArrowRight className="h-4 w-4" strokeWidth={2.2} aria-hidden />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
