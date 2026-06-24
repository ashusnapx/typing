'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { getModeDisplayName } from '@/lib/utils';
import { getExamSpecs, FULL_MISTAKES, HALF_MISTAKES } from '@/lib/exam-config';
import { ROUTES } from '@/lib/config';
import { TestMode } from '@/types';
import { PracticeSet } from '@/lib/practice-sets';

const NAVY = '#003366';
const ACCENT = '#cc0000';
const GRAY = '#f5f5f5';
const BORDER = '#dcdcdc';
const TEXT = '#222222';

interface ExamInstructionsProps {
  mode: TestMode;
  durationSeconds: number;
  lang?: 'english' | 'hindi';
  onBegin: () => void;
  selectedSet?: PracticeSet;
}

export function ExamInstructions({ mode, durationSeconds, lang = 'english', onBegin, selectedSet }: ExamInstructionsProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const [agreed, setAgreed] = useState(false);

  const specs = getExamSpecs(mode);
  const examTitle = getModeDisplayName(mode);
  const isSscChsl = mode === 'ssc_chsl';
  const isSscCgl = mode === 'ssc_cgl_dest';

  const durationLabel = durationSeconds >= 60
    ? `${Math.floor(durationSeconds / 60)} Minutes`
    : `${durationSeconds} Secs`;

  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: 'Poppins, sans-serif', color: TEXT, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        height: 64, background: NAVY, display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', padding: '0 32px', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ color: '#fff', fontSize: 20, fontWeight: 700, letterSpacing: 1 }}>EDUQUITY</div>
          <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.3)' }} />
          <div style={{ color: '#fff', fontSize: 15, fontWeight: 500, opacity: 0.9 }}>{examTitle}</div>
        </div>
        <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>Skill Test</div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: 0 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 40px' }}>
          {/* Candidate Info */}
          <div style={{
            background: '#f0f4f8', border: `1px solid ${BORDER}`, borderRadius: 6,
            padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 24, marginBottom: 28,
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%', background: NAVY,
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 24, fontWeight: 600,
            }}>
              {user?.full_name?.[0] || 'C'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: TEXT }}>{user?.full_name || 'Candidate'}</div>
              <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>Roll No: {user?.id?.slice(0, 8).toUpperCase() || 'XXXXXX'}</div>
            </div>
            <div style={{ textAlign: 'right', fontSize: 13, color: '#666' }}>
              <div>Duration: <strong>{durationLabel}</strong></div>
              <div>Language: <strong>{lang === 'hindi' ? 'Hindi' : 'English'}</strong></div>
            </div>
          </div>

          {/* Title */}
          <h1 style={{ fontSize: 28, fontWeight: 700, color: NAVY, margin: '0 0 4px' }}>{examTitle}</h1>
          {selectedSet && (
            <div style={{ fontSize: 15, fontWeight: 500, color: '#555', marginBottom: 20 }}>
              Practice Set {selectedSet.number}: {selectedSet.title}
            </div>
          )}

          {/* ===== INSTRUCTIONS ===== */}
          <Section title="1. Test Overview">
            <p style={pStyle}>
              This is a <strong>qualifying skill test</strong> as per SSC norms. No marks are added to the merit,
              but <strong style={{ color: ACCENT }}>passing is mandatory</strong> for final selection.
              The passage contains approximately <strong>2,000 key depressions</strong> on general topics.
            </p>
            <p style={pStyle}>
              Duration: <strong>{durationLabel}</strong> | Auto-submits when timer expires.
            </p>
          </Section>

          <Section title="2. Speed Requirements">
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Post</th>
                  <th style={thStyle}>Speed Required</th>
                  <th style={thStyle}>Duration</th>
                </tr>
              </thead>
              <tbody>
                {isSscCgl ? (
                  <tr>
                    <td style={tdStyle}>Tax Assistant / Compiler</td>
                    <td style={tdStyle}>~27 WPM (8,000 KDPH)</td>
                    <td style={tdStyle}>15 minutes</td>
                  </tr>
                ) : isSscChsl ? (
                  <>
                    <tr><td style={tdStyle}>LDC / JSA / PA / SA</td><td style={tdStyle}>35 WPM English / 30 WPM Hindi</td><td style={tdStyle}>10 minutes</td></tr>
                    <tr><td style={tdStyle}>DEO</td><td style={tdStyle}>~27 WPM (8,000 KDPH)</td><td style={tdStyle}>15 minutes</td></tr>
                  </>
                ) : (
                  <tr><td style={tdStyle}>DEO (CAG)</td><td style={tdStyle}>~50 WPM (15,000 KDPH)</td><td style={tdStyle}>15 minutes</td></tr>
                )}
              </tbody>
            </table>
          </Section>

          <Section title="3. Qualifying Standards (Category-wise)">
            <table style={tableStyle}>
              <thead>
                <tr><th style={thStyle}>Category</th><th style={thStyle}>Max Error %</th></tr>
              </thead>
              <tbody>
                <tr><td style={tdStyle}>Unreserved (UR)</td><td style={tdStyle}>≤{specs?.errorAllowanceGeneral ?? 20}%</td></tr>
                <tr><td style={tdStyle}>OBC / EWS</td><td style={tdStyle}>≤{specs?.errorAllowanceObcEws ?? 25}%</td></tr>
                <tr><td style={tdStyle}>SC / ST</td><td style={tdStyle}>≤{specs?.errorAllowanceScSt ?? 30}%</td></tr>
              </tbody>
            </table>
          </Section>

          <Section title="4. Error Marking">
            <p style={pStyle}><strong>Full Mistakes (1 error each):</strong></p>
            <ul style={ulStyle}>
              {FULL_MISTAKES.map((m, i) => <li key={i} style={liStyle}>{m}</li>)}
            </ul>
            <p style={{ ...pStyle, marginTop: 12 }}><strong>Half Mistakes (0.5 error each):</strong></p>
            <ul style={ulStyle}>
              {HALF_MISTAKES.map((m, i) => <li key={i} style={liStyle}>{m}</li>)}
            </ul>
            <div style={{
              marginTop: 12, padding: '10px 16px', background: '#f0fdf4',
              border: '1px solid #16a34a', borderRadius: 6, fontSize: 14, color: '#166534',
            }}>
              <strong>Formula:</strong> Total Errors = Full Mistakes + (Half Mistakes ÷ 2)<br />
              Error % = (Total Errors ÷ Total Key Depressions) × 100
            </div>
          </Section>

          <Section title="5. Key Rules">
            <ul style={ulStyle}>
              <li style={liStyle}>Use <strong>Tab key</strong> for paragraph start — manual spaces count as half mistake.</li>
              <li style={liStyle}>Only <strong>one space</strong> after punctuation marks.</li>
              <li style={liStyle}>Type words, numbers, and symbols <strong>exactly as shown</strong>.</li>
              <li style={liStyle}><strong>Backspace is allowed</strong> for corrections during the test.</li>
              <li style={liStyle}>Do <strong>not retype</strong> after completing the passage once. Use remaining time for revisions.</li>
              <li style={liStyle}>Test <strong>auto-ends</strong> when the timer runs out. No manual submission needed.</li>
            </ul>
          </Section>

          <Section title="6. Instructions">
            <ul style={ulStyle}>
              <li style={liStyle}>Select your <strong>language medium</strong> as opted in your application.</li>
              <li style={liStyle}>Read the passage displayed on the screen and type in the text area below.</li>
              <li style={liStyle}>Formatting errors are penalized. Follow the passage style strictly.</li>
              <li style={liStyle}>Use revision time wisely — check for spelling, spacing, and punctuation errors.</li>
              <li style={liStyle}>Maintain a <strong>quiet environment</strong> and stable internet connection.</li>
            </ul>
          </Section>

          {/* References */}
          <Section title="References">
            <div style={{ fontSize: 12, color: '#888', lineHeight: 1.7 }}>
              <strong>Sources:</strong>
              <ul style={{ margin: '4px 0 0', paddingLeft: 20 }}>
                {specs?.citations?.map((url, i) => (
                  <li key={i}><a href={url} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb' }}>{url}</a></li>
                ))}
                <li><a href="https://ssc.gov.in" target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb' }}>ssc.gov.in</a></li>
              </ul>
            </div>
          </Section>

          {/* Declaration */}
          <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 20, marginTop: 8 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 15, color: TEXT }}>
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                style={{ width: 18, height: 18, accentColor: NAVY, cursor: 'pointer' }}
              />
              I have read and understood all the instructions.
            </label>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        height: 72, background: '#fff', borderTop: `1px solid ${BORDER}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 32px', flexShrink: 0,
      }}>
        <button
          onClick={() => router.push(ROUTES.dashboard)}
          style={{
            padding: '8px 28px', background: '#fff', border: `1px solid ${BORDER}`,
            borderRadius: 4, fontSize: 14, fontWeight: 600, color: TEXT, cursor: 'pointer',
          }}
        >
          Back
        </button>
        <button
          onClick={onBegin}
          disabled={!agreed}
          style={{
            padding: '12px 0', width: 220, background: agreed ? NAVY : '#bbb',
            border: 'none', borderRadius: 4, fontSize: 15, fontWeight: 600, color: '#fff',
            cursor: agreed ? 'pointer' : 'not-allowed',
          }}
        >
          I Agree & Start Test
        </button>
      </div>
    </div>
  );
}

const pStyle: React.CSSProperties = { fontSize: 15, lineHeight: 1.7, color: TEXT, margin: '0 0 8px' };
const ulStyle: React.CSSProperties = { padding: 0, margin: '4px 0 0', listStyle: 'none' };
const liStyle: React.CSSProperties = {
  fontSize: 15, lineHeight: 1.7, color: TEXT, paddingLeft: 20, position: 'relative',
  marginBottom: 2,
};
const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', fontSize: 14, marginTop: 8, marginBottom: 8 };
const thStyle: React.CSSProperties = { border: `1px solid ${BORDER}`, padding: '8px 12px', background: GRAY, fontWeight: 600, textAlign: 'left', color: TEXT };
const tdStyle: React.CSSProperties = { border: `1px solid ${BORDER}`, padding: '8px 12px', color: TEXT };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h2 style={{ fontSize: 17, fontWeight: 700, color: NAVY, marginBottom: 6 }}>{title}</h2>
      {children}
    </div>
  );
}
