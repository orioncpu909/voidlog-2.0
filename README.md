# ARTHA app (v1 demo)

A web rebuild of the ARTHA, a Wellness Sanctuary member app, focused on a booking flow that first-time Wellness Account holders can't get wrong.

```bash
npm install
npm run dev   # http://localhost:3100
```

## Home
Home fits on one phone screen with no scrolling. Top to bottom:
1. **Streak:** current streak, the last 7 days as dots, best streak, visits this month and total visits. Taps through to Stats.
2. **This month's calendar:** a full month grid. Sage dots are upcoming bookings and faint dots are past visits. Tapping a day opens it in the Calendar. Your next booking shows underneath. The calendar stretches or shrinks to fill the space left.
3. **Upcoming events.**

Account alerts show as slim one-line rows above the streak, only when they apply:
- a one-time notice
- the trial (days left, what it becomes, a **Cancel** button)
- a cancelled membership with "Keep"
- the specials, with ✕

The full trial and membership cards are on Account. Booking is in the Book tab.

## Design rules
- **One price, always the one you pay.** Prices never sit in class titles. During a promo the regular price is crossed out next to the special rate, with the promo name and end date. With no promo, Wellness Accounts see the regular price.
- **One booking flow for everything, modeled on the Open app.** Book has three tabs (Classes, Therapies, Treatments), a two-week date strip, and one scrolling list grouped by day. Tap a class or time to open its full page (photo, details, your price, location, cancellation policy), then **Reserve** at the bottom. The location and your price are always on screen.
- **Pull to refresh, modeled on WHOOP's** (`components/PullToRefresh.tsx`, `components/TulipLogo.tsx`). On every tab and for every account, pulling down from the top (finger on a phone; click-and-drag down with a mouse; or keep scrolling up with a trackpad or wheel once you're at the top) fades the black ARTHA logo in at the top, inside the header (no arrow). Let go past the line (or, on a trackpad, the moment the pull crosses it) and the logo draws itself in, the way WHOOP's circled "W" does: the circle sweeps in as a spinning arc with a gap while the tulip draws stroke by stroke from ARTHA's own logo image, cup first, then the teardrop. When the app has reloaded, the logo fades up out of view. About 1 second in total, like WHOOP's; it never goes below the bottom of the ARTHA wordmark, and it's off while a sheet or full-screen page is open. A pull that's never released clears itself after 3 seconds. The same draw-in is the start-up loading screen. The mark is `public/images/artha-tulip.png`, revealed along traced centerlines.
- **Email a studio in the app** (`components/EmailStudio.tsx`). Account → Contact us has "Email this studio" under each location, and so does the Location section on every Book class page. A pop-up shows a black "To" card with the studio's name, email and address (Wellness Accounts can switch between West LA and Studio City; members and trials can only email their home studio, so the button only appears for that one), a topic, an optional subject and the message. There's no server yet, so Send confirms and offers "Open in my email app" with everything filled in; the pop-up says so plainly. Hook Send up to an email service when a backend exists.
- **Where you can book.** Wellness Accounts book anything at both locations. Members take **classes (and events) at both locations**, but their **therapies and treatments are at their home location** only (`bookableAt` in `lib/data.ts`). In Book, members get a location switch on Classes; Therapies and Treatments show their home location with a lock. A link to a therapy at the other location shows "Only at your home location" instead of Reserve.
- **No surprises at confirm.** The class page shows "You pay today", whether a treatment credit is applied (on by default), and the exact free-cancellation deadline ("until tomorrow at 6:00 AM") plus what happens after it.
- **New download → create account** (`components/SignUp.tsx`). A fresh install opens on a welcome screen (photo, ARTHA wordmark, "Create account" and "I already have an account"). Create account requires every field: first and last name, email, a 10-digit mobile number, a password (8+ characters, show/hide) and **Confirm password** (must match), plus a terms checkbox, with plain-language errors. **Instagram** is the one optional field: a handle (with or without the @) that's saved without the @ and shown as a link on the Account card. It's a demo: the details stay on the device and the password is never stored. "I already have an account" lists the sample accounts, since there's no real sign-in.
- **First visit walkthrough.** After sign-up, new accounts see three screens: how booking works, which location, and "your prices", including the current promo.

