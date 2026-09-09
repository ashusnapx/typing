'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import { APP } from '@/lib/config';
import {
  SSC_EXAM_SPECS,
  EXAM_VARIANTS,
} from '@/lib/exam-config';
import { MISTAKE_GROUPS, COMBINATIONS } from '@/lib/marking-scheme-examples';

/**
 * The marking scheme, in English or Hinglish.
 *
 * Most of the audience is sitting at a laptop for the first time, and the
 * curriculum already teaches in Hinglish ("Baithne ka sahi tareeka"), so the
 * page that explains how they are marked should be readable in the same
 * register. The toggle is remembered, because someone who needs Hinglish needs
 * it on every visit.
 *
 * Every rule carries a worked example. "Transposition — words typed in wrong
 * order" is meaningless; "passage says `I hope`, you typed `hope I`, half a
 * mistake" is not. Those examples come from lib/marking-scheme-examples.ts and
 * are asserted against the real evaluation engine in tests, so the page cannot
 * promise a cost the exam does not charge.
 */

export type Lang = 'en' | 'hi';
const LANG_KEY = 'tm-lang';

/* -------------------------------------------------------------------------- */

const T = {
  langLabel: { en: 'English', hi: 'Hinglish' },
  eyebrow: { en: 'Marking scheme', hi: 'Marking scheme' },
  title: {
    en: ['How the typing test is ', 'actually marked'],
    hi: ['Typing test ki ', 'marking kaise hoti hai'],
  },
  lede: {
    en: 'Everything below is from the Commission’s own notices, written for someone who has just sat down at a computer. Every rule has an example — the sources are at the bottom.',
    hi: 'Neeche sab kuch SSC ke apne notice se hai, un logon ke liye likha gaya jo abhi computer par baithe hain. Har niyam ke saath ek example hai — sources sabse neeche hain.',
  },

  wordsHeading: { en: ['First, the ', 'words they use'], hi: ['Pehle, ', 'kuch shabd samajh lein'] },

  terms: [
    {
      word: { en: 'Key depression', hi: 'Key depression (ek button dabana)' },
      body: {
        en: 'One press of a key. The letter a is one. So is a space, a comma, a full stop, and the Shift you hold for a capital.',
        hi: 'Keyboard ka ek button dabana. "a" ek hai. Space, comma, full stop, aur capital ke liye dabaya gaya Shift — sab ek-ek hain.',
      },
    },
    {
      word: { en: 'Word', hi: 'Word (shabd)' },
      body: {
        en: 'Five key depressions. Not a real word — a fixed unit. So "I" and "administration" do not count the same.',
        hi: 'Paanch key depressions. Asli shabd nahi — ek fixed maap. Isliye "I" aur "administration" barabar nahi ginte.',
      },
    },
    {
      word: { en: 'WPM (words per minute)', hi: 'WPM (words per minute)' },
      body: {
        en: 'Your key depressions divided by five, then divided by the minutes you typed for.',
        hi: 'Aapke key depressions ko 5 se bhaag dein, phir jitne minute type kiya us se bhaag dein.',
      },
    },
    {
      word: { en: 'KDPH (key depressions per hour)', hi: 'KDPH (key depressions per hour)' },
      body: {
        en: 'The same speed written differently. Divide by 300 to get WPM — so 8,000 KDPH is about 27 WPM, and 10,500 KDPH is 35 WPM.',
        hi: 'Wahi speed, doosre tareeke se. 300 se bhaag dein to WPM mil jaata hai — 8,000 KDPH ≈ 27 WPM, aur 10,500 KDPH = 35 WPM.',
      },
    },
    {
      word: { en: 'Gross speed', hi: 'Gross speed (kacchi speed)' },
      body: {
        en: 'Your raw speed, before any mistake is taken off.',
        hi: 'Aapki speed, galtiyan kaatne se pehle.',
      },
    },
    {
      word: { en: 'Net speed', hi: 'Net speed (asli speed)' },
      body: {
        en: 'Gross speed after mistakes are deducted. This is the number you are judged on.',
        hi: 'Galtiyan kaatne ke baad ki speed. Aapko isi number par jaancha jaata hai.',
      },
    },
    {
      word: { en: 'Qualifying', hi: 'Qualifying (sirf pass hona zaroori)' },
      body: {
        en: 'The test adds no marks to your merit list. But you must clear it, or you are out — however well you did in the written papers.',
        hi: 'Is test ke number merit list mein nahi judte. Par pass karna zaroori hai — warna written kitna bhi acha ho, aap bahar.',
      },
    },
  ],

  kdCaption: {
    en: 'Every letter, space and full stop counts as one key depression. Five of them make one "word" — so words per minute has nothing to do with how long the real words are.',
    hi: 'Har akshar, space aur full stop ek key depression hai. Paanch milkar ek "word" bante hain — isliye WPM ka asli shabdon ki lambai se koi lena-dena nahi.',
  },

  mistakesHeading: { en: ['What counts as a ', 'mistake'], hi: ['Galti kise ', 'maana jaata hai'] },
  mistakesLede: {
    en: 'This is where most candidates lose the test — not on speed. Two half mistakes cost the same as one full mistake.',
    hi: 'Zyadatar log yahin test haarte hain — speed par nahi. Do aadhi galtiyan milkar ek poori galti ke barabar.',
  },
  costsFull: { en: 'Costs 1 full mistake', hi: 'Poori galti — 1' },
  costsHalf: { en: 'Costs half a mistake', hi: 'Aadhi galti — 0.5' },
  passageSays: { en: 'Passage says', hi: 'Passage mein hai' },
  youTyped: { en: 'You typed', hi: 'Aapne type kiya' },
  howToAvoid: { en: 'How to avoid it', hi: 'Isse kaise bachein' },
  practise: { en: 'Practise this', hi: 'Yeh practice karein' },

  comboHeading: { en: ['When mistakes ', 'add up'], hi: ['Jab galtiyan ', 'jud jaati hain'] },
  comboLede: {
    en: 'Mistakes do not cancel out and they do not multiply. They add. Here is exactly how the sums work.',
    hi: 'Galtiyan na cancel hoti hain, na multiply. Woh sirf judti hain. Hisaab aise lagta hai.',
  },
  totalCost: { en: 'Total', hi: 'Kul' },
  /** Singular and plural, because "1 galtiyan" reads as badly in Hinglish as
   *  "1 mistakes" does in English. */
  mistakeWord: {
    en: { one: 'mistake', many: 'mistakes' },
    hi: { one: 'galti', many: 'galtiyan' },
  },

  formulaHeading: { en: ['The sum, ', 'done once'], hi: ['Hisaab, ', 'ek baar mein'] },
  workedExample: { en: 'Worked example', hi: 'Hisaab kar ke dekhein' },

  examsHeading: { en: ['Every exam, ', 'side by side'], hi: ['Har exam, ', 'ek saath'] },
  examsLede: {
    en: 'The bar belongs to the post you applied for, not to the exam.',
    hi: 'Bar us post ka hota hai jiske liye aapne apply kiya, poore exam ka nahi.',
  },

  usHeading: { en: ['How ', 'we mark you'], hi: ['Hum aapko ', 'kaise jaanchte hain'] },
  sourcesHeading: { en: ['Where this ', 'comes from'], hi: ['Yeh sab ', 'kahan se aaya'] },
  sourcesLede: {
    en: 'Read them yourself. Rules change between years, and the notice for your own examination is the only one that binds.',
    hi: 'Khud padhein. Niyam saal-dar-saal badalte hain, aur sirf aapke apne exam ka notice hi maanya hai.',
  },
  ctaTest: { en: 'Take a test on these rules', hi: 'Inhi niyamon par test dein' },
  ctaLearn: { en: 'Learn to avoid the mistakes', hi: 'Galtiyan rokna seekhein' },
} as const;

