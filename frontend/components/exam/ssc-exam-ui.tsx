'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Maximize2,
  Minimize2,
  Type as TypeIcon,
} from 'lucide-react';
import { useTypingStore } from '@/store/typing-store';
import { useAuthStore } from '@/store/auth-store';
import { useTypingEngine } from '@/hooks/use-typing-engine';
import { calculateWPM, calculateAccuracy, getModeDisplayName } from '@/lib/utils';
import { getExamSpecs } from '@/lib/exam-config';

interface SSCExamUIProps {
  mode: string;
  durationSeconds: number;
  wpmTarget?: number;
  passage: any;
  lang?: 'english' | 'hindi';
  onComplete: () => void;
  phase: string;
  newEngine?: any;
}

/**
 * The live exam screen.
 *
 * This is the one surface that does NOT wear the site's cream-and-serif
 * language. It reproduces the sober, high-contrast chrome of the SSC online
 * test — bright blue candidate strip, navy figures, a plain sans, and the
 * repeating roll-number watermark that the real interface prints across the
 * page. A candidate ten minutes into a timed skill test should recognise this
 * screen on exam day, not admire it.
 *
 * The real interface also gives no word highlighting, no error highlighting
 * and no auto-scroll. Practice mode deliberately breaks that fidelity, because
 * a learner needs the feedback loop the exam withholds; every exam mode keeps
 * it.
 */

const LIVE_FEEDBACK_MODES = new Set(['practice', 'lesson']);

function pad(n: number) {
  return String(n).padStart(2, '0');
}

/* ------------------------------------------------------------- watermark */

/** The roll number tiled diagonally behind every post-login screen.
 *
 *  The platform does this with `.watermark1/2/3 { color:#d0d0d0; font-size:100pt }`
 *  — enormous, pale, unmissable. It is the single most recognisable feature of
 *  the real screen and no practice site reproduces it, so candidates meet it
 *  for the first time on exam day and find it distracting. Better to have
 *  already stopped noticing it. */
function Watermark({ text }: { text: string }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 select-none overflow-hidden"
      style={{
        // Generated from a runtime value, so it cannot live in the stylesheet.
        backgroundImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(
          `<svg xmlns="http://www.w3.org/2000/svg" width="760" height="420"><text x="20" y="300" transform="rotate(-26 20 300)" font-family="Verdana, Geneva, sans-serif" font-size="78" fill="#e2e2e2">${text}</text></svg>`
        )}")`,
        backgroundRepeat: 'repeat',
      }}
    />
  );
}

/* ---------------------------------------------------------------- passage */

/** Rendered per word rather than per character: a CHSL passage is ~2,000
 *  characters but only ~350 words, and this re-renders on every keystroke. */
