'use client';

import { CSS } from '@/lib/config';

interface KeyHeatmapProps {
  accuracyData?: Record<string, { correct: number; incorrect: number }>;
  onKeyClick?: (key: string) => void;
  compact?: boolean;
}

const ROWS = [
  ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '='],
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', '\\'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'"],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/'],
];

const ROW_OFFSETS = [0, 0.75, 1.5, 2];

function getAccuracyColor(
  data: { correct: number; incorrect: number } | undefined,
): string {
  if (!data || (data.correct === 0 && data.incorrect === 0)) return '#e5e7eb';
  const total = data.correct + data.incorrect;
  if (total === 0) return '#e5e7eb';
  const ratio = data.correct / total;
  if (ratio >= 0.95) return '#22c55e';
  if (ratio >= 0.85) return '#86efac';
  if (ratio >= 0.75) return '#fde047';
  if (ratio >= 0.6) return '#fb923c';
  return '#ef4444';
}

function getAccuracyText(
  data: { correct: number; incorrect: number } | undefined,
): string | null {
  if (!data) return null;
  const total = data.correct + data.incorrect;
  if (total === 0) return null;
  return `${Math.round((data.correct / total) * 100)}%`;
}

export function KeyHeatmap({ accuracyData, onKeyClick, compact }: KeyHeatmapProps) {
  const size = compact ? 'w-6 h-5 text-[7px]' : 'w-9 h-8 text-[9px]';
  const gap = compact ? 'gap-0.5' : 'gap-1';

  return (
    <div
      className="bg-paper border-2 border-pencil/20 p-3 shadow-hard-sm"
      style={{ borderRadius: CSS.radii.md }}
    >
      <div className="text-xs font-marker text-pencil mb-2">Key Accuracy</div>
      <div className="flex flex-col gap-1">
        {ROWS.map((row, rowIdx) => (
          <div key={rowIdx} className="flex items-center" style={{ paddingLeft: `${ROW_OFFSETS[rowIdx] * (compact ? 14 : 22)}px` }}>
            <div className={`flex ${gap}`}>
              {row.map((key) => {
                const data = accuracyData?.[key];
                const color = getAccuracyColor(data);
                const text = getAccuracyText(data);

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => onKeyClick?.(key)}
                    className={`
                      ${size} flex items-center justify-center font-mono border
                      transition-all duration-150 hover:scale-110 hover:shadow-hard-sm
                      ${onKeyClick ? 'cursor-pointer' : 'cursor-default'}
                    `}
                    style={{
                      backgroundColor: color,
                      borderColor: data ? 'rgba(0,0,0,0.15)' : '#e5e7eb',
                      borderRadius: CSS.radii.sm,
                      color: color === '#e5e7eb' ? '#9ca3af' : '#1a1a1a',
                    }}
                    title={data ? `${key}: ${data.correct}/${data.correct + data.incorrect} (${text || 'N/A'})` : `${key}: No data`}
                    aria-label={`Key ${key}${text ? `, accuracy ${text}` : ', no data'}`}
                  >
                    {compact ? (
                      <span className="truncate">{key === ' ' ? '␣' : key.length > 1 ? key.slice(0, 1) : key}</span>
                    ) : (
                      <span>{key === ' ' ? '␣' : key}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      {/* Legend */}
      <div className="flex items-center justify-center gap-2 mt-2 text-[9px] font-hand text-pencil/50">
        <span className="flex items-center gap-0.5"><span className="w-2 h-2 rounded-sm inline-block" style={{ backgroundColor: '#22c55e' }} /> ≥95%</span>
        <span className="flex items-center gap-0.5"><span className="w-2 h-2 rounded-sm inline-block" style={{ backgroundColor: '#86efac' }} /> ≥85%</span>
        <span className="flex items-center gap-0.5"><span className="w-2 h-2 rounded-sm inline-block" style={{ backgroundColor: '#fde047' }} /> ≥75%</span>
        <span className="flex items-center gap-0.5"><span className="w-2 h-2 rounded-sm inline-block" style={{ backgroundColor: '#fb923c' }} /> ≥60%</span>
        <span className="flex items-center gap-0.5"><span className="w-2 h-2 rounded-sm inline-block" style={{ backgroundColor: '#ef4444' }} /> {'<'}60%</span>
      </div>
    </div>
  );
}
