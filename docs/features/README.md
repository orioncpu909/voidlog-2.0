# ARTHA app, version 2: all features

Every feature in the ARTHA member app (`~/Cursor/artha-app`, saved in the browser as `artha-demo-v2`), one note per area. Listed November 4, 2026 from the code itself, then checked against the README and HANDOFF.

192 features in all: 163 live, 17 hidden (switched off in `lib/flags.ts`), 7 demo only and 5 staff only.

| Area | Features | Live | What's in it |
|---|---|---|---|
| [Sign-up & onboarding](01-sign-up-and-onboarding.md) | 16 | 16 | Creating an account, the welcome walkthrough, and where a new person lands. |
| [Home](02-home.md) | 8 | 8 | The first tab: greeting, alerts, streak, events and the calendar. |
| [Booking](03-booking.md) | 44 | 42 | The Book tab: classes, therapies and treatments, prices, the confirm step and cancelling. |
| [Events](04-events.md) | 9 | 9 | Ticketed events, free RSVPs, members-only and private classes. |
| [Calendar & history](05-calendar-and-history.md) | 8 | 7 | Upcoming bookings, past visits and booking details. |
| [Stats & profile](06-stats-and-profile.md) | 16 | 16 | The stats dashboard and the Profile page. |
| [Account & membership](07-account-and-membership.md) | 33 | 33 | The Account tab: plans, the trial, switching, cancelling, credits and contact. |
| [Payments & card](08-payments-and-card.md) | 5 | 5 | Card on file, declined cards and billing. |
| [Guest passes](09-guest-passes.md) | 10 | 10 | Sending complimentary passes and the friend's booking page. |
| [Referrals](10-referrals.md) | 3 | 3 | Referral codes and referral credits. |
| [Ratings & staff admin](11-ratings-and-staff-admin.md) | 10 | 5 | Rating classes and events, private comments, and the staff admin page. |
| [Community](12-community.md) | 14 | 0 | Leaderboards and challenges. The whole tab is switched off for now. |
| [App shell & navigation](13-app-shell-and-navigation.md) | 9 | 9 | Tabs, swiping, pull to refresh, the check-in code and other app-wide pieces. |
| [Demo tools](14-demo-tools.md) | 7 | 0 | Buttons that exist only to show the demo: switching accounts, jumping ahead in time, resetting. |

## How to read these notes

- Each feature says what it does, where to find it in the app, and which code files hold it.
- **Live** features have no status line. Others are marked:
  - **Hidden**: built but switched off in `lib/flags.ts`. The Community tab and the Calendar tab are off right now.
  - **Demo only**: only under Account → Demo, for showing the app.
  - **Staff only**: the `/admin` page.
- Prices and rules are what the demo code enforces today. Some are still placeholders to confirm (see `HANDOFF.md` in the app).
- This is a snapshot. When features change, update the matching note or regenerate the list.
