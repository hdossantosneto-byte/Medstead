import type { Config } from "tailwindcss";

const forest = {
  50: "#F0FDF4",
  100: "#DCFCE7",
  200: "#BBF7D0",
  300: "#86EFAC",
  400: "#4ADE80",
  500: "#22C55E",
  600: "#16A34A",
  700: "#15803D",
  800: "#166534",
};

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#060F22",
          900: "#091733",
          800: "#0F2045",
          700: "#16305F",
          600: "#1B3A6B",
        },
        forest,
        teal: forest,
        brand: {
          green: "#16A34A",
          lime: "#22C55E",
          blue: "#2563EB",
        },
        sand: "#F8FAFC",
        ink: "#0F172A",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(6,15,34,0.04), 0 12px 32px rgba(6,15,34,0.06)",
        tile: "0 1px 2px rgba(6,15,34,0.05), 0 8px 24px rgba(6,15,34,0.06)",
      },
      minHeight: {
        tap: "44px",
      },
    },
  },
  plugins: [],
};

export default config;
