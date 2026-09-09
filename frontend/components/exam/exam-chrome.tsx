'use client';

import React from 'react';
import { useAuthStore } from '@/store/auth-store';

/**
 * The vendor frame, shared by every screen of an exam session.
 *
 * A candidate meets this chrome once, at the instructions, and does not leave
 * it until the result is read. That continuity is the point: on exam day the
 * title bar, the blue candidate strip and the roll-number watermark are
 * already there before the passage appears, and staying inside them through
 * the result means the only screen that ever changes is the one in the middle.
 *
 * Everything here reproduces the platform rather than expressing the site —
 * Verdana at fixed small sizes, #1a1a1a chrome, the amber sliver under the
 * footer. See the `.exam-*` tokens in globals.css.
 */

/** The roll number tiled diagonally behind every post-login screen.
 *
 *  The platform draws it at ~100pt in #d4d4d0 — enormous, pale, unmissable,
 *  and reproduced by no practice site, so candidates meet it for the first
 *  time on exam day and find it distracting. Better to have stopped noticing. */
function Watermark({ text }: { text: string }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 select-none overflow-hidden"
      style={{
        // Generated from a runtime value, so it cannot live in the stylesheet.
        backgroundImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(
          `<svg xmlns="http://www.w3.org/2000/svg" width="760" height="420"><text x="20" y="300" transform="rotate(-26 20 300)" font-family="Verdana, Geneva, sans-serif" font-size="78" fill="#e8e8e4">${text}</text></svg>`
        )}")`,
        backgroundRepeat: 'repeat',
      }}
    />
  );
}

/** Signed-in users get a stable fake roll number derived from their id;
 *  guests get a placeholder, because eleven zeros reads as a bug. */
export function useCandidate() {
  const user = useAuthStore((s) => s.user);
  const rollNo = user?.id
    ? user.id.replace(/\D/g, '').padEnd(11, '0').slice(0, 11)
    : null;
  return {
    rollNo,
    name: user?.full_name || 'Guest candidate',
    watermark: rollNo ?? 'PRACTICE',
  };
}

export function ExamChrome({
  postLabel,
  onZoomIn,
  onZoomOut,
  children,
}: {
  /** Printed in the candidate strip as "Post/Subject". */
  postLabel: string;
  /** Omit both to hide the zoom controls — the instructions page has no
   *  passage to resize. */
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  children: React.ReactNode;
}) {
  const candidate = useCandidate();
  const showZoom = !!(onZoomIn && onZoomOut);

  return (
    <div className="exam-root relative flex min-h-screen flex-col">
      <Watermark text={candidate.watermark} />

      {/* ------------------------------------------------------ title bar */}
      <div className="relative border-b border-exam-line bg-white">
        <div className="mx-auto flex w-full max-w-5xl items-center gap-4 px-4 py-2 sm:px-6">
          <div className="flex min-w-[7rem] shrink-0 items-center gap-2">
            {showZoom && (
              <>
                <button
                  type="button"
                  onClick={onZoomIn}
                  className="rounded bg-exam-chrome px-2.5 py-1 text-[11px] font-bold text-white"
                >
                  Zoom (+)
                </button>
                <button
                  type="button"
                  onClick={onZoomOut}
                  className="rounded bg-exam-chrome px-2.5 py-1 text-[11px] font-bold text-white"
                >
                  Zoom (&minus;)
                </button>
              </>
            )}
          </div>

          <p className="flex-1 text-center text-base font-bold uppercase text-exam-text">
            Eduquity &middot; SSC Online Skill Test
          </p>

          <div className="hidden min-w-[7rem] shrink-0 justify-end gap-1.5 sm:flex">
            {['Registration Photo', 'Captured Photo'].map((label) => (
              <div
                key={label}
                className="flex h-[70px] w-[80px] items-center justify-center border border-exam-line bg-exam-panel p-1 text-center text-[8px] leading-tight text-exam-muted"
              >
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* --------------------------------------------- candidate strip */}
      <div className="relative bg-exam-chrome text-white">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-x-4 gap-y-1 px-4 py-1.5 text-sm font-bold sm:px-6">
          <span className="tnum">Roll No : {candidate.rollNo ?? '—'}</span>
          <span aria-hidden className="opacity-60">
            |
          </span>
          <span className="truncate">Name : {candidate.name}</span>
          <span aria-hidden className="hidden opacity-60 sm:inline">
            |
          </span>
          <span className="hidden truncate sm:inline">
            Post/Subject : {postLabel}
          </span>
        </div>
      </div>

      {children}

      {/* -------------------------------------------------------- footer */}
      {/* Blue bar over the thin amber sliver the platform's outer table
          leaves visible. */}
      <div className="relative mt-auto">
        <div className="bg-exam-chrome py-1 text-center text-[11px] font-bold text-white">
          Practice simulation &middot; Not affiliated with SSC or Eduquity
        </div>
        <div className="h-1 bg-exam-amber" />
      </div>
    </div>
  );
}

/** The red-on-pale-yellow figure block the platform prints top right. Used
 *  live during the test and statically on the instructions page. */
export function ExamTimeBox({
  label,
  value,
  assertive = false,
}: {
  label: string;
  value: string;
  assertive?: boolean;
}) {
  return (
    <div className="text-right">
      <div className="mb-0.5 text-[11px] font-bold text-exam-text">{label}</div>
      <div
        className="exam-timer tnum"
        role="timer"
        aria-live={assertive ? 'assertive' : 'off'}
      >
        {value}
      </div>
    </div>
  );
}

export function pad(n: number) {
  return String(n).padStart(2, '0');
}

/** hh:mm:ss from seconds, the format the platform's countdown uses. */
export function clock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`;
}
