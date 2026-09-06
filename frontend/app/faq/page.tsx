import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { APP, LEGAL } from '@/lib/config';
import { FULL_MISTAKES, HALF_MISTAKES } from '@/lib/exam-config';

export const metadata: Metadata = {
  title: 'FAQ',
  description:
    'SSC typing test questions answered: required speed for CHSL and CGL, KDPH to WPM, error caps by post and category, full and half mistakes, the net speed formula, and how to practise.',
  alternates: { canonical: '/faq' },
  robots: { index: true, follow: true },
};

type FaqItem = {
  q: string;
  /** One paragraph per string. */
  a: readonly string[];
  /** Optional bullet list rendered after the paragraphs. */
  list?: readonly string[];
};

type FaqGroup = {
  id: string;
  title: string;
  blurb: string;
  items: readonly FaqItem[];
};

/* Sources: SSC CHSL 2025 Notice of Examination, paras 13.8.13.6–13.8.13.7, and
 * the Commission's Revised Guidelines for Evaluation of Typing Test / DEST
 * Scripts. The same documents drive lib/ssc-posts.ts and lib/exam-config.ts, so
 * an answer here and a target in the product cannot drift apart. */
const GROUPS: readonly FaqGroup[] = [
  {
    id: 'the-exam',
    title: 'The exam',
    blurb: 'What the Commission actually requires, post by post.',
    items: [
      {
        q: 'What typing speed does the SSC CHSL skill test require?',
        a: [
          'For LDC and JSA posts the requirement is 35 words per minute in English or 30 words per minute in Hindi, typed within 10 minutes. In the Commission’s other unit that is 10,500 and 9,000 key depressions per hour.',
          'The medium is the one you chose in your application form. You cannot switch it on the day.',
        ],
      },
      {
        q: 'Is the skill test 10 minutes or 15 minutes?',
        a: [
          'It depends on the post, not the exam. The Typing Test for LDC and JSA runs 10 minutes. The Data Entry Skill Test — DEO under CHSL, and DEST for CGL posts — runs 15 minutes.',
          'Candidates eligible for a scribe get 5 minutes of compensatory time on top, and you can switch that on in every mode here so your practice matches the clock you will actually get.',
        ],
      },
      {
        q: 'What is KDPH, and how do I convert it to WPM?',
        a: [
          'KDPH is key depressions per hour — every character, space and punctuation mark counts as one depression. The Commission fixes a word at five depressions, so WPM is KDPH divided by 300.',
          '8,000 KDPH is about 27 WPM. 10,500 KDPH is 35 WPM. 15,000 KDPH — the DEO Grade A requirement — is about 50 WPM.',
        ],
      },
      {
        q: 'How many mistakes am I allowed?',
        a: [
          'The error cap depends on the post and on your category. There are three families of cap.',
        ],
        list: [
          'Typing Test posts (LDC, JSA, Postal and Sorting Assistant): 7% for unreserved, 10% for OBC, EWS, SC and ST.',
          'Data-entry posts marked on DEST (DEO, DEO Grade A, UDC): 20% unreserved, 25% OBC and EWS, 30% SC and ST.',
          'Computer Proficiency Test posts (ASO in CSS, MEA and AFHQ; Inspector in CBIC): 5% unreserved, 7% OBC, EWS, SC and ST, and 10% for candidates with a benchmark disability.',
        ],
      },
      {
        q: 'Which posts are marked against the strict 5% cap?',
        a: [
          'Assistant Section Officer in the Central Secretariat Service, Ministry of External Affairs and AFHQ, and Inspector posts under CBIC. These are evaluated as a Computer Proficiency Test, where the allowance is a quarter of the one used for data-entry posts.',
          'Public sources disagree on where Tax Assistant sits. We show both bars for that post rather than picking one quietly — practise to 5% and you clear either reading.',
        ],
      },
      {
        q: 'Is the typing test qualifying, or does it carry marks?',
        a: [
          'Qualifying. No marks from it are added to your final score. It is still mandatory: fail it and the post goes, whatever your written score was.',
        ],
      },
      {
        q: 'Can I take the skill test in Hindi?',
        a: [
          'For CHSL LDC and JSA, yes — at 30 WPM, in Unicode Devanagari. DEO and the CGL DEST posts are English only.',
          'The real test uses the Mangal Unicode font, with a choice of the InScript or Remington (Gail) layout made before you begin. Install the layout you intend to use and practise on it, because you cannot change it once the test starts.',
        ],
      },
      {
        q: 'How long is the passage?',
        a: [
          'Long enough that finishing it at the required speed is the whole test. Roughly 1,700–1,900 key depressions for the 10-minute Typing Test, 2,000–2,200 for the 15-minute DEST, and 3,700–4,000 for the 15,000 KDPH DEO Grade A test.',
        ],
      },
      {
        q: 'Do PwBD candidates get extra time?',
        a: [
          'Candidates eligible for a scribe under the Commission’s rules get 5 minutes of compensatory time. Separate error allowances also apply to some posts.',
          'Every mode here supports the compensatory clock, so you never have to mentally adjust a mock built for someone else.',
        ],
      },
      {
        q: 'Can I use backspace, or Ctrl+Z, during the test?',
        a: [
          'Editing with backspace is permitted in the SSC skill test as currently notified, and our modes follow the post you selected. Keyboard shortcuts beyond basic typing — undo, cut, copy, paste, spell check and autocorrect — are disabled in the exam interface.',
          'Backspace is a trap even where it is allowed. Every correction costs seconds you do not get back, and the cheapest way to raise net speed is usually to stop reaching for it. Blind mode exists to break the habit.',
        ],
      },
    ],
  },
  {
    id: 'scoring',
    title: 'Scoring and evaluation',
    blurb: 'How a result is arrived at, and why ours is lower than most.',
    items: [
      {
        q: 'How is net speed calculated?',
        a: [
          'Total key depressions divided by five gives gross words. From that the Commission subtracts full mistakes, and half of the half mistakes. Divide by the duration in minutes and you have net words per minute.',
          'In one line: net WPM = (key depressions ÷ 5 − full mistakes − half mistakes ÷ 2) ÷ minutes.',
        ],
      },
      {
        q: 'What counts as a full mistake?',
        a: ['Each of these costs a whole word:'],
        list: FULL_MISTAKES,
      },
      {
        q: 'What counts as a half mistake?',
        a: [
          'Each of these costs half a word. Two of them cost the same as one full mistake:',
        ],
        list: HALF_MISTAKES,
      },
      {
        q: 'How is the error percentage worked out?',
        a: [
          'Full mistakes plus half of the half mistakes gives your total errors. Expressed as a percentage of the gross words you typed, that is the error percentage compared against your post and category cap.',
          'Speed and errors are separate bars. You must clear both — a fast candidate over the error cap fails exactly as a slow accurate one does.',
        ],
      },
      {
        q: 'Why is my speed here lower than on other typing sites?',
        a: [
          'Because most sites report gross speed and we report net. Gross ignores mistakes entirely, which routinely reads five to eight WPM higher than the number the Commission would give you.',
          'It is not a comfortable number, but it is the one that decides the post. If you want the flattering figure, it is on your result screen too, next to the real one.',
        ],
      },
      {
        q: 'Does an omitted word cost more than a spelling error?',
        a: [
          'No. Omission, substitution, addition, repetition, an incomplete word and a spelling error are all full mistakes. Spacing, capitalisation, punctuation, transposition and paragraph formatting are half mistakes.',
          'This is why candidates who type quickly still fail. Speed is trained by everyone; mistake mechanics are trained by almost nobody, which is why a whole stage of our curriculum is devoted to them.',
        ],
      },
      {
        q: 'What happens if I do not finish the passage?',
        a: [
          'Your speed is computed from what you actually typed, so stopping early lowers it rather than protecting you from mistakes. Each passage is sized so that completing it inside the time is exactly what the required speed looks like — if you did not finish, you did not make the bar.',
        ],
      },
    ],
  },
  {
    id: 'using-it',
    title: 'Using Typing Mania',
    blurb: 'Which mode to sit in, and how to practise so it counts.',
    items: [
      {
        q: 'Do I need an account to take a test?',
        a: [
          'No. Every lesson and every full-length scored test works signed out.',
          'An account only adds the things that need memory: history across weeks, trend lines, per-key accuracy, coaching feedback and leaderboards.',
        ],
      },
      {
        q: 'What is blind mode, and should I use it?',
        a: [
          'Blind mode hides every error highlight while you type. Mistakes appear only in the report at the end — which is exactly what the real interface does.',
          'Use it once you can type the passage without looking down. Practising only in a mode that colours your mistakes as you make them trains a reflex the exam will not let you use.',
        ],
      },
      {
        q: 'What is the difference between mock mode and the Eduquity replica?',
        a: [
          'Mock mode is a full-length test under exam conditions with our own interface. The replica rebuilds the layout, timer placement, fonts, instruction screen and typing area of the exam software itself.',
          'Practise in either for speed; sit the replica in the last two weeks so the screen is familiar before it matters.',
        ],
      },
      {
        q: 'How do I set my post so the targets are right?',
        a: [
          'Pick your post and category once on the Learn page. Every timer, target, error cap and verdict across the product follows from the notification for that post, including the compensatory clock if you are eligible for it.',
          'The default is LDC / JSA at the unreserved cap, which is the strictest common case among the typing-test posts.',
        ],
      },
      {
        q: 'Can I practise Hindi typing here?',
        a: [
          'Yes — Hindi mode runs on Unicode Devanagari with the same evaluation engine, and includes a phonetic input for practising without installing anything. Capitalisation errors do not apply in Hindi, as the Commission’s guidelines specify.',
          'If your exam is in Hindi, also install the InScript layout on your own machine and put your final weeks of practice into it. Layout muscle memory is the part transliteration cannot teach you.',
        ],
      },
      {
        q: 'Does it work if my internet drops mid-test?',
        a: [
          'Yes. Tests run entirely in your browser and completed attempts are stored on your device, then synced when the connection returns. A dropped connection does not cost you a result.',
        ],
      },
      {
        q: 'How much should I practise each day?',
        a: [
          'Thirty focused minutes beats two distracted hours. A workable split is ten minutes of drills on your weakest keys, fifteen minutes of one full-length test in blind mode, and five minutes reading the mistake review.',
          'Chase accuracy first. Speed follows accuracy within two or three weeks; accuracy almost never follows speed.',
        ],
      },
      {
        q: 'I have never used a keyboard properly. Where do I start?',
        a: [
          'The Learn page, at stage zero. It begins with posture and finger placement and assumes nothing — the home row before the alphabet, the alphabet before words, words before passages.',
        ],
      },
    ],
  },
  {
    id: 'account',
    title: 'Account, data and payments',
    blurb: 'What we store, what it costs, and how to get out.',
    items: [
      {
        q: 'Is Typing Mania free?',
        a: [
          'The parts that decide whether you qualify are free: the lessons, full-length scored tests, the evaluation engine and your mistake review. No account, no card.',
          'Paid plans add extras on top. They never gate a scored test.',
        ],
      },
      {
        q: 'What data do you store about me?',
        a: [
          'An email address if you make an account, your exam preferences, and what you typed during a test with its keystroke timings — which is what makes mistake review and weak-key analysis possible at all.',
          'The privacy policy lists every category, why we hold it and for how long.',
        ],
      },
      {
        q: 'Can I delete my account and my data?',
        a: [
          `Yes, from your account settings, at any time. We erase your personal data within 30 days apart from records the law requires us to keep, such as payment entries. You can also delete individual tests without deleting the account.`,
          `Under the Digital Personal Data Protection Act, 2023 you can also ask for a summary of your data, have it corrected, withdraw consent, or nominate someone to exercise these rights for you. Write to ${LEGAL.privacyEmail} and we will respond within ${LEGAL.resolveDays} days.`,
        ],
      },
      {
        q: 'Do you sell my data or run ads?',
        a: [
          'No, and no. There are no advertising networks, no cross-site trackers and no data sales. Leaderboards show only the display name and score you chose to publish.',
        ],
      },
      {
        q: 'How do refunds work?',
        a: [
          `A first subscription can be refunded in full within ${LEGAL.refundWindowDays} days of payment, no reason needed, and approved refunds reach the original payment method in ${LEGAL.refundProcessingDays}. Cancelling stops renewal and you keep access until the paid period ends.`,
        ],
      },
      {
        q: 'A speed or error cap here does not match my notification. What now?',
        a: [
          `Tell us and we will fix it. Send the notice and the paragraph number to ${LEGAL.supportEmail} — corrections to exam data go to the front of the queue, because a wrong cap here is worse than no cap at all.`,
          'Requirements change between cycles. Always confirm the numbers against the notice governing your own examination.',
        ],
      },
    ],
  },
];