const SOURCES = [
  {
    label: 'SSC CHSL 2025 — Notice of Examination',
    note: {
      en: 'Speeds, durations, passage lengths and compensatory time (paras 13.8.13.6–13.8.13.7).',
      hi: 'Speed, samay, passage ki lambai aur compensatory time (para 13.8.13.6–13.8.13.7).',
    },
    href: 'https://ssc.gov.in/api/attachment/uploads/masterData/NoticeBoards/Notice_of_adv_chsl_2025.pdf',
  },
  {
    label: 'SSC CGL 2025 — Notice of Examination',
    note: {
      en: 'Tier-4 DEST and CPT requirements for Tax Assistant, ASO and Inspector posts.',
      hi: 'Tax Assistant, ASO aur Inspector ke liye Tier-4 DEST aur CPT ke niyam.',
    },
    href: 'https://ssc.gov.in/api/attachment/uploads/masterData/NoticeBoards/Notice_of_adv_cgl_2025.pdf',
  },
  {
    label: 'SSC — Revised Guidelines for Evaluation of Typing Test / DEST Scripts',
    note: {
      en: 'The full and half mistake list, and how errors are counted.',
      hi: 'Poori aur aadhi galtiyon ki list, aur ginti ka tareeka.',
    },
    href: 'https://ssc.nic.in/Downloads/portal/english/evaluation-dest-tt.pdf',
  },
  {
    label: 'SSC — official website',
    note: {
      en: 'Always confirm against the notice for your own examination year.',
      hi: 'Apne saal ke notice se hamesha mila kar dekh lein.',
    },
    href: 'https://ssc.gov.in',
  },
];

