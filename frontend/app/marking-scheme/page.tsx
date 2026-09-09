import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Check, X } from 'lucide-react';
import { APP } from '@/lib/config';
import {
  SSC_EXAM_SPECS,
  FULL_MISTAKES,
  HALF_MISTAKES,
  EXAM_VARIANTS,
} from '@/lib/exam-config';

export const metadata: Metadata = {
  title: 'Marking scheme',
  description:
    'How the SSC typing test and DEST are marked, in plain language: what a key depression is, what counts as a full or half mistake, how net speed is calculated, and the exact speed and error limit for every post.',
  alternates: { canonical: '/marking-scheme' },
  robots: { index: true, follow: true },
};

/* Every figure on this page is read from the same table the app scores you
 * against, so the explanation and the marking can never drift apart. */

const SOURCES = [
  {
    label: 'SSC CHSL 2025 — Notice of Examination',
    note: 'Speeds, durations, passage lengths and compensatory time (paras 13.8.13.6–13.8.13.7).',
    href: 'https://ssc.gov.in/api/attachment/uploads/masterData/NoticeBoards/Notice_of_adv_chsl_2025.pdf',
  },
  {
    label: 'SSC CGL 2025 — Notice of Examination',
    note: 'Tier-4 DEST and CPT requirements for Tax Assistant, ASO and Inspector posts.',
    href: 'https://ssc.gov.in/api/attachment/uploads/masterData/NoticeBoards/Notice_of_adv_cgl_2025.pdf',
  },
  {
    label: 'SSC — Revised Guidelines for Evaluation of Typing Test / DEST Scripts',
    note: 'The full and half mistake list, and how errors are counted.',
    href: 'https://ssc.nic.in/Downloads/portal/english/evaluation-dest-tt.pdf',
  },
  {
    label: 'SSC — official website',
    note: 'Always confirm against the notice for your own examination year.',
    href: 'https://ssc.gov.in',
  },
];

/* -------------------------------------------------------------------------- */
/* Diagrams                                                                    */
/* -------------------------------------------------------------------------- */

/** Five characters make one "word". Drawn rather than described, because the
 *  whole speed system rests on this one convention and it is the thing
 *  first-time computer users have never met. */
function KeyDepressionDiagram() {
  const cells = ['t', 'h', 'e', '␣', 'i'];
  return (
    <figure className="card-flat p-5">
      <svg
        viewBox="0 0 360 120"
        className="h-auto w-full"
        role="img"
        aria-label="Five key presses — t, h, e, a space, and i — are counted as one word."
      >
        {cells.map((c, i) => (
          <g key={i}>
            <rect
              x={10 + i * 62}
              y={22}
              width={52}
              height={52}
              rx={8}
              fill="rgb(255 255 235)"
              stroke="rgb(26 26 26)"
              strokeWidth={2}
            />
            <text
              x={36 + i * 62}
              y={56}
              textAnchor="middle"
              fontSize={22}
              fontFamily="monospace"
              fill="rgb(26 26 26)"
            >
              {c}
            </text>
          </g>
        ))}
        <path
          d="M10 88 L322 88"
          stroke="rgb(26 26 26)"
          strokeWidth={1.5}
          opacity={0.35}
        />
        <text x={166} y={110} textAnchor="middle" fontSize={14} fill="rgb(26 26 26)">
          5 key presses = 1 word
        </text>
      </svg>
      <figcaption className="mt-3 text-sm text-vast/60">
        Every letter, space and full stop counts as one key depression. The
        Commission counts five of them as one word — so &ldquo;words per
        minute&rdquo; has nothing to do with how long the real words are.
      </figcaption>
    </figure>
  );
}

/** The single most expensive misunderstanding: which slips cost a whole mark
 *  and which cost half. */
