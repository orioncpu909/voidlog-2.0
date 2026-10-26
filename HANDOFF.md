# ARTHA app: handoff

Read this to pick the project back up in a new session. It covers what the app is, how to run it, how it's organized, the business rules it follows, what's still open, and the traps to avoid.

Last updated: Oct 26, 2026. Latest commit when written: `f8d2942`.

---

## 1. What this is

A web rebuild of the **"ARTHA, a Wellness Sanctuary"** member app for ARTHA's two LA locations (West LA and Studio City). It's built mobile-first, and the main goal is a booking flow that new **Wellness Account** (non-member) users can't get wrong, with no confusion about prices.

It's a **demo**:
- All data lives in the browser (localStorage).
- No real payments, sign-in or server.

| | |
|---|---|
| Local folder | `/Users/miguelgarcia/Cursor/artha-app` |
| GitHub | https://github.com/orioncpu909/voidlog-2.0 (branch `main`) |
| Stack | Next.js 14 (App Router), React 18, TypeScript, Tailwind 3, lucide-react, clsx |
| Dev URL | http://localhost:3100 |

---

## 2. Run it

```bash
cd /Users/miguelgarcia/Cursor/artha-app
npm install          # first time only
npm run dev          # http://localhost:3100
```

Other commands:

```bash
npx tsc --noEmit -p .   # type-check (ignore errors under .next/)
npm run build           # production build (stop the dev server first, see gotchas)
```

**In the Claude desktop app:** the preview config lives at `/Applications/Orions Belt/.claude/launch.json` (server name `artha-app`), because that's the session's main folder. Start it with the Browser pane's `preview_start` and the name `artha-app`. If you open a session directly in the artha-app folder, there's also a copy at `artha-app/.claude/launch.json`.

**To check it like a phone:** use a 375×812 viewport. Home is designed to fit that screen with **no scrolling**.

---

## 3. Resume with Claude

Open a Claude Code session in `/Users/miguelgarcia/Cursor/artha-app` and start with:

> Read HANDOFF.md and README.md, then run the app at localhost:3100 and confirm it loads. Then: <your next change>.

`CLAUDE.md` in this folder points new sessions here automatically.

---

## 4. Where things live

```
app/
  page.tsx              Home: streak, month calendar, events (fits one screen)
  book/page.tsx         Booking flow: category → service → time → review → confirm sheet → done
  calendar/page.tsx     Month calendar + bookings, cancel, add to phone calendar (?day=YYYY-MM-DD)
  stats/page.tsx        Full stats dashboard + visit history
  membership/page.tsx   "Account" tab: plan, trial/membership cards, stats panel,
                        prices, change plan, policies, contact, charges, demo controls
components/             UI pieces (HomeAlerts, StreakCard, HomeCalendar, CategoryTiles, TrialCard,
                        MembershipCard, StatsOverview, EventsSection, …)
lib/
  data.ts         Locations, services, tiers, prices, promos, first-visit rules, priceFor()
  schedule.ts     Real weekly class schedule, therapy/treatment slot rules (SLOT_RULES)
  store.tsx       All demo state + actions (booking, cancel, trial, membership, demo history)
  policy.ts       Cancellation and no-show rules + the one-sentence policy text
  trial.ts        7-day trial rules
  membership.ts   Membership cancel / 5-day refund rule
  stats.ts        Streaks and stats from completed visits
  events.ts       Events (free RSVP or $10 ticketed)
  therapists.ts   Christian, Tiffany, Victor (bios are placeholders)
  images.ts       Photos behind the Book tiles (Unsplash, swappable)
  ics.ts          "Add to phone calendar" .ics file
docs/artha-public-info.md   Everything collected from artha.la, with sources
docs/artha-brand-palette.md ARTHA's colors from artha.la and how the app uses them
README.md                   Rules and where to change them
```

