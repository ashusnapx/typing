import { FINGER_COLORS } from './keyboard-layout';

/**
 * Where the hands go, drawn rather than described.
 *
 * The posture lesson said "sit straight, elbows at 90 degrees, wrists off the
 * table" and showed nothing. Someone who has never used a keyboard properly
 * cannot act on that sentence — it is the one lesson in the course where the
 * words are least use and a picture is nearly the whole thing.
 *
 * Both drawings avoid colour as a code: fingers read light on the left hand
 * and dark on the right, and the label on each key names the finger, so
 * nothing has to be looked up in a legend.
 */

const KEYS = [
  { label: 'A', x: 68, finger: 'lp' as const, name: 'little' },
  { label: 'S', x: 132, finger: 'lr' as const, name: 'ring' },
  { label: 'D', x: 196, finger: 'lm' as const, name: 'middle' },
  { label: 'F', x: 260, finger: 'li' as const, name: 'index', anchor: true },
  { label: 'G', x: 324, finger: 'li' as const, name: 'index' },
  { label: 'H', x: 388, finger: 'ri' as const, name: 'index' },
  { label: 'J', x: 452, finger: 'ri' as const, name: 'index', anchor: true },
  { label: 'K', x: 516, finger: 'rm' as const, name: 'middle' },
  { label: 'L', x: 580, finger: 'rr' as const, name: 'ring' },
  { label: ';', x: 644, finger: 'rp' as const, name: 'little' },
];

/** Palm centre, and the key each finger rests on. */
const HANDS = [
  {
    side: 'Left hand',
    palmX: 164,
    fingers: [
      { zone: 'lp' as const, keyX: 68 },
      { zone: 'lr' as const, keyX: 132 },
      { zone: 'lm' as const, keyX: 196 },
      { zone: 'li' as const, keyX: 260 },
    ],
    thumbX: 300,
  },
  {
    side: 'Right hand',
    palmX: 548,
    fingers: [
      { zone: 'ri' as const, keyX: 452 },
      { zone: 'rm' as const, keyX: 516 },
      { zone: 'rr' as const, keyX: 580 },
      { zone: 'rp' as const, keyX: 644 },
    ],
    thumbX: 412,
  },
];

