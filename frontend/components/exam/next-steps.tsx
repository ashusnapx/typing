'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import type { Plan } from '@/lib/analysis-plan';

/**
 * The end of the report: what to do about it, and a promise to do it.
 *
 * Everything above this is description — bars, marks, a passage with the slips
 * painted in. Description does not change an attempt. So the report closes
 * with the two or three things that are actually costing the candidate the
 * post, in the language the advice would be given in, and asks them to tick
 * each one off before they go.
 *
 * The ticking is the point. A list you read is a list you forget; a list you
 * agree to, item by item, is a commitment, and the button to take the next
 * test only lights up once every item has been accepted.
 */

const storageKey = (testId: string) => `tm-plan-${testId}`;

export function NextSteps({
  plan,
  testId,
  retakeHref,
}: {
  plan: Plan;
  testId: string;
  retakeHref: string;
}) {
  const [agreed, setAgreed] = useState<string[]>([]);

  /* Kept per attempt, so coming back to this report shows what was already
     accepted rather than asking again. */
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey(testId));
      if (saved) setAgreed(JSON.parse(saved));
    } catch {
      /* private mode, or something else wrote here */
    }
  }, [testId]);

  const toggle = (id: string) => {
    setAgreed((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try {
        localStorage.setItem(storageKey(testId), JSON.stringify(next));
      } catch {
        /* private mode */
      }
      return next;
    });
  };

  const done = plan.steps.every((s) => agreed.includes(s.id));

  return (
    <section className="card mt-5 border-vast bg-accent-soft p-5 sm:p-6">
      <h2 className="text-lg font-bold sm:text-xl">Dekh bhai</h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-vast/80">
        {plan.headline}
      </p>

      <p className="eyebrow mt-5">Itna kar le, bas — tick karke aage badh</p>

      <ul className="mt-2 space-y-2">
        {plan.steps.map((step) => {
          const ticked = agreed.includes(step.id);
          return (
            <li key={step.id}>
              <div
                className={`flex flex-wrap items-start gap-3 border-2 border-vast/20 px-4 py-3 transition-colors ${
                  ticked ? 'bg-lumen' : 'bg-lumen/60'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggle(step.id)}
                  aria-pressed={ticked}
                  /* The label is the sentence itself, so a screen reader hears
                     what is being agreed to rather than "button, checkbox". */
                  aria-label={`Theek hai: ${step.text}`}
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border-2 border-vast ${
                    ticked ? 'bg-vast text-lumen' : 'bg-lumen'
                  }`}
                >
                  {ticked && <Check className="h-3.5 w-3.5" strokeWidth={3.5} aria-hidden />}
                </button>

                <div className="min-w-0 flex-1">
                  <p
                    className={`text-[13px] leading-relaxed ${
                      ticked ? 'text-vast/50 line-through' : 'text-vast/85'
                    }`}
                  >
                    {step.text}
                  </p>
                  {step.href && (
                    <Link
                      href={step.href}
                      className="mt-1 inline-flex items-center gap-1 text-[12px] font-bold underline"
                    >
                      Practise: {step.hrefLabel}
                      <ArrowRight className="h-3 w-3" strokeWidth={2.5} aria-hidden />
                    </Link>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Link
          href={retakeHref}
          className={`btn btn-md justify-center ${done ? 'btn-ink' : 'btn-outline'}`}
        >
          {done ? 'Chal, agla test dete hain' : 'Agla test'}
          <ArrowRight className="h-4 w-4" strokeWidth={2.5} aria-hidden />
        </Link>
        <Link href="/dashboard" className="btn btn-outline btn-md justify-center">
          Dashboard
        </Link>
        {!done && (
          <span className="text-[12px] text-vast/55">
            Upar sab tick kar de, phir chalte hain.
          </span>
        )}
      </div>
    </section>
  );
}

export default NextSteps;