`priceFor()` in `lib/data.ts` is the **single source of every price**. In the UI, use `useStore().quote(...)`. It wraps `priceFor()` and also handles the first-visit discount and pricing by booking date.

---

## 5. Business rules (as built)

### Account types and prices

| | Classes | Cryo | Sauna | Float / Contrast / Red Light | HBOT | Treatments |
|---|---|---|---|---|---|---|
| **Wellness** (free, non-member) | $29 | $29 | $49 | $69 | $200 | $200 |
| **Restore** $125/mo | 25% off regular | 25% off | 25% off | 25% off | 25% off | $125 |
| **Classic** $199/mo | included | included | $5 | $19 | $125 | $125 |
| **Gold** $299/mo | included | included | included | included | $125 | $125 |
| **7-Day Trial** $29 | included | included | $5 | $5 float, $19 contrast, $69 red light | $200 | $125 |

- **Gold:** 1 treatment credit a month. Credits cover treatments and HBOT.
- **Restore:** 1 massage credit a month (per artha.la). Its included class, cryo and sauna are **not modeled yet**.
- **Welcome credits:** members get 4.
- **Location:** members can only book at their own location. Wellness accounts can book at both.

### Specials (promos)

- **Who and where:** Wellness accounts only, and every special runs at both locations.
- **Current specials:** $9 classes until Nov 1 (per artha.la) and $10 cryo until Dec 31 (that end date is a placeholder).
- **Display:** promo prices always show one clear price with the regular price crossed out.
- **Home banner:** can be closed and stays closed until a *new* special starts.

### First appointment

- **Discount:** classes and therapies are **50% off**. HBOT and treatments drop to **$125** instead.
- **Doesn't apply:** never on special prices or event tickets.
- **On Home:** not advertised. People see it once they're booking.
- **Cancelling:** a free cancel gives the offer back; a late cancel uses it up.

### Booking and cancelling

- **Confirm step:** every booking ends with a confirm sheet. It shows the price and the policy as one sentence, e.g. "To avoid a no-show charge of $9, cancel by tomorrow at 7:30 AM."
- **Free-cancel window:** 3 hours before classes and therapies, 12 hours before treatments and contrast.
- **No-show charge = what the service costs right now:**
  - Paid booking: no refund.
  - Included in a membership: charged the current price.
  - Paid with a credit: the credit is used up.
  - Trial: no charge.

### 7-day trial

- **Once per account:** the Trial option disappears after it's used.
- **What it becomes:** the member picks Restore, Classic (the default) or Gold. The first month is prorated, minus the $29.
- **Cancelling:** no membership charge, and the member keeps the remaining days. At the end, they choose to downgrade to Wellness or delete the account.
- **Cancel button:** on Home (slim row) and on Account.

### Cancelling a membership

- **Within 5 days of joining:** full refund, and it ends now.
- **After 5 days:** no refund, but full access until the end of the month. Then the account becomes Wellness.
- **Calendar and bookings:** stay either way.

### Schedule and slots

- **Classes:** the real Oct 25–31 week from ARTHA's public booking pages, repeated weekly.
- **Therapy slots:**
  - cryo: every 5 minutes (pick an hour, then a time)
  - sauna: every hour at :20 for 45 minutes
  - float: every 90 minutes, 45-minute sessions
  - treatments: hourly
- **Hours:** 7 AM–9 PM, assumed.

### Events

- **Ticketed** (special or private classes, workshops): a flat $10 for every account.
- **Free:** RSVP. Each event is tagged with its host location.

### Stats

- **Streak:** consecutive days with a completed visit, ending today or yesterday.
- **Stats page:** streaks, weekly visits, visits by service, favorites, savings, spend and visit history.

### Demo accounts

Every account is named "Karan". Switch between them in **Account → Demo · view as**:

