'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { getModeDisplayName } from '@/lib/utils';
import { TestMode } from '@/types';

const instructions = [
  'This is a typing skill test conducted by the Staff Selection Commission (SSC) for recruitment purposes.',
  'The total duration of this test is mentioned above. The timer will start as soon as you click "I am ready to begin".',
  'You are required to type the given passage exactly as displayed on the screen. Pay close attention to punctuation, spacing, and capitalization.',
  'The passage will be displayed in the upper section of the screen. The typing area is provided in the lower section.',
  'Use the keyboard to type the passage in the text box provided. The system records every keystroke for evaluation.',
  'You may use the Backspace key to correct mistakes. The system tracks all corrections made during the test.',
  'Once the timer starts, it cannot be paused, stopped, or extended under any circumstances.',
  'You must maintain the minimum required typing speed as per SSC guidelines for the respective exam category.',
  'Typing accuracy is equally important as speed. The evaluation considers both net speed and accuracy percentage.',
  'Do not use any external resources, copy-paste, or automated tools during the test. Such activity will result in disqualification.',
  'Ensure you are in a quiet environment with a stable internet connection before beginning the test.',
  'Your result, including WPM, accuracy, and qualification status, will be displayed immediately after the test concludes.',
];

interface ExamInstructionsProps {
  mode: TestMode;
  durationSeconds: number;
  onBegin: () => void;
}

export function ExamInstructions({ mode, durationSeconds, onBegin }: ExamInstructionsProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const [agreed, setAgreed] = useState(false);

  const durationLabel = durationSeconds >= 60
    ? `${Math.floor(durationSeconds / 60)} Mins`
    : `${durationSeconds} Secs`;

  const examTitle = getModeDisplayName(mode);

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
        {/* Left: Instructions (83%) */}
        <div style={{
          flex: '0 0 83%',
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid #e5e5e5',
        }}>
          {/* Scrollable instructions */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '40px 48px 24px',
          }}
            className="exam-scroll"
          >
            <h1 style={{
              fontSize: 48,
              fontWeight: 700,
              color: '#222222',
              margin: '0 0 8px',
              textAlign: 'center',
            }}>
              {examTitle}
            </h1>

            <div style={{
              fontSize: 16,
              fontWeight: 600,
              color: '#222',
              marginTop: 32,
              marginBottom: 8,
            }}>
              Duration: {durationLabel}
            </div>

            <p style={{
              fontSize: 15,
              color: '#222',
              marginBottom: 20,
              fontWeight: 400,
            }}>
              Read the following instructions carefully before starting the test.
            </p>

            <ol style={{
              padding: 0,
              margin: 0,
              listStyle: 'none',
            }}>
              {instructions.map((text, i) => (
                <li key={i} style={{
                  fontSize: 15,
                  lineHeight: 1.8,
                  color: '#222222',
                  paddingLeft: 32,
                  position: 'relative',
                  marginBottom: 4,
                }}>
                  <span style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    fontWeight: 600,
                    color: '#222',
                  }}>
                    {i + 1}.
                  </span>
                  {text}
                </li>
              ))}
            </ol>
          </div>

          {/* Language & Declaration */}
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
                <option>English</option>
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

        {/* Right: Candidate Panel (17%) */}
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
          onClick={() => router.push('/dashboard')}
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