export function HomeRowHands() {
  return (
    <figure className="card overflow-hidden">
      <figcaption className="border-b-2 border-vast bg-lumen-dark px-4 py-2.5">
        <span className="eyebrow">Where your fingers rest</span>
      </figcaption>

      <div className="px-4 py-5">
        <svg
          viewBox="0 0 712 350"
          className="w-full"
          role="img"
          aria-label="Both hands resting on the home row. Left little finger on A, ring on S, middle on D, index on F. Right index on J, middle on K, ring on L, little on semicolon. Both thumbs rest on the space bar."
        >
          {HANDS.map((hand) => (
            <g key={hand.side}>
              {/* Fingers, drawn as capsules from the palm down to the key. */}
              {hand.fingers.map((f) => (
                <line
                  key={f.zone}
                  x1={hand.palmX + (f.keyX - hand.palmX) * 0.28}
                  y1={104}
                  x2={f.keyX}
                  y2={212}
                  stroke={FINGER_COLORS[f.zone]}
                  strokeWidth={30}
                  strokeLinecap="round"
                />
              ))}

              {/* Thumb, angled in towards the space bar. */}
              <line
                x1={hand.palmX + (hand.thumbX - hand.palmX) * 0.4}
                y1={96}
                x2={hand.thumbX}
                y2={286}
                stroke={FINGER_COLORS.rm}
                strokeWidth={30}
                strokeLinecap="round"
                opacity={0.45}
              />

              {/* Palm. */}
              <rect
                x={hand.palmX - 78}
                y={30}
                width={156}
                height={78}
                rx={30}
                fill="#f0f0ec"
                stroke="#1a1a1a"
                strokeWidth={2.5}
              />
              <text
                x={hand.palmX}
                y={75}
                textAnchor="middle"
                fontSize={19}
                fontWeight={600}
                fill="#1a1a1a"
              >
                {hand.side}
              </text>
            </g>
          ))}

          {/* The home row. */}
          {KEYS.map((k) => (
            <g key={k.label}>
              <rect
                x={k.x - 28}
                y={212}
                width={56}
                height={56}
                rx={8}
                fill={k.anchor ? '#ffd11a' : '#ffffff'}
                stroke="#1a1a1a"
                strokeWidth={2.5}
              />
              <text
                x={k.x}
                y={248}
                textAnchor="middle"
                fontSize={22}
                fontWeight={700}
                fill="#1a1a1a"
              >
                {k.label}
              </text>
              {/* The raised bump you find without looking. */}
              {k.anchor && (
                <rect x={k.x - 11} y={256} width={22} height={4} rx={2} fill="#1a1a1a" />
              )}
              <text
                x={k.x}
                y={288}
                textAnchor="middle"
                fontSize={13}
                fill="#1a1a1a"
                opacity={0.6}
              >
                {k.name}
              </text>
            </g>
          ))}

          {/* Space bar, for both thumbs. */}
          <rect
            x={220}
            y={300}
            width={272}
            height={38}
            rx={8}
            fill="#ffffff"
            stroke="#1a1a1a"
            strokeWidth={2.5}
          />
          <text x={356} y={325} textAnchor="middle" fontSize={14} fill="#1a1a1a" opacity={0.6}>
            space — both thumbs
          </text>
        </svg>

        <p className="mt-3 text-[15px] leading-relaxed text-vast/70">
          <strong>F</strong> and <strong>J</strong> have a raised bump. Find them
          without looking, and your other fingers land in the right place.
        </p>
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

      <div className="grid gap-4 px-4 py-5 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] sm:items-center">
        <svg
          viewBox="0 0 420 300"
          className="w-full"
          role="img"
          aria-label="Side view of correct seating: screen at eye level, back straight against the chair, elbows at a right angle, wrists floating above the desk."
        >
          {/* Desk. */}
          <rect x={150} y={186} width={250} height={9} rx={3} fill="#1a1a1a" />
          <rect x={370} y={195} width={8} height={90} fill="#1a1a1a" opacity={0.35} />

          {/* Screen, at eye level. */}
          <rect x={286} y={86} width={104} height={78} rx={6} fill="#ffffff" stroke="#1a1a1a" strokeWidth={3} />
          <rect x={330} y={164} width={16} height={22} fill="#1a1a1a" opacity={0.35} />

          {/* Chair. */}
          <rect x={54} y={188} width={92} height={9} rx={3} fill="#1a1a1a" />
          <rect x={54} y={96} width={9} height={94} rx={3} fill="#1a1a1a" />
          <rect x={92} y={197} width={8} height={88} fill="#1a1a1a" opacity={0.35} />

          {/* Head. */}
          <circle cx={104} cy={74} r={25} fill="#f0f0ec" stroke="#1a1a1a" strokeWidth={3} />
          {/* Torso, straight and against the chair back. */}
          <line x1={104} y1={99} x2={104} y2={186} stroke="#1a1a1a" strokeWidth={16} strokeLinecap="round" />
          {/* Upper arm down, forearm level: a right angle at the elbow. */}
          <line x1={112} y1={120} x2={112} y2={166} stroke="#8a8a84" strokeWidth={13} strokeLinecap="round" />
          <line x1={112} y1={166} x2={222} y2={166} stroke="#8a8a84" strokeWidth={13} strokeLinecap="round" />
          {/* Thigh and shin. */}
          <line x1={104} y1={186} x2={168} y2={186} stroke="#1a1a1a" strokeWidth={14} strokeLinecap="round" />
          <line x1={168} y1={186} x2={168} y2={272} stroke="#1a1a1a" strokeWidth={14} strokeLinecap="round" />
          <line x1={168} y1={272} x2={196} y2={272} stroke="#1a1a1a" strokeWidth={12} strokeLinecap="round" />

          {/* Keyboard, with the wrist above it rather than on the desk. */}
          <rect x={214} y={176} width={78} height={12} rx={3} fill="#ffffff" stroke="#1a1a1a" strokeWidth={2.5} />

          {/* Eye line to the top of the screen. */}
          <line x1={129} y1={74} x2={286} y2={100} stroke="#1a1a1a" strokeWidth={2} strokeDasharray="6 6" opacity={0.45} />

          {/* The right angle at the elbow, marked. */}
          <path d="M112 148 L130 148 L130 166" fill="none" stroke="#ffd11a" strokeWidth={4} />

          {[
            { n: '1', x: 396, y: 82 },
            { n: '2', x: 78, y: 132 },
            { n: '3', x: 96, y: 176 },
            { n: '4', x: 246, y: 152 },
          ].map((m) => (
            <g key={m.n}>
              <circle cx={m.x} cy={m.y} r={13} fill="#ffd11a" stroke="#1a1a1a" strokeWidth={2.5} />
              <text x={m.x} y={m.y + 5} textAnchor="middle" fontSize={14} fontWeight={700} fill="#1a1a1a">
                {m.n}
              </text>
            </g>
          ))}
        </svg>

        <ol className="space-y-2.5">
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
