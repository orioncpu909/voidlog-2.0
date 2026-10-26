import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // ARTHA brand palette, from artha.la (see docs/artha-brand-palette.md). Token names are
        // the app's roles; the comments give the brand color behind each one.
        sand: "#EEEAE0", // page background: a light tint of ARTHA sand #C6BC9B
        shell: "#FAF8F3", // cards
        line: "#DDD6C4", // borders, sand-toned
        ink: "#2F2E2E", // ARTHA charcoal text
        muted: "#6E685B", // secondary text, warm gray
        clay: { DEFAULT: "#9F2747", soft: "#F3E4E6" }, // warnings and credits: ARTHA burgundy
        moss: { DEFAULT: "#5C4733", soft: "#E7E2D6" }, // primary: mid-brown, lighter than ARTHA's near-black so it stands out
        sage: { DEFAULT: "#C9A44C", deep: "#7A5C12" }, // specials: gold (dark text on it); deep = gold text on light backgrounds
        copper: "#D68D51", // ARTHA copper, accents on dark only (fails contrast with white text)
        ocean: "#322F27", // Therapies: ARTHA brown-black
        walnut: "#635E4E", // Treatments: ARTHA olive-taupe
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
