import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        sand: "#F4EEE4",
        shell: "#FBF8F3",
        line: "#E5DCCD",
        ink: "#2A2925",
        muted: "#857D70",
        clay: { DEFAULT: "#B0603F", soft: "#F1E1D6" },
        moss: { DEFAULT: "#2F4A3A", soft: "#E1E8DF" },
        sage: "#4A7356", // specials
        ocean: "#2C4A57",
        walnut: "#5B4535",
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
