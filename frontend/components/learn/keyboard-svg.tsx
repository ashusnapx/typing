'use client';

import { useMemo, useEffect, useState, useRef } from 'react';
import { KEYBOARD_KEYS, getKeyByLabel } from './keyboard-layout';

interface KeyboardSVGProps {
  expectedChar?: string | null;
  typedHistory?: string[];
  showLegend?: boolean;
}

const KEY_W = 44;
const KEY_H = 44;
const GAP = 4;
const ROW_GAP = 8;
const STAGGER = [0, 14, 28, 42];
const PAD_X = 12;
const PAD_Y = 12;
const RADIUS = 5;

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

export default function KeyboardSVG({ expectedChar, typedHistory = [], showLegend = true }: KeyboardSVGProps) {
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());
  const [wrongFlash, setWrongFlash] = useState<string | null>(null);
  const prevLenRef = useRef(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      setPressedKeys(prev => new Set(prev).add(e.key.toLowerCase()));
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      setPressedKeys(prev => {
        const next = new Set(prev);
        next.delete(e.key.toLowerCase());
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
    if (typedHistory.length > prevLenRef.current) {
      const lastChar = typedHistory[typedHistory.length - 1];
      if (expectedChar && lastChar !== expectedChar) {
        const def = getKeyByLabel(expectedChar);
        if (def) {
          setWrongFlash(def.label);
          setTimeout(() => setWrongFlash(null), 400);
        }
      }
    }
    prevLenRef.current = typedHistory.length;
  }, [typedHistory, expectedChar]);

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
  const viewH = 4 * (KEY_H + ROW_GAP) + PAD_Y * 2 - ROW_GAP;

  const rows = [0, 1, 2, 3];

  return (
    <div className="w-full rounded-xl overflow-hidden border-2 border-pencil/20 shadow-hard-sm bg-paper/50">
      <div className="px-4 py-2 bg-pencil/5 border-b-2 border-pencil/10 flex items-center justify-between">
        <span className="text-sm font-hand text-pencil/60">Keyboard</span>
        {expectedChar && (
          <span className="text-sm font-mono font-bold text-blue-pen">
            Next: <kbd className="px-2 py-0.5 bg-white border border-pencil/30 rounded text-pencil">{expectedChar === ' ' ? '␣' : expectedChar}</kbd>
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
                100% { fill: #ffd43b; stroke: #d4a017; }
              }
            `}</style>
          </defs>
          {rows.map(row => {
            const keys = KEYBOARD_KEYS.filter(k => k.row === row);
            const staggerX = PAD_X + STAGGER[row];
            const rowY = PAD_Y + row * (KEY_H + ROW_GAP);
            return keys.map(key => {
              const x = staggerX + key.col * (KEY_W + GAP);
              const w = key.width * KEY_W + (key.width - 1) * GAP;
              const isPressed = pressedKeys.has(key.label.toLowerCase());
              const isHighlighted = activeLabels.has(key.label);
              const isNext = expectedChar && getKeyByLabel(expectedChar)?.label === key.label;
              const isHomeRow = ['a', 's', 'd', 'f', 'j', 'k', 'l', ';'].includes(key.label);
              const isWrong = wrongFlash === key.label;

              let fill = '#f8f4ef';
              let stroke = '#ddd8d0';
              let textFill = '#555';
              let strokeW = 1.5;
              let fontWeight = 400;
              let animName = '';

              if (isWrong) {
                fill = '#ff4444';
                stroke = '#cc0000';
                textFill = '#fff';
                strokeW = 2.5;
                fontWeight = 700;
                animName = 'key-flash-red 0.4s ease-out';
              } else if (isNext) {
                fill = '#ffd43b';
                stroke = '#d4a017';
                textFill = '#1a1a1a';
                strokeW = 2;
                fontWeight = 700;
                animName = 'key-blink 1s ease-in-out infinite';
              } else if (isPressed) {
                fill = '#e0d8c8';
                stroke = '#c0b8a8';
                textFill = '#1a1a1a';
                strokeW = 2;
                fontWeight = 500;
              } else if (isHomeRow) {
                fill = '#f0ebe0';
                stroke = '#d4d0c8';
              }

              return (
                <g key={`${key.row}-${key.col}`}>
                  <rect
                    x={x} y={rowY} width={w} height={KEY_H}
                    rx={RADIUS} ry={RADIUS}
                    fill={fill} stroke={stroke} strokeWidth={strokeW}
                    style={{
                      transition: 'fill 0.08s, stroke 0.08s',
                      ...(animName ? { animation: animName } : {}),
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
                </g>
              );
            });
          })}
        </svg>
      </div>
      {showLegend && (
        <div className="px-4 py-2 bg-pencil/5 border-t-2 border-pencil/10 text-center text-xs font-hand text-pencil/40">
          Home row keys are shaded. Next key blinks. Wrong key flashes red.
        </div>
      )}
    </div>
  );
}