## Account types (lib/data.ts)
| | Classes | Cryo | Sauna | Float / Contrast / Red Light | HBOT | Treatments |
|---|---|---|---|---|---|---|
| Wellness (free) | $29 | $29 | $49 | $69 | $200 | $200 |
| Classic $199 | incl. | incl. | $5 | $19 | $125 | $125 |
| Gold $299 | incl. | incl. | incl. | incl. | $125 | $125 |

- Gold also gets 1 treatment credit per month. Credits cover treatments and HBOT.
- Members get 4 welcome credits.
- Restore (from artha.la): 1 massage, 1 sauna, 1 cryo and 1 class free each calendar month (`monthlyPerks`), then 25% off regular prices; extra massages $125. A free perk shows as **Included** with a "Restore monthly perk" tag. Once it's used, that service shows the regular price crossed out, the Restore price in gold, and a **"Restore · 25% off"** tag (on Book's class rows, service pages and the Account price list). The Account card shows this month's perks as free or used. A free cancel gives a perk back; a late cancel uses it up, with no extra charge. The unused-massage rollover isn't modeled.
- Trial prices follow the trial agreement.
- Promos live in `PROMOS`. A promo always runs at both locations. Its Home banner has an ✕. A closed banner stays hidden until a new special starts, and it disappears when the special ends. Current specials:
  - $9 classes until Nov 1, per artha.la.
  - $10 cryo, which has no published end date. It's set to Dec 31 and marked CONFIRM.

## First-visit price (lib/data.ts)
- Every new account's first paid appointment is discounted. Classes and therapies are half off (`FIRST_VISIT_DISCOUNT`). HBOT and treatments drop to $125 instead (`FIRST_VISIT_FIXED`); members already paying $125 get no extra discount there. It never applies to special (promo) prices or to $10 event tickets.
- It's never advertised and never described as a percentage: not on Home, not in onboarding. When a new account books, the price simply shows as the special price with the normal price crossed out and a "First visit price" tag.
- If that booking is cancelled for free, the offer comes back. A late cancel uses it up.

## Calendar (app/calendar)
- Every booking appears in the Calendar automatically: a month view with a dot on booked days, plus an upcoming list.
- Each booking has **Add to phone calendar**, which downloads an .ics file with a 1-hour reminder. Adding to the phone calendar fully automatically needs the native app or a server-side calendar feed.
- The Calendar keeps working after a membership or trial is cancelled.

