import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // ARTHA's palette, taken from the brand mood photos: deep umber pages, sand cards, shoji amber
        // buttons and selected items.
        // Most colors are CSS variables (app/globals.css) so they flip inside a card, where the text
        // has to be dark. Token names are the app's roles, not literal colors (see
        // docs/artha-brand-palette.md).
        sand: "rgb(var(--sand) / <alpha-value>)", // page background; inside a card, a deeper sand panel
        card: "rgb(var(--card) / <alpha-value>)", // cards and sheets: light sand
        line: "rgb(var(--line) / <alpha-value>)", // borders and dividers
        shell: "rgb(var(--shell) / <alpha-value>)", // main text (the name is historical)
        ink: "#0A0401", // text on gold and other light fills
        muted: "rgb(var(--muted) / <alpha-value>)", // secondary text
        clay: { DEFAULT: "rgb(var(--clay) / <alpha-value>)", soft: "rgb(var(--clay-soft) / <alpha-value>)", deep: "#A3401C" }, // warnings, late cancels: terracotta
        moss: { DEFAULT: "rgb(var(--moss) / <alpha-value>)", soft: "rgb(var(--moss-soft) / <alpha-value>)", deep: "#855D37" }, // tan and brown: links, icons, chart bars, credits
        sage: { DEFAULT: "rgb(var(--sage) / <alpha-value>)", deep: "rgb(var(--sage-deep) / <alpha-value>)", light: "#C08442" }, // amber fill (ink text); deep = amber text; light = pressed
        copper: "#D68D51", // ARTHA copper: the Studio City dot
        promo: "#B0926A", // specials: a darker sand than the cards (ink text)
      },
      // A step up from Tailwind's defaults: Futura PT runs small and thin next to a phone's own font.
      fontSize: {
        xs: ["0.8125rem", "1.125rem"],
        sm: ["0.9375rem", "1.3125rem"],
      },
      fontFamily: {
        heading: ["var(--font-heading)", "\"Arial Narrow\"", "sans-serif"],
        wordmark: ["var(--font-wordmark)", "Georgia", "serif"],
        // Futura PT Book, then the phone's own app font: SF Pro on iPhone and Mac, Roboto on Android.
        sans: ["var(--font-body)", "-apple-system", "BlinkMacSystemFont", "\"SF Pro Text\"", "Roboto", "\"Segoe UI\"", "\"Helvetica Neue\"", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
