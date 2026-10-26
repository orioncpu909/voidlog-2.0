# ARTHA app

Start here: read `HANDOFF.md` for how to run the app, the business rules, open questions and gotchas. `README.md` explains where each rule lives in code.

- Run: `npm run dev` → http://localhost:3100 (mobile-first; check at 375×812)
- Type-check: `npx tsc --noEmit -p .`
- Every price goes through `priceFor()` in `lib/data.ts` (UI: `useStore().quote()`).
- Demo data is in localStorage under `artha-demo-v2`. Reset it after changing seeds in `lib/store.tsx`.
- Home must fit one phone screen with no scrolling.
- Restart the dev server after changing `tailwind.config.ts`.
