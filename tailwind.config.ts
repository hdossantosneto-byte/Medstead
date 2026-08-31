import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#060F22",
          950: "#060F22",
          900: "#091733",
          800: "#0F2045",
          700: "#152A52",
        },
        brand: {
          green: "#16A34A",
          "green-light": "#22C55E",
          blue: "#2563EB",
        },
        forest: {
          50: "#F0FDF4",
          100: "#DCFCE7",
          200: "#BBF7D0",
          600: "#16A34A",
          700: "#15803D",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(6,15,34,0.06), 0 10px 28px rgba(6,15,34,0.08)",
      },
      minHeight: {
        tap: "44px",
      },
    },
  },
  plugins: [],
};

export default config;
