'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * A living product shot of the exam screen.
 *
 * The hero previously asked visitors to take a typing test before they knew
 * what the site was. This shows the thing instead: a scaled replica of the
 * actual exam chrome — the blue candidate strip, the red timer on its yellow
 * block, the tan passage panel — with the passage typing itself and the clock
 * running. It sells the one thing competitors do not have, which is fidelity
 * to the screen candidates will actually face.
 *
 * Purely decorative and inert: no input, no focus targets, hidden from
 * assistive tech, and frozen to a still frame under reduced-motion.
 */

const PASSAGE =
  'Financial inclusion has been a central objective of economic policy in India. Direct benefit transfers now reach beneficiaries without intermediaries.';

const START_SECONDS = 9 * 60 + 41;

export function ExamPreview({ className = '' }: { className?: string }) {
  const [typed, setTyped] = useState('');
  const [seconds, setSeconds] = useState(START_SECONDS);
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced.current) {
      // A representative still, rather than an empty frame.
      setTyped(PASSAGE.slice(0, 78));
      return;
    }

    let i = 0;
    // Varied cadence: a constant interval reads as a machine, not a typist.
    let timer: number;
    const step = () => {
      i = i >= PASSAGE.length ? 0 : i + 1;
      setTyped(PASSAGE.slice(0, i));
      const pause = i === 0 ? 1400 : PASSAGE[i - 1] === ' ' ? 90 : 38 + Math.random() * 55;
      timer = window.setTimeout(step, pause);
    };
    timer = window.setTimeout(step, 700);

    const clock = window.setInterval(
      () => setSeconds((s) => (s <= 0 ? START_SECONDS : s - 1)),
      1000
    );

    return () => {
      window.clearTimeout(timer);
      window.clearInterval(clock);
    };
  }, []);

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');

  return (
    <div
      aria-hidden
      className={`pointer-events-none select-none overflow-hidden rounded-xl border-2 border-vast bg-white ${className}`}
      style={{ fontFamily: 'Verdana, Geneva, sans-serif' }}
    >
      {/* Title bar */}
      <div className="flex items-center gap-2 border-b border-exam-line px-3 py-1.5">
        <span className="rounded bg-exam-chrome px-1.5 py-px text-[8px] font-bold text-white">
          Zoom (+)
        </span>
        <span className="flex-1 text-center text-[10px] font-bold uppercase text-exam-text">
          SSC Online Skill Test
        </span>
        <span className="h-6 w-7 rounded-sm border border-exam-line bg-exam-panel" />
      </div>

      {/* Candidate strip */}
      <div className="flex items-center gap-2 bg-exam-chrome px-3 py-1 text-[9px] font-bold text-white">
        <span className="tnum">Roll No : 61915223281</span>
        <span className="opacity-60">|</span>
        <span>Name : Candidate</span>
      </div>

      {/* Header with the timer where the real screen puts it */}
      <div className="flex items-start justify-between border-b border-exam-line px-3 py-2">
        <div>
          <p className="text-[10px] font-bold text-exam-navy">SSC CHSL</p>
          <p className="mt-0.5 text-[8px] text-exam-muted">English · Target 35 WPM</p>
        </div>
        <div className="text-right">
          <div className="text-[8px] font-bold text-exam-text">Time Left</div>
          <div
            className="tnum mt-0.5 px-1.5 py-px text-[13px] font-bold"
            style={{ background: 'rgb(255 255 204)', color: 'rgb(255 0 0)' }}
          >
            00:{mm}:{ss}
          </div>
        </div>
      </div>

      {/* Passage panel */}
      <div className="m-2.5 overflow-hidden rounded border border-exam-panel-edge bg-exam-panel">
        <div className="border-b border-exam-panel-edge bg-white px-2.5 py-1 text-[8px] font-bold uppercase text-exam-navy">
          Passage
        </div>
        <p className="px-2.5 py-2 text-[9px] leading-[1.7] text-exam-text">
          {PASSAGE}
        </p>
      </div>

      {/* Typing panel — the text arriving is what makes it read as live */}
      <div className="mx-2.5 mb-2.5 overflow-hidden rounded border border-exam-panel-edge bg-white">
        <div className="border-b border-exam-panel-edge bg-exam-panel px-2.5 py-1 text-[8px] font-bold uppercase text-exam-navy">
          Type here
        </div>
        <p className="min-h-[3.6rem] px-2.5 py-2 text-[9px] leading-[1.7] text-exam-text">
          {typed}
          <span className="ml-px inline-block h-[9px] w-[1.5px] animate-blink bg-exam-text align-middle" />
        </p>
        <div className="h-[3px] bg-exam-line/40">
          <div
            className="h-full bg-exam-chrome transition-[width] duration-200"
            style={{ width: `${(typed.length / PASSAGE.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="bg-exam-chrome py-1 text-center text-[8px] font-bold text-white">
        Practice simulation
      </div>
      <div className="h-[3px] bg-exam-amber" />
    </div>
  );
}
