'use client';

import { useEffect, useRef, useState } from 'react';
import { useTypingStore } from '@/store/typing-store';
import { useAuthStore } from '@/store/auth-store';
import { useTypingEngine } from '@/hooks/use-typing-engine';
import { calculateWPM, calculateAccuracy, getModeDisplayName } from '@/lib/utils';
import { getExamSpecs } from '@/lib/exam-config';
import { CSS } from '@/lib/config';

const BG = '#f5f5f5';
const BORDER = '#dcdcdc';
const BLUE = '#2F5BFF';
const SUBMIT_BLUE = '#2196F3';
const TEXT = '#333333';

interface SSCExamUIProps {
  mode: string;
  durationSeconds: number;
  wpmTarget?: number;
  passage: any;
  lang?: 'english' | 'hindi';
  onComplete: () => void;
  phase: string;
}

export function SSCExamUI({ mode, durationSeconds, wpmTarget, passage, lang = 'english', onComplete, phase }: SSCExamUIProps) {
  const store = useTypingStore();
  const { user } = useAuthStore();
  const { typedContent, originalContent, elapsedSeconds } = useTypingEngine(lang);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [tabSwitches, setTabSwitches] = useState(0);
  const [windowBlurs, setWindowBlurs] = useState(0);
  const [fullscreenExits, setFullscreenExits] = useState(0);
  const [resizeEvents, setResizeEvents] = useState(0);
  const [showWarning, setShowWarning] = useState('');
  const [category, setCategory] = useState('UR');

  useEffect(() => { window.scrollTo(0, 0); }, [phase]);

  useEffect(() => {
    if (phase === 'typing') {
      document.documentElement.requestFullscreen().catch(() => {});
      textareaRef.current?.focus();
    }
  }, [phase]);

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

  const remaining = Math.max(0, durationSeconds - elapsedSeconds);
  const hours = Math.floor(remaining / 3600);
  const mins = Math.floor((remaining % 3600) / 60);
  const secs = remaining % 60;

  const correctChars = typedContent.split('').filter((c, i) => c === originalContent[i]).length;
  const totalChars = typedContent.length;
  const wordsTyped = typedContent.trim().split(/\s+/).filter(Boolean).length;
  const grossWpm = elapsedSeconds > 0 ? Math.round((totalChars / 5) / (elapsedSeconds / 60)) : 0;
  const netWpm = elapsedSeconds > 0 ? calculateWPM(totalChars, elapsedSeconds) : 0;
  const accuracy = totalChars > 0 ? calculateAccuracy(correctChars, totalChars) : 100;
  const mistakes = totalChars - correctChars;

  const suspiciousCount = tabSwitches + windowBlurs + fullscreenExits;
  const isLowTime = remaining < 60;

  return (
    <div style={{ background: BG, minHeight: '100vh', fontFamily: 'Poppins, sans-serif' }}>
      {/* Sticky Header — timer always visible */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: '#fff',
        borderBottom: `2px solid ${BORDER}`,
        padding: '12px 24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 48, height: 48, background: BLUE, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14 }}>
              SSC
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: TEXT }}>{getModeDisplayName(mode)}</div>
              <div style={{ fontSize: 12, color: '#888' }}>SSC Computer Based Skill Test</div>
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: 36,
              fontWeight: 700,
              fontFamily: 'monospace',
              color: '#e53935',
              letterSpacing: 2,
              animation: isLowTime ? 'blink 1s step-end infinite' : 'none',
            }}>
              {String(hours).padStart(2, '0')} : {String(mins).padStart(2, '0')} : {String(secs).padStart(2, '0')}
            </div>
            <div style={{ fontSize: 11, color: '#888', marginTop: 2, letterSpacing: 4 }}>
              HOURS &nbsp;|&nbsp; MINUTES &nbsp;|&nbsp; SECONDS
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => { if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {}); }}
              style={{ padding: '6px 12px', border: `1px solid ${BORDER}`, borderRadius: 6, background: '#fff', cursor: 'pointer', fontSize: 13, color: TEXT }}
            >
              ⛶ Fullscreen
            </button>
          </div>
        </div>
      </div>

      {/* Language Bar */}
      <div style={{ background: BLUE, height: 48, display: 'flex', alignItems: 'center', maxWidth: 1280, margin: '16px auto 0', borderRadius: 8, padding: '0 24px' }}>
        <span style={{ color: '#fff', fontSize: 15, fontWeight: 500 }}>Language: {lang === 'hindi' ? 'Hindi' : 'English'}</span>
      </div>

      {/* Warnings */}
      {showWarning && (
        <div style={{ maxWidth: 1280, margin: '8px auto 0', padding: '8px 16px', background: '#fff3cd', border: '1px solid #ffc107', borderRadius: 6, fontSize: 13, color: '#856404' }}>
          ⚠ {showWarning}
        </div>
      )}

      {/* Main Layout */}
      <div style={{ maxWidth: 1280, margin: '16px auto', padding: '0 24px', display: 'flex', gap: 20 }}>
        {/* Left: Passage + Typing */}
        <div style={{ flex: 3, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Exam Spec Bar */}
          {(() => {
            const specs = getExamSpecs(mode);
            if (!specs) return null;
            return (
              <div style={{ fontSize: 12, color: '#666', background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 8, padding: '8px 16px', display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                <span>Duration: <strong>{specs.durationMinutes} min</strong></span>
                <span>Target: <strong>{specs.qualifyingNature === 'speed_wpm' ? `${specs.englishSpeedWpm} WPM` : `${specs.englishKdph.toLocaleString()} KDPH`}</strong></span>
                <span>Passage: <strong>{specs.passageKeyDepressions[0]}-{specs.passageKeyDepressions[1]} KD</strong></span>
                <span>Backspace: <strong style={{ color: specs.backspaceAllowed ? CSS.colors.green : CSS.colors.red }}>{specs.backspaceAllowed ? 'Allowed' : 'Locked'}</strong></span>
              </div>
            );
          })()}

          {/* Passage Viewer — plain text, no live feedback */}
          <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: `1px solid ${BORDER}`, fontSize: 14, fontWeight: 600, color: TEXT }}>
              Passage
            </div>
            <div
              style={{ height: 280, overflowY: 'auto', padding: 16, fontSize: 18, lineHeight: 2, color: TEXT, userSelect: 'none' }}
              className="ssc-scrollbar"
              onCopy={e => e.preventDefault()}
              onContextMenu={e => e.preventDefault()}
              onDragStart={e => e.preventDefault()}
            >
              {passage?.content || 'Loading passage...'}
            </div>
          </div>

          {/* Typing Area */}
          <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: `1px solid ${BORDER}`, fontSize: 14, fontWeight: 600, color: TEXT }}>
              Typing Area
            </div>
            <textarea
              ref={textareaRef}
              value={typedContent}
              onChange={(e) => store.updateTypedContent(e.target.value)}
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
                height: 280,
                padding: 16,
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

          {/* Blind Mode — stats hidden during typing */}
          {phase !== 'typing' && (
            <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 8, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 14, color: TEXT }}>
              <div style={{ display: 'flex', gap: 24 }}>
                <span>Chars: <strong>{totalChars}</strong></span>
                <span>Words: <strong>{wordsTyped}</strong></span>
                <span>Gross: <strong>{grossWpm}</strong></span>
              </div>
              <div style={{ display: 'flex', gap: 24 }}>
                <span>Net WPM: <strong>{netWpm}</strong></span>
                <span>Accuracy: <strong>{accuracy.toFixed(1)}%</strong></span>
                <span style={{ color: mistakes > 0 ? CSS.colors.red : undefined }}>Mistakes: <strong>{mistakes}</strong></span>
              </div>
            </div>
          )}
        </div>

        {/* Right: Candidate Info & Submit */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <button
            onClick={() => setShowWarning('Read all instructions carefully before starting the test.')}
            style={{ width: '100%', padding: '10px 0', background: '#000', color: '#fff', borderRadius: 9999, fontSize: 14, fontWeight: 600, cursor: 'pointer', border: 'none' }}
          >
            📄 Instructions
          </button>

          <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 8, padding: 16 }}>
            <div style={{ textAlign: 'center', marginBottom: 12 }}>
              <div style={{ width: 56, height: 56, background: '#e0e0e0', borderRadius: '50%', margin: '0 auto 8px' }} />
              <div style={{ fontSize: 16, fontWeight: 600, color: TEXT }}>{user?.full_name || user?.email?.split('@')[0] || 'Candidate'}</div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 4 }}>Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', border: `1px solid ${BORDER}`, borderRadius: 6, fontSize: 14, color: TEXT, background: '#fff' }}
              >
                <option value="UR">UR (Unreserved)</option>
                <option value="OBC">OBC</option>
                <option value="SC">SC</option>
                <option value="ST">ST</option>
                <option value="EWS">EWS</option>
              </select>
            </div>
            <button
              onClick={onComplete}
              disabled={totalChars === 0}
              style={{
                width: '100%',
                padding: '12px 0',
                background: totalChars === 0 ? '#bbb' : SUBMIT_BLUE,
                color: '#fff',
                borderRadius: 8,
                fontSize: 16,
                fontWeight: 600,
                cursor: totalChars === 0 ? 'not-allowed' : 'pointer',
                border: 'none',
              }}
            >
              Submit Test
            </button>
          </div>

          {phase !== 'typing' && (
            <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 8, padding: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: TEXT, marginBottom: 8 }}>Security Status</div>
              <div style={{ fontSize: 12, color: '#888', lineHeight: 1.8 }}>
                <div>Tab Switches: {tabSwitches}</div>
                <div>Window Blurs: {windowBlurs}</div>
                <div>Fullscreen Exits: {fullscreenExits}</div>
                <div>Window Resizes: {resizeEvents}</div>
                <div style={{ color: suspiciousCount > 0 ? CSS.colors.red : CSS.colors.green, fontWeight: 600, marginTop: 4 }}>
                  Suspicious Events: {suspiciousCount}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .ssc-scrollbar::-webkit-scrollbar { width: 8px; }
        .ssc-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 4px; }
        .ssc-scrollbar::-webkit-scrollbar-thumb { background: #c1c1c1; border-radius: 4px; }
        .ssc-scrollbar::-webkit-scrollbar-thumb:hover { background: #a1a1a1; }
        @keyframes blink {
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
