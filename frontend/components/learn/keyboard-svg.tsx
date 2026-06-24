'use client';

import { useMemo, useEffect, useState, useRef } from 'react';
import {
  KEYBOARD_KEYS,
  getKeyByLabel,
  FINGER_COLORS,
  FINGER_NAMES,
  getFingerForLabel,
  getActiveFingerZones,
} from './keyboard-layout';
import { KeystrokeEvent } from '@/types';
import { FingerZone } from './keyboard-layout';

interface KeyboardSVGProps {
  expectedChar?: string | null;
  typedHistory?: string[];
  showLegend?: boolean;
  keystrokeEvents?: KeystrokeEvent[];
  highlightZones?: FingerZone[];
  fingerQuizMode?: boolean;
  focusedKey?: string;
}

const KEY_W = 44;
const KEY_H = 44;
const GAP = 4;
const ROW_GAP = 8;
const STAGGER = [0, 14, 28, 42];
const PAD_X = 12;
const PAD_Y = 12;
const RADIUS = 5;
const HOME_ROW_KEYS = ['a', 's', 'd', 'f', 'j', 'k', 'l', ';'];
const GHOST_HAND_Y_OFFSET = 2 * (KEY_H + ROW_GAP) + 12;

const FINGER_ZONE_ORDER: FingerZone[] = ['lp', 'lr', 'lm', 'li', 'ri', 'rm', 'rr', 'rp', 'thumb'];

const FINGER_NAMES_SHORT: Record<FingerZone, string> = {
  lp: 'LP', lr: 'LR', lm: 'LM', li: 'LI',
  ri: 'RI', rm: 'RM', rr: 'RR', rp: 'RP',
  thumb: 'TH',
};

function rowTotalWidth(row: number) {
  const keys = KEYBOARD_KEYS.filter(k => k.row === row);
  let totalW = 0;
  for (const k of keys) {
    totalW += k.width * KEY_W + (totalW > 0 ? GAP : 0);
  }
  return totalW;
}

function maxRowWidth() {
  let max = 0;
  for (let r = 0; r < 4; r++) {
    max = Math.max(max, rowTotalWidth(r));
  }
  return max;
}

