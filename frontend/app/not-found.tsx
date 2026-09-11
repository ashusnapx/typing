'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * The page that isn't there.
 *
 * Built on the shape the best of these use: the number said plainly and large,
 * one way back, and an illustration drawn from the product's own material
 * rather than a stock signpost. WhatsApp puts chat bubbles on theirs because
 * it is a chat app; the equivalent here is a drill, so the missing address is
 * shown the way this site shows every other typing mistake — what was wanted
 * on one line, what arrived on the next, and the part that went wrong marked
 * exactly as the marking scheme marks it.
 *
 * It also does something the old one could not: it shows the address that
 * failed. A learner who mistyped a URL can usually see their own slip the
 * moment it is set next to the right one.
 */

/** Where the path stopped matching anything real. */
function splitPath(path: string): { kept: string; wrong: string } {
  const known = ['/exam/lesson/', '/exam/', '/learn', '/blog', '/dashboard'];
  const match = known.find((k) => path.startsWith(k));
  if (!match) return { kept: '/', wrong: path.slice(1) };
  return { kept: match, wrong: path.slice(match.length) };
}

export default function NotFound() {
  const pathname = usePathname() || '/';
  const { kept, wrong } = splitPath(pathname);

  return (
    <section className="px-5 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto grid w-full max-w-content items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="min-w-0">
          <h1 className="text-balance text-5xl sm:text-6xl lg:text-7xl">
            404.
            <br />
            Yeh page <em>nahi mila</em>.
          </h1>

          <p className="mt-6 max-w-md text-lg leading-relaxed text-vast/70">
            Jo address aapne khola woh yahan nahi hai. Ho sakta hai typing mein
            galti ho gayi ho — neeche dekhiye.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/" className="btn btn-primary btn-lg">
              Home par wapas
            </Link>
            <Link href="/learn" className="btn btn-outline btn-lg">
              Learn to type
            </Link>
          </div>

          <p className="eyebrow mt-10">Ya seedha yahan jaayein</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              { href: '/exam/chsl', label: 'SSC CHSL test' },
              { href: '/exam/cgl-dest', label: 'SSC CGL DEST' },
              { href: '/marking-scheme', label: 'Marking scheme' },
              { href: '/leaderboard', label: 'Leaderboard' },
            ].map((l) => (
              <Link key={l.href} href={l.href} className="chip transition-colors hover:bg-dawn">
                {l.label}
              </Link>
            ))}
          </div>
        </div>

        {/* The address, marked the way a mistake is marked in a drill. */}
        <figure className="card overflow-hidden">
          <figcaption className="border-b-2 border-vast bg-lumen-dark px-4 py-2.5">
            <span className="eyebrow">Jo aapne type kiya</span>
          </figcaption>

          <div className="px-5 py-6">
            <p className="eyebrow !text-vast/40">Address</p>
            <p className="mt-2 break-all font-mono text-lg leading-relaxed">
              <span className="text-ok">{kept}</span>
              {wrong ? (
                <span className="text-err line-through decoration-2">{wrong}</span>
              ) : null}
              <span className="caret" aria-hidden="true" />
            </p>

            <div className="mt-5 border-t-2 border-vast/10 pt-4">
              <p className="eyebrow !text-vast/40">Yahan galti hai</p>
              <p className="mt-2 text-base leading-relaxed text-vast/70">
                {wrong
                  ? 'Is hisse ka koi page nahi hai. Spelling check kijiye, ya neeche ke links use kijiye.'
                  : 'Yeh address kahin point nahi karta. Neeche ke links se shuru kijiye.'}
              </p>
            </div>

            {/* One full mistake, priced the way the scheme prices it — the
                joke only works because the number is the real one. */}
            <div className="mt-5 flex items-center gap-3">
              <span className="chip chip-err">Poori galti</span>
              <span className="tnum text-sm text-vast/50">1 mistake · 404</span>
            </div>
          </div>
        </figure>
      </div>
    </section>
  );
}
