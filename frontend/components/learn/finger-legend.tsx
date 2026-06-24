'use client';

import { useState } from 'react';
import { FINGER_COLORS, FINGER_NAMES, HAND, FingerZone } from './keyboard-layout';
import { CSS } from '@/lib/config';

interface FingerLegendProps {
  activeZone?: FingerZone | null;
  onZoneHover?: (zone: FingerZone | null) => void;
  onZoneClick?: (zone: FingerZone) => void;
}

const LEFT_FINGERS: FingerZone[] = ['lp', 'lr', 'lm', 'li'];
const RIGHT_FINGERS: FingerZone[] = ['ri', 'rm', 'rr', 'rp'];

const ZONE_SHORT: Record<FingerZone, string> = {
  lp: 'LP',
  lr: 'LR',
  lm: 'LM',
  li: 'LI',
  ri: 'RI',
  rm: 'RM',
  rr: 'RR',
  rp: 'RP',
  thumb: 'TH',
};

function Finger({ zone, activeZone, onZoneHover, onZoneClick }: {
  zone: FingerZone;
  activeZone: FingerZone | null | undefined;
  onZoneHover?: (zone: FingerZone | null) => void;
  onZoneClick?: (zone: FingerZone) => void;
}) {
  const [showTip, setShowTip] = useState(false);
  const isActive = activeZone === zone;
  const color = FINGER_COLORS[zone];

  return (
    <div className="relative flex flex-col items-center">
      <button
        type="button"
        onClick={() => onZoneClick?.(zone)}
        onMouseEnter={() => { setShowTip(true); onZoneHover?.(zone); }}
        onMouseLeave={() => { setShowTip(false); onZoneHover?.(null); }}
        onFocus={() => { setShowTip(true); onZoneHover?.(zone); }}
        onBlur={() => { setShowTip(false); onZoneHover?.(null); }}
        className={`
          w-10 h-14 flex items-center justify-center border-2 font-marker text-xs
          transition-all duration-200 cursor-pointer relative
          ${isActive
            ? 'scale-110 shadow-hard-sm ring-2 ring-offset-2 ring-pencil/40 z-10'
            : 'hover:scale-105 hover:shadow-hard-sm'
          }
        `}
        style={{
          backgroundColor: color,
          borderColor: isActive ? '#333' : `${color}80`,
          borderRadius: CSS.radii.sm,
          color: '#1a1a1a',
        }}
        aria-label={`${FINGER_NAMES[zone]} (${zone})`}
        aria-pressed={isActive}
      >
        {ZONE_SHORT[zone]}
      </button>
      {showTip && (
        <div
          className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-pencil text-paper text-[10px] font-marker whitespace-nowrap shadow-hard-sm z-20 pointer-events-none"
          style={{ borderRadius: CSS.radii.sm }}
        >
          {FINGER_NAMES[zone]}
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-t-pencil border-l-transparent border-r-transparent" />
        </div>
      )}
    </div>
  );
}

export function FingerLegend({ activeZone, onZoneHover, onZoneClick }: FingerLegendProps) {
  return (
    <div className="bg-paper border-2 border-pencil/20 p-4 shadow-hard-sm" style={{ borderRadius: CSS.radii.md }}>
      <h4 className="font-marker text-sm text-pencil mb-3">Finger Zones</h4>
      <div className="flex flex-col items-center gap-4">
        {/* Hands row */}
        <div className="flex items-center gap-6">
          {/* Left Hand */}
          <div className="flex items-end gap-1.5">
            {LEFT_FINGERS.map((zone) => (
              <Finger
                key={zone}
                zone={zone}
                activeZone={activeZone}
                onZoneHover={onZoneHover}
                onZoneClick={onZoneClick}
              />
            ))}
          </div>
          {/* Right Hand */}
          <div className="flex items-end gap-1.5">
            {RIGHT_FINGERS.map((zone) => (
              <Finger
                key={zone}
                zone={zone}
                activeZone={activeZone}
                onZoneHover={onZoneHover}
                onZoneClick={onZoneClick}
              />
            ))}
          </div>
        </div>
        {/* Thumb */}
        <Finger
          zone="thumb"
          activeZone={activeZone}
          onZoneHover={onZoneHover}
          onZoneClick={onZoneClick}
        />
        {/* Labels */}
        <div className="flex w-full justify-between text-[10px] font-hand text-pencil/40 mt-1">
          <span>Left</span>
          <span>Right</span>
        </div>
      </div>
    </div>
  );
}