function MistakeWeightDiagram() {
  return (
    <figure className="card-flat p-5">
      <svg
        viewBox="0 0 360 130"
        className="h-auto w-full"
        role="img"
        aria-label="A full mistake removes one word from your score; a half mistake removes half a word."
      >
        <rect x={10} y={18} width={150} height={44} rx={8} fill="rgb(248 228 228)" stroke="rgb(127 28 52)" strokeWidth={2} />
        <text x={85} y={40} textAnchor="middle" fontSize={13} fontWeight="700" fill="rgb(127 28 52)">FULL MISTAKE</text>
        <text x={85} y={55} textAnchor="middle" fontSize={12} fill="rgb(127 28 52)">&minus;1 word</text>

        <rect x={200} y={18} width={150} height={44} rx={8} fill="rgb(252 248 216)" stroke="rgb(94 85 21)" strokeWidth={2} />
        <text x={275} y={40} textAnchor="middle" fontSize={13} fontWeight="700" fill="rgb(94 85 21)">HALF MISTAKE</text>
        <text x={275} y={55} textAnchor="middle" fontSize={12} fill="rgb(94 85 21)">&minus;0.5 word</text>

        <text x={85} y={84} textAnchor="middle" fontSize={12} fill="rgb(26 26 26)">wrong spelling</text>
        <text x={85} y={100} textAnchor="middle" fontSize={12} fill="rgb(26 26 26)">skipped word</text>
        <text x={85} y={116} textAnchor="middle" fontSize={12} fill="rgb(26 26 26)">wrong number</text>

        <text x={275} y={84} textAnchor="middle" fontSize={12} fill="rgb(26 26 26)">capital letter</text>
        <text x={275} y={100} textAnchor="middle" fontSize={12} fill="rgb(26 26 26)">spacing, comma</text>
        <text x={275} y={116} textAnchor="middle" fontSize={12} fill="rgb(26 26 26)">word order</text>
      </svg>
      <figcaption className="mt-3 text-sm text-vast/60">
        Two half mistakes cost the same as one full mistake. Most candidates
        lose more to the right-hand column than the left, because nobody warns
        them about it.
      </figcaption>
    </figure>
  );
}

/* -------------------------------------------------------------------------- */

function Term({ word, children }: { word: string; children: React.ReactNode }) {
  return (
    <div className="border-b-2 border-vast/10 py-4 last:border-0">
      <dt className="text-xl">{word}</dt>
      <dd className="mt-1.5 text-base leading-relaxed text-vast/65">{children}</dd>
    </div>
  );
}