/* FAQPage markup no longer produces rich results in Google Search (withdrawn in
 * May 2026) but remains valid schema.org, and is still read by other engines
 * and by AI answer surfaces. It costs a few hundred bytes, so it stays. */
const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: GROUPS.flatMap((g) =>
    g.items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: [...item.a, ...(item.list ?? [])].join(' '),
      },
    }))
  ),
};

function QuestionRow({ item }: { item: FaqItem }) {
  return (
    <details className="group border-b-2 border-vast/10 last:border-0">
      <summary className="flex cursor-pointer list-none items-start gap-4 py-5 text-lg font-medium transition-colors hover:text-vast/70 [&::-webkit-details-marker]:hidden">
        <span className="flex-1">{item.q}</span>
        <ChevronDown
          className="mt-1 h-5 w-5 shrink-0 text-vast/40 transition-transform duration-200 group-open:rotate-180"
          strokeWidth={2}
          aria-hidden="true"
        />
      </summary>
      <div className="max-w-2xl pb-6 pr-9">
        {item.a.map((para) => (
          <p key={para} className="mt-3 text-base leading-relaxed text-vast/65 first:mt-0">
            {para}
          </p>
        ))}
        {item.list && (
          <ul className="mt-4 space-y-2.5">
            {item.list.map((li) => (
              <li key={li} className="relative pl-6 text-base leading-relaxed text-vast/65">
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-[0.6em] h-1.5 w-1.5 rounded-full bg-vast/40"
                />
                {li}
              </li>
            ))}
          </ul>
        )}
      </div>
    </details>
  );
}

