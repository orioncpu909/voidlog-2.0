# ARTHA app (v1 demo)

A web rebuild of the ARTHA, a Wellness Sanctuary member app, focused on a booking flow that first-time Wellness Account holders can't get wrong.

```bash
npm install
npm run dev   # http://localhost:3100
```

## Design rules
- **One price, always the one you pay.** Prices never sit in class titles. During a promo the regular price is crossed out next to the special rate, with the promo name and end date. With no promo, Wellness Accounts see the regular price.
- **One booking flow for everything.** Book → Classes / Therapies / Treatments → time → review → confirm. Every screen shows the location, and the back arrow always works.
- **No surprises at confirm.** The review screen shows "You pay today", whether a treatment credit is applied (on by default), and the exact free-cancellation deadline ("until tomorrow at 6:00 AM") plus what happens after it.
- **First visit walkthrough.** New accounts see three screens: how booking works, which location, and "your prices", including the current promo.

## Account types (lib/data.ts)
| | Classes | Cryo | Sauna | Float / Contrast / Red Light | HBOT | Treatments |
|---|---|---|---|---|---|---|
| Wellness (free) | $29 | $29 | $49 | $69 | $200 | $200 |
| Classic $199 | incl. | incl. | $5 | $19 | $125 | $125 |
| Gold $299 | incl. | incl. | incl. | incl. | $125 | $125 |

- Gold also gets 1 treatment credit per month. Credits cover treatments and HBOT.
- Members get 4 welcome credits.
- Restore (from artha.la): 1 massage, 1 sauna, 1 cryo and 1 class per month, then 25% off regular prices. Massage $125. So far only the massage is tracked as a monthly credit.
- Trial prices follow the trial agreement.
- Promos live in `PROMOS`. A promo always runs at both locations. Current specials:
  - $9 classes until Nov 1, per artha.la.
  - $10 cryo, which has no published end date. It's set to Dec 31 and marked CONFIRM.

## First appointment 50% off (lib/data.ts)
- Every new account's first paid appointment is half off, for any class, therapy or treatment (`FIRST_VISIT_DISCOUNT`). It never applies to special (promo) prices or to $10 event tickets.
- Home doesn't advertise it. It shows in onboarding and on prices once someone is booking, with the normal price crossed out.
- If that booking is cancelled for free, the offer comes back. A late cancel uses it up.

## Calendar (app/calendar)
- Every booking appears in the Calendar automatically: a month view with a dot on booked days, plus an upcoming list.
- Each booking has **Add to phone calendar**, which downloads an .ics file with a 1-hour reminder. Adding to the phone calendar fully automatically needs the native app or a server-side calendar feed.
- The Calendar keeps working after a membership or trial is cancelled.

## Cancelling a membership (lib/membership.ts)
- **Within the first 5 days:** full refund, and the account moves to a free Wellness Account right away.
- **After 5 days:** no refund and no further charges. The member keeps full access, prices and their calendar until the end of the month, then becomes a free Wellness Account. A "Keep my membership" link undoes it until then.
- Bookings dated after access ends are priced at Wellness rates.
- Demo: the Gold account joined 2 days ago, so it's inside the refund window. The Classic account is past it. "Jump to the end of this month" ends a cancelled membership right away.

## Streaks and stats (lib/stats.ts, app/stats)
- **Home streak card:** current streak (consecutive days with a visit, ending today or yesterday) and total visits.
- **Your stats:** reached from the streak card or Account. Shows:
  - Current and longest streak, total visits and hours.
  - Visits per week for the last 8 weeks.
  - Visits by service.
  - Favorite class and most-booked instructor or therapist.
  - For members: savings versus regular prices.
- Only completed visits count. Cancelled bookings and future bookings don't.

## Therapists (lib/therapists.ts)
- Treatments → **Meet your therapists**: Christian, Tiffany and Victor, with specialties and a short bio. Each has "Book … with {name}" buttons that open only that therapist's times. Bios are placeholders to replace.
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

## Where to change things
- `lib/data.ts`: services, account types, prices and promos. Lines marked CONFIRM are assumptions.
- `lib/schedule.ts`: the real class week (Oct 25–31) for both locations, from ARTHA's public booking pages. It repeats weekly in the demo.
- `SLOT_RULES` in `lib/schedule.ts`: when therapies can start.
  - Cryo every 5 minutes. People pick an hour, then a time.
  - Sauna every hour at :20, for 45 minutes (e.g. 4:20–5:05 PM).
  - Float every 90 minutes, for 45-minute sessions.
- `docs/artha-public-info.md`: everything collected from artha.la, with sources.
- `lib/store.tsx`: demo data in localStorage. Swap it for a real backend later.

All data lives in the browser. No payments are taken. Every demo account is named Karan. On the Account tab, "Demo · view as" switches between a new user, Wellness, Classic, Gold, Restore and Trial accounts, which come with a few weeks of past visits.
