# Home

The first tab: greeting, alerts, streak, events and the calendar.

8 features, 8 live. Back to the [feature list](README.md).

## Greeting and plan badge

Home opens with 'Good morning' (before noon), 'Good afternoon' (noon to 6 PM) or 'Good evening', followed by your first name. At the top right is your plan: '[Plan] Member' for paid memberships, otherwise just the plan name. Tap it to open Account. If you have treatment credits, a '[N] credits' pill sits under it, and tapping it explains what credits cover.

- **Where:** Home > top
- **Code:** `app/page.tsx`

## Trial countdown row

While you're on a trial, a row reads 'Trial · N days left · then [plan] $X/mo' with a 'change' link to Account and a Cancel button that opens the trial-cancel pop-up. Once you've cancelled, it reads 'Trial cancelled · enjoy it until [date]' with a 'Keep trial' button to undo.

- **Where:** Home > alerts (trial accounts)
- **Code:** `components/HomeAlerts.tsx`

## Cancelled membership row

After you cancel a membership, a row reads 'Membership cancelled · full access until [date]' with a Keep button that undoes the cancellation.

- **Where:** Home > alerts (after cancelling)
- **Code:** `components/HomeAlerts.tsx`

## Specials banner

Wellness (non-member) accounts see one row per current special, with a Book link on the right. Today the only one is 'Special: Cryo $10' with the regular $29 crossed out and 'until Dec 31' (the $9 classes special ended Nov 1). Tapping a row opens that service in Book. The X hides every current special, and they stay hidden until a new special starts. Members never see this banner.

- **Where:** Home > alerts (Wellness accounts)
- **Code:** `components/HomeAlerts.tsx`

## Streak card

Shows your current streak as '[N]-day streak' next to a flame. A hint line changes with your situation: 'Book your first visit to start a streak', 'Today counts. Come back tomorrow to keep it going', 'Visit today to keep it going' or 'Visit today to start a new streak'. A Monday-to-Sunday row of circles shows this week: days you visited are filled in, today has a ring, and future days are dashed. A day you pick in the calendar below gets a ring here too. Tap the card to open Stats.

- **Where:** Home > streak card
- **Code:** `components/StreakCard.tsx`, `components/StreakFlame.tsx`, `lib/stats.ts`

## Home month calendar

A month grid with weeks starting on Monday. Arrows move to the previous or next month, and the year shows when you're away from the current month. Today is highlighted and past days are greyed out. Each day shows up to 3 dots for its bookings: gold for coming up, faint for past. Tap a day to see its bookings, and tap it again to go back to everything coming up. Picking a day in another month jumps the grid to that month.

- **Where:** Home > calendar card
- **Code:** `components/HomeCalendar.tsx`

## Account notices (one-time messages)

The app leaves one-time notes on an account, such as a trial or membership ending, a monthly renewal, a referral reward, a billing change or a refund confirmation. (Challenge prize notes come from Community, which is switched off.) Most new notes are added after any you haven't read, but a trial ending, a membership ending or a cancel within the first 5 days replaces any unread note instead. Home shows only the newest in a slim row under the greeting, with a '+N more on Account' link when several have stacked up, and the Account tab shows all of them in one banner. Tapping the X in either place clears every note at once.

- **Where:** Home, top alert row (and Account)
- **Code:** `components/HomeAlerts.tsx`, `components/TrialCard.tsx`, `lib/store.tsx`

## Home screen layout

Home is built to fit one phone screen without scrolling. From top to bottom: the greeting and plan badge, the slim account alert rows (only when they apply), the rate-your-last-class card (only when one is due), the streak card, the Upcoming events strip (hidden when there are no events), and then the month calendar with your bookings, which stretches to fill the space that's left. On a short phone the page scrolls a little.

- **Where:** Home tab
- **Code:** `app/page.tsx`
