'use client';

import { PracticeSet } from '@/lib/practice-sets';
import { ArrowLeft, Timer, Target } from 'lucide-react';

const NAVY = '#003366';
const BORDER = '#dcdcdc';
const TEXT = '#222222';

interface PracticeSetSelectorProps {
  examName: string;
  sets: PracticeSet[];
  durationMinutes: number;
  wpmTarget?: number;
  onSelect: (set: PracticeSet) => void;
  onBack: () => void;
}

export default function PracticeSetSelector({ examName, sets, durationMinutes, wpmTarget, onSelect, onBack }: PracticeSetSelectorProps) {
  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: 'Poppins, sans-serif', color: TEXT }}>
      {/* Header */}
      <div style={{
        height: 64, background: NAVY, display: 'flex', alignItems: 'center',
        padding: '0 32px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ color: '#fff', fontSize: 20, fontWeight: 700, letterSpacing: 1 }}>EDUQUITY</div>
          <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.3)' }} />
          <div style={{ color: '#fff', fontSize: 15, fontWeight: 500, opacity: 0.9 }}>{examName}</div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
        {/* Back */}
        <button
          onClick={onBack}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 14, color: '#666', background: 'none', border: 'none',
            cursor: 'pointer', padding: 0, marginBottom: 24,
          }}
        >
          <ArrowLeft size={16} />
          Back to Exams
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: NAVY, margin: '0 0 8px' }}>Select Practice Set</h1>
          <p style={{ fontSize: 15, color: '#666', margin: 0 }}>Choose a set to begin the {examName} typing test</p>
          <div style={{
            display: 'flex', justifyContent: 'center', gap: 24, marginTop: 8,
            fontSize: 13, color: '#888',
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Timer size={14} /> {durationMinutes} min
            </span>
            {wpmTarget ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Target size={14} /> {wpmTarget} WPM target
              </span>
            ) : null}
          </div>
        </div>

        {/* Sets Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 16 }}>
          {sets.map((set) => (
            <button
              key={set.number}
              onClick={() => onSelect(set)}
              style={{
                display: 'block', textAlign: 'left', width: '100%',
                background: '#fff', border: `1px solid ${BORDER}`,
                borderRadius: 8, padding: 24,
                cursor: 'pointer', transition: 'border-color 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = NAVY;
                e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,51,102,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = BORDER;
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 8, background: NAVY,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: 18, fontWeight: 700, flexShrink: 0,
                  }}>
                    {set.number}
                  </div>
                  <div>
                    <div style={{ fontSize: 17, fontWeight: 600, color: TEXT, marginBottom: 2 }}>{set.title}</div>
                    <div style={{ fontSize: 14, color: '#888' }}>{set.description}</div>
                  </div>
                </div>
                <div style={{ color: '#ccc', fontSize: 20 }}>→</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