## Cancelling a membership (lib/membership.ts)
- **Switch to pay as you go on your own:** every membership (Restore, Classic, Gold and the trial) sees a **Wellness Account · Free** option under Account → Change membership (`components/SwitchToWellness.tsx`). It explains what happens (including that Wellness Accounts stay up to date on future promotions), shows the Wellness prices, and follows the rules below (a trial runs to its end date and doesn't turn into a membership). Once scheduled, the option shows the switch date.
- **Within the first 5 days:** full refund, and the account moves to a free Wellness Account right away.
- **After 5 days:** no refund and no further charges. The member keeps full access, prices and their calendar until the end of the month, then becomes a free Wellness Account. A "Keep my membership" link undoes it until then.
- Bookings dated after access ends are priced at Wellness rates.
- Demo: the Gold account joined 2 days ago, so it's inside the refund window. The Classic account is past it. "Jump to the end of this month" ends a cancelled membership right away.

## Streaks and stats (lib/stats.ts, app/stats)
- **Account tab:** a stats panel with streak, best streak, visits, hours and top services, linking to the full dashboard.
- **Home streak card:** current streak (consecutive days with a visit, ending today or yesterday) and total visits.
- **Your stats:** reached from the streak card or Account. Shows:
  - Current and longest streak, total visits and hours.
  - Visits per week for the last 8 weeks.
  - Visits by service.
  - Favorite class and most-booked instructor or therapist.
  - For members: savings versus regular prices.
- Only completed visits count. Cancelled bookings and future bookings don't.
- Works the same for Wellness accounts and members. Every account also gets a **Visit history** list: date, service, location, therapist or instructor, and what was paid. Wellness accounts see what they've saved with specials and offers, and their total spent; members see what they've saved with their membership.

## Therapists (lib/therapists.ts)
- Treatments → **Meet your therapists**: Christian, Tiffany and Victor appear as avatars under the treatment. Tapping one shows their specialties and bio, with "See {name}'s times" to show only their times. Bios are placeholders to replace.
- Treatment times are assigned to the therapists who do that treatment.

## Events (lib/events.ts)
- **Ticketed events.** Special classes, private classes and workshops cost a flat **$10 for every account**, Wellness included (`EVENT_TICKET_PRICE`). Buying a ticket goes through a confirm step with the no-show sentence, and the ticket appears in the Calendar, where it can be cancelled for a refund until the deadline.
- **Free events** (e.g. Dia De Los Muertos) use a simple RSVP.
- Event cards on Home show **$10** or **Free**, change to **✓ Ticket** or **✓ Going** once booked, and are tagged with the location hosting them. Add `ticket: { capacity }` to an event to make it ticketed.

## 7-day trial (lib/trial.ts)
- **One trial per account.** Starting a trial marks the account as having used it. After that the Trial option no longer appears, even if the trial was cancelled.
- **Choose the membership after the trial.** The trial card has Restore / Classic / Gold. Nothing chosen means Classic. After 7 days the trial becomes the chosen membership. The first charge is the rest of that month at that membership's rate, minus the $29 trial fee. The app checks for ended trials on open and once a minute while it's open.
- **Easy to cancel.** A trial card on Home and Account shows the days left, the exact end time and a **Cancel trial** button. Cancelling never charges for a membership, and the member keeps the rest of the trial they paid for. They choose what happens when it ends:
  - **Switch to a free Wellness Account**, or
  - **Delete my account.** The account is removed and its later bookings are released.
- Until the trial ends, a "Keep my trial" link undoes the cancellation.
- Demo: "Jump to the end of this trial" on the Account tab triggers the switch to Classic right away.

## Cancellation (lib/policy.ts)
- Free until 3 hours before classes and therapies, and until 12 hours before treatments and contrast.
- **No-show charge = what the service costs right now.**
  - A paid booking isn't refunded.
  - A booking included in a membership is charged the service's current price (e.g. $9 for a class during the special).
  - A credit-paid booking uses up the credit.
  - Trials: no charge.
- Every booking goes through a final **Confirm your booking** sheet. It shows the price and the policy as one sentence, e.g. "To avoid a no-show charge of $9, cancel by tomorrow at 7:30 AM." The Calendar and the success screen use the same sentence.

## Photos
- Classes show without photos: time on the left, then the class, teacher, price and spots. Each therapy and treatment has a photo. They're free Unsplash photos set in `lib/images.ts`. Replace them with ARTHA's own photos by adding files to `/public/images` and pointing those entries at `/images/<file>`.
- Cryo starts every 5 minutes, so its list groups times by hour; tap an hour to pick the exact time.

## Where to change things
- `lib/data.ts`: services, account types, prices and promos. Lines marked CONFIRM are assumptions.
- `lib/schedule.ts`: the real class week (Oct 25–31) for both locations, from ARTHA's public booking pages. It repeats weekly in the demo.
- `SLOT_RULES` in `lib/schedule.ts`: when therapies can start.
  - Cryo every 5 minutes. People pick an hour, then a time.
  - Sauna every hour at :20, for 45 minutes (e.g. 4:20–5:05 PM).
  - Float every 90 minutes, for 45-minute sessions.
- `docs/artha-public-info.md`: everything collected from artha.la, with sources.
- `lib/store.tsx`: demo data in localStorage. Swap it for a real backend later.

All data lives in the browser. No payments are taken. Every demo account is named Karan. On the Account tab, "Demo · view as" switches between a new download, Wellness, Classic, Gold, Restore and Trial accounts. Each account except the new user has a visit history generated from an activity profile (`ACTIVITY` in `lib/store.tsx`): Gold and Classic are advanced regulars (92 and 58 visits, 14- and 9-day streaks), and Restore, Wellness and Trial are intermediate (22–26 visits).
