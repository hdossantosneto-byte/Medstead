import type { Config } from "tailwindcss";

const forest = {
  50: "#E8F5E9",
  100: "#C8E6C9",
  200: "#A5D6A7",
  300: "#81C784",
  400: "#66BB6A",
  500: "#43A047",
  600: "#2E7D32",
  700: "#1B5E20",
  800: "#145218",
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
          950: "#001129",
          900: "#002147",
          800: "#0B2545",
          700: "#13315C",
          600: "#1B3A6B",
        },
        forest,
        teal: forest,
        sand: "#F6F4EF",
        ink: "#0F172A",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(0,33,71,0.06), 0 8px 24px rgba(0,33,71,0.06)",
      },
      minHeight: {
        tap: "44px",
      },
    },
  },
  plugins: [],
};

export default config;
