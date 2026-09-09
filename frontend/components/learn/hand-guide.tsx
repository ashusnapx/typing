import { fingerMap, FINGER_NAMES, HAND, type FingerZone } from './keyboard-layout';

/**
 * Where the hands go for *this* lesson.
 *
 * The first version drew the home row and nothing else, so every lesson in the
 * course showed an identical picture — a drill on the top row, the number row
 * or the punctuation keys was illustrated by a diagram of A S D F. The keys a
 * learner has not met are exactly the ones worth drawing.
 *
 * The board now shows the rows the lesson touches, and each finger is drawn
 * reaching the key it has to reach, from the home key it rests on. A lesson on
 * E and T lifts two fingers to the top row and leaves the other six at rest,
 * which is what the hand actually does.
 */

/* -------------------------------------------------------------------------- */
/* Board geometry                                                              */
/* -------------------------------------------------------------------------- */

const PITCH = 64;
const KEY = 56;

/** Row tops, and the stagger a real keyboard has. */
const ROW_Y = { number: 36, top: 100, home: 164, bottom: 228 } as const;
type RowName = keyof typeof ROW_Y;

const ROWS: { name: RowName; keys: string[]; x0: number }[] = [
  { name: 'number', keys: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'], x0: 36 },
  { name: 'top', keys: ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'], x0: 52 },
  { name: 'home', keys: ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';'], x0: 68 },
  { name: 'bottom', keys: ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/'], x0: 100 },
];

interface Cap {
  label: string;
  x: number;
  y: number;
  row: RowName;
  zone: FingerZone;
}

const BOARD: Cap[] = ROWS.flatMap((row) =>
  row.keys.map((label, i) => ({
    label,
    x: row.x0 + i * PITCH,
    y: ROW_Y[row.name],
    row: row.name,
    zone: fingerMap[label] ?? 'rp',
  })),
);

const capFor = (label: string) => BOARD.find((c) => c.label === label.toLowerCase());

/** The key each finger rests on between reaches. */
const HOME_KEY: Record<Exclude<FingerZone, 'thumb'>, string> = {
  lp: 'a',
  lr: 's',
  lm: 'd',
  li: 'f',
  ri: 'j',
  rm: 'k',
  rr: 'l',
  rp: ';',
};

const SPACE = { x: 220, y: 300, w: 300, h: 40 };

/* -------------------------------------------------------------------------- */
/* Key lookup                                                                  */
/* -------------------------------------------------------------------------- */

/** Keys a lesson can name that are not letters on the board. */
const SPECIAL_FINGERS: Record<string, FingerZone> = {
  space: 'thumb',
  spacebar: 'thumb',
  shift: 'lp',
  'left shift': 'lp',
  'right shift': 'rp',
  enter: 'rp',
  return: 'rp',
  tab: 'lp',
  backspace: 'rp',
  capslock: 'lp',
  'caps lock': 'lp',
};

/** The finger that presses a key, or null if it is not a key we teach. */
export function fingerFor(key: string): FingerZone | null {
  const k = key.trim().toLowerCase();
  if (!k) return null;
  return SPECIAL_FINGERS[k] ?? fingerMap[k] ?? null;
}

/**
 * The keys a lesson should show fingering for.
 *
 * Most lessons name their keys. The later drills do not: they are passages
 * with a focus — figures, punctuation, capitals — and the keys that matter are
 * whichever ones appear in the passage. The figures drill is the clearest
 * case: a full mistake for every wrong digit, and no key list of its own.
 */
export function lessonKeysFor(lesson: {
  keys?: string[];
  newKeys?: string[];
  focus?: string;
  sampleText?: string;
}): string[] {
  const declared = Array.from(
    new Set([...(lesson.newKeys ?? []), ...(lesson.keys ?? [])]),
  ).filter((k) => fingerFor(k));
  if (declared.length > 0) return declared;

  const text = lesson.sampleText ?? '';
  if (lesson.focus === 'figures') {
    return Array.from(new Set(text.match(/\d/g) ?? [])).sort();
  }
  if (lesson.focus === 'punctuation') {
    return Array.from(new Set(text.match(/[.,;:'"?!/-]/g) ?? [])).filter((k) => fingerFor(k));
  }
  if (lesson.focus === 'capitalisation') {
    // Capitals are made with the opposite hand's Shift, which is the whole
    // technique the drill is training.
    return ['Left Shift', 'Right Shift'];
  }
  return [];
}

/* -------------------------------------------------------------------------- */
/* The hand                                                                    */
/* -------------------------------------------------------------------------- */

const FINGERS_LEFT: Exclude<FingerZone, 'thumb'>[] = ['lp', 'lr', 'lm', 'li'];
const FINGERS_RIGHT: Exclude<FingerZone, 'thumb'>[] = ['ri', 'rm', 'rr', 'rp'];

/** Knuckle x for each finger, and how far back it sits — the middle knuckle is
 *  furthest from the board because the middle finger is the longest. */
const KNUCKLE: Record<Exclude<FingerZone, 'thumb'>, { x: number; y: number; w: number }> = {
  lp: { x: 76, y: 344, w: 17 },
  lr: { x: 136, y: 334, w: 19 },
  lm: { x: 196, y: 328, w: 20 },
  li: { x: 256, y: 336, w: 19 },
  ri: { x: 456, y: 336, w: 19 },
  rm: { x: 516, y: 328, w: 20 },
  rr: { x: 576, y: 334, w: 19 },
  rp: { x: 636, y: 344, w: 17 },
};

/**
 * The shading model, in one place.
 *
 * A flat fill makes a finger read as a shape rather than a finger. Three
 * layers give it form: a band of tone running across the finger, so it reads
 * as a cylinder rather than a strip; a soft highlight along the lit side; and
 * occlusion where one part sits under another. The light is fixed at the upper
 * left, which is where a desk lamp or a window usually is, and every part of
 * both hands is lit from the same place — inconsistent light is the thing that
 * makes an illustration look wrong even when the drawing is right.
 */
const TONE = {
  hi: '#fdf9f4',
  light: '#f2e9de',
  mid: '#e0d1bf',
  shade: '#c3ac95',
  deep: '#a08b76',
  line: '#7d6c5c',
} as const;

/** Degrees of the axis from knuckle to tip, so the tone band can run across it. */
const axisAngle = (kx: number, ky: number, tx: number, ty: number) =>
  (Math.atan2(ty - ky, tx - kx) * 180) / Math.PI;

/** One finger, reaching from its knuckle up to the key it must press. */
function Finger({
  zone,
  tx,
  ty,
  id,
}: {
  zone: Exclude<FingerZone, 'thumb'>;
  tx: number;
  ty: number;
  id: string;
}) {
  const { x: kx, y: ky, w: wk } = KNUCKLE[zone];
  const wt = wk - 4;
  const bend = (ky - ty) * 0.45;
  // The tone band runs across the finger, so it is rotated a quarter turn off
  // the finger's own axis.
  const across = axisAngle(kx, ky, tx, ty) + 90;

  const body = `M ${kx - wk} ${ky}
      C ${kx - wk - 2} ${ky - bend} ${tx - wt} ${ty + bend} ${tx - wt} ${ty + 14}
      Q ${tx - wt} ${ty - 8} ${tx} ${ty - 8}
      Q ${tx + wt} ${ty - 8} ${tx + wt} ${ty + 14}
      C ${tx + wt} ${ty + bend} ${kx + wk + 2} ${ky - bend} ${kx + wk} ${ky} Z`;

  return (
    <g>
      <defs>
        <linearGradient
          id={id}
          gradientUnits="objectBoundingBox"
          gradientTransform={`rotate(${across} 0.5 0.5)`}
          x1="0"
          y1="0"
          x2="1"
          y2="0"
        >
          <stop offset="0%" stopColor={TONE.shade} />
          <stop offset="16%" stopColor={TONE.mid} />
          <stop offset="42%" stopColor={TONE.hi} />
          <stop offset="70%" stopColor={TONE.light} />
          <stop offset="100%" stopColor={TONE.deep} />
        </linearGradient>
      </defs>

      <path d={body} fill={`url(#${id})`} stroke={TONE.line} strokeWidth={1.5} strokeOpacity={0.75} />

      {/* Specular ridge down the lit side of the cylinder. */}
      <path
        d={`M ${kx - wk * 0.34} ${ky - 8}
            C ${kx - wk * 0.34} ${ky - bend} ${tx - wt * 0.34} ${ty + bend} ${tx - wt * 0.3} ${ty + 20}`}
        fill="none"
        stroke="#ffffff"
        strokeWidth={wt * 0.42}
        strokeLinecap="round"
        opacity={0.32}
        filter="url(#soften)"
      />

      {/* Occlusion where the finger meets the back of the hand. */}
      <path
        d={`M ${kx - wk} ${ky} C ${kx - wk} ${ky - 16} ${kx + wk} ${ky - 16} ${kx + wk} ${ky}`}
        fill="none"
        stroke={TONE.deep}
        strokeWidth={7}
        opacity={0.3}
        filter="url(#soften)"
      />

      {/* Two joint creases, so it reads as three segments. */}
      <path
        d={`M ${tx - wt + 2} ${ty + 34} Q ${tx} ${ty + 27} ${tx + wt - 2} ${ty + 34}`}
        fill="none"
        stroke={TONE.deep}
        strokeWidth={1.6}
        opacity={0.45}
      />
      <path
        d={`M ${kx - wk + 3} ${ky - 46} Q ${(kx + tx) / 2} ${ky - 55} ${kx + wk - 3} ${ky - 46}`}
        fill="none"
        stroke={TONE.deep}
        strokeWidth={1.6}
        opacity={0.35}
      />

      {/* Nail: its own curve, and a highlight of its own. */}
      <ellipse
        cx={tx}
        cy={ty + 13}
        rx={wt * 0.6}
        ry={wt * 0.82}
        fill="url(#nail)"
        stroke={TONE.line}
        strokeWidth={1.1}
        strokeOpacity={0.6}
      />
      <ellipse
        cx={tx - wt * 0.18}
        cy={ty + 9}
        rx={wt * 0.24}
        ry={wt * 0.34}
        fill="#ffffff"
        opacity={0.55}
        filter="url(#soften)"
      />
    </g>
  );
}

/** Back of the hand and thumb. `dir` is +1 for the left hand, -1 for the right. */
function Palm({ cx, dir, id }: { cx: number; dir: 1 | -1; id: string }) {
  const p = (x: number, y: number) => `${cx + dir * x} ${y}`;
  const body = `M ${p(-92, 500)}
      C ${p(-104, 440)} ${p(-108, 386)} ${p(-104, 348)}
      C ${p(-78, 328)} ${p(-48, 324)} ${p(-22, 328)}
      C ${p(16, 324)} ${p(62, 328)} ${p(102, 342)}
      C ${p(112, 388)} ${p(106, 446)} ${p(88, 500)}
      C ${p(40, 516)} ${p(-40, 516)} ${p(-92, 500)} Z`;

  return (
    <g>
      <defs>
        {/* Light from the upper left, falling off across the back of the hand. */}
        <radialGradient id={id} cx={dir === 1 ? '0.34' : '0.66'} cy="0.3" r="0.95">
          <stop offset="0%" stopColor={TONE.hi} />
          <stop offset="38%" stopColor={TONE.light} />
          <stop offset="72%" stopColor={TONE.mid} />
          <stop offset="100%" stopColor={TONE.shade} />
        </radialGradient>
      </defs>

      <path d={body} fill={`url(#${id})`} stroke={TONE.line} strokeWidth={1.7} strokeOpacity={0.75} />

      {/* Knuckles: four soft bumps where the fingers begin. */}
      {[-76, -22, 32, 84].map((dx, i) => (
        <ellipse
          key={`k${i}`}
          cx={cx + dir * dx}
          cy={348 + Math.abs(dx) * 0.05}
          rx={16}
          ry={11}
          fill="#ffffff"
          opacity={0.3}
          filter="url(#soften)"
        />
      ))}

      {/* Tendons running back from the knuckles to the wrist. */}
      {[-76, -22, 32, 84].map((dx, i) => (
        <path
          key={`t${i}`}
          d={`M ${p(dx, 356)} C ${p(dx - dir * 4, 402)} ${p(dx - dir * 8, 442)} ${p(dx - dir * 10, 478)}`}
          fill="none"
          stroke={TONE.deep}
          strokeWidth={3}
          strokeLinecap="round"
          opacity={0.12}
        />
      ))}

      {/* The muscle at the base of the thumb, catching the light. */}
      <ellipse
        cx={cx + dir * 62}
        cy={428}
        rx={40}
        ry={54}
        transform={`rotate(${dir * 18} ${cx + dir * 62} 428)`}
        fill="#ffffff"
        opacity={0.2}
        filter="url(#soften)"
      />
      {/* Occlusion along the outer edge, so the hand has a far side. */}
      <path
        d={`M ${p(-100, 356)} C ${p(-110, 420)} ${p(-100, 470)} ${p(-90, 498)}`}
        fill="none"
        stroke={TONE.deep}
        strokeWidth={12}
        opacity={0.22}
        filter="url(#soften)"
      />

      {/* Thumb, on its own axis, resting over the space bar. */}
      <path
        d={`M ${p(96, 356)}
            C ${p(140, 372)} ${p(168, 400)} ${p(160, 428)}
            Q ${p(150, 452)} ${p(126, 444)}
            C ${p(102, 434)} ${p(78, 414)} ${p(64, 392)} Z`}
        fill={`url(#${id})`}
        stroke={TONE.line}
        strokeWidth={1.6}
        strokeOpacity={0.75}
      />
      <path
        d={`M ${p(104, 372)} C ${p(136, 388)} ${p(152, 406)} ${p(148, 424)}`}
        fill="none"
        stroke="#ffffff"
        strokeWidth={9}
        strokeLinecap="round"
        opacity={0.28}
        filter="url(#soften)"
      />
      <ellipse
        cx={cx + dir * 146}
        cy={430}
        rx={11}
        ry={13}
        transform={`rotate(${dir * 34} ${cx + dir * 146} 430)`}
        fill="url(#nail)"
        stroke={TONE.line}
        strokeWidth={1.1}
        strokeOpacity={0.6}
      />

      {/* Wrist, running off the bottom of the frame. */}
      <path
        d={`M ${p(-90, 502)} C ${p(-60, 542)} ${p(56, 542)} ${p(86, 502)}`}
        fill="none"
        stroke={TONE.line}
        strokeWidth={1.5}
        opacity={0.4}
      />
    </g>
  );
}

/* -------------------------------------------------------------------------- */

/**
 * The board and the hands, for one lesson.
 *
 * `keys` are the keys the lesson teaches. Every finger with one of them
 * reaches for it; the rest stay on their home key.
 */
export function KeyboardHands({ keys = [] }: { keys?: string[] }) {
  const lit = new Map<string, Cap>();
  for (const raw of keys) {
    const cap = capFor(raw);
    if (cap) lit.set(cap.label, cap);
  }

  /** The key each finger is drawn reaching. */
  const target = (zone: Exclude<FingerZone, 'thumb'>): Cap => {
    for (const cap of lit.values()) if (cap.zone === zone) return cap;
    return capFor(HOME_KEY[zone])!;
  };

  /* Only the rows in play: the home row is always drawn because that is where
     the hands rest, and any row the lesson reaches into is drawn with it. */
  const rowsShown = new Set<RowName>(['home']);
  for (const cap of lit.values()) rowsShown.add(cap.row);
  const visible = BOARD.filter((c) => rowsShown.has(c.row));

  const reaching = [...FINGERS_LEFT, ...FINGERS_RIGHT].filter(
    (z) => target(z).row !== 'home',
  );

  const top = Math.min(...visible.map((c) => c.y)) - 26;

  return (
    <figure className="card overflow-hidden">
      <figcaption className="border-b-2 border-vast bg-lumen-dark px-4 py-2.5">
        <span className="eyebrow">
          {reaching.length > 0 ? 'Which finger reaches which key' : 'Where your fingers rest'}
        </span>
      </figcaption>

      <div className="px-4 py-5">
        <svg
          viewBox={`0 ${top} 740 ${560 - top}`}
          className="w-full"
          role="img"
          aria-label={
            reaching.length > 0
              ? `Both hands on the home row. ${reaching
                  .map((z) => `${FINGER_NAMES[z]} reaches ${target(z).label.toUpperCase()}`)
                  .join('; ')}.`
              : 'Both hands resting on the home row, seen from above. Left little finger on A, ring on S, middle on D, index on F; right index on J, middle on K, ring on L, little on the semicolon.'
          }
        >
          <defs>
            {/* One blur, reused for every soft edge — highlights, occlusion and
                the shadow the hands cast on the board. Eight separate filters
                would cost eight passes on a phone. */}
            <filter id="soften" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="5" />
            </filter>
            <filter id="drop" x="-30%" y="-30%" width="160%" height="180%">
              <feDropShadow dx="4" dy="10" stdDeviation="9" floodColor="#3a2f22" floodOpacity="0.3" />
            </filter>
            <linearGradient id="nail" x1="0.2" y1="0" x2="0.8" y2="1">
              <stop offset="0%" stopColor="#fffdfa" />
              <stop offset="60%" stopColor="#f4ece2" />
              <stop offset="100%" stopColor="#dbc9b6" />
            </linearGradient>
            {/* Keycaps get a top-lit bevel so the board reads as moulded
                plastic rather than as flat rectangles. */}
            <linearGradient id="keycap" x1="0" y1="0" x2="0.25" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="55%" stopColor="#f7f5f1" />
              <stop offset="100%" stopColor="#e4e0d8" />
            </linearGradient>
            <linearGradient id="keycapLit" x1="0" y1="0" x2="0.25" y2="1">
              <stop offset="0%" stopColor="#ffe271" />
              <stop offset="55%" stopColor="#ffd11a" />
              <stop offset="100%" stopColor="#e8b800" />
            </linearGradient>
          </defs>

          {/* Keys. */}
          {visible.map((cap) => {
            const isLit = lit.has(cap.label);
            const isAnchor = cap.label === 'f' || cap.label === 'j';
            return (
              <g key={`${cap.row}-${cap.label}`}>
                <rect
                  x={cap.x - KEY / 2}
                  y={cap.y}
                  width={KEY}
                  height={KEY}
                  rx={9}
                  fill={isLit ? 'url(#keycapLit)' : 'url(#keycap)'}
                  stroke="#1a1a1a"
                  strokeWidth={isLit ? 3 : 2.2}
                />
                <text
                  x={cap.x}
                  y={cap.y + 35}
                  textAnchor="middle"
                  fontSize={20}
                  fontWeight={700}
                  fill="#1a1a1a"
                >
                  {cap.label.toUpperCase()}
                </text>
                {isAnchor && (
                  <rect x={cap.x - 11} y={cap.y + 44} width={22} height={4} rx={2} fill="#1a1a1a" />
                )}
              </g>
            );
          })}

          <rect
            x={SPACE.x}
            y={SPACE.y}
            width={SPACE.w}
            height={SPACE.h}
            rx={9}
            fill="url(#keycap)"
            stroke="#1a1a1a"
            strokeWidth={2.2}
          />
          <text x={SPACE.x + SPACE.w / 2} y={SPACE.y + 26} textAnchor="middle" fontSize={13} fill="#1a1a1a" opacity={0.55}>
            space — both thumbs
          </text>

          {/* Both hands under one shadow, so they sit on the board rather than
              float above it. */}
          <g filter="url(#drop)">
            {/* Fingers first, then the palms over their bases. */}
            {FINGERS_LEFT.map((z) => {
              const t = target(z);
              return <Finger key={z} zone={z} id={`f-${z}`} tx={t.x} ty={t.y + 26} />;
            })}
            {FINGERS_RIGHT.map((z) => {
              const t = target(z);
              return <Finger key={z} zone={z} id={`f-${z}`} tx={t.x} ty={t.y + 26} />;
            })}
            <Palm cx={166} dir={1} id="palm-l" />
            <Palm cx={546} dir={-1} id="palm-r" />
          </g>
        </svg>

        <p className="mt-3 text-[15px] leading-relaxed text-vast/70">
          {reaching.length > 0 ? (
            <>
              Reach from the home row and come straight back. <strong>F</strong> and{' '}
              <strong>J</strong> have a raised bump, so you can find your place
              again without looking.
            </>
          ) : (
            <>
              <strong>F</strong> and <strong>J</strong> have a raised bump. Find
              them without looking and the rest land in place.
            </>
          )}
        </p>
      </div>
    </figure>
  );
}

/**
 * The keys this lesson teaches, and the finger for each.
 *
 * Named rather than colour-coded, so nothing has to be looked up in a legend.
 */
export function LessonKeys({ keys }: { keys: string[] }) {
  const seen = new Set<string>();
  const mapped = keys
    .map((k) => ({ key: k.trim(), zone: fingerFor(k) }))
    .filter((k): k is { key: string; zone: FingerZone } => {
      if (!k.zone || !k.key) return false;
      const id = k.key.toLowerCase();
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });

  if (mapped.length === 0) return null;

  const hands = [
    { side: 'Left hand', items: mapped.filter((m) => HAND[m.zone] === 'left') },
    { side: 'Right hand', items: mapped.filter((m) => HAND[m.zone] === 'right') },
  ].filter((h) => h.items.length > 0);

  return (
    <figure className="card overflow-hidden">
      <figcaption className="border-b-2 border-vast bg-lumen-dark px-4 py-2.5">
        <span className="eyebrow">This lesson&rsquo;s keys</span>
      </figcaption>

      <div className="space-y-4 px-4 py-4">
        {hands.map((hand) => (
          <div key={hand.side}>
            <p className="eyebrow">{hand.side}</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {hand.items.map((m) => (
                <li key={m.key} className="flex items-center gap-2 border-2 border-vast bg-accent px-2.5 py-1.5">
                  <span className="tnum text-base font-bold uppercase">{m.key}</span>
                  <span className="text-[13px] text-vast/70">{FINGER_NAMES[m.zone]}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </figure>
  );
}

/** The four things that matter about how you sit. */
const POSTURE_NOTES = [
  { n: '1', text: 'Screen at eye level' },
  { n: '2', text: 'Back straight against the chair' },
  { n: '3', text: 'Elbows bent at a right angle' },
  { n: '4', text: 'Wrists floating, not resting on the desk' },
];

export function PostureSideView() {
  return (
    <figure className="card overflow-hidden">
      <figcaption className="border-b-2 border-vast bg-lumen-dark px-4 py-2.5">
        <span className="eyebrow">How to sit</span>
      </figcaption>

      <div className="px-4 py-5">
        <svg
          viewBox="0 0 470 350"
          className="w-full"
          role="img"
          aria-label="Side view of correct seating: screen at eye level, back straight against the chair, elbows at a right angle, wrists floating above the desk."
        >
          <defs>
            <linearGradient id="body" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#e9e3da" />
              <stop offset="100%" stopColor="#c8bcae" />
            </linearGradient>
            <linearGradient id="skinSide" x1="0" y1="0" x2="0.6" y2="1">
              <stop offset="0%" stopColor="#f3ece4" />
              <stop offset="100%" stopColor="#d8cabc" />
            </linearGradient>
          </defs>

          <line x1={20} y1={318} x2={450} y2={318} stroke="#1a1a1a" strokeWidth={2} opacity={0.25} />

          {/* Chair. */}
          <path d="M 58 214 h 108 a 6 6 0 0 1 0 12 H 58 a 6 6 0 0 1 0 -12 Z" fill="#1a1a1a" />
          <path d="M 56 108 h 14 a 7 7 0 0 1 7 7 v 96 h -28 v -96 a 7 7 0 0 1 7 -7 Z" fill="#1a1a1a" />
          <rect x={104} y={226} width={9} height={72} fill="#1a1a1a" opacity={0.75} />
          <path d="M 76 300 h 66 a 5 5 0 0 1 0 10 H 76 a 5 5 0 0 1 0 -10 Z" fill="#1a1a1a" opacity={0.75} />

          {/* Desk. */}
          <path d="M 176 200 h 250 a 5 5 0 0 1 0 10 H 176 a 5 5 0 0 1 0 -10 Z" fill="#1a1a1a" />
          <rect x={410} y={210} width={9} height={108} fill="#1a1a1a" opacity={0.7} />

          {/* Monitor, its top edge on the eye line. */}
          <rect x={306} y={82} width={116} height={86} rx={7} fill="#ffffff" stroke="#1a1a1a" strokeWidth={3} />
          <rect x={318} y={94} width={92} height={62} rx={3} fill="#1a1a1a" opacity={0.08} />
          <path d="M 356 168 h 16 v 22 h 22 v 10 h -60 v -10 h 22 Z" fill="#1a1a1a" opacity={0.7} />

          {/* Thigh, lower leg, foot. */}
          <path d="M 116 200 C 140 194 168 194 186 200 L 186 216 C 164 222 136 222 116 216 Z" fill="url(#body)" stroke="#1a1a1a" strokeWidth={2} />
          <path d="M 168 214 C 182 214 190 222 190 236 L 192 292 C 192 302 182 306 174 304 C 166 302 162 296 163 288 L 160 234 C 159 222 160 214 168 214 Z" fill="url(#body)" stroke="#1a1a1a" strokeWidth={2} />
          <path d="M 162 302 C 176 300 200 304 210 310 Q 214 318 204 318 L 166 318 C 158 318 156 306 162 302 Z" fill="#1a1a1a" />

          {/* Torso, flat against the chair back. */}
          <path d="M 92 108 C 88 148 88 180 92 202 C 112 210 142 210 154 202 C 152 176 146 140 138 116 C 132 100 104 96 92 108 Z" fill="url(#body)" stroke="#1a1a1a" strokeWidth={2.2} />

          {/* Upper arm down, forearm level — the right angle the lesson is about. */}
          <path d="M 122 122 C 136 124 142 136 141 150 L 140 178 C 139 190 128 194 120 191 C 112 188 110 180 111 172 L 112 136 C 112 126 114 121 122 122 Z" fill="url(#body)" stroke="#1a1a1a" strokeWidth={2} />
          <path d="M 116 176 C 140 170 210 170 244 176 C 252 178 254 186 250 190 C 244 195 148 196 118 192 C 110 190 109 178 116 176 Z" fill="url(#body)" stroke="#1a1a1a" strokeWidth={2} />
          <path d="M 246 176 C 262 174 278 178 284 184 C 288 190 284 195 276 195 L 250 194 C 242 192 240 180 246 176 Z" fill="url(#skinSide)" stroke="#1a1a1a" strokeWidth={2} />

          {/* Neck, head, hair. */}
          <path d="M 104 92 h 22 v 20 h -22 Z" fill="url(#skinSide)" stroke="#1a1a1a" strokeWidth={2} />
          <path d="M 116 42 C 138 42 148 58 147 74 C 146 88 138 98 124 100 C 108 102 96 92 94 76 C 92 56 100 42 116 42 Z" fill="url(#skinSide)" stroke="#1a1a1a" strokeWidth={2.2} />
          <path d="M 116 42 C 140 42 149 58 147 74 C 143 66 136 60 124 58 C 110 56 100 62 95 72 C 92 54 100 42 116 42 Z" fill="#1a1a1a" />

          <path d="M 232 188 h 82 a 4 4 0 0 1 0 12 h -82 a 4 4 0 0 1 0 -12 Z" fill="#ffffff" stroke="#1a1a1a" strokeWidth={2} />

          <line x1={146} y1={72} x2={306} y2={88} stroke="#1a1a1a" strokeWidth={2} strokeDasharray="7 7" opacity={0.4} />
          <path d="M 118 156 L 136 156 L 136 174" fill="none" stroke="#ffd11a" strokeWidth={4} />

          {[
            { n: '1', x: 436, y: 78 },
            { n: '2', x: 68, y: 152 },
            { n: '3', x: 100, y: 168 },
            { n: '4', x: 268, y: 154 },
          ].map((m) => (
            <g key={m.n}>
              <circle cx={m.x} cy={m.y} r={13} fill="#ffd11a" stroke="#1a1a1a" strokeWidth={2.5} />
              <text x={m.x} y={m.y + 5} textAnchor="middle" fontSize={14} fontWeight={700} fill="#1a1a1a">
                {m.n}
              </text>
            </g>
          ))}
        </svg>

        <ol className="mt-3 grid gap-2 sm:grid-cols-2">
          {POSTURE_NOTES.map((note) => (
            <li key={note.n} className="flex items-start gap-2.5 text-[15px] leading-snug">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-vast bg-accent text-[13px] font-bold">
                {note.n}
              </span>
              {note.text}
            </li>
          ))}
        </ol>
      </div>
    </figure>
  );
}