function PassagePane({
  passage,
  caretIndex,
  lang,
  showPosition,
  fontScale,
}: {
  passage: string;
  caretIndex: number;
  lang: 'english' | 'hindi';
  showPosition: boolean;
  fontScale: number;
}) {
  const words = useMemo(() => {
    const out: { text: string; start: number; end: number }[] = [];
    const re = /\S+\s*/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(passage)) !== null) {
      out.push({ text: m[0], start: m.index, end: m.index + m[0].length });
    }
    return out;
  }, [passage]);

  const activeRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!showPosition) return;
    activeRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [caretIndex, showPosition]);

  return (
    <div
      className={`max-h-[32vh] min-h-[8rem] overflow-y-auto px-5 py-4 ${
        lang === 'hindi' ? 'font-hindi' : ''
      }`}
      style={{ fontSize: `${fontScale}px`, lineHeight: lang === 'hindi' ? 2 : 1.85 }}
      onCopy={(e) => e.preventDefault()}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    >
      <p className="select-none whitespace-pre-wrap text-exam-text">
        {words.map((w, i) => {
          if (!showPosition) return <span key={i}>{w.text}</span>;
          const isDone = caretIndex >= w.end;
          const isCurrent = !isDone && caretIndex >= w.start;
          return (
            <span
              key={i}
              ref={isCurrent ? activeRef : undefined}
              className={
                isDone
                  ? 'text-exam-muted/60'
                  : isCurrent
                    ? 'rounded-sm bg-glow/40'
                    : ''
              }
            >
              {w.text}
            </span>
          );
        })}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------- main */

export function SSCExamUI({
  mode,
  durationSeconds,
  wpmTarget,
  passage,
  lang = 'english',
  onComplete,
  phase,
  newEngine,
}: SSCExamUIProps) {
  const store = useTypingStore();
  const user = useAuthStore((s) => s.user);
  const {
    typedContent: oldTypedContent,
    originalContent: oldOriginalContent,
    elapsedSeconds: oldElapsedSeconds,
  } = useTypingEngine(lang);

  const typedContent = newEngine ? newEngine.getTypedText() : oldTypedContent;
  const originalContent = newEngine ? store.originalContent : oldOriginalContent;
  const elapsedSeconds = newEngine ? store.elapsedSeconds : oldElapsedSeconds;

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [integrityEvents, setIntegrityEvents] = useState(0);
  const [warning, setWarning] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fontScale, setFontScale] = useState(17);

  const specs = getExamSpecs(mode);
  const isTyping = phase === 'typing';
  const showLive = LIVE_FEEDBACK_MODES.has(mode);
  const backspaceLocked = specs ? !specs.backspaceAllowed : false;

  /* ---- focus + fullscreen ---- */

  useEffect(() => {
    if (!isTyping) return;
    const el = textareaRef.current;
    if (!el) return;
    el.value = typedContent;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTyping]);

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else document.documentElement.requestFullscreen().catch(() => {});
  };

  /* ---- integrity monitoring ---- */

  useEffect(() => {
    if (!isTyping) return;

    const flag = (message: string) => {
      setIntegrityEvents((n) => n + 1);
      setWarning(message);
      window.setTimeout(() => setWarning(''), 4000);
    };

    const onVisibility = () => {
      if (document.hidden) flag('Tab switch detected — this is logged in the real exam.');
    };
    const onBlur = () => flag('Window lost focus.');
    const onContextMenu = (e: MouseEvent) => e.preventDefault();
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        ['c', 'v', 'x', 'a', 'p', 'u', 's'].includes(e.key.toLowerCase())
      ) {
        e.preventDefault();
      }
      if (e.key === 'Tab') e.preventDefault();
      if (backspaceLocked && (e.key === 'Backspace' || e.key === 'Delete')) {
        e.preventDefault();
        flag('Backspace is disabled for this exam.');
      }
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', onBlur);
    document.addEventListener('contextmenu', onContextMenu);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('contextmenu', onContextMenu);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isTyping, backspaceLocked]);

  /* ---- derived ---- */

  const totalDuration = store.totalDuration || durationSeconds;
  const remaining = Math.max(0, totalDuration - elapsedSeconds);
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  const totalChars = typedContent.length;
  const correctChars = useMemo(
    () =>
      typedContent
        .split('')
        .filter((c: string, i: number) => c === originalContent[i]).length,
    [typedContent, originalContent]
  );
  const grossWpm =
    elapsedSeconds > 0 ? Math.round(totalChars / 5 / (elapsedSeconds / 60)) : 0;
  const netWpm = elapsedSeconds > 0 ? calculateWPM(totalChars, elapsedSeconds) : 0;
  const accuracy = totalChars > 0 ? calculateAccuracy(correctChars, totalChars) : 100;

  // Display the exact text the engine scores against. Reading passage.content
  // here would let the visible passage drift from the compared one when the
  // fetch falls back, and mark the candidate wrong for typing what they saw.
  const passageText: string = originalContent || passage?.content || '';
  const passageProgress = passageText
    ? Math.min(100, (totalChars / passageText.length) * 100)
    : 0;
  const timeProgress = totalDuration ? (elapsedSeconds / totalDuration) * 100 : 0;

  const timeState =
    remaining <= 60 ? 'critical' : remaining <= 120 ? 'low' : 'normal';

  const targetLabel =
    specs?.qualifyingNature === 'speed_wpm'
      ? `${specs.englishSpeedWpm} WPM`
      : specs
        ? `${specs.englishKdph.toLocaleString('en-IN')} KDPH`
        : wpmTarget
          ? `${wpmTarget} WPM`
          : '—';

  // The real screen prints a roll number. Signed-in users get a stable one
  // derived from their id; guests get a clearly fake placeholder.
  const rollNo = user?.id
    ? user.id.replace(/\D/g, '').padEnd(11, '0').slice(0, 11)
    : null;
  const candidateName = user?.full_name || 'Guest candidate';
  // Guests have no roll number; eleven zeros reads as a bug, so the watermark
  // says what the screen is instead.
  const watermarkText = rollNo ?? 'PRACTICE';

  return (
    <div className="exam-root relative flex min-h-screen flex-col">
      <Watermark text={watermarkText} />

      {/* ------------------------------------------------------ title bar */}
      {/* The platform's header frame: title centred, zoom controls to the
          left, candidate photo boxes to the right. */}
      <div className="relative border-b border-exam-line bg-white">
        <div className="mx-auto flex w-full max-w-5xl items-center gap-4 px-4 py-2 sm:px-6">
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setFontScale((f) => Math.min(24, f + 2))}
              className="rounded bg-exam-chrome px-2.5 py-1 text-[11px] font-bold text-white"
            >
              Zoom (+)
            </button>
            <button
              type="button"
              onClick={() => setFontScale((f) => Math.max(12, f - 2))}
              className="rounded bg-exam-chrome px-2.5 py-1 text-[11px] font-bold text-white"
            >
              Zoom (&minus;)
            </button>
          </div>

          <p className="flex-1 text-center text-base font-bold uppercase text-exam-text">
            SSC Online Skill Test
          </p>

          <div className="hidden shrink-0 gap-1.5 sm:flex">
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
          <span className="tnum">Roll No : {rollNo ?? '—'}</span>
          <span aria-hidden className="opacity-60">|</span>
          <span className="truncate">Name : {candidateName}</span>
          <span aria-hidden className="hidden opacity-60 sm:inline">|</span>
          <span className="hidden sm:inline">
            Post/Subject : {getModeDisplayName(mode)}
          </span>
        </div>
      </div>

      {/* -------------------------------------------------------- header */}
      <header className="sticky top-0 z-40 border-b border-exam-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center gap-4 px-4 py-2.5 sm:px-6">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-exam-navy">
              {getModeDisplayName(mode)}
            </p>
            <p className="mt-0.5 text-xs text-exam-muted">
              {lang === 'hindi' ? 'हिंदी' : 'English'} · Target {targetLabel}
            </p>
          </div>

          <div className="ml-auto flex items-center gap-4">
            {/* Caption above, red figures on the pale-yellow block, top
                right — exactly where and how the platform prints it. */}
            <div className="text-right">
              <div className="mb-0.5 text-[11px] font-bold text-exam-text">
                Time Left
              </div>
              <div
                className="exam-timer tnum"
                role="timer"
                aria-live={timeState === 'critical' ? 'assertive' : 'off'}
              >
                {pad(Math.floor(remaining / 3600))}:{pad(mins % 60)}:{pad(secs)}
              </div>
            </div>

            <button
              type="button"
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              className="hidden h-9 w-9 items-center justify-center rounded border border-exam-line text-exam-muted transition-colors hover:text-exam-text sm:flex"
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" strokeWidth={2} />
              ) : (
                <Maximize2 className="h-4 w-4" strokeWidth={2} />
              )}
            </button>
          </div>
        </div>

        <div
          className="h-1 w-full bg-exam-line/50"
          role="progressbar"
          aria-valuenow={Math.round(timeProgress)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Time elapsed"
        >
          <div
            className={`h-full transition-[width] duration-1000 ease-linear ${
              timeState === 'critical'
                ? 'bg-exam-err'
                : timeState === 'low'
                  ? 'bg-exam-hot'
                  : 'bg-exam-chrome'
            }`}
            style={{ width: `${timeProgress}%` }}
          />
        </div>
      </header>

      {warning && (
        <div
          role="alert"
          className="relative mx-auto mt-3 flex w-full max-w-5xl items-center gap-2 rounded border border-exam-hot/40 bg-warn-bg px-4 py-2.5 text-sm font-medium text-exam-hot"
        >
          <AlertTriangle className="h-4 w-4 shrink-0" strokeWidth={2} />
          {warning}
        </div>
      )}

      {/* ---------------------------------------------------------- body */}
      <div className="relative mx-auto w-full max-w-5xl flex-1 px-4 py-4 sm:px-6">
        {/* Passage — inset panel with the tan bevel of the real screen. */}
        <section className="overflow-hidden rounded border-2 border-exam-panel-edge bg-exam-panel">
          <header className="flex items-center gap-3 border-b border-exam-panel-edge bg-white px-5 py-2">
            <h2 className="text-xs font-bold uppercase tracking-wide text-exam-navy">
              Passage
            </h2>
            <div className="ml-auto flex items-center gap-3 text-xs text-exam-muted">
              <button
                type="button"
                onClick={() => setFontScale((s) => (s >= 21 ? 15 : s + 2))}
                className="flex items-center gap-1 rounded px-1.5 py-0.5 transition-colors hover:text-exam-text"
                aria-label="Change passage text size"
                title="Text size"
              >
                <TypeIcon className="h-3.5 w-3.5" strokeWidth={2} />
                {fontScale}px
              </button>
              <span className="tnum">
                {passageText.length.toLocaleString('en-IN')} KD
              </span>
            </div>
          </header>

          {passageText ? (
            <PassagePane
              passage={passageText}
              caretIndex={totalChars}
              lang={lang}
              showPosition={isTyping && showLive}
              fontScale={fontScale}
            />
          ) : (
            <div className="space-y-2.5 p-5">
              {[100, 96, 92, 98, 60].map((w, i) => (
                <div key={i} className="skeleton h-4" style={{ width: `${w}%` }} />
              ))}
            </div>
          )}
        </section>

        {/* Typing area */}
        <section className="mt-4 overflow-hidden rounded border-2 border-exam-panel-edge bg-white">
          <header className="flex items-center gap-3 border-b border-exam-panel-edge bg-exam-panel px-5 py-2">
            <h2 className="text-xs font-bold uppercase tracking-wide text-exam-navy">
              Type here
            </h2>
            <div className="ml-auto flex items-center gap-3 text-xs">
              {backspaceLocked && (
                <span className="rounded bg-err-bg px-2 py-0.5 font-bold text-exam-err">
                  Backspace disabled
                </span>
              )}
              <span className="tnum text-exam-muted">
                {totalChars.toLocaleString('en-IN')} /{' '}
                {passageText.length.toLocaleString('en-IN')}
              </span>
            </div>
          </header>

          <textarea
            ref={textareaRef}
            defaultValue={typedContent}
            lang={lang === 'hindi' ? 'hi' : 'en'}
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
            autoComplete="off"
            data-gramm="false"
            onChange={(e) => {
              if (newEngine) newEngine.handleTextareaInput(e.target.value);
              else store.updateTypedContent(e.target.value);
            }}
            onPaste={(e) => e.preventDefault()}
            onCopy={(e) => e.preventDefault()}
            onCut={(e) => e.preventDefault()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => e.preventDefault()}
            onContextMenu={(e) => e.preventDefault()}
            disabled={!isTyping}
            placeholder={
              lang === 'hindi'
                ? 'यहाँ टाइप करें…'
                : 'Start typing the passage above…'
            }
            className={`w-full resize-none bg-white px-5 py-4 text-exam-text outline-none placeholder:text-exam-muted/60 disabled:opacity-60 ${
              lang === 'hindi' ? 'font-hindi' : ''
            }`}
            style={{
              height: '28vh',
              minHeight: '10rem',
              fontSize: `${fontScale}px`,
              lineHeight: lang === 'hindi' ? 2 : 1.85,
            }}
          />

          {/* "Will I finish in time" is the candidate's real question. */}
          <div className="h-1 w-full bg-exam-line/40">
            <div
              className="h-full bg-exam-chrome transition-[width] duration-200"
              style={{ width: `${passageProgress}%` }}
            />
          </div>
        </section>

        {/* Live metrics — practice only; the real exam shows none of this. */}
        {showLive && isTyping && (
          <div className="mt-4 grid grid-cols-3 gap-3">
            {[
              {
                label: 'Net WPM',
                value: netWpm,
                tone: netWpm >= (wpmTarget ?? 35) ? 'ok' : '',
              },
              {
                label: 'Accuracy',
                value: `${accuracy.toFixed(0)}%`,
                tone: accuracy >= 95 ? 'ok' : accuracy >= 90 ? '' : 'err',
              },
              { label: 'Gross WPM', value: grossWpm, tone: '' },
            ].map((m) => (
              <div
                key={m.label}
                className="rounded border border-exam-line bg-white px-4 py-3 text-center"
              >
                <div
                  className={`tnum text-2xl font-bold ${
                    m.tone === 'ok'
                      ? 'text-exam-ok'
                      : m.tone === 'err'
                        ? 'text-exam-err'
                        : 'text-exam-navy'
                  }`}
                >
                  {m.value}
                </div>
                <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-exam-muted">
                  {m.label}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Submit */}
        <div className="mt-6 flex flex-col items-center gap-2 pb-10">
          <button
            onClick={onComplete}
            disabled={totalChars === 0}
            className="exam-btn w-full sm:w-auto sm:min-w-[16rem]"
          >
            Submit test
          </button>
          <p className="text-xs text-exam-muted">
            {totalChars === 0
              ? 'Start typing to enable submission'
              : 'Submitting ends the test and shows your evaluation'}
          </p>
          {integrityEvents > 0 && (
            <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-exam-hot">
              <AlertTriangle className="h-3.5 w-3.5" strokeWidth={2} />
              {integrityEvents} integrity{' '}
              {integrityEvents === 1 ? 'event' : 'events'} logged
            </p>
          )}
        </div>
      </div>

      {/* -------------------------------------------------------- footer */}
      {/* Blue bar over the thin amber sliver the platform's outer table
          leaves visible. */}
      <div className="relative">
        <div className="bg-exam-chrome py-1 text-center text-[11px] font-bold text-white">
          Practice simulation &middot; Not affiliated with SSC or Eduquity
        </div>
        <div className="h-1 bg-exam-amber" />
      </div>
    </div>
  );
}
