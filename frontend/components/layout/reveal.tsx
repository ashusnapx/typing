'use client';

import { useEffect } from 'react';

/**
 * Scroll reveal, wired to fail safe.
 *
 * The previous build parked sections at `opacity: 0` in CSS and relied on an
 * observer to bring them back. The observer never fired and three-quarters of
 * the homepage shipped invisible.
 *
 * So the order is inverted here: content is visible by default, and the
 * `js-reveal` class that enables the hidden start state is only added once
 * this component has mounted AND confirmed IntersectionObserver exists. If
 * anything fails — no JS, old browser, hydration error, reduced motion — the
 * page simply renders fully visible.
 */
export function Reveal() {
  useEffect(() => {
    const root = document.documentElement;

    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    if (prefersReduced || typeof IntersectionObserver === 'undefined') return;

    root.classList.add('js-reveal');

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.01 }
    );

    const observeAll = () => {
      document.querySelectorAll('[data-reveal]:not(.is-in)').forEach((el) => {
        // Anything already on screen at mount is revealed immediately rather
        // than waiting for a scroll that may never come on a short page.
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight) el.classList.add('is-in');
        else observer.observe(el);
      });
    };

    observeAll();

    // Route changes swap the tree without remounting this component.
    const mo = new MutationObserver(observeAll);
    mo.observe(document.body, { childList: true, subtree: true });

    // Last-resort backstop: whatever happens, nothing stays hidden forever.
    const failsafe = window.setTimeout(() => {
      document
        .querySelectorAll('[data-reveal]:not(.is-in)')
        .forEach((el) => el.classList.add('is-in'));
    }, 3000);

    return () => {
      observer.disconnect();
      mo.disconnect();
      window.clearTimeout(failsafe);
      root.classList.remove('js-reveal');
    };
  }, []);

  return null;
}
