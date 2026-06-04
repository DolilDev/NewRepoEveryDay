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
        // GitHub dark palette
        gh: {
          bg: "#0d1117",
          surface: "#161b22",
          surface2: "#1c2128",
          border: "#30363d",
          "border-muted": "#21262d",
          text: "#e6edf3",
          muted: "#8b949e",
          subtle: "#6e7681",
          green: "#238636",
          "green-hover": "#2ea043",
          blue: "#2f81f7",
          danger: "#f85149",
          gold: "#d29922",
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
