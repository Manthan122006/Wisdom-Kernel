/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Surfaces
        paper: "#F6F7F9",
        surface: "#FFFFFF",
        "surface-tint": "#F9FBFF",
        rule: "#E2E6ED",
        "rule-strong": "#CBD3DF",

        // Deep navy text scale
        ink: "#0A1F3C",
        "ink-2": "#4A5A70",
        "ink-3": "#7A879B",

        // Elevated blue/white accent — Option A (deep indigo + ice-blue)
        royal: {
          DEFAULT: "#2F5FD6",
          dark: "#13294B",
          light: "#6E93E8",
          tint: "#EAF0FC",
        },

        // Extra tints used on the colourful stat/hero cards
        mint: { DEFAULT: "#2FBF9B", tint: "#E7F9F3" },
        peach: { DEFAULT: "#FF8A5B", tint: "#FFEEE5" },
        sky: { DEFAULT: "#3AA0FF", tint: "#EAF4FF" },

        // Semantic only - never decorative
        correct: "#0F766E",
        "correct-tint": "#ECF7F5",
        wrong: "#B3261E",
        "wrong-tint": "#FDF0EF",
        caution: "#A96411",
        "caution-tint": "#FDF5EA",
      },
      fontFamily: {
        serif: ['"Source Serif 4"', "Georgia", "serif"],
        sans: ['"IBM Plex Sans"', "system-ui", "-apple-system", "sans-serif"],
        mono: ['"IBM Plex Mono"', "ui-monospace", "monospace"],
      },
      fontSize: {
        // Type scale, roughly a major third
        "display": ["2.75rem", { lineHeight: "1.12", letterSpacing: "-0.02em" }],
        "title": ["1.875rem", { lineHeight: "1.2", letterSpacing: "-0.015em" }],
        "heading": ["1.3125rem", { lineHeight: "1.3", letterSpacing: "-0.01em" }],
        "label": ["0.75rem", { lineHeight: "1.4", letterSpacing: "0.04em" }],
      },
      maxWidth: {
        prose: "68ch",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(19, 41, 75, 0.04), 0 8px 20px rgba(19, 41, 75, 0.06)",
        "soft-lg": "0 4px 10px rgba(19, 41, 75, 0.08), 0 16px 32px rgba(19, 41, 75, 0.10)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-record": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.55", transform: "scale(0.88)" },
        },
        "modal-in": {
          from: { opacity: "0", transform: "translateY(12px) scale(0.99)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
      },
      animation: {
        "fade-in": "fade-in 220ms ease-out both",
        "pulse-record": "pulse-record 1.4s ease-in-out infinite",
        "modal-in": "modal-in 180ms ease-out both",
      },
    },
  },
  plugins: [],
};