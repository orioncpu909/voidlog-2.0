# Demo tools

Buttons that exist only to show the demo: switching accounts, jumping ahead in time, resetting.

7 features, 0 live. Back to the [feature list](README.md).

## Simulate the check-in scan

A small 'Simulate the scan (demo)' link under the QR code acts like the studio scanner. It checks you in to your soonest appointment that's open for check-in. If none is open, it says 'Check-in opens 1 hour before an appointment.'

- **Where:** QR button in the header > Simulate the scan (demo)
- **Status:** Demo only
- **Code:** `components/CheckInSheet.tsx`, `lib/checkin.ts`

## Jump to the end of a trial or month

"Jump to the end of this trial", shown only on a trial account, ends the trial right now and runs what happens next: it becomes a membership and is charged, drops to a Wellness Account, or is deleted, depending on the choice made. "Jump to the end of this month", shown only when a membership is set to end, does the same for a cancelled membership, so it becomes a Wellness Account or is deleted as chosen.

- **Where:** Account tab > Demo
- **Status:** Demo only
- **Code:** `app/membership/page.tsx`, `lib/store.tsx`

## New download, staff admin and reset buttons

"Open the app as a new download (sign-up)" wipes the new-download account (its bookings, charges, plunge logs and unclaimed guest passes) and opens the welcome screen so sign-up can be tried again; details used in earlier sign-ups stay blocked from reuse, and used guest passes still block repeat guests. "Open the staff admin (class ratings)" links to the staff ratings page, which sits outside the member tabs. "Reset demo data" throws away everything saved on the device and rebuilds all sample accounts, history, bookings and ratings from scratch, opening on the new-download welcome screen.

- **Where:** Account tab > Demo
- **Status:** Demo only
- **Code:** `app/admin/page.tsx`, `app/membership/page.tsx`, `components/AppShell.tsx`, `lib/store.tsx`

## Sample demo accounts

The demo comes with six accounts, all named Karan: New download (no account yet), Wellness (free, trial already used), Classic (4 credits, member 20 days), Gold (5 credits, joined 2 days ago so the 5-day refund is gone after visits), Restore (Studio City home, 4 credits, member 40 days) and Trial (started 4 days ago). All but New download have a made-up Visa ending 4242 (exp 12/2029), visit history with streaks, two classes tomorrow and a class plus therapy in three days.

- **Where:** Account > Demo > View as
- **Status:** Demo only
- **Code:** `lib/store.tsx`

## Demo rating history

About two in three past classes in the sample accounts come pre-rated, mostly 4 and 5 stars, with each instructor leaning a bit higher or lower so the admin page has something to compare. Low demo ratings get a sample comment. Each account's most recent class is left unrated so it can be rated on Home.

- **Where:** Staff admin and Home
- **Status:** Demo only
- **Code:** `lib/ratings.ts`, `lib/store.tsx`

## View as another account

Switch between the accounts on this device: 'New download' (no account yet), then the Wellness, Classic, Gold, Restore and Trial sample accounts, each labeled with its first name and plan. After someone tries the sign-up, the new account shows as 'New user (first visit)' until it finishes the welcome steps.

- **Where:** Account > Demo > View as
- **Status:** Demo only
- **Code:** `app/membership/page.tsx`, `lib/store.tsx`

## Make this card decline

A demo switch, shown when the account has a saved card, that toggles the card between declining and working ("Make this card decline" / "Stop this card declining"). It acts like a pretend bank decline so you can try what happens when a paid booking fails.

- **Where:** Account > Demo
- **Status:** Demo only
- **Code:** `app/membership/page.tsx`, `lib/store.tsx`
