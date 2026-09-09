'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { EXAM_MODES } from '@/lib/config';
import { EXAM_VARIANTS } from '@/lib/exam-config';

/**
 * Two exams, not nine variants.
 *
 * This listed every post separately — LDC/JSA, DEO, DEO Grade 'A', DEST, CPT,
 * Hindi, and three training modes — each with its own speed bar and error cap.
 * A candidate who has applied for CHSL does not know, and should not have to
 * know, whether they are sitting the LDC paper or the DEO one before they have
 * typed a word: the paper is the same, only the bar it is judged against
 * differs.
 *
 * So they pick the exam they applied for, and the result screen tells them
 * which posts that score actually clears — worked out from their own attempt
 * rather than guessed from a table beforehand.
 */

const EXAMS = [
  {
    href: '/exam/chsl',
    name: 'SSC CHSL',
    duration: '10 minutes',
    bar: '35 WPM',
    posts: 'LDC, JSA, Postal Assistant, Sorting Assistant, DEO',
    hindiHref: '/exam/hindi',
  },
  {
    href: '/exam/cgl-dest',
    name: 'SSC CGL',
    duration: '15 minutes',
    bar: '8,000 key depressions per hour',
    posts: 'Tax Assistant, ASO, Inspector, UDC',
    hindiHref: null,
  },
];

/** Everything without an official spec behind it. */
const TRAINING = EXAM_MODES.filter(
  (m) => !EXAM_VARIANTS.some((v) => v.mode === m.id) && m.id !== 'ssc_hindi'
);

export default function ExamListingPage() {
  return (
    <div className="mx-auto w-full max-w-content px-5 py-12 sm:px-8 sm:py-16">
      <h1 className="text-5xl sm:text-6xl">
        Pick your <em>exam</em>
      </h1>
      <p className="mt-4 max-w-lg text-lg text-vast/60">
        Your result tells you which posts that score clears. No sign-in needed.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {EXAMS.map((exam) => (
          <div key={exam.href} className="card flex flex-col p-6">
            <h2 className="text-3xl">{exam.name}</h2>
            <p className="tnum mt-2 text-base text-vast/70">
              {exam.bar} · {exam.duration}
            </p>
            <p className="mt-4 flex-1 text-base text-vast/55">{exam.posts}</p>

            <div className="mt-6 flex flex-wrap gap-2 border-t-2 border-vast/10 pt-4">
              <Link href={exam.href} className="btn btn-primary btn-md">
                Start
                <ArrowRight className="h-4 w-4" strokeWidth={2.2} aria-hidden />
              </Link>
              {exam.hindiHref && (
                <Link href={exam.hindiHref} className="btn btn-outline btn-md font-hindi">
                  हिंदी
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      {TRAINING.length > 0 && (
        <section className="mt-12" aria-labelledby="training-heading">
          <h2 id="training-heading" className="eyebrow">
            Practice, untimed against no bar
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {TRAINING.map((m) => (
              <Link key={m.id} href={m.href} className="btn btn-outline btn-sm">
                {m.title}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