/* -------------------------------------------------------------------------- */

function KeyDepressionDiagram({ lang }: { lang: Lang }) {
  const cells = ['t', 'h', 'e', '␣', 'i'];
  return (
    <figure className="card-flat p-5">
      <svg viewBox="0 0 360 120" className="h-auto w-full" role="img" aria-label={T.kdCaption[lang]}>
        {cells.map((c, i) => (
          <g key={i}>
            <rect x={10 + i * 62} y={22} width={52} height={52} rx={8} fill="rgb(255 255 235)" stroke="rgb(26 26 26)" strokeWidth={2} />
            <text x={36 + i * 62} y={56} textAnchor="middle" fontSize={22} fontFamily="monospace" fill="rgb(26 26 26)">{c}</text>
          </g>
        ))}
        <path d="M10 88 L322 88" stroke="rgb(26 26 26)" strokeWidth={1.5} opacity={0.35} />
        <text x={166} y={110} textAnchor="middle" fontSize={14} fill="rgb(26 26 26)">
          {lang === 'hi' ? '5 button = 1 word' : '5 key presses = 1 word'}
        </text>
      </svg>
      <figcaption className="mt-3 text-sm text-vast/60">{T.kdCaption[lang]}</figcaption>
    </figure>
  );
}

/** One rule, its meaning, and every way it actually shows up. */
function MistakeCard({
  group,
  lang,
}: {
  group: (typeof MISTAKE_GROUPS)[number];
  lang: Lang;
}) {
  const isFull = group.weight === 'full';
  return (
    <article className="card overflow-hidden">
      <header
        className={`flex flex-wrap items-center gap-x-3 gap-y-1 border-b-2 border-vast px-5 py-4 ${
          isFull ? 'bg-err-bg' : 'bg-warn-bg'
        }`}
      >
        <h3 className="text-2xl">{group.title[lang]}</h3>
        <span className={`chip ml-auto shrink-0 ${isFull ? 'chip-err' : ''}`}>
          {isFull ? T.costsFull[lang] : T.costsHalf[lang]}
        </span>
      </header>

      <div className="p-5">
        <p className="text-base leading-relaxed text-vast/70">{group.meaning[lang]}</p>

        <ul className="mt-5 space-y-3">
          {group.examples.map((ex, i) => (
            <li key={i} className="card-flat p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="min-w-0">
                  <span className="eyebrow">{T.passageSays[lang]}</span>
                  <p className="mt-1.5 break-words font-mono text-base text-ok">
                    {ex.passage}
                  </p>
                </div>
                <div className="min-w-0">
                  <span className="eyebrow">{T.youTyped[lang]}</span>
                  <p className="mt-1.5 break-words font-mono text-base text-err">
                    {ex.typed}
                  </p>
                </div>
              </div>
              <p className="mt-3 flex flex-wrap items-baseline gap-x-2 text-sm text-vast/60">
                <span className="tnum shrink-0 font-semibold text-vast">
                  &minus;{ex.cost}
                </span>
                {ex.why[lang]}
              </p>
            </li>
          ))}
        </ul>

        <div className="mt-5 border-t-2 border-vast/10 pt-4">
          <span className="eyebrow">{T.howToAvoid[lang]}</span>
          <p className="mt-2 text-base leading-relaxed text-vast/70">{group.fix[lang]}</p>
          <Link
            href={`/exam/lesson/${group.lessonId}`}
            className="mt-3 inline-flex items-center gap-1.5 text-base font-medium underline underline-offset-4"
          >
            {T.practise[lang]}
            <ArrowRight className="h-4 w-4" strokeWidth={2.2} aria-hidden />
          </Link>
        </div>
      </div>
    </article>
  );
}

