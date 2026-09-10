/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Surfaces
        paper: "#F8FAFC",
        surface: "#FFFFFF",
        "surface-muted": "#F0F6FF",
        rule: "#E2E8F0",
        "rule-strong": "#CBD5E1",

        // Deep navy text and surface scale
        ink: "#0F172A",
        "ink-2": "#334155",
        "ink-3": "#64748B",
        navy: {
          DEFAULT: "#102A56",
          deep: "#0B1E3F",
          dark: "#172554",
          light: "#1E3A8A",
        },

        // Coordinated Blue Palette (Very Light -> Soft -> Medium -> Primary -> Deep)
        blue: {
          50: "#F0F6FF",  // Very Light Blue
          100: "#EAF3FF", // Light Blue
          150: "#DCEBFF", // Soft Blue
          200: "#D5E7FF", // Soft Blue border / highlight
          300: "#93C5FD", // Muted accent
          400: "#5B8DEF", // Medium Blue
          500: "#3B82F6", // Bright Blue
          600: "#2563EB", // Primary Blue
          700: "#1D4ED8", // Deep Blue
          800: "#1E40AF",
          900: "#1E3A8A",
          950: "#102A56", // Dark Navy
        },

        // Legacy / semantic aliases
        royal: {
          DEFAULT: "#2563EB",
          dark: "#1D4ED8",
          light: "#5B8DEF",
          tint: "#F0F6FF",
          soft: "#DCEBFF",
          subtle: "#EAF3FF",
        },

        // Semantic states
        correct: "#059669",
        "correct-tint": "#ECFDF5",
        wrong: "#DC2626",
        "wrong-tint": "#FEF2F2",
        caution: "#D97706",
        "caution-tint": "#FFFBEB",
      },
      boxShadow: {
        subtle: "0 1px 3px 0 rgba(15, 23, 42, 0.04), 0 1px 2px -1px rgba(15, 23, 42, 0.04)",
        card: "0 4px 20px -2px rgba(15, 23, 42, 0.05), 0 2px 6px -1px rgba(15, 23, 42, 0.02)",
        "card-hover": "0 12px 28px -4px rgba(37, 99, 235, 0.10), 0 4px 10px -2px rgba(15, 23, 42, 0.04)",
        elevated: "0 20px 30px -6px rgba(15, 23, 42, 0.08), 0 8px 12px -3px rgba(15, 23, 42, 0.04)",
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '"IBM Plex Sans"', "system-ui", "-apple-system", "sans-serif"],
        serif: ['"Source Serif 4"', "Georgia", "serif"],
        mono: ['"IBM Plex Mono"', "ui-monospace", "monospace"],
      },
      fontSize: {
        "display": ["2.75rem", { lineHeight: "1.12", letterSpacing: "-0.02em" }],
        "title": ["1.875rem", { lineHeight: "1.2", letterSpacing: "-0.015em" }],
        "heading": ["1.3125rem", { lineHeight: "1.3", letterSpacing: "-0.01em" }],
        "label": ["0.75rem", { lineHeight: "1.4", letterSpacing: "0.04em" }],
      },
      maxWidth: {
        prose: "68ch",
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
