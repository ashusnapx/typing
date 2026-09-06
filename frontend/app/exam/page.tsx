'use client';

import Link from 'next/link';
import { Clock, Target, ArrowRight, Languages } from 'lucide-react';
import { EXAM_MODES } from '@/lib/config';
import { getExamSpecs } from '@/lib/exam-config';

type ModeId = (typeof EXAM_MODES)[number]['id'];

/** Only the official set is named. Everything else in EXAM_MODES falls through
 *  to training, so the config stays the single source of truth and a mode added
 *  there can never go silently missing from this page. */
const OFFICIAL_MODES: readonly ModeId[] = ['ssc_chsl', 'ssc_cgl_dest', 'ssc_hindi'];

/** Grouped so the page answers "which one is my exam?" before it answers
 *  "what modes exist?". Aspirants arrive knowing their post, not our taxonomy. */
const GROUPS = [
  {
    id: 'official',
    title: 'Official exam patterns',
    blurb: 'Exact duration, speed target and error allowance from the notification.',
    modes: EXAM_MODES.filter((m) => OFFICIAL_MODES.includes(m.id)).map((m) => m.id),
  },
  {
    id: 'training',
    title: 'Training modes',
    blurb: 'Same passages, different feedback — for building speed before you test it.',
    modes: EXAM_MODES.filter((m) => !OFFICIAL_MODES.includes(m.id)).map((m) => m.id),
  },
] as const;

/** `emphasis` is purely presentational. The official patterns are what most
 *  visitors came for, so they get the bordered white card; training modes sit
 *  back as hairline cards at a smaller type size. */
function ExamCard({ id, emphasis = false }: { id: ModeId; emphasis?: boolean }) {
  const mode = EXAM_MODES.find((m) => m.id === id);
  if (!mode) return null;

  const specs = getExamSpecs(mode.id);
  const minutes = Math.floor(mode.duration / 60);
  const target =
    specs?.qualifyingNature === 'speed_wpm'
      ? `${specs.englishSpeedWpm} WPM`
      : specs
        ? `${specs.englishKdph.toLocaleString('en-IN')} KDPH`
        : mode.wpmTarget > 0
          ? `${mode.wpmTarget} WPM`
          : 'KDPH';

  return (
    <Link
      href={mode.href}
      data-reveal
      className={`group flex flex-col transition-transform duration-200 ease-spring hover:-translate-y-1 ${
        emphasis ? 'card p-6 sm:p-7' : 'card-flat p-5 hover:border-vast'
      }`}
    >
      <div className="flex items-start gap-3">
        <h3 className={emphasis ? 'text-2xl' : 'text-xl'}>{mode.title}</h3>
        {mode.lang === 'hindi' && (
          <span className="chip chip-lilac ml-auto shrink-0">
            <Languages className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
            <span className="font-hindi">हिंदी</span>
          </span>
        )}
      </div>

      <p
        className={`flex-1 leading-relaxed text-vast/60 ${
          emphasis ? 'mt-3 text-base' : 'mt-2 text-sm'
        }`}
      >
        {mode.description}
      </p>

      {/* Given its own line rather than buried in the meta row: losing the
          backspace key changes how you sit the whole test. */}
      {specs && !specs.backspaceAllowed && (
        <p className="mt-4">
          <span className="chip chip-err">No backspace</span>
        </p>
      )}

      <div
        className={`flex items-center gap-4 border-t-2 border-vast/10 text-vast/50 ${
          emphasis ? 'mt-6 pt-4 text-sm' : 'mt-5 pt-3 text-xs'
        }`}
      >
        <span className="tnum flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
          {minutes} min
        </span>
        <span className="tnum flex items-center gap-1.5">
          <Target className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
          {target}
        </span>
        <ArrowRight
          className="ml-auto h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:text-vast"
          strokeWidth={2.2}
          aria-hidden="true"
        />
      </div>
    </Link>
  );
}

export default function ExamListingPage() {
  return (
    <>
      {/* ═══════════════════════════════════════════════════ lead — cream */}
      <section className="px-5 pb-14 pt-12 sm:px-8 sm:pb-16 sm:pt-16">
        <div className="mx-auto w-full max-w-content">
          <p className="eyebrow">Typing tests</p>

          <h1 className="mt-6 max-w-3xl text-5xl sm:text-6xl">
            Pick the test you&rsquo;re <em>actually sitting</em>
          </h1>

          <p className="mt-6 max-w-xl text-lg text-vast/70">
            Every mode below scores you with the official SSC error engine. No
            account needed — sign in only when you want your history kept.
          </p>
        </div>
      </section>

      {/* Each group is its own slab, and the official one takes the lilac —
          the loudest ground in the system — so the exam patterns read as the
          page's answer and the training modes as the follow-up. */}
      {GROUPS.map((group) => {
        const official = group.id === 'official';
        return (
          <section
            key={group.id}
            aria-labelledby={`${group.id}-heading`}
            className={`slab ${official ? 'slab-lilac' : 'slab-cream'}`}
          >
            <div className="mx-auto w-full max-w-content px-5 sm:px-8">
              <div className={official ? 'max-w-2xl' : 'max-w-xl'} data-reveal>
                <h2
                  id={`${group.id}-heading`}
                  className={official ? 'text-4xl sm:text-5xl' : 'text-3xl sm:text-4xl'}
                >
                  {group.title}
                </h2>
                <p
                  className={`mt-4 leading-relaxed text-vast/60 ${
                    official ? 'text-lg' : 'text-base'
                  }`}
                >
                  {group.blurb}
                </p>
              </div>

              <div
                className={`grid ${
                  official
                    ? 'mt-12 gap-4 sm:grid-cols-2 lg:grid-cols-3'
                    : 'mt-10 gap-3 sm:grid-cols-2 lg:grid-cols-4'
                }`}
              >
                {group.modes.map((id) => (
                  <ExamCard key={id} id={id} emphasis={official} />
                ))}
              </div>
            </div>
          </section>
        );
      })}
    </>
  );
}
