'use client';

import { useRouter } from 'next/navigation';
import { EXAM_MODES } from '@/lib/config';
import { Clock, Target, ArrowRight } from 'lucide-react';

const NAVY = '#003366';
const BORDER = '#dcdcdc';
const TEXT = '#222222';

const ICONS: Record<string, React.ReactNode> = {
  Target: <Target size={22} />,
  Keyboard: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M6 16h12" /></svg>,
  Play: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3" /></svg>,
  Sparkles: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5z" /><path d="M18 14l1 2.5L22 17l-2.5 1L18 21l-1-2.5L14 17l2.5-1z" /></svg>,
  Award: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="6" /><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" /></svg>,
};

export default function ExamListingPage() {
  const router = useRouter();

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: 'Poppins, sans-serif', color: TEXT }}>
      {/* Header */}
      <div style={{
        height: 64, background: NAVY, display: 'flex', alignItems: 'center',
        padding: '0 32px',
      }}>
        <div style={{ color: '#fff', fontSize: 20, fontWeight: 700, letterSpacing: 1 }}>EDUQUITY</div>
        <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.3)', marginLeft: 16 }} />
        <div style={{ color: '#fff', fontSize: 15, fontWeight: 500, opacity: 0.9, marginLeft: 16 }}>Typing Tests</div>
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 24px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: NAVY, margin: '0 0 6px' }}>Choose a Typing Test</h1>
        <p style={{ fontSize: 15, color: '#666', margin: '0 0 28px' }}>
          Select an exam mode to start practicing. Each mode follows official SSC guidelines.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {EXAM_MODES.map((exam) => {
            const minutes = Math.floor(exam.duration / 60);
            const wpmLabel = exam.wpmTarget > 0 ? `${exam.wpmTarget} WPM` : 'KDPH';
            const isHindi = exam.lang === 'hindi';

            return (
              <button
                key={exam.id}
                onClick={() => router.push(exam.href)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 20, textAlign: 'left', width: '100%',
                  background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 10,
                  padding: '20px 24px', cursor: 'pointer', transition: 'border-color 0.15s, box-shadow 0.15s',
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
                {/* Icon */}
                <div style={{
                  width: 48, height: 48, borderRadius: 10, background: '#f0f4f8',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: NAVY, flexShrink: 0,
                }}>
                  {ICONS[exam.icon] || <Target size={22} />}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 17, fontWeight: 600, color: TEXT, marginBottom: 2 }}>
                    {exam.title}
                    {isHindi && (
                      <span style={{
                        marginLeft: 8, fontSize: 10, background: NAVY, color: '#fff',
                        padding: '1px 8px', borderRadius: 8, verticalAlign: 'middle',
                      }}>
                        HINDI
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 14, color: '#888', lineHeight: 1.4 }}>{exam.description}</div>
                </div>

                {/* Meta */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#666' }}>
                    <Clock size={14} />
                    {minutes} min
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#666' }}>
                    <Target size={14} />
                    {wpmLabel}
                  </div>
                  <ArrowRight size={18} color="#ccc" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
