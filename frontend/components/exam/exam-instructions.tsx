'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { getModeDisplayName } from '@/lib/utils';
import { getExamSpecs, FULL_MISTAKES, HALF_MISTAKES } from '@/lib/exam-config';
import { ROUTES } from '@/lib/config';
import { TestMode } from '@/types';
import { PracticeSet } from '@/lib/practice-sets';

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
  const [instructionLang, setInstructionLang] = useState<'english' | 'hindi'>(lang === 'hindi' ? 'hindi' : 'english');

  const specs = getExamSpecs(mode);
  const examTitle = getModeDisplayName(mode);
  const isSscChsl = mode === 'ssc_chsl';
  const isSscCgl = mode === 'ssc_cgl_dest';

  const durationLabel = durationSeconds >= 60
    ? `${Math.floor(durationSeconds / 60)} Mins`
    : `${durationSeconds} Secs`;

  return (
    <div style={{
      minHeight: '100vh',
      background: '#ffffff',
      fontFamily: 'Arial, Helvetica, sans-serif',
      color: '#222222',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Fixed Header */}
      <div style={{
        height: 60,
        background: '#ffffff',
        borderBottom: '1px solid #e5e5e5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 32,
            height: 32,
            background: '#4ec5df',
            borderRadius: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
            fontWeight: 700,
            color: '#fff',
          }}>M</div>
          <span style={{ fontSize: 16, fontWeight: 600, color: '#222' }}>Type Mania</span>
          <span style={{ color: '#e5e5e5', fontSize: 18 }}>|</span>
          <span style={{ fontSize: 15, fontWeight: 400, color: '#666' }}>{examTitle}</span>
        </div>
      </div>

      {/* Main content */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* Left: Instructions */}
        <div style={{
          flex: '0 0 83%',
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid #e5e5e5',
        }}>
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '32px 48px 16px',
          }}
            className="exam-scroll"
          >
            <h1 style={{
              fontSize: 40,
              fontWeight: 700,
              color: '#222222',
              margin: '0 0 4px',
              textAlign: 'center',
            }}>
              {examTitle}
            </h1>

            {selectedSet && (
              <div style={{ textAlign: 'center', marginTop: 4, marginBottom: 4 }}>
                <span style={{ fontSize: 15, fontWeight: 500, color: '#2563eb' }}>
                  Practice Set {selectedSet.number}: {selectedSet.title}
                </span>
              </div>
            )}

            <div style={{
              fontSize: 14,
              fontWeight: 500,
              color: '#666',
              marginTop: 20,
              marginBottom: 16,
              textAlign: 'center',
            }}>
              Duration: {durationLabel} | Qualifying Nature (No Marks)
            </div>

            {/* ===== TEST OVERVIEW ===== */}
            <Section title="1. Test Overview">
              <p style={pStyle}>
                This is a <strong>qualifying skill test</strong> conducted by the Staff Selection Commission (SSC) for{' '}
                {isSscCgl ? 'CGL DEST (Data Entry Speed Test)' : isSscChsl ? 'CHSL Tier-2 Section-III Module-II' : 'CHSL DEO Skill Test'}.
                No marks are added to the merit list, but <strong>passing is mandatory</strong> for final selection.
                Failure to qualify leads to disqualification regardless of written exam scores.
              </p>
              <p style={pStyle}>
                The test passage consists of approximately <strong>2,000 key depressions</strong> of moderate
                difficulty on general topics. You must type the passage exactly as displayed, following all
                formatting rules prescribed by the Commission.
              </p>
              <p style={pStyle}>
                The typing test <strong>automatically ends after {isSscChsl ? '10' : '15'} minutes</strong>.
                No manual submission is required.
              </p>
            </Section>

            {/* ===== SPEED REQUIREMENTS ===== */}
            <Section title="2. Speed Requirements">
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Post</th>
                    <th style={thStyle}>Speed Required</th>
                    <th style={thStyle}>Duration</th>
                    <th style={thStyle}>Passage Length</th>
                  </tr>
                </thead>
                <tbody>
                  {isSscCgl ? (
                    <tr>
                      <td style={tdStyle}>Tax Assistant / Compiler</td>
                      <td style={tdStyle}>~27 WPM (8,000 KDPH)</td>
                      <td style={tdStyle}>15 minutes</td>
                      <td style={tdStyle}>~2,000 key depressions</td>
                    </tr>
                  ) : isSscChsl ? (
                    <>
                      <tr>
                        <td style={tdStyle}>LDC / JSA / PA / SA</td>
                        <td style={tdStyle}>35 WPM English / 30 WPM Hindi (10,500/9,000 KDPH)</td>
                        <td style={tdStyle}>10 minutes</td>
                        <td style={tdStyle}>~2,000 key depressions</td>
                      </tr>
                      <tr>
                        <td style={tdStyle}>DEO</td>
                        <td style={tdStyle}>~27 WPM (8,000 KDPH)</td>
                        <td style={tdStyle}>15 minutes</td>
                        <td style={tdStyle}>~2,000 key depressions</td>
                      </tr>
                    </>
                  ) : (
                    <tr>
                      <td style={tdStyle}>DEO (CAG)</td>
                      <td style={tdStyle}>~50 WPM (15,000 KDPH)</td>
                      <td style={tdStyle}>15 minutes</td>
                      <td style={tdStyle}>~3,700–4,000 key depressions</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </Section>

            {/* ===== QUALIFYING STANDARDS ===== */}
            <Section title="3. Qualifying Standards (Category-wise Error Allowance)">
              <p style={pStyle}>
                Errors are calculated as a percentage of total words/key depressions. Candidates must stay within
                the permissible error limit for their category:
              </p>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Category</th>
                    <th style={thStyle}>Max Error %</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td style={tdStyle}>Unreserved (UR)</td><td style={tdStyle}>≤{specs?.errorAllowanceGeneral ?? 20}%</td></tr>
                  <tr><td style={tdStyle}>OBC / EWS</td><td style={tdStyle}>≤{specs?.errorAllowanceObcEws ?? 25}%</td></tr>
                  <tr><td style={tdStyle}>SC / ST / Others</td><td style={tdStyle}>≤{specs?.errorAllowanceScSt ?? 30}%</td></tr>
                </tbody>
              </table>
              <p style={{ ...pStyle, fontSize: 13, color: '#cc0000' }}>
                ⚠ If you exceed the prescribed error percentage, you are declared <strong>Not Qualified</strong>,
                even if you complete the entire passage within the time limit.
              </p>
            </Section>

            {/* ===== MARKING SCHEME ===== */}
            <Section title="4. Error Marking Scheme — Full Mistakes (1 error each)">
              <ul style={ulStyle}>
                {FULL_MISTAKES.map((m, i) => (
                  <li key={i} style={liStyle}>{m}</li>
                ))}
              </ul>

              <h4 style={{ fontSize: 15, fontWeight: 600, marginTop: 20, marginBottom: 8, color: '#ea580c' }}>
                Half Mistakes (0.5 error each)
              </h4>
              <ul style={ulStyle}>
                {HALF_MISTAKES.map((m, i) => (
                  <li key={i} style={liStyle}>{m}</li>
                ))}
              </ul>

              <div style={{
                marginTop: 12, padding: '10px 14px', background: '#f0fdf4',
                border: '1px solid #16a34a', borderRadius: 6, fontSize: 14, color: '#166534',
              }}>
                <strong>Formula:</strong> Total Errors = Full Mistakes + (Half Mistakes ÷ 2)<br />
                <strong>Error %</strong> = (Total Errors ÷ Total Key Depressions) × 100<br />
                SSC calculates errors up to <strong>2 decimal places</strong>.
              </div>
            </Section>

            {/* ===== FORMATTING RULES ===== */}
            <Section title="5. Paragraph & Formatting Rules">
              <p style={pStyle}>
                <strong>Formatting errors count as half mistakes per paragraph.</strong>
              </p>
              <ul style={ulStyle}>
                <li style={liStyle}>
                  <strong>Tab Key must be used</strong> to start a new paragraph. Using manual spaces instead
                  of Tab results in a half mistake for that paragraph.
                </li>
                <li style={liStyle}>
                  Only <strong>one space</strong> should be given after punctuation marks.
                </li>
                <li style={liStyle}>
                  The formatting style of the given passage must be followed strictly.
                </li>
                <li style={liStyle}>
                  Words, numbers, figures, and years must be typed <strong>exactly as given</strong>.
                </li>
              </ul>
            </Section>

            {/* ===== LANGUAGE RULES ===== */}
            <Section title="6. Medium & Language Rules">
              <ul style={ulStyle}>
                <li style={liStyle}>
                  Candidates must strictly follow the medium selected in the application form.
                </li>
                <li style={liStyle}>
                  <strong>English Medium</strong> — Only English typing is allowed.
                </li>
                <li style={liStyle}>
                  <strong>Hindi Medium</strong> — Only Hindi typing is allowed (Mangal Unicode font).
                </li>
                <li style={liStyle}>
                  Typing in any other language or script is treated as an error.
                </li>
              </ul>
            </Section>

            {/* ===== BACKSPACE & REVISION ===== */}
            <Section title="7. Backspace, Revision & Submission">
              <ul style={ulStyle}>
                <li style={liStyle}>
                  <strong>Backspace is allowed.</strong> You may use Backspace to correct mistakes during the test.
                  However, over-relying on backspace wastes time and may lead to incomplete passage.
                </li>
                <li style={liStyle}>
                  You are <strong>not required to retype</strong> the passage after completing it once.
                </li>
                <li style={liStyle}>
                  If time remains, you may <strong>revise and correct visible errors</strong>.
                  Focus on spelling, spacing, and punctuation errors.
                </li>
                <li style={liStyle}>
                  The test <strong>automatically ends</strong> when the timer runs out. No manual submission needed.
                </li>
                <li style={liStyle}>
                  Avoid panic typing or excessive corrections in the final seconds — this increases errors.
                </li>
              </ul>
            </Section>

            {/* ===== IMPORTANT TIPS ===== */}
            <Section title="8. Important Tips">
              <ul style={ulStyle}>
                <li style={liStyle}>
                  <strong>Accuracy &gt; Raw Speed.</strong> It is better to type at consistent speed with 99% accuracy
                  than high speed with many errors. Speed without accuracy or accuracy without speed can both lead to failure.
                </li>
                <li style={liStyle}>
                  Maintain <strong>consistent typing speed</strong> throughout the test. Avoid excessive hesitation,
                  repeated corrections, or unnecessary pauses.
                </li>
                <li style={liStyle}>
                  <strong>Never skip lines</strong> — skipping a line can result in consecutive Full Mistakes.
                  Use your finger on the screen/paper to track your reading line.
                </li>
                <li style={liStyle}>
                  Ensure you are in a quiet environment with a <strong>stable internet connection</strong> before beginning.
                </li>
                <li style={liStyle}>
                  Do not use any external resources, copy-paste, or automated tools during the test.
                  Such activity will result in <strong>disqualification</strong>.
                </li>
              </ul>
            </Section>

            {/* ===== CITATIONS ===== */}
            <Section title="References">
              <div style={{ fontSize: 12, color: '#888', lineHeight: 1.7 }}>
                <strong>Sources:</strong>
                <ul style={{ margin: '4px 0 0', paddingLeft: 20 }}>
                  {specs?.citations?.map((url, i) => (
                    <li key={i}>
                      <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb' }}>
                        {url}
                      </a>
                    </li>
                  ))}
                  <li><a href="https://ssc.gov.in" target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb' }}>https://ssc.gov.in</a></li>
                </ul>
              </div>
            </Section>

          </div>

          {/* Declaration */}
          <div style={{
            borderTop: '1px solid #e5e5e5',
            padding: '20px 48px',
            flexShrink: 0,
            background: '#fff',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: '#222' }}>Choose your default language:</span>
              <select disabled
                style={{
                  padding: '6px 12px',
                  border: '1px solid #e5e5e5',
                  borderRadius: 4,
                  fontSize: 14,
                  color: '#666',
                  background: '#f9f9f9',
                  cursor: 'not-allowed',
                  minWidth: 120,
                }}
              >
                <option>{lang === 'hindi' ? 'Hindi' : 'English'}</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: '#222' }}>Instruction Language:</span>
              <select
                value={instructionLang}
                onChange={(e) => setInstructionLang(e.target.value as 'english' | 'hindi')}
                style={{
                  padding: '6px 12px',
                  border: '1px solid #e5e5e5',
                  borderRadius: 4,
                  fontSize: 14,
                  color: '#222',
                  background: '#fff',
                  cursor: 'pointer',
                  minWidth: 120,
                }}
              >
                <option value="english">English</option>
                <option value="hindi">हिन्दी</option>
              </select>
            </div>

            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              cursor: 'pointer',
              fontSize: 15,
              color: '#222',
            }}>
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                style={{
                  width: 18,
                  height: 18,
                  accentColor: '#4ec5df',
                  cursor: 'pointer',
                }}
              />
              I have understood and agree to all the instructions.
            </label>
          </div>
        </div>

        {/* Right: Candidate Panel */}
        <div style={{
          flex: '0 0 17%',
          background: '#ffffff',
          padding: '32px 16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}>
          <div style={{
            textAlign: 'right',
            width: '100%',
            fontSize: 14,
            color: '#666',
            marginBottom: 32,
          }}>
            Maximum Marks: 1
          </div>

          <div style={{
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: '#4ec5df',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
          }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>

          <div style={{
            fontSize: 18,
            fontWeight: 500,
            color: '#222',
            textAlign: 'center',
          }}>
            {user?.full_name || 'Candidate'}
          </div>
        </div>
      </div>

      {/* Sticky Footer */}
      <div style={{
        height: 70,
        background: '#ffffff',
        borderTop: '1px solid #e5e5e5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        flexShrink: 0,
      }}>
        <button
          onClick={() => router.push(ROUTES.dashboard)}
          style={{
            padding: '8px 24px',
            background: '#d9edf7',
            border: 'none',
            borderRadius: 4,
            fontSize: 14,
            fontWeight: 600,
            color: '#222',
            cursor: 'pointer',
          }}
        >
          Previous
        </button>

        <button
          onClick={onBegin}
          disabled={!agreed}
          style={{
            padding: '12px 0',
            width: 200,
            background: agreed ? '#4ec5df' : '#ccc',
            border: 'none',
            borderRadius: 6,
            fontSize: 15,
            fontWeight: 600,
            color: '#fff',
            cursor: agreed ? 'pointer' : 'not-allowed',
            transition: 'background 0.2s',
          }}
        >
          I am ready to begin
        </button>
      </div>

      <style jsx global>{`
        .exam-scroll::-webkit-scrollbar {
          width: 12px;
        }
        .exam-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .exam-scroll::-webkit-scrollbar-thumb {
          background: #8ca8b8;
          border-radius: 6px;
        }
        .exam-scroll::-webkit-scrollbar-thumb:hover {
          background: #6a8a9a;
        }
      `}</style>
    </div>
  );
}

const pStyle: React.CSSProperties = {
  fontSize: 15,
  lineHeight: 1.7,
  color: '#222',
  margin: '0 0 8px',
};

const ulStyle: React.CSSProperties = {
  padding: 0,
  margin: '4px 0 0',
  listStyle: 'none',
};

const liStyle: React.CSSProperties = {
  fontSize: 15,
  lineHeight: 1.7,
  color: '#222',
  paddingLeft: 24,
  position: 'relative',
  marginBottom: 2,
};

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: 14,
  marginTop: 8,
  marginBottom: 8,
};

const thStyle: React.CSSProperties = {
  border: '1px solid #dcdcdc',
  padding: '8px 12px',
  background: '#f5f5f5',
  fontWeight: 600,
  textAlign: 'left',
  color: '#222',
};

const tdStyle: React.CSSProperties = {
  border: '1px solid #dcdcdc',
  padding: '8px 12px',
  color: '#222',
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#222', marginBottom: 8 }}>{title}</h2>
      {children}
    </div>
  );
}
