'use client';

import Link from 'next/link';
import { Clock, ArrowRight, Languages } from 'lucide-react';
import { EXAM_MODES } from '@/lib/config';
import { EXAM_VARIANTS, type ExamVariant } from '@/lib/exam-config';

/** Training modes are everything without an official spec behind it. */
const TRAINING = EXAM_MODES.filter(
  (m) => !EXAM_VARIANTS.some((v) => v.mode === m.id)
);

function VariantRow({ v }: { v: ExamVariant }) {
  return (
    <Link
      href={v.href}
      className="group flex items-center gap-3 border-b-2 border-vast/10 py-4 last:border-0"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-xl">{v.post}</h3>
          {v.hindiAvailable && (
            <span className="chip chip-lilac font-hindi shrink-0">हिंदी</span>
          )}
        </div>
        <p className="mt-0.5 truncate text-sm text-vast/50">{v.where}</p>
      </div>

      <div className="tnum shrink-0 text-right">
        <div className="text-base font-semibold">{v.requirement}</div>
        <div className="mt-0.5 whitespace-nowrap text-sm text-vast/50">
          {v.durationSeconds / 60} min · {v.errorCapUr}%
        </div>
      </div>

      {/* Decorative, and the first thing worth losing when the row is tight. */}
      <ArrowRight
        className="hidden h-4 w-4 shrink-0 text-vast/30 transition-transform group-hover:translate-x-1 group-hover:text-vast sm:block"
        strokeWidth={2.2}
      />
    </Link>
  );
}

export default function ExamListingPage() {
  const chsl = EXAM_VARIANTS.filter((v) => v.exam === 'CHSL');
  const cgl = EXAM_VARIANTS.filter((v) => v.exam === 'CGL');

  return (
    <div className="mx-auto w-full max-w-content px-5 py-12 sm:px-8 sm:py-16">
      <h1 className="text-5xl sm:text-6xl">
        Pick your <em>post</em>
      </h1>
      <p className="mt-4 max-w-lg text-lg text-vast/60">
        Each post has its own speed bar and error cap. No sign-in needed.
      </p>

      <div className="mt-12 grid gap-8 lg:grid-cols-2">
        <section aria-labelledby="chsl-heading" className="min-w-0">
          <h2 id="chsl-heading" className="text-3xl">
            SSC CHSL
          </h2>
          <div className="card mt-4 px-5">
            {chsl.map((v) => (
              <VariantRow key={v.mode} v={v} />
            ))}
          </div>
        </section>

        <section aria-labelledby="cgl-heading" className="min-w-0">
          <h2 id="cgl-heading" className="text-3xl">
            SSC CGL
          </h2>
          <div className="card mt-4 px-5">
            {cgl.map((v) => (
              <VariantRow key={v.mode} v={v} />
            ))}
          </div>
        </section>
      </div>

      <section aria-labelledby="training-heading" className="mt-12">
        <h2 id="training-heading" className="text-3xl">
          Training
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {TRAINING.map((m) => (
            <Link
              key={m.id}
              href={m.href}
              className="card-flat group flex flex-col p-4 transition-transform duration-200 ease-spring hover:-translate-y-1 hover:border-vast"
            >
              <div className="flex items-start gap-2">
                <h3 className="text-lg">{m.title}</h3>
                {m.lang === 'hindi' && (
                  <span className="chip chip-lilac ml-auto shrink-0 font-hindi">
                    हिंदी
                  </span>
                )}
              </div>
              <p className="mt-1 flex-1 text-sm text-vast/55">{m.description}</p>
              <span className="tnum mt-3 flex items-center gap-1.5 text-xs text-vast/45">
                <Clock className="h-3 w-3" strokeWidth={2} />
                {Math.floor(m.duration / 60)} min
                <ArrowRight
                  className="ml-auto h-3.5 w-3.5 transition-transform group-hover:translate-x-1"
                  strokeWidth={2.2}
                />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <p className="mt-10 flex items-center gap-2 text-sm text-vast/50">
        <Languages className="h-4 w-4 shrink-0" strokeWidth={2} />
        Not sure which post you&rsquo;ll get? Take any test — the result shows
        every post that score clears.
      </p>
    </div>
  );
}
