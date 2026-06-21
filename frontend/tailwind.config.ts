import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "#fdfbf7",
        pencil: "#2d2d2d",
        muted: "#e5e0d8",
        accent: "#ff4d4d",
        "blue-pen": "#2d5da1",
        "postit": "#fff9c4",
      },
      fontFamily: {
        hand: ["Patrick Hand", "cursive"],
        marker: ["Kalam", "cursive"],
        mono: ["Courier New", "Courier", "monospace"],
        hindi: ["Noto Sans Devanagari", "Kruti Dev", "Arial", "sans-serif"],
      },
      boxShadow: {
        hard: "4px 4px 0px 0px #2d2d2d",
        "hard-sm": "3px 3px 0px 0px #2d2d2d",
        "hard-lg": "8px 8px 0px 0px #2d2d2d",
        "hard-hover": "2px 2px 0px 0px #2d2d2d",
        "hard-blue": "4px 4px 0px 0px #2d5da1",
        "hard-red": "4px 4px 0px 0px #ff4d4d",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "blink": "blink 1s step-end infinite",
        "jiggle": "jiggle 0.3s ease-in-out",
        "bounce-gentle": "bounce-gentle 3s ease-in-out infinite",
        "wiggle": "wiggle 1s ease-in-out infinite",
      },
      keyframes: {
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
        jiggle: {
          "0%, 100%": { transform: "rotate(0deg)" },
          "25%": { transform: "rotate(-2deg)" },
          "75%": { transform: "rotate(2deg)" },
        },
        "bounce-gentle": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        wiggle: {
          "0%, 100%": { transform: "rotate(-1deg)" },
          "50%": { transform: "rotate(1deg)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
