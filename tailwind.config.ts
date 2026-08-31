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
        navy: {
          950: "#061525",
          900: "#0B2545",
          800: "#13315C",
          700: "#1B3A6B",
          600: "#23487A",
        },
        teal: {
          50: "#F0FDFA",
          100: "#CCFBF1",
          400: "#2DD4BF",
          500: "#14B8A6",
          600: "#0D9488",
          700: "#0F766E",
        },
        sand: "#F6F4EF",
        ink: "#0F172A",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(11,37,69,0.06), 0 8px 24px rgba(11,37,69,0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
