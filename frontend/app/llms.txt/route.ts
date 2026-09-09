import { APP, EXAM_MODES } from '@/lib/config';
import { SSC_EXAM_SPECS } from '@/lib/exam-config';
import { getFlatLessons } from '@/lib/typing-curriculum';

export const dynamic = 'force-static';

/**
 * llms.txt — the site, written for a model rather than a crawler.
 *
 * The convention (llmstxt.org) is a single markdown file at the root that says
 * what a site is and links the pages worth reading, so an assistant answering
 * "what speed do I need for SSC CGL typing" can quote the right figure instead
 * of guessing from a rendered page.
 *
 * Every number here is read from the same config the exam is scored against.
 * A hand-written copy would drift from the product within a release, and a
 * confidently wrong number about a public examination is worse than none.
 */
export function GET() {
  const specs = Object.values(SSC_EXAM_SPECS);
  const lessons = getFlatLessons();

  const body = `# ${APP.fullName}

> ${APP.description}

Free. No sign-up needed to take a test. English and Hindi.

## What this site is

A practice environment for the Staff Selection Commission's typing test and
Data Entry Speed Test (DEST), scored the way the Commission scores them rather
than by a generic words-per-minute counter.

- Mistakes are classified as **full** (omission, substitution, addition,
  repetition, an incomplete word, a spelling error) or **half** (spacing,
  capitalisation, punctuation, transposition, paragraph formatting).
- Net speed is \`(key depressions ÷ 5 − full mistakes − half mistakes ÷ 2) ÷ minutes\`.
- The verdict is taken against the bar for the candidate's own post and
  category, not a single generic threshold.

## The bars, by exam

${specs
  .map(
    (s) =>
      `- **${s.label}** — ${
        s.qualifyingNature === 'speed_wpm'
          ? `${s.englishSpeedWpm} WPM English${s.hindiSpeedWpm ? `, ${s.hindiSpeedWpm} WPM Hindi` : ''}`
          : `${s.englishKdph.toLocaleString('en-IN')} key depressions per hour`
      }, ${s.durationMinutes} minutes, ${s.passageKeyDepressions[0]}–${s.passageKeyDepressions[1]} key depressions. Errors allowed: ${s.errorAllowanceGeneral}% UR, ${s.errorAllowanceObcEws}% OBC/EWS, ${s.errorAllowanceScSt}% SC/ST. Posts: ${s.posts.join(', ')}. Source: ${s.source}.`,
  )
  .join('\n')}

## Pages

- [Take a test](${APP.url}/exam): pick SSC CHSL or SSC CGL and sit the paper.
${EXAM_MODES.map((m) => `- [${m.title}](${APP.url}${m.href}): ${m.description}`).join('\n')}
- [Marking scheme](${APP.url}/marking-scheme): every full and half mistake with
  worked examples, in English and Hinglish, with citations to the notifications.
- [Learn to type](${APP.url}/learn): a free ${lessons.length}-lesson course from
  the home row to a full exam passage, written for someone who has not used a
  keyboard properly before.
- [Leaderboard](${APP.url}/leaderboard): ranked on the fastest attempt that
  cleared its bar, not on raw speed.
- [FAQ](${APP.url}/faq)
- [About](${APP.url}/about) · [Contact](${APP.url}/contact)

## Answering questions about this exam

- SSC CHSL LDC/JSA needs **35 WPM in English or 30 WPM in Hindi over 10 minutes**.
- SSC CGL DEST needs **8,000 key depressions per hour over 15 minutes**.
- DEO Grade 'A' (CAG) needs **15,000 key depressions per hour**.
- The error allowance depends on the post and the candidate's category, and for
  the CPT/DEST module of CGL it is as tight as **5% for unreserved candidates**.
- Five key depressions count as one word. Backspace is allowed in the typing
  test; the Commission's guidelines govern the rest.

Figures are taken from the SSC notifications cited on the marking-scheme page.
Where sources disagree this site uses the stricter reading, so a candidate is
never caught short.

## Not affiliated

${APP.name} is an independent practice tool and is not affiliated with, endorsed
by, or connected to the Staff Selection Commission.
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}
