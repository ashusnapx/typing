import {
  ACTIVE_KEY_COLOR,
  fingerMap,
  FINGER_COLORS,
  FINGER_NAMES,
  HAND,
  type FingerZone,
} from './keyboard-layout';

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

/** What a key that is not wanted right now looks like. */
const QUIET_KEY = '#eceae4';

/**
 * Rounded before it reaches an attribute.
 *
 * `Math.atan2`, `Math.hypot` and friends are *implementation-approximated* in
 * the ECMAScript spec — engines are not required to round them correctly, only
 * closely. Node and Chrome are both V8 and still disagreed in the last unit of
 * the last place, which put `rotate(-27.613027823084465 …)` in the server's
 * HTML and `rotate(-27.613027823084494 …)` in the client's, and React threw a
 * hydration mismatch over a difference of 3e-14 degrees.
 *
 * Two decimals is far below anything a hand can show at this size, and it is
 * the same number on every engine. It also cuts a few kilobytes of seventeen-
 * digit floats out of the markup.
 */
const r = (n: number) => Math.round(n * 100) / 100;

/** A point, formatted for a path. */
const pt = (p: { x: number; y: number }) => `${r(p.x)} ${r(p.y)}`;

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
 * The palette, flat.
 *
 * The hands were modelled: a five-stop gradient across every finger, a
 * specular ridge down each one, two joint creases, and a nail with its own
 * highlight on every fingertip. All of it aimed at realism and landed in the
 * uncanny valley — pale waxy fingers with visible nails, reading as something
 * prosthetic rather than as a hand.
 *
 * Nothing else on this site is rendered. Keycaps are flat fills inside a
 * two-pixel black outline, and the hands are now drawn the same way: one warm
 * tone, one shade where a part sits under another, and the same ink line as
 * the rest of the page. A drawing that is plainly a drawing cannot fall into
 * the valley.
 */
const TONE = {
  skin: '#f6d9bd',
  shade: '#e3b492',
  nail: '#fceadb',
  line: '#1a1a1a',
} as const;

/**
 * Where the joints fall along a finger, measured knuckle to tip.
 *
 * A finger is three bones. The crease at 0.44 is where the proximal phalanx
 * meets the middle one, the crease at 0.74 is the joint below the nail, and
 * the nail sits on the back of the distal phalanx. Real proportions, because
 * evenly spaced creases are the thing that reads as a drawn-on decoration
 * rather than a hand.
 */
const JOINTS = { pip: 0.44, dip: 0.74, nail: 0.9 } as const;