export default function KeyboardSVG({
  expectedChar,
  typedHistory = [],
  showLegend = true,
  keystrokeEvents,
  highlightZones = [],
  fingerQuizMode = false,
  focusedKey,
}: KeyboardSVGProps) {
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());
  const [wrongFlash, setWrongFlash] = useState<string | null>(null);
  const [showFingerAnswer, setShowFingerAnswer] = useState(false);
  const prevLenRef = useRef(0);
  const prevEventsLen = useRef(0);
  const fingerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      setPressedKeys(prev => {
        const next = new Set(prev);
        const key = e.key.toLowerCase();
        next.add(key);
        if (key === 'control') next.add('ctrl');
        if (key === ' ') next.add('space');
        if (key === 'escape') next.add('esc');
        if (key === 'arrowup') next.add('up');
        if (key === 'arrowdown') next.add('down');
        if (key === 'arrowleft') next.add('left');
        if (key === 'arrowright') next.add('right');
        if (key === 'enter') next.add('enter');
        if (key === 'backspace') next.add('backspace');
        if (key === 'tab') next.add('tab');
        if (key === 'capslock') next.add('capslock');
        return next;
      });
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      setPressedKeys(prev => {
        const next = new Set(prev);
        const key = e.key.toLowerCase();
        if (key === 'control') { next.delete('control'); next.delete('ctrl'); return next; }
        if (key === ' ') { next.delete(' '); next.delete('space'); return next; }
        if (key === 'escape') { next.delete('escape'); next.delete('esc'); return next; }
        if (key === 'arrowup') { next.delete('arrowup'); next.delete('up'); return next; }
        if (key === 'arrowdown') { next.delete('arrowdown'); next.delete('down'); return next; }
        if (key === 'arrowleft') { next.delete('arrowleft'); next.delete('left'); return next; }
        if (key === 'arrowright') { next.delete('arrowright'); next.delete('right'); return next; }
        next.delete(key);
        return next;
      });
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    if (!keystrokeEvents) return;
    if (keystrokeEvents.length > prevEventsLen.current) {
      const lastEvent = keystrokeEvents[keystrokeEvents.length - 1];
      if (lastEvent.is_error) {
        const def = getKeyByLabel(lastEvent.key);
        if (def) {
          setWrongFlash(def.label);
          setTimeout(() => setWrongFlash(null), 400);
        }
      }
    }
    prevEventsLen.current = keystrokeEvents.length;
  }, [keystrokeEvents]);

  useEffect(() => {
    if (keystrokeEvents) return;
    if (typedHistory.length > prevLenRef.current) {
      const lastChar = typedHistory[typedHistory.length - 1];
      if (expectedChar && lastChar !== expectedChar) {
        const def = getKeyByLabel(lastChar);
        if (def) {
          setWrongFlash(def.label);
          setTimeout(() => setWrongFlash(null), 400);
        }
      }
    }
    prevLenRef.current = typedHistory.length;
  }, [typedHistory, expectedChar, keystrokeEvents]);

  useEffect(() => {
    if (fingerQuizMode && expectedChar) {
      setShowFingerAnswer(false);
      if (fingerTimerRef.current) clearTimeout(fingerTimerRef.current);
      fingerTimerRef.current = setTimeout(() => setShowFingerAnswer(true), 2000);
      return () => {
        if (fingerTimerRef.current) clearTimeout(fingerTimerRef.current);
      };
    } else {
      setShowFingerAnswer(false);
    }
  }, [fingerQuizMode, expectedChar]);

  const activeLabels = useMemo(() => {
    const set = new Set<string>();
    typedHistory.forEach(char => {
      const def = getKeyByLabel(char);
      if (def) set.add(def.label);
    });
    if (expectedChar) {
      const def = getKeyByLabel(expectedChar);
      if (def) set.add(def.label);
    }
    return set;
  }, [typedHistory, expectedChar]);

  const viewW = maxRowWidth() + STAGGER[3] + PAD_X * 2;
  const viewH = 5 * (KEY_H + ROW_GAP) + PAD_Y * 2 - ROW_GAP + GHOST_HAND_Y_OFFSET + 12;

  const rows = [0, 1, 2, 3, 4];

  const homeRowX = (col: number) => {
    const staggerX = PAD_X + STAGGER[2];
    return staggerX + col * (KEY_W + GAP);
  };

  const homeRowY = PAD_Y + 2 * (KEY_H + ROW_GAP);

  return (
    <div className="w-full rounded-xl overflow-hidden border-2 border-pencil/20 shadow-hard-sm bg-paper/50">
      <div className="px-4 py-2 bg-pencil/5 border-b-2 border-pencil/10 flex items-center justify-between">
        <span className="text-sm font-hand text-pencil/60">Keyboard</span>
        {expectedChar && !fingerQuizMode && (
          <span className="text-sm font-mono font-bold text-blue-pen">
            Next: <kbd className="px-2 py-0.5 bg-white border border-pencil/30 rounded text-pencil">{expectedChar === ' ' ? '␣' : expectedChar}</kbd>
          </span>
        )}
        {expectedChar && fingerQuizMode && (
          <span className="text-sm font-mono font-bold text-purple-pen">
            Which finger for{' '}
            <kbd className="px-2 py-0.5 bg-white border border-pencil/30 rounded text-pencil">{expectedChar === ' ' ? '␣' : expectedChar}</kbd>
            ?{showFingerAnswer && (
              <span className="ml-2 text-green-600 font-bold">
                → {FINGER_NAMES[getFingerForLabel(expectedChar)] || '?'}
              </span>
            )}
          </span>
        )}
      </div>
      <div className="w-full overflow-auto">
        <svg
          viewBox={`0 0 ${viewW} ${viewH}`}
          className="w-full"
          style={{ minHeight: viewH, minWidth: viewW }}
        >
          <defs>
            <style>{`
              @keyframes key-blink {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
              }
              @keyframes key-flash-red {
                0% { fill: #ff4444; stroke: #cc0000; }
                100% { fill: #ff4444; stroke: #cc0000; }
              }
              @keyframes key-glow-pulse {
                0%, 100% { filter: drop-shadow(0 0 3px rgba(255,255,255,0.4)); }
                50% { filter: drop-shadow(0 0 8px rgba(255,255,255,0.8)); }
              }
            `}</style>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2.5" result="blur"/>
              <feMerge>
                <feMergeNode in="blur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          {rows.map(row => {
            const keys = KEYBOARD_KEYS.filter(k => k.row === row);
            let staggerX: number;
            if (row === 4) {
              const topWidth = maxRowWidth() + STAGGER[3];
              const bottomWidth = keys.reduce((sum, k) => {
                const kw = k.width * KEY_W + (sum > 0 ? GAP : 0);
                return sum + kw;
              }, 0);
              staggerX = PAD_X + (topWidth - bottomWidth) / 2;
            } else {
              staggerX = PAD_X + STAGGER[row];
            }
            const rowY = PAD_Y + row * (KEY_H + ROW_GAP);
            return keys.map(key => {
              const x = staggerX + key.col * (KEY_W + GAP);
              const w = key.width * KEY_W + (key.width - 1) * GAP;
              const isPressed = pressedKeys.has(key.label.toLowerCase());
              const isHomeRow = HOME_ROW_KEYS.includes(key.label);
              const isWrong = wrongFlash === key.label;
              const isFocused = focusedKey
                ? focusedKey === key.label
                : (expectedChar && getKeyByLabel(expectedChar)?.label === key.label);
              const isInHighlightZone = highlightZones.includes(key.finger);

              const fingerColor = FINGER_COLORS[key.finger];

              let fillColor = fingerColor;
              let fillOpacity = 0.15;
              let strokeColor = '#ddd8d0';
              let textFill = '#555';
              let strokeW = 1.5;
              let fontWeight = 400;
              let animName = '';
              let useGlow = false;

              if (isWrong) {
                fillColor = '#ff4444';
                strokeColor = '#cc0000';
                textFill = '#fff';
                strokeW = 2.5;
                fontWeight = 700;
                fillOpacity = 1;
                animName = 'key-flash-red 0.4s ease-out';
              } else if (isFocused) {
                fillColor = fingerColor;
                fillOpacity = 0.8;
                strokeColor = '#666';
                textFill = '#1a1a1a';
                strokeW = 2;
                fontWeight = 700;
                useGlow = true;
                animName = 'key-glow-pulse 1s ease-in-out infinite';
              } else if (isPressed) {
                fillColor = fingerColor;
                fillOpacity = 0.6;
                strokeColor = '#999';
                textFill = '#1a1a1a';
                strokeW = 2;
                fontWeight = 500;
              } else if (isInHighlightZone) {
                fillOpacity = 0.4;
                textFill = '#333';
                strokeW = 1.5;
              }

              return (
                <g key={`${key.row}-${key.col}`}>
                  <rect
                    x={x} y={rowY} width={w} height={KEY_H}
                    rx={RADIUS} ry={RADIUS}
                    fill={fillColor}
                    fillOpacity={fillOpacity}
                    stroke={strokeColor} strokeWidth={strokeW}
                    style={{
                      transition: 'fill 0.08s, stroke 0.08s, fill-opacity 0.08s',
                      ...(animName ? { animation: animName } : {}),
                      ...(useGlow ? { filter: 'url(#glow)' } : {}),
                    }}
                  />
                  <text
                    x={x + w / 2} y={rowY + KEY_H / 2 + 1}
                    textAnchor="middle" dominantBaseline="middle"
                    className="select-none"
                    fill={textFill}
                    fontSize={key.label.length > 1 ? 10 : 13}
                    fontFamily="monospace"
                    fontWeight={fontWeight}
                  >
                    {key.label === ' ' ? '␣' : key.label.toUpperCase()}
                  </text>
                  {isHomeRow && (
                    <line
                      x1={x + w * 0.3} y1={rowY + KEY_H - 4}
                      x2={x + w * 0.7} y2={rowY + KEY_H - 4}
                      stroke="#888" strokeWidth={1.5} strokeLinecap="round"
                      opacity={0.35}
                    />
                  )}
                </g>
              );
            });
          })}

          <g opacity={0.12} className="select-none">
            {[0, 1, 2, 3].map(col => {
              const cx = homeRowX(col) + KEY_W / 2;
              const cy = homeRowY + KEY_H + GHOST_HAND_Y_OFFSET;
              return <circle key={`ghost-l-${col}`} cx={cx} cy={cy} r={5} fill="#333" />;
            })}
            {[6, 7, 8, 9].map(col => {
              const cx = homeRowX(col) + KEY_W / 2;
              const cy = homeRowY + KEY_H + GHOST_HAND_Y_OFFSET;
              return <circle key={`ghost-r-${col}`} cx={cx} cy={cy} r={5} fill="#333" />;
            })}
          </g>
        </svg>
      </div>
      {showLegend && (
        <div className="px-4 py-2 bg-pencil/5 border-t-2 border-pencil/10">
          <div className="flex flex-wrap gap-3 justify-center text-xs">
            {FINGER_ZONE_ORDER.map(zone => (
              <span key={zone} className="flex items-center gap-1 font-hand text-pencil/60">
                <span
                  className="inline-block w-3 h-3 rounded-sm"
                  style={{ backgroundColor: FINGER_COLORS[zone] }}
                />
                {FINGER_NAMES_SHORT[zone]}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
