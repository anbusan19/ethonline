// Ported from AeroGuard's inline `tailwind.config` (index.html <script> block, CDN
// build) to a proper Tailwind build for Next.js. Theme tokens are unchanged.
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      colors: {
        aero: {
          black: "#050505",
          dark: "#0a0a0a",
          panel: "#111111",
          text: "#e5e5e5",
          accent: "#3b82f6",
          highlight: "#ef4444",
        },
      },
      backgroundImage: {
        "tech-grid":
          "linear-gradient(to right, #1f2937 1px, transparent 1px), linear-gradient(to bottom, #1f2937 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
};

export default config;
