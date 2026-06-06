import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // GitHub dark (Primer) — każdy kolor pochodzi ze zmiennej CSS z globals.css.
        gh: {
          bg: "var(--color-canvas)",
          "bg-deep": "var(--color-canvas-deep)",
          panel: "var(--color-panel)",
          surface: "var(--color-surface)",
          surface2: "var(--color-hover)",
          border: "var(--color-border)",
          "border-muted": "var(--color-border-subtle)",
          text: "var(--color-fg)",
          muted: "var(--color-fg-muted)",
          subtle: "var(--color-fg-subtle)",
          green: "var(--color-success)",
          "green-hover": "var(--color-success)",
          red: "var(--color-danger)",
          blue: "var(--color-accent)",
          "tab-active": "var(--color-tab-active)",
          "link-muted": "var(--color-link-muted)",
          purple: "var(--color-purple)",
        },
        calendar: {
          done: "var(--color-calendar-done)",
          empty: "var(--color-calendar-empty)",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          '"Noto Sans"',
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          '"SF Mono"',
          "Menlo",
          "Consolas",
          '"Liberation Mono"',
          "monospace",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