/* -------------------------------------------------------------------------- */

export function MarkingScheme() {
  const [lang, setLang] = useState<Lang>('en');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LANG_KEY);
      if (saved === 'hi' || saved === 'en') setLang(saved);
    } catch {
      /* private mode */
    }
  }, []);

  const choose = (l: Lang) => {
    setLang(l);
    try {
      localStorage.setItem(LANG_KEY, l);
    } catch {
      /* private mode */
    }
  };

  const specs = Object.values(SSC_EXAM_SPECS);
  const halfGroups = MISTAKE_GROUPS.filter((g) => g.weight === 'half');
  const fullGroups = MISTAKE_GROUPS.filter((g) => g.weight === 'full');

  /* Computed, not typed in, so the arithmetic on the page is the arithmetic
     the app performs. */
  const ex = { keyDepressions: 1800, full: 6, half: 8, minutes: 10 };
  const grossWords = ex.keyDepressions / 5;
  const errors = ex.full + ex.half / 2;
  const netWpm = (grossWords - errors) / ex.minutes;
  const errorPct = (errors / grossWords) * 100;

  const h = (parts: readonly [string, string]) => (
    <>
      {parts[0]}
      <em>{parts[1]}</em>
    </>
  );

  return (
    <>
      {/* ═══════════════════════════════════════════════════ lead — cream */}
      <section className="px-5 pb-14 pt-12 sm:px-8 sm:pb-16 sm:pt-16">
        <div className="mx-auto w-full max-w-content">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="eyebrow">{T.eyebrow[lang]}</p>
            <div role="radiogroup" aria-label="Language" className="segment">
              {(['en', 'hi'] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  role="radio"
                  aria-checked={lang === l}
                  data-active={lang === l}
                  onClick={() => choose(l)}
                  className="segment-item text-sm"
                >
                  {T.langLabel[l]}
                </button>
              ))}
            </div>
          </div>

          <h1 className="mt-6 max-w-3xl text-5xl sm:text-6xl">{h(T.title[lang])}</h1>
          <p className="mt-6 max-w-xl text-lg text-vast/70">{T.lede[lang]}</p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ the words — white slab */}
      <section className="slab slab-white" aria-labelledby="words-heading">
        <div className="mx-auto w-full max-w-content px-5 sm:px-8">
          <h2 id="words-heading" className="max-w-2xl text-4xl sm:text-5xl">
            {h(T.wordsHeading[lang])}
          </h2>

          <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)] lg:gap-16">
            <dl className="min-w-0">
              {T.terms.map((t) => (
                <div key={t.word.en} className="border-b-2 border-vast/10 py-4 last:border-0">
                  <dt className="text-xl">{t.word[lang]}</dt>
                  <dd className="mt-1.5 text-base leading-relaxed text-vast/65">
                    {t.body[lang]}
                  </dd>
                </div>
              ))}
            </dl>
            <div className="min-w-0">
              <KeyDepressionDiagram lang={lang} />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════ mistakes — lilac slab */}
      <section className="slab slab-lilac" aria-labelledby="mistakes-heading">
        <div className="mx-auto w-full max-w-content px-5 sm:px-8">
          <h2 id="mistakes-heading" className="max-w-2xl text-4xl sm:text-5xl">
            {h(T.mistakesHeading[lang])}
          </h2>
          <p className="mt-5 max-w-xl text-lg text-vast/70">{T.mistakesLede[lang]}</p>

          <h3 className="mt-12 text-3xl">
            {lang === 'hi' ? 'Aadhi galtiyan (0.5)' : 'Half mistakes (0.5 each)'}
          </h3>
          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            {halfGroups.map((g) => (
              <MistakeCard key={g.kind} group={g} lang={lang} />
            ))}
          </div>

          <h3 className="mt-12 text-3xl">
            {lang === 'hi' ? 'Poori galtiyan (1)' : 'Full mistakes (1 each)'}
          </h3>
          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            {fullGroups.map((g) => (
              <MistakeCard key={g.kind} group={g} lang={lang} />
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════ combinations — cream slab */}
      <section className="slab slab-cream" aria-labelledby="combo-heading">
        <div className="mx-auto w-full max-w-content px-5 sm:px-8">
          <h2 id="combo-heading" className="max-w-2xl text-4xl sm:text-5xl">
            {h(T.comboHeading[lang])}
          </h2>
          <p className="mt-5 max-w-xl text-lg text-vast/70">{T.comboLede[lang]}</p>

          <ul className="mt-10 space-y-4">
            {COMBINATIONS.map((c, i) => (
              <li key={i} className="card p-5 sm:p-6">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="min-w-0">
                    <span className="eyebrow">{T.passageSays[lang]}</span>
                    <p className="mt-1.5 break-words font-mono text-base text-ok">{c.passage}</p>
                  </div>
                  <div className="min-w-0">
                    <span className="eyebrow">{T.youTyped[lang]}</span>
                    <p className="mt-1.5 break-words font-mono text-base text-err">{c.typed}</p>
                  </div>
                </div>

                <div className="tnum mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 border-t-2 border-vast/10 pt-4 text-base">
                  {c.full > 0 && (
                    <span className="chip chip-err">
                      {c.full} &times; {lang === 'hi' ? 'poori' : 'full'} = {c.full}
                    </span>
                  )}
                  {c.half > 0 && (
                    <span className="chip">
                      {c.half} &times; {lang === 'hi' ? 'aadhi' : 'half'} = {c.half / 2}
                    </span>
                  )}
                  <span className="ml-auto font-semibold">
                    {T.totalCost[lang]}: {c.total}{' '}
                    {c.total === 1
                      ? T.mistakeWord[lang].one
                      : T.mistakeWord[lang].many}
                  </span>
                </div>

                <p className="mt-3 text-base leading-relaxed text-vast/60">{c.note[lang]}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ═══════════════════════════════════════ the sum — white slab */}
      <section className="slab slab-white" aria-labelledby="formula-heading">
        <div className="mx-auto w-full max-w-content px-5 sm:px-8">
          <h2 id="formula-heading" className="max-w-2xl text-4xl sm:text-5xl">
            {h(T.formulaHeading[lang])}
          </h2>

          <div className="mt-10 grid gap-8 lg:grid-cols-2 lg:gap-12">
            <div className="min-w-0 overflow-x-auto">
              <div className="card min-w-0 p-5 font-mono text-sm leading-relaxed sm:p-6">
                gross words = key depressions &divide; 5<br />
                mistakes&nbsp;&nbsp;&nbsp; = full + (half &divide; 2)<br />
                net words&nbsp;&nbsp;&nbsp; = gross words &minus; mistakes<br />
                <strong>net speed</strong>&nbsp;&nbsp;&nbsp; = net words &divide; minutes<br />
                <strong>error %</strong>&nbsp;&nbsp;&nbsp;&nbsp; = mistakes &divide; gross words &times; 100
              </div>
            </div>

            <div className="card min-w-0 p-5 sm:p-6">
              <p className="eyebrow">{T.workedExample[lang]}</p>
              <p className="mt-3 text-base leading-relaxed text-vast/70">
                {lang === 'hi' ? (
                  <>
                    Aapne {ex.minutes} minute mein{' '}
                    <strong className="tnum text-vast">{ex.keyDepressions.toLocaleString('en-IN')}</strong>{' '}
                    key depressions kiye, <strong className="tnum text-vast">{ex.full}</strong> poori aur{' '}
                    <strong className="tnum text-vast">{ex.half}</strong> aadhi galtiyon ke saath.
                  </>
                ) : (
                  <>
                    You type{' '}
                    <strong className="tnum text-vast">{ex.keyDepressions.toLocaleString('en-IN')}</strong>{' '}
                    key depressions in {ex.minutes} minutes, with{' '}
                    <strong className="tnum text-vast">{ex.full}</strong> full and{' '}
                    <strong className="tnum text-vast">{ex.half}</strong> half mistakes.
                  </>
                )}
              </p>
              <dl className="tnum mt-5 space-y-2 text-base">
                {[
                  [lang === 'hi' ? 'Gross words' : 'Gross words', String(grossWords)],
                  [lang === 'hi' ? 'Galtiyan' : 'Mistakes', String(errors)],
                  [lang === 'hi' ? 'Net speed' : 'Net speed', `${netWpm.toFixed(1)} WPM`],
                  [lang === 'hi' ? 'Error rate' : 'Error rate', `${errorPct.toFixed(1)}%`],
                ].map(([k, v], i, arr) => (
                  <div
                    key={k}
                    className={`flex justify-between gap-3 ${i < arr.length - 1 ? 'border-b border-vast/10 pb-2' : ''}`}
                  >
                    <dt className="text-vast/60">{k}</dt>
                    <dd className="font-semibold">{v}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-5 text-base leading-relaxed text-vast/60">
                {lang === 'hi'
                  ? 'Yeh LDC/JSA pass kar leta hai — speed bhi (35 chahiye) aur errors bhi (UR ke liye 7% tak). Aath aadhi galtiyon ne chaar poore shabd kha liye.'
                  : 'That clears LDC/JSA on speed (needs 35) and on errors (limit 7% for UR). Eight half mistakes cost this candidate four whole words.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════ every exam — ink slab */}
      <section className="on-dark slab slab-ink" aria-labelledby="exams-heading">
        <div className="mx-auto w-full max-w-content px-5 sm:px-8">
          <h2 id="exams-heading" className="max-w-2xl text-4xl sm:text-5xl">
            {h(T.examsHeading[lang])}
          </h2>
          <p className="mt-5 max-w-xl text-lg text-lumen/70">{T.examsLede[lang]}</p>

          <div className="mt-10 min-w-0 overflow-x-auto rounded-2xl border-2 border-lumen/20">
            <table className="w-full min-w-[46rem] text-left">
              <caption className="sr-only">{T.examsHeading[lang].join('')}</caption>
              <thead>
                <tr className="border-b-2 border-lumen/20 bg-lumen/5">
                  {[
                    lang === 'hi' ? 'Post' : 'Post',
                    lang === 'hi' ? 'Speed chahiye' : 'Speed needed',
                    lang === 'hi' ? 'Samay' : 'Time',
                    lang === 'hi' ? 'Passage' : 'Passage',
                    lang === 'hi' ? 'Max errors (UR / OBC-EWS / SC-ST)' : 'Max errors (UR / OBC-EWS / SC-ST)',
                  ].map((th) => (
                    <th key={th} scope="col" className="eyebrow !text-cream/50 px-5 py-3">
                      {th}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {specs.map((s) => (
                  <tr key={s.type} className="border-b border-lumen/10 align-top last:border-0">
                    <th scope="row" className="px-5 py-4 text-base font-medium">
                      {s.label}
                      <span className="mt-1 block text-sm font-normal text-lumen/50">
                        {s.posts.join(', ')}
                      </span>
                    </th>
                    <td className="tnum px-5 py-4 text-base text-lumen/75">
                      {s.qualifyingNature === 'speed_wpm' ? (
                        <>
                          {s.englishSpeedWpm} WPM
                          {s.hindiSpeedWpm ? (
                            <span className="block text-sm text-lumen/50">{s.hindiSpeedWpm} WPM Hindi</span>
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
                    <td className="tnum px-5 py-4 text-base text-lumen/75">{s.durationMinutes} min</td>
                    <td className="tnum px-5 py-4 text-base text-lumen/75">
                      {s.passageKeyDepressions[0].toLocaleString('en-IN')}–
                      {s.passageKeyDepressions[1].toLocaleString('en-IN')}
                      <span className="block text-sm text-lumen/50">key depressions</span>
                    </td>
                    <td className="tnum px-5 py-4 text-base font-semibold text-lumen/75">
                      <span className={s.errorAllowanceGeneral <= 7 ? 'text-glow' : ''}>
                        {s.errorAllowanceGeneral}%
                      </span>
                      {' / '}{s.errorAllowanceObcEws}%{' / '}{s.errorAllowanceScSt}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 space-y-2 text-base leading-relaxed text-lumen/60">
            <p>
              {lang === 'hi'
                ? 'Scribe ke liye eligible candidates ko upar diye samay se 5 minute extra milte hain.'
                : 'Candidates eligible for a scribe get 5 minutes of compensatory time on top of the durations above.'}
            </p>
            <p>
              <strong className="text-lumen">
                {lang === 'hi' ? 'CGL DEST yahan 5% par hai.' : 'CGL DEST is shown at 5%.'}
              </strong>{' '}
              {lang === 'hi'
                ? 'Alag-alag sources mein Tax Assistant ke liye 5% ya 20% likha hai. Hum 5% par jaanchte hain — yahan pass matlab dono hisaab se pass. Apne saal ke notice se mila lein.'
                : 'Published sources disagree on whether Tax Assistant is marked at 5% or 20%, so we mark at 5% — a pass here is a pass under either reading. Confirm against the notice for your own year.'}
            </p>
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/exam" className="btn btn-cream btn-lg">
              {T.ctaTest[lang]}
              <ArrowRight className="h-4 w-4" strokeWidth={2.2} aria-hidden />
            </Link>
            <Link href="/learn" className="btn btn-outline btn-lg">
              {T.ctaLearn[lang]}
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════ what we do — cream slab */}
      <section className="slab slab-cream" aria-labelledby="us-heading">
        <div className="mx-auto w-full max-w-content px-5 sm:px-8">
          <h2 id="us-heading" className="max-w-2xl text-4xl sm:text-5xl">
            {h(T.usHeading[lang])}
          </h2>

          <ul className="mt-10 grid gap-6 sm:grid-cols-3">
            {[
              {
                en: { t: 'Same formula', b: 'Net speed and error rate use the sums on this page. We report net speed, never gross — most practice sites quietly report gross, which reads several words per minute faster than the truth.' },
                hi: { t: 'Wahi formula', b: 'Net speed aur error rate isi page ke hisaab se. Hum net speed dikhate hain, gross nahi — zyadatar sites gross dikhati hain, jo asli se kai WPM zyada lagti hai.' },
              },
              {
                en: { t: 'Your post, your bar', b: `All ${EXAM_VARIANTS.length} post variants are marked against their own speed and error limit, and your category changes the limit.` },
                hi: { t: 'Aapki post, aapka bar', b: `Sabhi ${EXAM_VARIANTS.length} post apne-apne speed aur error limit par jaanche jaate hain, aur aapki category limit badal deti hai.` },
              },
              {
                en: { t: 'Half the passage, minimum', b: 'Speed over three lines proves nothing, so an attempt has to reach half the passage to count as a pass. That rule is ours, not the Commission’s.' },
                hi: { t: 'Kam se kam aadha passage', b: 'Teen line ki speed kuch sabit nahi karti, isliye pass hone ke liye aadha passage type karna zaroori hai. Yeh niyam hamara hai, SSC ka nahi.' },
              },
            ].map((c) => (
              <li key={c.en.t} className="card p-6">
                <div className="flex items-center gap-2.5">
                  <Check className="h-5 w-5 shrink-0 text-ok" strokeWidth={2.5} aria-hidden />
                  <h3 className="text-2xl">{c[lang].t}</h3>
                </div>
                <p className="mt-3 text-base leading-relaxed text-vast/60">{c[lang].b}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ═════════════════════════════════════════ sources — white slab */}
      <section className="slab slab-white" aria-labelledby="sources-heading">
        <div className="mx-auto w-full max-w-content px-5 sm:px-8">
          <h2 id="sources-heading" className="text-4xl sm:text-5xl">{h(T.sourcesHeading[lang])}</h2>
          <p className="mt-5 max-w-xl text-lg text-vast/65">{T.sourcesLede[lang]}</p>

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
                    <span className="block text-lg font-medium underline underline-offset-4">{s.label}</span>
                    <span className="mt-1 block text-base text-vast/55">{s.note[lang]}</span>
                  </span>
                  <ArrowRight className="mt-1 h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1" strokeWidth={2.2} aria-hidden />
                </a>
              </li>
            ))}
          </ul>

          <p className="mt-8 max-w-2xl text-sm leading-relaxed text-vast/45">
            {lang === 'hi'
              ? `${APP.name} ka Staff Selection Commission, Eduquity Careers ya TCS iON se koi sambandh nahi hai. Speed aur error ke niyam SSC ke prakashit notice se liye gaye hain; apne exam ke notice se hamesha mila lein.`
              : `${APP.name} is not affiliated with, endorsed by or connected to the Staff Selection Commission, Eduquity Careers or TCS iON. Speed and error requirements are reproduced from published SSC notices; always confirm them against the notice for your own examination.`}
          </p>
        </div>
      </section>
    </>
  );
}