export default function MarkingSchemePage() {
  const specs = Object.values(SSC_EXAM_SPECS);

  /** A worked example, computed here rather than typed in, so the arithmetic
   *  on the page is the arithmetic the app performs. */
  const example = {
    keyDepressions: 1800,
    full: 6,
    half: 8,
    minutes: 10,
  };
  const exGrossWords = example.keyDepressions / 5;
  const exErrors = example.full + example.half / 2;
  const exNetWords = exGrossWords - exErrors;
  const exNetWpm = exNetWords / example.minutes;
  const exErrorPct = (exErrors / exGrossWords) * 100;

  return (
    <>
      {/* ═════════════════════════════════════════════════════ lead — cream */}
      <section className="px-5 pb-14 pt-12 sm:px-8 sm:pb-16 sm:pt-16">
        <div className="mx-auto w-full max-w-content">
          <p className="eyebrow">Marking scheme</p>
          <h1 className="mt-6 max-w-3xl text-5xl sm:text-6xl">
            How the typing test is <em>actually marked</em>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-vast/70">
            Everything below is from the Commission&rsquo;s own notices, written
            for someone who has just sat down at a computer. Nothing here is our
            opinion — the sources are at the bottom.
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ the words — white slab */}
      <section className="slab slab-white" aria-labelledby="words-heading">
        <div className="mx-auto w-full max-w-content px-5 sm:px-8">
          <h2 id="words-heading" className="max-w-2xl text-4xl sm:text-5xl">
            First, the <em>words they use</em>
          </h2>

          <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)] lg:gap-16">
            <dl className="min-w-0">
              <Term word="Key depression">
                One press of a key. The letter <strong>a</strong> is one. So is a
                space, a comma, a full stop, and the Shift you hold for a
                capital. The Commission counts these, not letters.
              </Term>
              <Term word="Word">
                Five key depressions. Not a real word — a fixed unit. So
                &ldquo;I&rdquo; and &ldquo;administration&rdquo; do not count the
                same.
              </Term>
              <Term word="WPM (words per minute)">
                Your key depressions divided by five, then divided by the minutes
                you typed for.
              </Term>
              <Term word="KDPH (key depressions per hour)">
                The same speed written differently. Divide by 300 to get WPM —
                so 8,000 KDPH is about 27 WPM, and 10,500 KDPH is 35 WPM.
              </Term>
              <Term word="Gross speed">
                Your raw speed, before any mistake is taken off.
              </Term>
              <Term word="Net speed">
                Gross speed after mistakes are deducted. This is the number you
                are judged on.
              </Term>
              <Term word="Qualifying">
                The test adds no marks to your merit list. But you must clear it,
                or you are out — however well you did in the written papers.
              </Term>
            </dl>

            <div className="min-w-0 space-y-4">
              <KeyDepressionDiagram />
              <MistakeWeightDiagram />
            </div>
          </div>
        </div>
      </section>

      {/* ═════════════════════════════════════ mistakes — lilac slab */}
      <section className="slab slab-lilac" aria-labelledby="mistakes-heading">
        <div className="mx-auto w-full max-w-content px-5 sm:px-8">
          <h2 id="mistakes-heading" className="max-w-2xl text-4xl sm:text-5xl">
            What counts as a <em>mistake</em>
          </h2>
          <p className="mt-5 max-w-xl text-lg text-vast/70">
            This is where most candidates lose the test — not on speed.
          </p>

          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            <div className="card p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-err text-cream">
                  <X className="h-5 w-5" strokeWidth={3} aria-hidden />
                </span>
                <h3 className="text-2xl">Full mistake &mdash; costs 1 word</h3>
              </div>
              <ul className="mt-5 space-y-2.5">
                {FULL_MISTAKES.map((m) => (
                  <li key={m} className="flex gap-2.5 text-base leading-relaxed text-vast/70">
                    <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-err" />
                    {m}
                  </li>
                ))}
              </ul>
            </div>

            <div className="card p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-warn text-cream">
                  <span aria-hidden className="text-sm font-bold">½</span>
                </span>
                <h3 className="text-2xl">Half mistake &mdash; costs 0.5</h3>
              </div>
              <ul className="mt-5 space-y-2.5">
                {HALF_MISTAKES.map((m) => (
                  <li key={m} className="flex gap-2.5 text-base leading-relaxed text-vast/70">
                    <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-warn" />
                    {m}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ═════════════════════════════════════════ the sum — cream slab */}
      <section className="slab slab-cream" aria-labelledby="formula-heading">
        <div className="mx-auto w-full max-w-content px-5 sm:px-8">
          <h2 id="formula-heading" className="max-w-2xl text-4xl sm:text-5xl">
            The sum, <em>done once</em>
          </h2>

          <div className="mt-10 grid gap-8 lg:grid-cols-2 lg:gap-12">
            <div className="min-w-0">
              <div className="card overflow-x-auto p-5 font-mono text-sm leading-relaxed sm:p-6">
                gross words = key depressions &divide; 5
                <br />
                mistakes&nbsp;&nbsp;&nbsp; = full + (half &divide; 2)
                <br />
                net words&nbsp;&nbsp;&nbsp; = gross words &minus; mistakes
                <br />
                <strong>net speed</strong>&nbsp;&nbsp;&nbsp; = net words &divide;
                minutes
                <br />
                <strong>error %</strong>&nbsp;&nbsp;&nbsp;&nbsp; = mistakes
                &divide; gross words &times; 100
              </div>
              <p className="mt-4 text-base text-vast/60">
                Your test has to pass both: the speed for your post, and the
                error limit for your category.
              </p>
            </div>

            <div className="card min-w-0 p-5 sm:p-6">
              <p className="eyebrow">Worked example</p>
              <p className="mt-3 text-base leading-relaxed text-vast/70">
                You type{' '}
                <strong className="tnum text-vast">
                  {example.keyDepressions.toLocaleString('en-IN')}
                </strong>{' '}
                key depressions in {example.minutes} minutes, with{' '}
                <strong className="tnum text-vast">{example.full}</strong> full
                and <strong className="tnum text-vast">{example.half}</strong>{' '}
                half mistakes.
              </p>
              <dl className="tnum mt-5 space-y-2 text-base">
                <div className="flex justify-between gap-3 border-b border-vast/10 pb-2">
                  <dt className="text-vast/60">Gross words</dt>
                  <dd className="font-semibold">{exGrossWords}</dd>
                </div>
                <div className="flex justify-between gap-3 border-b border-vast/10 pb-2">
                  <dt className="text-vast/60">Mistakes</dt>
                  <dd className="font-semibold">{exErrors}</dd>
                </div>
                <div className="flex justify-between gap-3 border-b border-vast/10 pb-2">
                  <dt className="text-vast/60">Net speed</dt>
                  <dd className="font-semibold">{exNetWpm.toFixed(1)} WPM</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-vast/60">Error rate</dt>
                  <dd className="font-semibold">{exErrorPct.toFixed(1)}%</dd>
                </div>
              </dl>
              <p className="mt-5 text-base leading-relaxed text-vast/60">
                That clears LDC/JSA on speed (needs 35) and on errors (limit 7%
                for UR). Eight half mistakes cost this candidate four whole
                words &mdash; which is why the small slips matter.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════ every exam — ink slab */}
      <section className="on-dark slab slab-ink" aria-labelledby="exams-heading">
        <div className="mx-auto w-full max-w-content px-5 sm:px-8">
          <h2 id="exams-heading" className="max-w-2xl text-4xl sm:text-5xl">
            Every exam, <em>side by side</em>
          </h2>
          <p className="mt-5 max-w-xl text-lg text-lumen/70">
            The bar belongs to the post you applied for, not to the exam.
          </p>

          <div className="mt-10 min-w-0 overflow-x-auto rounded-2xl border-2 border-lumen/20">
            <table className="w-full min-w-[46rem] text-left">
              <caption className="sr-only">
                Speed, duration and error limit for every SSC typing test and DEST
              </caption>
              <thead>
                <tr className="border-b-2 border-lumen/20 bg-lumen/5">
                  <th scope="col" className="eyebrow !text-cream/50 px-5 py-3">Post</th>
                  <th scope="col" className="eyebrow !text-cream/50 px-3 py-3">Speed needed</th>
                  <th scope="col" className="eyebrow !text-cream/50 px-3 py-3">Time</th>
                  <th scope="col" className="eyebrow !text-cream/50 px-3 py-3">Passage</th>
                  <th scope="col" className="eyebrow !text-cream/50 px-5 py-3">Max errors (UR / OBC-EWS / SC-ST)</th>
                </tr>
              </thead>
              <tbody>
                {specs.map((s) => (
                  <tr key={s.type} className="border-b border-lumen/10 last:border-0 align-top">
                    <th scope="row" className="px-5 py-4 text-base font-medium">
                      {s.label}
                      <span className="mt-1 block text-sm font-normal text-lumen/50">
                        {s.posts.join(', ')}
                      </span>
                    </th>
                    <td className="tnum px-3 py-4 text-base text-lumen/75">
                      {s.qualifyingNature === 'speed_wpm' ? (
                        <>
                          {s.englishSpeedWpm} WPM
                          {s.hindiSpeedWpm ? (
                            <span className="block text-sm text-lumen/50">
                              {s.hindiSpeedWpm} WPM Hindi
                            </span>
                          ) : null}
                        </>
                      ) : (
                        <>
                          {s.englishKdph.toLocaleString('en-IN')} KDPH
                          <span className="block text-sm text-lumen/50">
                            ≈ {Math.round(s.englishKdph / 300)} WPM
                          </span>
                        </>
                      )}
                    </td>
                    <td className="tnum px-3 py-4 text-base text-lumen/75">
                      {s.durationMinutes} min
                    </td>
                    <td className="tnum px-3 py-4 text-base text-lumen/75">
                      {s.passageKeyDepressions[0].toLocaleString('en-IN')}–
                      {s.passageKeyDepressions[1].toLocaleString('en-IN')}
                      <span className="block text-sm text-lumen/50">key depressions</span>
                    </td>
                    <td className="tnum px-5 py-4 text-base font-semibold text-lumen/75">
                      <span className={s.errorAllowanceGeneral <= 7 ? 'text-glow' : ''}>
                        {s.errorAllowanceGeneral}%
                      </span>
                      {' / '}
                      {s.errorAllowanceObcEws}%{' / '}
                      {s.errorAllowanceScSt}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 space-y-2 text-base leading-relaxed text-lumen/60">
            <p>
              Candidates eligible for a scribe get 5 minutes of compensatory
              time on top of the durations above.
            </p>
            <p>
              <strong className="text-lumen">CGL DEST is shown at 5%.</strong>{' '}
              Published sources disagree on whether Tax Assistant is marked at
              5% or 20%, so we mark at 5% — a pass here is a pass under either
              reading. Confirm against the notice for your own year.
            </p>
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/exam" className="btn btn-cream btn-lg">
              Take a test on these rules
              <ArrowRight className="h-4 w-4" strokeWidth={2.2} aria-hidden />
            </Link>
            <Link href="/learn" className="btn btn-outline btn-lg">
              Learn to avoid the mistakes
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════ what we do — white slab */}
      <section className="slab slab-white" aria-labelledby="us-heading">
        <div className="mx-auto w-full max-w-content px-5 sm:px-8">
          <h2 id="us-heading" className="max-w-2xl text-4xl sm:text-5xl">
            How <em>we</em> mark you
          </h2>
          <p className="mt-5 max-w-xl text-lg text-vast/65">
            Exactly as above, with one addition of our own.
          </p>

          <ul className="mt-10 grid gap-6 sm:grid-cols-3">
            {[
              {
                title: 'Same formula',
                body: 'Net speed and error rate use the sums on this page. We report net speed, never gross — most practice sites quietly report gross, which reads several words per minute faster than the truth.',
              },
              {
                title: 'Your post, your bar',
                body: `All ${EXAM_VARIANTS.length} post variants are marked against their own speed and error limit, and your category changes the limit.`,
              },
              {
                title: 'Half the passage, minimum',
                body: 'Speed over three lines proves nothing, so an attempt has to reach half the passage to count as a pass. That rule is ours, not the Commission’s.',
              },
            ].map((c) => (
              <li key={c.title} className="card p-6">
                <div className="flex items-center gap-2.5">
                  <Check className="h-5 w-5 shrink-0 text-ok" strokeWidth={2.5} aria-hidden />
                  <h3 className="text-2xl">{c.title}</h3>
                </div>
                <p className="mt-3 text-base leading-relaxed text-vast/60">{c.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ═════════════════════════════════════════ sources — cream slab */}
      <section className="slab slab-cream" aria-labelledby="sources-heading">
        <div className="mx-auto w-full max-w-content px-5 sm:px-8">
          <h2 id="sources-heading" className="text-4xl sm:text-5xl">
            Where this <em>comes from</em>
          </h2>
          <p className="mt-5 max-w-xl text-lg text-vast/65">
            Read them yourself. Rules change between years, and the notice for
            your own examination is the only one that binds.
          </p>

          <ul className="mt-10 space-y-3">
            {SOURCES.map((s) => (
              <li key={s.href}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="card group flex items-start gap-4 p-5 transition-transform duration-200 ease-spring hover:-translate-y-1"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-lg font-medium underline underline-offset-4">
                      {s.label}
                    </span>
                    <span className="mt-1 block text-base text-vast/55">{s.note}</span>
                  </span>
                  <ArrowRight
                    className="mt-1 h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1"
                    strokeWidth={2.2}
                    aria-hidden
                  />
                </a>
              </li>
            ))}
          </ul>

          <p className="mt-8 max-w-2xl text-sm leading-relaxed text-vast/45">
            {APP.name} is not affiliated with, endorsed by or connected to the
            Staff Selection Commission, Eduquity Careers or TCS iON. Speed and
            error requirements are reproduced from published SSC notices; always
            confirm them against the notice for your own examination.
          </p>
        </div>
      </section>
    </>
  );
}
