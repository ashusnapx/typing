'use client';

import { useMemo } from 'react';

interface MouseSVGProps {
  pressedKeys?: string[];
  showLegend?: boolean;
}

const HIGHLIGHT = '#ffd43b';
const BODY = '#4a4a4a';
const BTN = '#5a5a5a';
const WHEEL = '#6a6a6a';

export default function MouseSVG({ pressedKeys = [], showLegend = true }: MouseSVGProps) {
  const keys = useMemo(() => new Set(pressedKeys), [pressedKeys]);
  const left = keys.has('left-click');
  const right = keys.has('right-click');
  const scroll = keys.has('scroll');

  return (
    <div className="w-full rounded-xl overflow-hidden border-2 border-pencil/20 shadow-hard-sm bg-paper/50">
      <div className="px-4 py-2 bg-pencil/5 border-b-2 border-pencil/10 flex items-center justify-between">
        <span className="text-sm font-hand text-pencil/60">Mouse — Click tracking</span>
      </div>
      <div className="flex items-center justify-center p-6">
        <svg viewBox="0 0 200 280" className="w-48 h-64" style={{ maxWidth: '12rem' }}>
          {/* Tail/Cable */}
          <path d="M100 5 Q100 -10 105 -20" stroke={BODY} strokeWidth={3} fill="none" strokeLinecap="round" />

          {/* Mouse body */}
          <path
            d="M60 40 Q60 10 100 10 Q140 10 140 40 L140 200 Q140 250 100 250 Q60 250 60 200 Z"
            fill={BODY}
            stroke="#333"
            strokeWidth={2}
          />

          {/* Left button */}
          <path
            d="M63 42 Q63 18 100 18 L100 85 Q80 85 63 85 Z"
            fill={left ? HIGHLIGHT : BTN}
            stroke={left ? '#d4a017' : '#444'}
            strokeWidth={1.5}
            style={{ transition: 'fill 0.1s' }}
          />

          {/* Right button */}
          <path
            d="M137 42 Q137 18 100 18 L100 85 Q120 85 137 85 Z"
            fill={right ? HIGHLIGHT : BTN}
            stroke={right ? '#d4a017' : '#444'}
            strokeWidth={1.5}
            style={{ transition: 'fill 0.1s' }}
          />

          {/* Scroll wheel */}
          <rect
            x={92}
            y={50}
            width={16}
            height={24}
            rx={4}
            ry={4}
            fill={scroll ? HIGHLIGHT : WHEEL}
            stroke={scroll ? '#d4a017' : '#555'}
            strokeWidth={1.5}
            style={{ transition: 'fill 0.1s' }}
          />
          {/* Wheel lines */}
          <line x1={97} y1={58} x2={103} y2={58} stroke={scroll ? '#b8860b' : '#888'} strokeWidth={1} />
          <line x1={97} y1={62} x2={103} y2={62} stroke={scroll ? '#b8860b' : '#888'} strokeWidth={1} />
          <line x1={97} y1={66} x2={103} y2={66} stroke={scroll ? '#b8860b' : '#888'} strokeWidth={1} />

          {/* Left button label */}
          <text x={83} y={105} textAnchor="middle" fill="#aaa" fontSize={8} fontFamily="sans-serif">L</text>
          {/* Right button label */}
          <text x={117} y={105} textAnchor="middle" fill="#aaa" fontSize={8} fontFamily="sans-serif">R</text>
        </svg>
      </div>
      {showLegend && (
        <div className="px-4 py-2 bg-pencil/5 border-t-2 border-pencil/10 flex flex-wrap gap-3 justify-center text-xs font-hand text-pencil/50">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-[#ffd43b]" /> Active</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-[#5a5a5a]" /> Button</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-[#4a4a4a]" /> Body</span>
        </div>
      )}
    </div>
  );
}
