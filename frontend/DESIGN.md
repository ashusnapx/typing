# Design system — Typing Mania

Visual language modelled on wisprflow.ai. Read this before touching any UI file.

## Two registers

**Expressive** — marketing, learn, results, auth, listings.
Cream ground, big serif headlines, coloured slabs, sticker buttons, motion.

**Sober (`exam-*`)** — the live exam screen only.
A candidate ten minutes into a timed skill test must not face lilac stickers and
96px serif. Neutral grey/white, navy chrome, sans headings, high contrast.
Never mix the two on one screen.

## Tokens

All colours are CSS variables holding bare `R G B` triples, exposed through
Tailwind. Never hardcode a hex in a component.

| Token | Hex | Role |
|---|---|---|
| `lumen` | `#ffffeb` | cream ground (page background) |
| `lumen-dark` | `#e4e4d0` | segment track, muted fills |
| `vast` | `#1a1a1a` | ink — all text, all borders |
| `fathom` | `#034f46` | deep green slab |
| `dawn` | `#f0d7ff` | lilac — primary button, highlights |
| `glow` | `#ffa946` | amber accent |
| `flare` | `#ff6c4c` | coral — caret, alerts |
| `signal` | `#ffbcf2` | pink — button hover |
| `ok` / `ok-bg` | `#114e0b` / `#cef5ca` | pass |
| `warn` / `warn-bg` | `#5e5515` / `#fcf8d8` | caution |
| `err` / `err-bg` | `#7f1c34` / `#f8e4e4` | fail |

Exam register: `exam-bg`, `exam-surface`, `exam-line`, `exam-text`,
`exam-muted`, `exam-chrome` (navy), `exam-ok`, `exam-err`.

## Type

- **Display** — EB Garamond, weight 400, `letter-spacing: -0.03em`,
  `line-height: 0.95`. Applied automatically to `h1`–`h4`. Never bold it.
- **Body** — Figtree, 400/500/600/700.
- **Mono** — JetBrains Mono, for figures and keycaps only.
- **Devanagari** — Noto Sans Devanagari via `.font-hindi` / `:lang(hi)`.

Italic serif inside a headline is the system's main gesture — use `<em>` for
the emphasised half of a headline, never for whole headlines.

Sizes: `text-4xl` … `text-8xl` are the serif display ramp. `text-base` (1rem)
is body. `text-lg`/`text-xl` for leads.

Any figure that is compared or updates live gets `className="tnum"`.

## Components (in `globals.css`)

- `.slab` + `.slab-cream` / `-ink` / `-green` / `-lilac` / `-white` —
  full-bleed section with 5rem rounded **top** corners. Stack them; each
  appears to slide over the previous. Add `.on-dark` on ink/green slabs so
  borders and eyebrows flip to cream.
- `.btn` + `.btn-primary` (lilac) / `.btn-ink` / `.btn-outline` / `.btn-cream`
  / `.btn-ghost`, sized `.btn-sm` / `.btn-md` / `.btn-lg`.
  All have a hard **2px ink border** and 8px radius. No shadows.
- `.card` — white, 2px ink border, 1rem radius. `.card-flat` — cream, hairline.
- `.field` — 3rem tall, 2px ink border, lilac focus ring.
- `.segment` / `.segment-item` — pill toggle, `data-active="true"` on the
  selected one.
- `.chip` — small pill, 1.5px border. Variants `-lilac` `-glow` `-flare`
  `-ok` `-err`.
- `.eyebrow` — uppercase 13px label with wide tracking.
- `.kbd`, `.skeleton`, `.marquee` / `.marquee-track`.
- Exam register: `.exam-root`, `.exam-surface`, `.exam-chrome`, `.exam-btn`,
  `.exam-btn-secondary`.

## Motion

- Hover lift on buttons: `translateY(-2px)`, spring easing.
- Scroll reveal: put `data-reveal` on a section. It starts **visible**; the
  `Reveal` component only hides it once it has confirmed it can un-hide it.
  **Never** write `opacity: 0` into a component's own styles — that shipped a
  blank homepage once already.
- `ease-spring` = `cubic-bezier(0.34, 1.56, 0.64, 1)`.
- Everything respects `prefers-reduced-motion`.

## Rules

1. No shadows for elevation. Separation comes from borders and colour.
2. Borders are 2px and ink-coloured on light grounds, cream on dark slabs.
3. Don't use `text-content-*`, `bg-surface-*`, `border-line-*` in new code —
   those are legacy aliases kept only so un-migrated screens aren't unstyled.
   Use `text-vast/60`, `bg-lumen`, `border-vast` etc.
4. Headings are already serif; don't add `font-display` to an `h1`–`h4`.
5. Copy is sentence case, direct, second person. No exclamation marks.