export default function FAQPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* ═══════════════════════════════════════════════════ hero — cream */}
      <section className="px-5 pb-14 pt-10 sm:px-8 sm:pb-16 sm:pt-16">
        <div className="mx-auto w-full max-w-content">
          <div className="max-w-3xl">
            <p className="eyebrow">Help</p>
            <h1 className="mt-5 text-5xl sm:text-6xl lg:text-7xl">
              Questions, <em>answered properly</em>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-vast/70">
              The exam rules come from the notice of examination and the
              Commission&rsquo;s evaluation guidelines — the same documents that
              set the targets inside {APP.name}, so nothing here contradicts what
              the product does to your score.
            </p>
          </div>

          <nav aria-label="Question categories" className="mt-10 flex flex-wrap gap-2">
            {GROUPS.map((g) => (
              <a key={g.id} href={`#${g.id}`} className="chip transition-colors hover:bg-dawn">
                {g.title}
              </a>
            ))}
          </nav>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ questions — white */}
      <section className="slab slab-white">
        <div className="mx-auto w-full max-w-content px-5 sm:px-8">
          {GROUPS.map((group, i) => (
            <div
              key={group.id}
              id={group.id}
              className={`scroll-mt-24 ${i > 0 ? 'mt-20' : ''}`}
            >
              <div className="grid gap-8 lg:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] lg:gap-16">
                <div className="lg:sticky lg:top-24 lg:self-start" data-reveal>
                  <span className="tnum eyebrow">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h2 className="mt-3 text-3xl sm:text-4xl">{group.title}</h2>
                  <p className="mt-3 text-base leading-relaxed text-vast/55">
                    {group.blurb}
                  </p>
                </div>
                <div className="border-t-2 border-vast/10">
                  {group.items.map((item) => (
                    <QuestionRow key={item.q} item={item} />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════ still stuck — ink */}
      <section className="on-dark slab slab-ink">
        <div className="mx-auto w-full max-w-content px-5 sm:px-8">
          <div className="grid gap-10 md:grid-cols-2">
            <div>
              <h2 className="text-4xl sm:text-5xl">Not answered here?</h2>
              <p className="mt-5 max-w-md text-base leading-relaxed text-lumen/70">
                Write to us. We acknowledge within {LEGAL.ackHours} hours, and a
                correction to exam data is the fastest thing we ship.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/contact" className="btn btn-cream btn-lg">
                  Contact us
                  <ArrowRight className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />
                </Link>
                <Link href="/exam" className="btn btn-outline btn-lg">
                  Browse the modes
                </Link>
              </div>
            </div>
            <div className="md:justify-self-end">
              <h3 className="eyebrow !text-cream/50">Start somewhere</h3>
              <ul className="mt-4 space-y-2.5">
                {[
                  { href: '/learn', label: 'Learn typing from zero' },
                  { href: '/exam/chsl', label: 'SSC CHSL test — 35 WPM, 10 min' },
                  { href: '/exam/blind', label: 'Blind mode' },
                  { href: '/about', label: 'How the engine works' },
                ].map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-base text-lumen/70 transition-colors hover:text-lumen"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
