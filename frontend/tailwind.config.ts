import type { Config } from "tailwindcss";

/** Tokens are stored as bare "R G B" triples so Tailwind's opacity modifiers
 *  (`bg-fathom/20`) keep working through CSS variables. */
const t = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ---- Base palette --------------------------------------------------
        lumen: { DEFAULT: t("lumen"), dark: t("lumen-dark") },
        vast: t("vast"),
        fathom: t("fathom"),
        dawn: t("dawn"),
        glow: t("glow"),
        flare: t("flare"),
        signal: t("signal"),
        pulse: t("pulse"),

        // ---- Semantic ------------------------------------------------------
        bg: t("bg"),
        ink: t("text"),
        cream: t("lumen"),
        ok: { DEFAULT: t("ok"), bg: t("ok-bg") },
        warn: { DEFAULT: t("warn"), bg: t("warn-bg") },
        err: { DEFAULT: t("err"), bg: t("err-bg") },

        // ---- Exam register -------------------------------------------------
        exam: {
          bg: t("exam-bg"),
          surface: t("exam-surface"),
          line: t("exam-line"),
          text: t("exam-text"),
          muted: t("exam-muted"),
          chrome: t("exam-chrome"),
          navy: t("exam-navy"),
          hot: t("exam-hot"),
          amber: t("exam-amber"),
          "timer-bg": t("exam-timer-bg"),
          watermark: t("exam-watermark"),
          panel: t("exam-panel"),
          "panel-edge": t("exam-panel-edge"),
          ok: t("exam-ok"),
          err: t("exam-err"),
        },

        // ---- Legacy aliases ------------------------------------------------
        // Un-migrated screens still reference these; pointing them at the new
        // tokens keeps nothing unstyled mid-migration.
        paper: t("bg"),
        pencil: t("text"),
        muted: t("lumen-dark"),
        accent: t("flare"),
        "blue-pen": t("fathom"),
        postit: t("dawn"),
        surface: { DEFAULT: t("bg-alt"), 2: t("lumen-dark"), 3: t("lumen-dark") },
        line: { DEFAULT: t("lumen-dark"), strong: t("vast") },
        content: {
          DEFAULT: t("text"),
          muted: t("text"),
          subtle: t("text"),
          inverse: t("text-invert"),
        },
        brand: {
          DEFAULT: t("dawn"),
          strong: t("signal"),
          ink: t("vast"),
          wash: t("dawn"),
          on: t("vast"),
        },
        info: { DEFAULT: t("fathom"), wash: t("lumen-dark") },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-body)", "ui-sans-serif", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
        hindi: [
          "var(--font-devanagari)",
          "Noto Sans Devanagari",
          "Mangal",
          "sans-serif",
        ],
        // Legacy — the handwriting faces are retired.
        hand: ["var(--font-body)", "ui-sans-serif", "system-ui", "sans-serif"],
        marker: ["var(--font-display)", "Georgia", "serif"],
      },
      fontSize: {
        // Body ramp mirrors the source system's body tokens.
        "2xs": ["0.8125rem", { lineHeight: "1.15rem" }],
        xs: ["0.8125rem", { lineHeight: "1.2rem" }],
        sm: ["0.875rem", { lineHeight: "1.35rem" }],
        base: ["1rem", { lineHeight: "1.5rem" }],
        md: ["1.125rem", { lineHeight: "1.65rem" }],
        lg: ["1.25rem", { lineHeight: "1.75rem" }],
        xl: ["1.375rem", { lineHeight: "1.85rem" }],
        // Display ramp — serif, tight, negative tracking.
        "2xl": ["1.75rem", { lineHeight: "0.98", letterSpacing: "-0.028em" }],
        "3xl": ["2rem", { lineHeight: "0.98", letterSpacing: "-0.03em" }],
        "4xl": ["2.75rem", { lineHeight: "0.95", letterSpacing: "-0.03em" }],
        "5xl": ["3.5rem", { lineHeight: "0.95", letterSpacing: "-0.03em" }],
        "6xl": ["4.5rem", { lineHeight: "0.94", letterSpacing: "-0.03em" }],
        "7xl": ["6rem", { lineHeight: "0.93", letterSpacing: "-0.03em" }],
        "8xl": ["7.5rem", { lineHeight: "0.92", letterSpacing: "-0.03em" }],
      },
      borderRadius: {
        sm: "6px",
        DEFAULT: "8px",
        md: "8px",
        lg: "12px",
        xl: "1rem",
        "2xl": "2rem",
        slab: "5rem",
      },
      spacing: {
        section: "6rem",
        "section-lg": "8rem",
      },
      boxShadow: {
        // The system uses borders, not elevation. These stay flat by design.
        xs: "none",
        sm: "none",
        md: "none",
        lg: "0 24px 48px -24px rgb(26 26 26 / 0.25)",
        focus: "0 0 0 3px rgb(var(--dawn))",
        hard: "none",
        "hard-sm": "none",
        "hard-lg": "none",
        "hard-hover": "none",
      },
      transitionTimingFunction: {
        DEFAULT: "cubic-bezier(0.4, 0, 0.2, 1)",
        spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
      transitionDuration: { DEFAULT: "200ms" },
      maxWidth: { prose: "34rem", content: "76rem" },
      animation: {
        rise: "rise 400ms cubic-bezier(0.34, 1.56, 0.64, 1) both",
        blink: "caret-blink 1.1s steps(1) infinite",
        shimmer: "shimmer 1.4s ease infinite",
        marquee: "marquee 40s linear infinite",
        // Legacy no-ops from the retired doodle theme.
        jiggle: "none",
        "bounce-gentle": "none",
        wiggle: "none",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