/** One finger, reaching from its knuckle up to the key it must press. */
function Finger({
  zone,
  tx,
  ty,
  tint,
  blink = false,
}: {
  zone: Exclude<FingerZone, 'thumb'>;
  tx: number;
  ty: number;
  /** Filled in this finger's own colour when it is the one being used. */
  tint?: string;
  /** Pulse the nail, in step with the key on the board. */
  blink?: boolean;
}) {
  const { x: kx, y: ky, w: wk } = KNUCKLE[zone];
  const wt = wk - 3;

  /* The finger is built along its own axis.
   *
   * It used to be drawn from fixed control points — the edges bowed straight
   * down the page and the joint creases ran flat across it, whatever direction
   * the finger was actually pointing. That is fine for a finger resting
   * straight ahead and wrong for every other one: a reach across to G or H came
   * out as a lopsided S with a bulge on the outside edge, and the creases sat
   * at an angle no knuckle bends at.
   *
   * Everything below is placed in terms of `u`, the direction from knuckle to
   * tip, and `n`, the perpendicular. The shape then holds for any reach: it
   * tapers evenly, the tip cap stays round, and the creases always cross the
   * finger square.
   */
  const tipX = tx;
  const tipY = ty + 16;
  const dx = tipX - kx;
  const dy = tipY - ky;
  const len = Math.max(1, Math.hypot(dx, dy));
  const ux = dx / len;
  const uy = dy / len;
  const nx = -uy;
  const ny = ux;

  /** A point on the centre line, and the half-width there. */
  const along = (t: number) => ({
    x: kx + dx * t,
    y: ky + dy * t,
    w: wk + (wt - wk) * t,
  });

  /** A point offset from the centre line, across the finger. */
  const across = (t: number, side: 1 | -1, scale = 1) => {
    const a = along(t);
    return { x: a.x + nx * a.w * side * scale, y: a.y + ny * a.w * side * scale };
  };

  const k1 = across(0, 1);
  const k2 = across(0, -1);
  const t1 = across(1, 1);
  const t2 = across(1, -1);

  /* A real finger is not a straight tube — it swells a little through the
     middle joint. One control point per edge, nudged outward. */
  const bow = 1.12;
  const c1 = across(0.5, 1, bow);
  const c2 = across(0.5, -1, bow);

  /* The tip cap, as a cubic that bulges past the tip along the axis. Two
     control points at four-thirds of the radius approximate a semicircle
     closely enough, and unlike an arc they need no sweep flag to be worked
     out per direction. */
  const cap = wt * 1.33;
  const cap1 = { x: t1.x + ux * cap, y: t1.y + uy * cap };
  const cap2 = { x: t2.x + ux * cap, y: t2.y + uy * cap };

  const body = `M ${pt(k1)}
      Q ${pt(c1)} ${pt(t1)}
      C ${pt(cap1)} ${pt(cap2)} ${pt(t2)}
      Q ${pt(c2)} ${pt(k2)} Z`;

  /** Degrees the finger points in, for rotating the nail with it. */
  const angle = r((Math.atan2(dy, dx) * 180) / Math.PI + 90);

  return (
    <g>
      <path
        d={body}
        fill={tint ?? TONE.skin}
        stroke={TONE.line}
        strokeWidth={tint ? 3 : 2}
        strokeLinejoin="round"
      />

      {/* One shade down the shaded edge, following the same axis as the body. */}
      <path
        d={`M ${pt(across(0.88, -1, 0.72))}
            Q ${pt(across(0.5, -1, 0.78))} ${pt(across(0.08, -1, 0.72))}`}
        fill="none"
        stroke={TONE.shade}
        strokeWidth={3.4}
        strokeLinecap="round"
      />

      {/* The anatomy, as line work.
          These were here once as modelled features — creases with soft shadow,
          a nail with its own gradient and highlight — and that version read as
          something prosthetic. Drawn flat, at real proportions, in the same ink
          as the outline, the same features read as an anatomical diagram. What
          made it creepy was the rendering, not the anatomy. */}
      {[JOINTS.pip, JOINTS.dip].map((t) => {
        const a = across(t, 1, 0.76);
        const b = across(t, -1, 0.76);
        const mid = along(t);
        /* Bowed slightly toward the tip, the way a crease sits on a bent
           joint. */
        return (
          <path
            key={t}
            d={`M ${pt(a)} Q ${pt({ x: mid.x + ux * 4, y: mid.y + uy * 4 })} ${pt(b)}`}
            fill="none"
            stroke={TONE.line}
            strokeWidth={1.3}
            strokeOpacity={0.38}
            strokeLinecap="round"
          />
        );
      })}

      {/* The knuckle, where the finger leaves the hand. */}
      {(() => {
        const a = across(0.04, 1, 0.8);
        const b = across(0.04, -1, 0.8);
        const m = along(0.04);
        return (
          <path
            d={`M ${pt(a)} Q ${pt({ x: m.x - ux * 8, y: m.y - uy * 8 })} ${pt(b)}`}
            fill="none"
            stroke={TONE.line}
            strokeWidth={1.4}
            strokeOpacity={0.3}
            strokeLinecap="round"
          />
        );
      })()}

      {/* The nail, lying on the back of the last phalanx and turning with it. */}
      {(() => {
        const nl = along(JOINTS.nail);
        return (
          <ellipse
            className={blink ? 'tm-blink' : undefined}
            cx={r(nl.x)}
            cy={r(nl.y)}
            rx={r(nl.w * 0.62)}
            ry={r(nl.w * 0.9)}
            transform={`rotate(${angle} ${r(nl.x)} ${r(nl.y)})`}
            fill={blink ? ACTIVE_KEY_COLOR : TONE.nail}
            stroke={TONE.line}
            strokeWidth={blink ? 1.8 : 1.2}
            strokeOpacity={blink ? 0.9 : 0.45}
          />
        );
      })()}
    </g>
  );
}