| Account | History |
|---|---|
| New user | none: shows onboarding and the first-visit offer |
| Wellness | intermediate: about 24 visits, 4-day streak, specials banner |
| Classic | advanced: about 58 visits, 9-day streak, a booking tomorrow |
| Gold | advanced: about 92 visits, 14-day streak; joined 2 days ago, so it's inside the refund window |
| Restore | intermediate (Studio City) |
| Trial | intermediate: 3 days left on the trial |

**Demo buttons on Account:** "Jump to the end of this trial", "Jump to the end of this month", and "Reset demo data".

---

## 6. What's open and needs real info from ARTHA

**Marked `CONFIRM` in code:**
- Therapist bios and specialties (`lib/therapists.ts`)
- The cryo special's end date, and both specials' start dates (`lib/data.ts`)
- Room and therapist capacity per slot (`lib/data.ts`)
- Event titles and descriptions; which location hosts Dia De Los Muertos (`lib/events.ts`)

**Other assumptions to check:**
- **Wellness late cancel:** set to no refund. Never confirmed.
- **Member no-show charge:** set to "current price". The 2026 agreements say $25.
- **Restore:** included class, cryo and sauna aren't modeled. During the $9 special, Restore's 25%-off class ($21.75) costs more than a Wellness class. Needs a decision.
- **Refund window:** 5 calendar days. The agreements say 5 business days.
- **Opening hours:** 7 AM–9 PM assumed. They aren't published.
- **Photos:** Unsplash stock images. Swap in ARTHA's own in `lib/images.ts`.
- **Schedule:** one real week, repeated.

---

## 7. Known limits

- **No backend:** each browser has its own data, nothing syncs, and there's no real sign-in.
- **No payments:** the charges list is a ledger only.
- **"Add to phone calendar"** downloads an .ics file. Fully automatic syncing needs the native app or a server feed.
- **Screen size:** Home is sized for iPhone 12–15 (812px tall). On much shorter screens it scrolls a little.

---

## 8. Gotchas (learned the hard way)

- **Colors:** the app uses ARTHA's brand palette (see `docs/artha-brand-palette.md`). Token names like `moss` and `sage` are app roles, not the actual colors anymore; the comments in `tailwind.config.ts` say which brand color each one holds.
- **New Tailwind colors:** after adding a color to `tailwind.config.ts`, **restart the dev server**, or the class won't apply.
- **`next build` while the dev server runs:** it breaks the dev server's `.next` folder. Stop dev, run `rm -rf .next`, then restart.
- **useEffect returns:** an effect must never return a value. Write `useEffect(() => { … }, [])`, not `useEffect(() => fn(), [])`. Otherwise you get the runtime error "destroy is not a function".
- **Demo data:** saved under the localStorage key `artha-demo-v2`. After changing seed data in `lib/store.tsx`, reset it (Account → Reset demo data, or `localStorage.removeItem("artha-demo-v2")`). Hot reload can serve old data until a full reload.
- **The `ACTIVITY` profiles** in `lib/store.tsx` generate the demo visit history. A seeded random generator keeps it the same on every reset.
- **Home fit:** the page height is `calc(100dvh - 145px)`: 53px header, 12px top padding, 80px for the tab bar. If you change the header or tab bar, update that number. Then check that `document.documentElement.scrollHeight <= innerHeight` at 375×812 for every demo account.
- **Agreement PDFs:** the ones in the Obsidian vault hold real member PII. Never copy names from them into demo data.

---

## 9. Good next steps

1. **Fill the CONFIRM items:** real bios, end dates, capacities, hours, Gold and Restore perks.
2. **Real backend:** for example Supabase, for sign-in, bookings, members and an admin view.
3. **Stripe test mode:** for memberships, trials and drop-ins.
4. **Admin tools:** let staff edit specials, events, the schedule, and partner-group (Nominations) pricing without code.
5. **Native iPhone app (or Expo):** for push notifications and true calendar sync.
6. **Streak rewards:** e.g. 5 classes earn a complimentary sauna, from the vault's Software Notes.
