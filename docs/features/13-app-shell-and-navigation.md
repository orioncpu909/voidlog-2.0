# App shell & navigation

Tabs, swiping, pull to refresh, the check-in code and other app-wide pieces.

9 features, 9 live. Back to the [feature list](README.md).

## Bottom tab bar

Three tabs run along the bottom of every screen: Home, Book and Account. A soft highlight slides behind whichever tab you're on. The Calendar and Community tabs are built but switched off, so they don't appear.

- **Where:** Bottom of every screen
- **Code:** `components/AppShell.tsx`, `lib/flags.ts`

## Top header bar

A header stays pinned to the top of every tab. It shows the ARTHA wordmark (tap it to go Home), a QR-code button that opens your check-in code, and your profile picture, which opens Profile. Your picture gets a ring while you're on Profile. Your picture shows your photo, or the first letter of your name if you haven't added one.

- **Where:** Top of every tab
- **Code:** `components/AppShell.tsx`, `components/Avatar.tsx`

## Swipe between tabs

Swipe left or right to move to the next tab, like turning pages. The next tab is already loaded under your finger. A swipe goes through if you drag past a quarter of the screen, or flick quickly (more than 40px). Short of that, the page springs back. There is no tab before Home or after Account, so swiping past either end just stretches a little. Swiping is off in these cases: within 20px of the screen edge (so the phone's own back swipe still works), on rows that scroll sideways, in text fields, while a pop-up is open, inside a Book category, while zoomed in, or with two fingers down. A tapped link wins over a swipe that's still finishing.

- **Where:** Any tab, swipe sideways
- **Code:** `components/SwipeTabs.tsx`, `lib/gesture.ts`

## Pull down to refresh

Pull down from the top of any tab to refresh. The ARTHA tulip logo fades in as you pull. Pull far enough (70px) and let go, and the logo draws itself in with a spinning circle. Meanwhile the app reloads saved data and applies anything that's due, such as a trial ending or the monthly renewal. The whole refresh takes about 1 second, then the logo fades away. A pull you never let go of clears itself after 3 seconds. Refresh is off while a pop-up is open. Pulling up at the bottom of a page just stretches it and springs back, with no refresh.

- **Where:** Top of any tab, pull down
- **Code:** `components/PullToRefresh.tsx`, `components/TulipLogo.tsx`, `lib/gesture.ts`

## First-launch gate

On a fresh download, a person has to create an account first, then sees the welcome walkthrough, and only then gets the tabs. The guest page and the staff admin page show without the header or tabs.

- **Where:** First open of the app
- **Code:** `components/AppShell.tsx`

## Check-in QR code

Every account gets its own QR code to scan at the studio check-in scanner. It's always black on white so scanners can read it, and there's an 8-character backup code (like ABCD-1234) under it. Under that, a line shows your status: 'Ready to check in' for an appointment that's open now (from 1 hour before it starts until it ends), 'Next up' with your next booking's name, day, time and studio, 'No appointments coming up', or 'Checked in for …' once you're in.

- **Where:** QR button in the header, on any tab
- **Code:** `components/CheckInSheet.tsx`, `lib/checkin.ts`

## Double-tap guard on pop-ups

For 0.4 seconds after a bottom sheet or confirm step opens, taps are ignored, so the second tap of a double tap can't accidentally hit a Confirm or "Yes, cancel" that just appeared. Sheets close with the X, a tap on the dimmed background, or the Escape key.

- **Where:** Every bottom sheet in the app
- **Code:** `components/Sheet.tsx`

## No double booking from a quick double tap

A second tap in the same instant can't book the same session twice or send two guest passes.

- **Where:** Booking and guest pass sends
- **Code:** `lib/store.tsx`

## Data saved on this device

All accounts, bookings, charges, ratings and guest passes are saved only in this phone's browser storage; there is no server and no real payments (charges are a record of what the card would be billed). If storage is unavailable or corrupt the demo starts fresh. A change made in another tab is picked up rather than overwritten. A loading tulip logo shows while data loads.

- **Where:** Whole app
- **Code:** `lib/store.tsx`
