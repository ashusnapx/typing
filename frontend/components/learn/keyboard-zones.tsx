import { fingerMap, FINGER_COLORS, type FingerZone } from './keyboard-layout';

/**
 * The whole board, coloured by the finger that owns each key.
 *
 * A chapter used to open with nothing but its name and a list of lessons, so
 * "Sabse Zaroori Akshar" gave no clue which part of the keyboard it covered or
 * which fingers were about to do the work. One picture answers both before a
 * single lesson is opened: the keys this chapter teaches stand at full
 * strength while the rest of the board fades behind them, so a learner sees
 * the new work in the context of the board they already know.
 *
 * Static by design. The drill's keyboard tracks live keystrokes and carries the
 * state for it; this one is a diagram, and giving it the same machinery would
 * put a keystroke listener on a page that has no drill running.
 */

const KEY = 40;
const GAP = 5;
const PITCH = KEY + GAP;
const ROW_H = KEY + GAP;

/** The four letter rows, and the stagger a real board has. */
const ROWS: { keys: string[]; x0: number }[] = [
  { keys: [...'1234567890'], x0: 0 },
  { keys: [...'qwertyuiop'], x0: 0.5 },
  { keys: [...'asdfghjkl;'], x0: 0.75 },
  { keys: [...'zxcvbnm,./'], x0: 1.25 },
];

const WIDTH = 10 * PITCH + 2.25 * PITCH;
const SPACE_Y = 4 * ROW_H + 6;
const HEIGHT = SPACE_Y + 30;

/** Left and right of a pair share a hue, so the legend names four, not eight. */
const PAIRS: { label: string; left: FingerZone; right: FingerZone }[] = [
  { label: 'Little', left: 'lp', right: 'rp' },
  { label: 'Ring', left: 'lr', right: 'rr' },
  { label: 'Middle', left: 'lm', right: 'rm' },
  { label: 'Index', left: 'li', right: 'ri' },
];

export interface KeyboardZonesProps {
  /** The keys this chapter teaches. Held at full strength; the rest fade. */
  keys?: string[];
  /** Shown above the board when the chapter names what it covers. */
  caption?: string;
}

export function KeyboardZones({ keys = [], caption }: KeyboardZonesProps) {
  const lit = new Set(
    keys
      .map((k) => k.toLowerCase())
      .filter((k) => k.length === 1),
  );
  /* A chapter that covers the whole board has nothing to contrast against, so
     it simply shows the board at full strength. */
  const hasLit = lit.size > 0 && lit.size < 26;

  return (
    <figure className="card overflow-hidden">
      <figcaption className="border-b-2 border-vast bg-lumen-dark px-4 py-2.5">
        <span className="eyebrow">Keyboard zones and finger placement</span>
      </figcaption>

      <div className="px-4 py-4">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="w-full"
          role="img"
          aria-label={
            lit.size > 0
              ? `A keyboard with each key coloured by the finger that types it. This chapter covers ${[...lit]
                  .map((k) => k.toUpperCase())
                  .join(', ')}.`
              : 'A keyboard with each key coloured by the finger that types it.'
          }
        >
          {ROWS.map((row, r) =>
            row.keys.map((label, i) => {
              const zone = fingerMap[label] ?? 'rp';
              const x = row.x0 * PITCH + i * PITCH;
              const y = r * ROW_H;
              const isLit = lit.has(label);
              /* F and J carry the bumps a touch typist finds the row by. */
              const isAnchor = label === 'f' || label === 'j';

              return (
                <g key={`${r}-${label}`}>
                  {/* The chapter's keys are marked by contrast, not by a
                      different colour. Painting them yellow read well for a
                      chapter of three keys and turned the board solid yellow
                      for a chapter of thirty — which hid the finger colours
                      the diagram exists to teach. Keys in play keep their
                      finger's hue at full strength and take a heavier outline;
                      the rest of the board fades behind them. */}
                  <rect
                    x={x}
                    y={y}
                    width={KEY}
                    height={KEY}
                    rx={7}
                    fill={FINGER_COLORS[zone]}
                    fillOpacity={hasLit && !isLit ? 0.35 : 1}
                    stroke="#1a1a1a"
                    strokeWidth={isLit ? 2.8 : 1.4}
                    strokeOpacity={hasLit && !isLit ? 0.35 : 1}
                  />
                  <text
                    x={x + KEY / 2}
                    y={y + KEY / 2 + 6}
                    textAnchor="middle"
                    fontSize={16}
                    fontWeight={isLit ? 700 : 500}
                    fill="#1a1a1a"
                    fillOpacity={hasLit && !isLit ? 0.4 : 1}
                  >
                    {label.toUpperCase()}
                  </text>
                  {isAnchor && (
                    <rect
                      x={x + KEY / 2 - 8}
                      y={y + KEY - 8}
                      width={16}
                      height={3}
                      rx={1.5}
                      fill="#1a1a1a"
                    />
                  )}
                </g>
              );
            }),
          )}

          {/* The space bar belongs to the thumbs. */}
          <rect
            x={2.5 * PITCH}
            y={SPACE_Y}
            width={6 * PITCH}
            height={22}
            rx={6}
            fill={FINGER_COLORS.thumb}
            stroke="#1a1a1a"
            strokeWidth={1.6}
          />
          <text
            x={2.5 * PITCH + 3 * PITCH}
            y={SPACE_Y + 15}
            textAnchor="middle"
            fontSize={11}
            fill="#1a1a1a"
            opacity={0.6}
          >
            space — both thumbs
          </text>
        </svg>

        {/* Four names, not eight: each pair shares a hue, left lighter than
            right, so the hand is as symmetric as the board. */}
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
          {PAIRS.map((pair) => (
            <li key={pair.label} className="flex items-center gap-1.5 text-sm text-vast/70">
              <span
                className="inline-block h-3.5 w-3.5 rounded-sm border border-vast/40"
                style={{ backgroundColor: FINGER_COLORS[pair.left] }}
              />
              <span
                className="inline-block h-3.5 w-3.5 rounded-sm border border-vast/40"
                style={{ backgroundColor: FINGER_COLORS[pair.right] }}
              />
              {pair.label}
            </li>
          ))}
        </ul>

        {caption && (
          <p className="mt-3 text-[15px] leading-relaxed text-vast/70">{caption}</p>
        )}
      </div>
    </figure>
  );
}