/** Back of the hand and thumb. `dir` is +1 for the left hand, -1 for the right. */
function Palm({ cx, dir }: { cx: number; dir: 1 | -1 }) {
  const p = (x: number, y: number) => `${cx + dir * x} ${y}`;

  /* Widest at the knuckles, narrowing to the wrist.
     The first flat version ran the same width top to bottom and closed square
     across the base, which is a mitten. A hand is a wedge: the knuckle line is
     the broadest part of it and everything below tapers toward the wrist. */
  const body = `M ${p(-100, 344)}
      C ${p(-112, 398)} ${p(-106, 458)} ${p(-86, 508)}
      C ${p(-58, 528)} ${p(22, 528)} ${p(56, 506)}
      C ${p(80, 466)} ${p(96, 408)} ${p(98, 348)}
      C ${p(54, 328)} ${p(-52, 328)} ${p(-100, 344)} Z`;

  /* Angled up and inward toward the space bar, which is where a thumb actually
     sits. Drawn before the palm so the palm covers its base — a thumb coming
     out from under the hand is attached to it; the earlier one was a closed
     blob laid on top, and read as a separate object. */
  const thumb = `M ${p(64, 452)}
      C ${p(80, 416)} ${p(104, 380)} ${p(124, 354)}
      C ${p(136, 340)} ${p(156, 352)} ${p(148, 370)}
      C ${p(132, 400)} ${p(110, 434)} ${p(96, 466)} Z`;

  return (
    <g>
      <path
        d={thumb}
        fill={TONE.skin}
        stroke={TONE.line}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <path
        d={body}
        fill={TONE.skin}
        stroke={TONE.line}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      {/* The web of the thumb, and the line the knuckles sit on. Two strokes is
          all the interior a flat hand needs. */}
      <path
        d={`M ${p(92, 386)} C ${p(84, 412)} ${p(78, 438)} ${p(76, 464)}`}
        fill="none"
        stroke={TONE.shade}
        strokeWidth={3}
        strokeLinecap="round"
      />
      <path
        d={`M ${p(-86, 366)} C ${p(-34, 352)} ${p(40, 356)} ${p(90, 372)}`}
        fill="none"
        stroke={TONE.shade}
        strokeWidth={3}
        strokeLinecap="round"
      />

      {/* The four knuckles of the hand itself, sitting on that line.
          They rise toward the middle finger and fall away to the little one,
          which is the arch that makes a back of a hand look like one. */}
      {[
        { x: -66, y: 366 },
        { x: -20, y: 358 },
        { x: 26, y: 360 },
        { x: 70, y: 370 },
      ].map((k) => (
        <path
          key={k.x}
          d={`M ${p(k.x - 15, k.y + 5)} Q ${p(k.x, k.y - 7)} ${p(k.x + 15, k.y + 5)}`}
          fill="none"
          stroke={TONE.line}
          strokeWidth={1.4}
          strokeOpacity={0.3}
          strokeLinecap="round"
        />
      ))}

      {/* The thumb has one joint and a nail of its own. */}
      <path
        d={`M ${p(96, 392)} Q ${p(108, 398)} ${p(116, 408)}`}
        fill="none"
        stroke={TONE.line}
        strokeWidth={1.3}
        strokeOpacity={0.35}
        strokeLinecap="round"
      />
      {/* Sat on the thumb's tip, mirrored by `dir` alone.
          Hand-picking an offset per side put the right hand's nail out beyond
          the edge of the hand, floating in space — the thumb tip is already
          mirrored, so deriving from it is both shorter and correct on both
          sides. */}
      <ellipse
        cx={cx + dir * 130}
        cy={360}
        rx={9}
        ry={12}
        transform={`rotate(${dir * 40} ${cx + dir * 130} 360)`}
        fill={TONE.nail}
        stroke={TONE.line}
        strokeWidth={1.2}
        strokeOpacity={0.45}
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
export function KeyboardHands({
  keys = [],
  activeKey = null,
  compact = false,
  singleHand,
  show = 'both',
}: {
  keys?: string[];
  /**
   * The key wanted right now, while a drill is running.
   *
   * With this set the picture stops being a diagram of the lesson and becomes
   * the hand at this instant: one finger leaves home, reaches the key, and
   * wears its own colour so it is obvious which one is doing the work. A
   * learner watching this a few hundred times stops needing to be told.
   */
  activeKey?: string | null;
  /** Drops the frame and the caption, for use inside a running drill. */
  compact?: boolean;
  /**
   * Which half to draw.
   *
   * Side by side, the board and the hands each get the whole width instead of
   * sharing one cramped picture, and the blinking key and the blinking nail
   * are far enough apart to be read as two separate answers to the same
   * question — which key, and which finger.
   */
  show?: 'both' | 'board' | 'hands';
  /**
   * Draw one hand only, for a drill that asks the other to rest in the lap.
   * The picture has to agree with the instruction, or the instruction loses.
   */
  singleHand?: 'left' | 'right';
}) {
  /* Live, only the key under the cursor counts — showing every key the lesson
     teaches would light half the board and reach with half the fingers, which
     is not what a hand does at any single moment. */
  const source = activeKey ? [activeKey] : keys;

  const lit = new Map<string, Cap>();
  for (const raw of source) {
    const cap = capFor(raw);
    if (cap) lit.set(cap.label, cap);
  }

  /** The key each finger is drawn reaching. */
  const target = (zone: Exclude<FingerZone, 'thumb'>): Cap => {
    for (const cap of lit.values()) if (cap.zone === zone) return cap;
    return capFor(HOME_KEY[zone])!;
  };

  /* The whole board, every time.
     It used to draw only the rows in play, so the keyboard changed shape from
     one lesson to the next and a learner never saw the thing they are actually
     sitting at. The full board is the constant; what changes is which keys are
     lit on it. */
  const visible = BOARD;

  const shownFingers =
    singleHand === 'left'
      ? FINGERS_LEFT
      : singleHand === 'right'
        ? FINGERS_RIGHT
        : [...FINGERS_LEFT, ...FINGERS_RIGHT];

  const reaching = shownFingers.filter((z) => target(z).row !== 'home');

  const top = Math.min(...visible.map((c) => c.y)) - 26;

  /* Each half is cropped to what it actually draws, so neither is padded out
     with the other one's empty space.

     The hands crop follows the fingers rather than sitting at a fixed line: a
     fixed one has to be low enough for a hand at rest, which then slices the
     tips off the moment a finger reaches up a row. */
  const handTop = Math.min(...shownFingers.map((z) => target(z).y + 26)) - 46;
  const viewBox =
    show === 'hands'
      ? `20 ${handTop} 700 ${580 - handTop}`
      : show === 'board'
        ? `0 ${top} 740 ${360 - top}`
        : `0 ${top} 740 ${472 - top}`;

  const Frame = compact ? 'div' : 'figure';
  /* Compact fills whatever box it is given; the viewBox letterboxes inside it. */

  return (
    <Frame className={compact ? 'h-full w-full' : 'card overflow-hidden'}>
      {!compact && (
        <figcaption className="border-b-2 border-vast bg-lumen-dark px-4 py-2.5">
          <span className="eyebrow">
            {reaching.length > 0 ? 'Which finger reaches which key' : 'Where your fingers rest'}
          </span>
        </figcaption>
      )}

      <div className={compact ? 'flex h-full w-full items-center justify-center' : 'px-4 py-5'}>
        <svg
          viewBox={viewBox}
          className={compact ? 'h-full w-full' : 'w-full'}
          /* Top-aligned inside the panel. Letterboxed drawings centre by
             default, which left a band of nothing under the coach while both
             pictures floated in the middle of their cells. */
          preserveAspectRatio={compact ? 'xMidYMin meet' : undefined}
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
            {/* Transparent, so one bevel serves every finger colour instead of
                a gradient per hue. */}
            <linearGradient id="gloss" x1="0" y1="0" x2="0.25" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
              <stop offset="55%" stopColor="#ffffff" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.12" />
            </linearGradient>
          </defs>

          {/* Keys. */}
          {show !== 'hands' && visible.map((cap) => {
            const isLit = lit.has(cap.label);
            const isAnchor = cap.label === 'f' || cap.label === 'j';
            return (
              <g key={`${cap.row}-${cap.label}`}>
                {/* A key is painted by the finger that owns it. The board
                    then teaches the assignment on its own, and the lesson's
                    own keys still come through yellow on top of it. */}
                {/* Grey unless it is wanted.
                    Every key carried its finger's colour before, which put
                    forty coloured tiles on screen and left the one key that
                    mattered to compete with all of them. Silent keys step
                    back; the wanted key takes its finger's colour, the same
                    colour the coach's chip and the reaching finger are
                    wearing, so the three read as one instruction. */}
                <rect
                  /* Keyed on the character so the key and the nail mount in
                     the same frame and blink in step. */
                  key={`cap-${activeKey ?? ''}`}
                  className={isLit && activeKey ? 'tm-blink' : undefined}
                  x={cap.x - KEY / 2}
                  y={cap.y}
                  width={KEY}
                  height={KEY}
                  rx={9}
                  data-lit={isLit ? 'true' : undefined}
                  fill={isLit ? FINGER_COLORS[cap.zone] : QUIET_KEY}
                  stroke="#1a1a1a"
                  strokeWidth={isLit ? 3.4 : 1.6}
                  strokeOpacity={isLit ? 1 : 0.35}
                />
                {/* The bevel rides over the colour instead of replacing it.
                    Lit keys skip it — their gradient is already bevelled. */}
                {!isLit && (
                  <rect
                    x={cap.x - KEY / 2}
                    y={cap.y}
                    width={KEY}
                    height={KEY}
                    rx={9}
                    fill="url(#gloss)"
                    pointerEvents="none"
                  />
                )}
                <text
                  x={cap.x}
                  y={cap.y + 35}
                  textAnchor="middle"
                  fontSize={20}
                  fontWeight={isLit ? 700 : 500}
                  fill="#1a1a1a"
                  fillOpacity={isLit ? 1 : 0.42}
                >
                  {cap.label.toUpperCase()}
                </text>
                {/* The bumps on F and J stay findable even when the key is
                    quiet — they are how a learner locates the row at all. */}
                {isAnchor && (
                  <rect
                    x={cap.x - 11}
                    y={cap.y + 44}
                    width={22}
                    height={4}
                    rx={2}
                    fill="#1a1a1a"
                    fillOpacity={isLit ? 1 : 0.5}
                  />
                )}
              </g>
            );
          })}

          {show !== 'hands' && (
          <rect
            x={SPACE.x}
            y={SPACE.y}
            width={SPACE.w}
            height={SPACE.h}
            rx={9}
            fill={lit.has(' ') ? FINGER_COLORS.thumb : QUIET_KEY}
            stroke="#1a1a1a"
            strokeWidth={lit.has(' ') ? 3.4 : 1.6}
            strokeOpacity={lit.has(' ') ? 1 : 0.35}
          />
          )}
          {show !== 'hands' && (
          <text x={SPACE.x + SPACE.w / 2} y={SPACE.y + 26} textAnchor="middle" fontSize={13} fill="#1a1a1a" opacity={0.55}>
            space — both thumbs
          </text>
          )}

          {/* Both hands under one shadow, so they sit on the board rather than
              float above it. */}
          {/* The colour coding is the lesson, so the hands are translucent
              enough to read it through them. Opaque, they covered eight of the
              ten keys they were drawn to explain. */}
          {show !== 'board' && (
          <g filter="url(#drop)" opacity={show === 'hands' ? 1 : 0.74}>
            {/* Fingers first, then the palms over their bases. */}
            {shownFingers.map((z) => {
              const t = target(z);
              /* Only tint while a drill is running. On the lesson's own
                 diagram several fingers are shown reaching at once, and
                 colouring them all would say they move together. */
              const working = activeKey != null && lit.has(t.label);
              return (
                <Finger
                  key={`${z}-${activeKey ?? ''}`}
                  zone={z}
                  tx={t.x}
                  ty={t.y + 26}
                  tint={working ? FINGER_COLORS[z] : undefined}
                  blink={working}
                />
              );
            })}
            {singleHand !== 'right' && <Palm cx={166} dir={1} />}
            {singleHand !== 'left' && <Palm cx={546} dir={-1} />}
          </g>
          )}
        </svg>

        <p className={`mt-3 text-[15px] leading-relaxed text-vast/70 ${compact ? 'hidden' : ''}`}>
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
    </Frame>
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
