'use client';

import { useEffect, useRef, useState } from 'react';
import { useTypingStore } from '@/store/typing-store';
import { useTypingEngine } from '@/hooks/use-typing-engine';
import { calculateWPM, calculateAccuracy, getModeDisplayName } from '@/lib/utils';
import { getExamSpecs } from '@/lib/exam-config';
import { CSS } from '@/lib/config';

const NAVY = '#003366';
const DARK_NAVY = '#002244';
const ACCENT_RED = '#cc0000';
const BORDER = '#dcdcdc';
const BG = '#f5f5f5';
const TEXT = '#222222';

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

export function SSCExamUI({ mode, durationSeconds, wpmTarget, passage, lang = 'english', onComplete, phase, newEngine }: SSCExamUIProps) {
  const store = useTypingStore();
  const { typedContent: oldTypedContent, originalContent: oldOriginalContent, elapsedSeconds: oldElapsedSeconds } = useTypingEngine(lang);

  const typedContent = newEngine ? newEngine.getTypedText() : oldTypedContent;
  const originalContent = newEngine ? store.originalContent : oldOriginalContent;
  const elapsedSeconds = newEngine ? store.elapsedSeconds : oldElapsedSeconds;

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [tabSwitches, setTabSwitches] = useState(0);
  const [windowBlurs, setWindowBlurs] = useState(0);
  const [fullscreenExits, setFullscreenExits] = useState(0);
  const [resizeEvents, setResizeEvents] = useState(0);
  const [showWarning, setShowWarning] = useState('');

  useEffect(() => { window.scrollTo(0, 0); }, [phase]);

  useEffect(() => {
    if (phase === 'typing') {
      document.documentElement.requestFullscreen().catch(() => {});
      if (textareaRef.current) {
        textareaRef.current.value = typedContent;
        textareaRef.current.focus();
      }
    }
  }, [phase, typedContent]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) {
        setTabSwitches(s => s + 1);
        setShowWarning('Tab switching detected! This is monitored in the actual exam.');
        setTimeout(() => setShowWarning(''), 3000);
      }
    };
    const onBlur = () => setWindowBlurs(s => s + 1);
    const onResize = () => setResizeEvents(s => s + 1);
    const onFullscreenChange = () => {
      if (!document.fullscreenElement) setFullscreenExits(s => s + 1);
    };
    const onContextMenu = (e: MouseEvent) => e.preventDefault();
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && ['c', 'v', 'x', 'a', 'p', 'u', 's'].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
      if (e.key === 'Tab') e.preventDefault();
    };

    if (phase === 'typing') {
      document.addEventListener('visibilitychange', onVisibility);
      window.addEventListener('blur', onBlur);
      window.addEventListener('resize', onResize);
      document.addEventListener('fullscreenchange', onFullscreenChange);
      document.addEventListener('contextmenu', onContextMenu);
      document.addEventListener('keydown', onKeyDown);
    }

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('contextmenu', onContextMenu);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [phase]);

  const totalDuration = store.totalDuration || durationSeconds;
  const remaining = Math.max(0, totalDuration - elapsedSeconds);
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  const correctChars = typedContent.split('').filter((c: string, i: number) => c === originalContent[i]).length;
  const totalChars = typedContent.length;
  const wordsTyped = typedContent.trim().split(/\s+/).filter(Boolean).length;
  const grossWpm = elapsedSeconds > 0 ? Math.round((totalChars / 5) / (elapsedSeconds / 60)) : 0;
  const netWpm = elapsedSeconds > 0 ? calculateWPM(totalChars, elapsedSeconds) : 0;
  const accuracy = totalChars > 0 ? calculateAccuracy(correctChars, totalChars) : 100;
  const mistakes = totalChars - correctChars;

  const suspiciousCount = tabSwitches + windowBlurs + fullscreenExits;
  const isLowTime = remaining < 60;

  const specs = getExamSpecs(mode);

  return (
    <div style={{ background: BG, minHeight: '100vh', fontFamily: 'Poppins, sans-serif', display: 'flex', flexDirection: 'column' }}>
      {/* Sticky Header — navy with timer */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: NAVY, color: '#fff',
        padding: '10px 24px',
      }}>
        <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: 1 }}>EDUQUITY</div>
            <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.25)' }} />
            <div style={{ fontSize: 14, fontWeight: 500, opacity: 0.9 }}>{getModeDisplayName(mode)}</div>
            {lang && (
              <div style={{
                marginLeft: 8, fontSize: 11, background: 'rgba(255,255,255,0.15)',
                padding: '2px 10px', borderRadius: 10, letterSpacing: 1,
              }}>
                {lang === 'hindi' ? 'HINDI' : 'ENGLISH'}
              </div>
            )}
          </div>

          {/* Timer */}
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: 32, fontWeight: 700, fontFamily: 'monospace',
              color: isLowTime ? '#ff4444' : '#fff',
              letterSpacing: 2, lineHeight: 1,
            }}>
              {String(mins).padStart(2, '0')} : {String(secs).padStart(2, '0')}
            </div>
            <div style={{ fontSize: 10, opacity: 0.6, letterSpacing: 3, marginTop: 1 }}>
              MINUTES &nbsp;|&nbsp; SECONDS
            </div>
          </div>
        </div>
      </div>

      {/* Warning */}
      {showWarning && (
        <div style={{
          margin: '8px auto 0', maxWidth: 960, width: '100%',
          padding: '8px 16px', background: '#fff3cd', border: '1px solid #ffc107',
          borderRadius: 6, fontSize: 13, color: '#856404',
        }}>
          ⚠ {showWarning}
        </div>
      )}

      {/* Main Content */}
      <div style={{ maxWidth: 960, margin: '16px auto', padding: '0 16px', width: '100%', flex: 1 }}>
        {/* Spec Bar */}
        {specs && (
          <div style={{
            fontSize: 12, color: '#666', background: '#fff',
            border: `1px solid ${BORDER}`, borderRadius: 6,
            padding: '8px 16px', display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 12,
          }}>
            <span>Duration: <strong>{specs.durationMinutes} min</strong></span>
            <span>Target: <strong>{specs.qualifyingNature === 'speed_wpm' ? `${specs.englishSpeedWpm} WPM` : `${specs.englishKdph.toLocaleString()} KDPH`}</strong></span>
            <span>Passage: <strong>{specs.passageKeyDepressions[0]}-{specs.passageKeyDepressions[1]} KD</strong></span>
            <span>Backspace: <strong style={{ color: specs.backspaceAllowed ? '#16a34a' : ACCENT_RED }}>{specs.backspaceAllowed ? 'Allowed' : 'Locked'}</strong></span>
          </div>
        )}

        {/* Passage Card */}
        <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 8, overflow: 'hidden', marginBottom: 12 }}>
          <div style={{
            padding: '10px 16px', borderBottom: `1px solid ${BORDER}`,
            fontSize: 13, fontWeight: 600, color: TEXT, background: '#fafafa',
          }}>
            Passage
          </div>
          <div
            style={{ padding: 20, fontSize: 17, lineHeight: 2, color: TEXT, userSelect: 'none', maxHeight: 260, overflowY: 'auto' }}
            onCopy={e => e.preventDefault()}
            onContextMenu={e => e.preventDefault()}
            onDragStart={e => e.preventDefault()}
          >
            {passage?.content || 'Loading passage...'}
          </div>
        </div>

        {/* Typing Area */}
        <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 8, overflow: 'hidden', marginBottom: 12 }}>
          <div style={{
            padding: '10px 16px', borderBottom: `1px solid ${BORDER}`,
            fontSize: 13, fontWeight: 600, color: TEXT, background: '#fafafa',
          }}>
            Typing Area
          </div>
          <textarea
            ref={textareaRef}
            defaultValue={typedContent}
            onChange={(e) => {
              if (newEngine) {
                newEngine.handleTextareaInput(e.target.value);
              } else {
                store.updateTypedContent(e.target.value);
              }
            }}
            onPaste={e => e.preventDefault()}
            onCopy={e => e.preventDefault()}
            onCut={e => e.preventDefault()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => e.preventDefault()}
            onContextMenu={e => e.preventDefault()}
            disabled={phase !== 'typing'}
            placeholder="Start typing here..."
            style={{
              width: '100%',
              height: 320,
              padding: 20,
              fontSize: 18,
              lineHeight: 2,
              color: TEXT,
              border: 'none',
              resize: 'none',
              outline: 'none',
              fontFamily: 'Poppins, sans-serif',
              background: 'transparent',
            }}
          />
        </div>

        {/* Stats shown only after submission (blind mode during typing) */}
        {phase !== 'typing' && (
          <div style={{
            background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 8,
            padding: '12px 16px', display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', fontSize: 14, color: TEXT, marginBottom: 12,
          }}>
            <div style={{ display: 'flex', gap: 24 }}>
              <span>Chars: <strong>{totalChars}</strong></span>
              <span>Words: <strong>{wordsTyped}</strong></span>
              <span>Gross WPM: <strong>{grossWpm}</strong></span>
            </div>
            <div style={{ display: 'flex', gap: 24 }}>
              <span>Net WPM: <strong>{netWpm}</strong></span>
              <span>Accuracy: <strong>{accuracy.toFixed(1)}%</strong></span>
              <span style={{ color: mistakes > 0 ? ACCENT_RED : '#16a34a' }}>Mistakes: <strong>{mistakes}</strong></span>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <button
            onClick={onComplete}
            disabled={totalChars === 0}
            style={{
              padding: '12px 48px',
              background: totalChars === 0 ? '#bbb' : NAVY,
              color: '#fff',
              borderRadius: 6,
              fontSize: 16,
              fontWeight: 600,
              cursor: totalChars === 0 ? 'not-allowed' : 'pointer',
              border: 'none',
              transition: 'background 0.2s',
            }}
          >
            Submit Test
          </button>
        </div>

        {/* Security Status */}
        {phase !== 'typing' && (
          <div style={{
            background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 8,
            padding: '10px 16px', display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', fontSize: 12, color: '#888',
          }}>
            <span>Tab: {tabSwitches} | Blur: {windowBlurs} | FS Exit: {fullscreenExits} | Resize: {resizeEvents}</span>
            <span style={{ color: suspiciousCount > 0 ? ACCENT_RED : '#16a34a', fontWeight: 600 }}>
              {suspiciousCount > 0 ? `⚠ ${suspiciousCount} suspicious event(s)` : '✓ No suspicious events'}
            </span>
          </div>
        )}
      </div>

      <style>{`
        @keyframes blink {
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
