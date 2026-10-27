import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // ARTHA's three main colors in a light theme: black text, gold buttons and selected items,
        // earthy-brown links and accents, on cream pages with white cards. Layout follows the Open
        // app. Token names are the app's roles, not literal colors (see docs/artha-brand-palette.md).
        // Contrast on white cards: text 18.7:1, muted 7.5:1, brown 7.1:1, burgundy 7.4:1,
        // deep gold 6.2:1; black text on gold 9:1.
        sand: "#F6F1E7", // page background: cream
        card: "#FFFFFF", // cards and sheets
        line: "#DCCDB6", // borders and dividers: tan
        shell: "#141210", // main text: black (the name is historical)
        ink: "#141210", // text on gold fills
        muted: "#5F5346", // secondary text: warm gray-brown
        clay: { DEFAULT: "#9F2747", soft: "#F8E4E8" }, // warnings, late cancels: ARTHA burgundy
        moss: { DEFAULT: "#7A4E2D", soft: "#F1E6D8" }, // earthy brown: links, icons, chart bars, credits
        sage: { DEFAULT: "#D9AE4F", deep: "#7A5C12", light: "#B8862B" }, // gold fill (ink text); deep = gold text; light = streak flame
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
