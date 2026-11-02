import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // ARTHA's dark theme, from the brand's warm near-black: cream text, gold buttons and selected
        // items, warm tan links and accents. Layout follows the Open app. Token names are the app's
        // roles, not literal colors (see docs/artha-brand-palette.md).
        sand: "#000000", // page background: black
        card: "#261F1B", // cards and sheets: ARTHA's near-black
        line: "#463B32", // borders and dividers
        shell: "#F6F1E7", // main text: cream (the name is historical)
        ink: "#15110E", // text on gold and other light fills
        muted: "#BDB0A0", // secondary text: warm gray
        clay: { DEFAULT: "#F0859F", soft: "#43202B", deep: "#9F2747" }, // warnings, late cancels: ARTHA burgundy, lifted for dark; deep = Cancel button outlines
        moss: { DEFAULT: "#D9AE85", soft: "#3A2C20" }, // warm tan: links, icons, chart bars, credits
        sage: { DEFAULT: "#D9AE4F", deep: "#E6C477", light: "#C99A3B" }, // gold fill (ink text); deep = gold text; light = streak flame
        copper: "#D68D51", // ARTHA copper: the Studio City dot
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        // The phone's own app font: SF Pro on iPhone and Mac, Roboto on Android, Segoe UI on Windows.
        sans: ["-apple-system", "BlinkMacSystemFont", "\"SF Pro Text\"", "Roboto", "\"Segoe UI\"", "\"Helvetica Neue\"", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
