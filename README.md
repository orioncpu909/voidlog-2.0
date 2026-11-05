# ARTHA app (v1 demo)

A web rebuild of the ARTHA, a Wellness Sanctuary member app, focused on a booking flow that first-time Wellness Account holders can't get wrong.

```bash
npm install
npm run dev   # http://localhost:3100
```

## Home
Home fits on one phone screen with no scrolling. Top to bottom:
1. **Streak:** the current streak and this week, Monday to Sunday (visited days filled, today ringed). Tap anywhere on it to open Stats. **Tap a day in the calendar below** to list what you did or have booked that day (switching month if the day is in the next one); tap it again to clear it. Tapping a day in the calendar rings it in the streak card too. **Stats ›** opens the Stats page.
2. **The calendar (your bookings live here):** a compact month grid (short rows, ‹ › to change month) with one dot per booking under each day: gold coming up, faint for past visits. The space below is a **Coming up** list of every upcoming booking, grouped by day: time, name, then instructor, studio, length and price, with a **Cancel** button. Tap a day to list that day instead (past days show what happened); tap the same day again to go back to Coming up. Cancel asks right in the list (free, or what a late cancel costs) with Keep it / Yes, cancel. Tap a booking to open the cancellation deadline and Add to phone calendar, or for a past visit, Book again. Nothing slides over the calendar except **History**, the full list of past and cancelled visits.
3. **Upcoming events.**

Account alerts show as slim one-line rows above the streak, only when they apply:
- a one-time notice
- the trial (days left, what it becomes, a **Cancel** button)
- a cancelled membership with "Keep"
- the specials, with ✕

The full trial and membership cards are on Account. Booking is in the Book tab.

## Design rules
- **One price, always the one you pay.** Prices never sit in class titles. During a promo the regular price is crossed out next to the special rate, with the promo name and end date. With no promo, Wellness Accounts see the regular price.
- **One booking flow for everything, modeled on the Open app.** **Book opens on three stacked boxes: Classes, Therapies, Treatments.** Each box has a photo on top with the section's name over it (`SECTION_IMAGE` in `lib/images.ts`: real Unsplash photos, not AI-generated) and shows what's in it, the next open time at your home studio and your price (Therapies "from" its lowest; Treatments "or 1 credit" when you have one). Tap a box to open that section (`/book?category=class|therapy|treatment`, so the Book tab and the back button return to the boxes), with "‹" and the section's name at the top. Inside, the location switch (with your price) and, for classes, a two-week date strip stay pinned, then one scrolling list grouped by day. Every class, therapy and treatment time shows its price in the same soft bubble ("Included", "$19", "$5", a crossed-out price for discounts), and HBOT and treatments add "or 1 credit" when you have one. Therapies and treatments list only open times: a taken time (or a whole hour of taken Cryo times) isn't shown at all, and a day with nothing left says "Fully booked this day." Your own bookings still show, marked Booked. Each day starts with a black band ("Today · Wednesday, Oct 28", "Friday · Oct 30") so days are clearly separated. **Booking takes two taps once you're in a section:** tap **Book** on a class row (or tap a therapy or treatment time) and confirm in the sheet that slides up. A "Booked" note appears and you stay on the list, which now shows the class as Booked. The small ⌄ next to the teacher's name pulls down the instructor's bio (what they teach, where and how often), then a short description of that class (what it is, whether it's heated, who it's for; `lib/classInfo.ts`). Book and Booked are outlined, not filled: amber for Book, white for Booked. Tapping a class name still opens its full page (details, location, cancellation policy, Reserve). **Therapies and Treatments open on a one-screen menu:** every service stacked vertically (name, length, your price) with **every open time left that day** underneath in a row you swipe sideways (the day and how many are open on the left; a fade at the right edge shows there's more). Tap a time to book it (Confirm is the second and last tap), or tap anywhere else in the service's block (its name, price, **Details ›**, the day label or the space around the times; the block highlights while pressed) for what the service is and all its times over two weeks (treatments also show their therapists there). Details has its own address (`&service=ir-sauna`), so the "‹" at the top and the phone's back button return to the menu, not the boxes. Cryo's full schedule opens on today's next hour. The location and your price are always on screen.
- **All-time leaderboard** (`allTimeBoard` in `lib/community.ts`): Community ranks everyone by visits since their first booking, across every service and plan, and it never resets. Tapping anyone on any board opens their stats.
- **Check-in QR code** (`lib/checkin.ts`, `components/CheckInSheet.tsx`): the QR button in the header shows the account's own code, to scan at the studio's check-in scanner from 1 hour before an appointment until it ends. The scanner doesn't exist yet, so the sheet has a demo scan.
- **Card on file** (`lib/card.ts`, `components/CardOnFileRow.tsx`): a half-width tile on Account beside Guest passes (a full-width row for trials and Wellness Accounts) shows the card and opens a sheet to change it, or add one if the account has none. It checks the number, expiry, security code and ZIP. Only the card type, last 4 digits and expiry are saved; the full number and security code never are. Sample accounts start with a made-up Visa ending in 4242. No card is really charged.
- **Guest passes** (`lib/guest.ts`, `components/GuestPasses.tsx`, `app/guest`): Restore, Classic and Gold members get 8 a month, on a tile beside the card on file. A pass is 1 class, 1 sauna and 1 cryotherapy, all complimentary. The member enters a friend's first name, last name and email, and the friend gets an email with a link to their own booking page, with no account needed. A pass works only at the sender's home studio. Booking the first service claims the pass. A pass counts when it's sent, cancelling an unclaimed one sent this month gives it back, and unused ones don't roll over. Passes still waiting stay on the list from month to month, and end if the member's membership ends. ARTHA doesn't allow recurring guests, so an email address can only ever claim one, from any member. There's no server yet, so the app shows the email instead of sending it, and its button opens the guest's page.
- **Declined card** (`book` in `lib/store.tsx`, `CardDeclinedPanel`): if a paid booking or ticket can't be charged, nothing is booked and the Confirm sheet itself changes to say the card was declined and must be updated to book. There's no second pop-up. **Update card** shows the card form in the same sheet, and saving goes back to Confirm with "Card updated. You'll pay with your Mastercard •• 4444", so the booking is still waiting to confirm. Bookings that cost nothing still go through. There's no payment provider yet, so a card "declines" when it's expired, or when you tap **Make this card decline (demo)** under Account → Demo. Saving a card clears it.
- **Booking limits** (`bookingConflict` in `lib/store.tsx`, `components/BlockedBanner.tsx`): one of each therapy a day, and no overlapping appointments. Tapping a blocked time shows a pop-up with the reason instead of the confirm sheet.
- **Swipe between tabs** (`components/SwipeTabs.tsx`). Swipe left or right between the bottom tabs: the other tabs stay rendered beside the page, so the next tab comes in with your finger. It stays off inside sideways-scrolling rows, sheets, Book's categories and pages that aren't tabs.
- **Pull to refresh, modeled on WHOOP's** (`components/PullToRefresh.tsx`, `components/TulipLogo.tsx`). Pulling up at the bottom of a page moves it the same way and springs back, with no logo or refresh. On every tab and for every account, pulling down from the top (finger on a phone; click-and-drag down with a mouse; or keep scrolling up with a trackpad or wheel once you're at the top) moves the page itself down with your finger (the header and tab bar stay put) and fades the black ARTHA logo in at the top, inside the header (no arrow). After you let go the page eases to a small gap while the logo loads, then springs back up. Let go past the line (or, on a trackpad, the moment the pull crosses it) and the logo draws itself in, the way WHOOP's circled "W" does: the circle sweeps in as a spinning arc with a gap while the tulip draws stroke by stroke from ARTHA's own logo image, cup first, then the teardrop. When the app has reloaded, the logo fades up out of view. About 1 second in total, like WHOOP's; it never goes below the bottom of the ARTHA wordmark, and it's off while a sheet or full-screen page is open. A pull that's never released clears itself after 3 seconds. The same draw-in is the start-up loading screen. The mark is `public/images/artha-tulip.png`, revealed along traced centerlines.
- **Email a studio in the app** (`components/EmailStudio.tsx`). Account → Contact us has "Email this studio" under each location, and so does the Location section on every Book class page. A pop-up shows a black "To" card with the studio's name, email and address (Wellness Accounts can switch between West LA and Studio City; members and trials can only email their home studio, so the button only appears for that one), a topic, an optional subject and the message. There's no server yet, so Send confirms and offers "Open in my email app" with everything filled in; the pop-up says so plainly. Hook Send up to an email service when a backend exists.
- **Where you can book.** Wellness Accounts book anything at both locations. Members take **classes (and events) at both locations**, but their **therapies and treatments are at their home location** only (`bookableAt` in `lib/data.ts`). In Book, members get a location switch on Classes; Therapies and Treatments show their home location with a lock. A link to a therapy at the other location shows "Only at your home location" instead of Reserve.
- **No surprises at confirm.** The confirm sheet (the same one from a Book button or a class page's Reserve) shows "You pay today", a treatment credit switch when one can cover it (on by default), and the exact free-cancellation deadline ("until tomorrow at 6:00 AM") plus what happens after it.
- **New download → create account** (`components/SignUp.tsx`). A fresh install opens on a welcome screen (photo, ARTHA wordmark, "Create account" and "I already have an account"). Create account requires every field: first and last name, email, a 10-digit mobile number, a password (8+ characters, show/hide) and **Confirm password** (must match), plus a terms checkbox, with plain-language errors. **Instagram** is the one optional field: a handle (with or without the @) that's saved without the @ and shown as a link on the Account card. It's a demo: the details stay on the device and the password is never stored. "I already have an account" lists the sample accounts, since there's no real sign-in.
- **First visit walkthrough.** After sign-up, new accounts see four screens: welcome (how booking works), **Here's your app** (the intro: a copy of the tab bar, then what Home, Book, Account, check-in, class ratings and free cancellation do; `AppTour` in `components/Onboarding.tsx`), which location, and "your prices", including the current promo. To see it without signing up, pick **App intro (new account)** under Account → Demo → View as (`INTRO_DEMO_ID` in `lib/store.tsx`): a new Wellness account with no history that starts the walkthrough every time it's picked.
- **Sign-up lands in the demo account.** So the demo isn't an empty account, signing up fills the Wellness sample account with the new person's name, email, phone and Instagram and switches to it (`SIGNUP_DEMO_ID` in `lib/store.tsx`). They see the walkthrough, then that account's streak, history and bookings under their own name. The new-download account stays empty, so "Open the app as a new download" can run it again (use a different email: one already used counts as taken). Reset demo data puts the sample name back.

## Account types (lib/data.ts)
| | Classes | Cryo | Sauna | Float / Contrast / Red Light | HBOT | Treatments |
|---|---|---|---|---|---|---|
| Wellness (free) | $29 | $29 | $49 | $69 | $200 | $200 |
| Classic $199 | incl. | incl. | $5 | $19 | $125 | $125 |
| Gold $299 | incl. | incl. | incl. | incl. | $125 | $125 |

- Gold also gets 1 treatment credit per month. A credit covers one session of anything members pay $125 for: every treatment, plus HBOT. A **What credits cover** sheet (`components/CreditsInfo.tsx`) explains this, listing covered services per studio; open it from the credits line on Account, the credits count on Home, or the "A credit can cover this" tag in Book.
- Treatments by studio: West LA has Massage and EM BodySculpting; Studio City has Massage, Cryo Facial, T-Shock Therapy and Endermologie (CONFIRM copy and Endermologie's length in `lib/data.ts`).
- Members get 4 welcome credits.
- Restore (from artha.la): 1 massage, 1 sauna, 1 cryo and 1 class free each calendar month (`monthlyPerks`), then 25% off regular prices; extra massages $125. A free perk shows as **Included** with a "Restore monthly perk" tag. Once it's used, that service shows the regular price crossed out, the Restore price in gold, and a **"Restore · 25% off"** tag (on Book's class rows, service pages and the Account price list). The Account card shows this month's perks as free or used. A free cancel gives a perk back; a late cancel uses it up, with no extra charge. The unused-massage rollover isn't modeled.
- Trial prices follow the trial agreement.
- Promos live in `PROMOS`. A promo always runs at both locations. Its Home banner (darker sand, `promo` in Tailwind) has one row per special, and tapping a row opens that service's times on Book (`promoHref` in `components/PromoBanner.tsx`; classes and treatments open their section's list). The banner has an ✕. A closed banner stays hidden until a new special starts, and it disappears when the special ends. Current specials:
  - $9 classes until Nov 1, per artha.la.
  - $10 cryo, which has no published end date. It's set to Dec 31 and marked CONFIRM.

## First-visit price (lib/data.ts)
- Every new account's first paid appointment is discounted. Classes and therapies are half off (`FIRST_VISIT_DISCOUNT`). HBOT and treatments drop to $125 instead (`FIRST_VISIT_FIXED`); members already paying $125 get no extra discount there. It never applies to special (promo) prices or to $10 event tickets.
- It's never advertised and never described as a percentage: not on Home, not in onboarding. When a new account books, the price simply shows as the special price with the normal price crossed out and a "First visit price" tag.
- If that booking is cancelled for free, the offer comes back. A late cancel uses it up.

## Calendar
- **Trying the app without a Calendar tab.** The Home calendar does the Calendar's jobs (above), and every "see it in your calendar" link (the Booked note's **View**, a class page after booking, an event ticket) opens Home with that day's bookings showing. The old /calendar address sends you there too. To bring the tab back exactly as it was, set `SHOW_CALENDAR_TAB = true` in `lib/flags.ts`.
- Every booking appears on the calendar automatically, with a dot on booked days.
- Each booking has **Add to phone calendar**, which downloads an .ics file with a 1-hour reminder. Adding to the phone calendar fully automatically needs the native app or a server-side calendar feed.
- The Calendar keeps working after a membership or trial is cancelled.
- **History** (under the upcoming list) shows past and cancelled visits. Tap one to see the instructor or therapist, the date and time, the studio with its address (opens Maps), the service, length and what was paid, plus a **Book again** button that opens the next matching session in the next two weeks (the same class with the same instructor when possible).

## Cancelling a membership (lib/membership.ts)
- **Switch to pay as you go on your own:** every membership (Restore, Classic, Gold and the trial) sees a **Wellness Account · Free** option under Account → Explore other Memberships (`components/SwitchToWellness.tsx`). It explains what happens (including that Wellness Accounts stay up to date on future promotions), shows the Wellness prices, and follows the rules below (a trial runs to its end date and doesn't turn into a membership). Once scheduled, the option shows the switch date.
- **Cancel membership offers Wellness first** (`components/MembershipCard.tsx`). The cancel sheet says when access ends, then leads with **Keep a free Wellness Account** (no monthly fee, every new special, calendar and stats stay). **No thanks, delete my account** opens a second confirm that says what's removed. A delete happens when access ends: right away inside the refund window, otherwise at the end of the month, when the account is removed and its later bookings are cancelled and refunded (the same path as a deleted trial). Until then the Account card offers "Keep a free Wellness Account instead" and "Keep my membership".
- **Within the first 5 days:** full refund, and the account moves to a free Wellness Account right away, unless the membership has been used. Used means a visit since joining, or a treatment credit on any booking on any plan (Restore's monthly massage counts). Cancelling that booking in time gives the refund back. The refund terms show only in the cancel steps, since they're in the member agreement.
- **After 5 days:** no refund and no further charges. The member keeps full access, prices and their calendar until the end of the month, then becomes a free Wellness Account. A "Keep my membership" link undoes it until then.
- Bookings dated after access ends are priced at Wellness rates.
- Demo: the Gold account joined 2 days ago but has visits since, so it shows the used-membership wording. To see a refund, join a plan from a new account and cancel. The Classic account is past the 5 days. "Jump to the end of this month" ends a cancelled membership right away.

## Streaks and stats (lib/stats.ts, app/stats)
- **Profile photo** (`lib/photo.ts`, `components/Avatar.tsx`): tap the picture on Profile to choose one from the phone. It's cropped to a 256px square and saved on this device; the header shows it too.
- **Profile** (`app/profile`, `lib/profile.ts`): tap the round initial at the top right of every tab, or **Profile ›** on the Account card. The plan badge at the top right of Profile opens what's included and when the account is next billed (`components/PlanSheet.tsx`, `lib/billing.ts`). Laid out like a fitness-app profile: initial, name, Instagram and home studio, then "member since" and "visiting since". What it shows depends on the account:
  - **Wellness accounts (basic stats):** total visits and hours, the day streak (opens Stats), an **Activity summary** (visits by service with time spent and bars, for 1M, 3M or All time; top 5 with Show all), and a "Members see more" row that opens Account.
  - **Members (Trial, Restore, Classic, Gold):**
    - **Header tiles:** a visit **level** (levels at 10, 25, 50, 100, 250, 500 and 1,000 visits), and next to it Restore's perks left this month, the trial's days left, or treatment credits (Classic, Gold).
    - **Achievements:** a swipeable row of badges (Cold-Blooded, Heat Seeker, Early Riser, Night Owl, Double Up, On a Roll, Both Studios and more), each numbered by how often it's been done. Unearned badges are locked.
    - **Data highlights** for 1M, 3M or All time:
      - three rings: days you came in, best week (visit days out of 7), and days with recovery (a therapy or treatment that day);
      - streaks: longest, most visits in a day, days with 2+ visits;
      - records: earliest and latest visit, favorite class, most booked with, and credits and perks used.
    - **Activity summary**, the same as for Wellness accounts.
  - **Everyone:** a **Refer a friend** card with a personal referral link (`artha.la/join?ref=…`, the same code every time for an account). Tap the link to copy it, or **Share my link** for the phone's share sheet. Below it, **Your referrals** lists each friend who signed up with the code and where they are (signed up, on a trial, member +1 credit).

## Community (lib/community.ts, app/community)

**Pushed back for now.** Challenges favor Gold, which has every therapy included, so Community is switched off with `SHOW_COMMUNITY = false` in `lib/flags.ts`. The tab bar is Home, Book, Account, `/community` sends you Home, and no prizes or tie breakers run. Everything below describes it when switched on. The all-time leaderboard needs the same rethink.
A tab of friendly, opt-in challenges and leaderboards among members. No pressure, treatments never count, and **first place wins 1 treatment credit**.

- **Every month, preset:**
  - **Class Count:** most classes all month.
  - **Recovery Ritual:** most therapies all month (cryo, sauna, red light, contrast, float, HBOT).
  - **Weekly sprints:**
    - Early Riser (classes before 8 AM), days 1–7;
    - Stillness (sound bath, yin, restorative, breathwork classes), days 8–14;
    - Hot & Cold (sauna, cryo, contrast), days 15–21;
    - Weekend Warrior (Saturday and Sunday visits), day 22 to the end of the month.
- **Top of the page:**
  - The intro, then the **leaderboards switch** on one line with what it does next to it ("Off: nobody sees you, except in challenges you join from a waitlist"). Wellness Accounts get one line instead: "Challenges are for members."
  - Then a row of chips for every challenge. **Coming up** chips come first (gold): challenges starting in the next 7 days, next month's included. Then **This week** / **This month** chips.
- **Coming up:** these challenges don't get a card on the page until they start, which keeps it uncluttered. Tap a coming-up chip to open its details:
  - dates, what counts, the prize, and how many are on the waitlist;
  - **Join the waitlist**, which then shows "✓ You're on the waitlist" with **Leave**. The chip then reads "✓ On the waitlist".
- **Waitlist rules:**
  - Signing up enters you in that challenge (you're ranked on its board) even if the switch is off. Once it starts, its card says "You joined this one from its waitlist" with **Leave**.
  - With the switch on you're already in everything, so the details say "You're in".
  - Wellness Accounts see "Members can join".
- **Active challenges:** every running challenge (this week's sprint and the month's) is grouped in one section of compact cards, so there's little scrolling. Each card shows:
  - "This week" or "This month", the name and days left;
  - one line on where you stand;
  - the **top 5 people**.
  Tapping a running chip scrolls to its card, and tapping a card opens its **details**: dates, what counts, the prize, where you stand and the **top 10**. **Last month's results** follow in the first week of a month.
- **Boards:**
  - **Ranks:** plain rank numbers, no medals.
  - **Ties:** everyone tied for 1st, 2nd or 3rd sits in one bracket labeled "Tied for 1st", each person on their own row. Ties further down share a number on separate rows.
  - **Your row:** if you're below the top 5 (or 10 in details), your row is added after a "⋯".
  - **Last month's results** name the winner as "1st:".
- **People taking part:** every challenge says how many are taking part ("12 taking part"), counting members who keep their name hidden. With your name hidden you still privately see "you'd be #2". Your name only shows on the board when you're in the challenge (switch on, or on its waitlist). **All N** shows the whole board.
- **Winning:** when a challenge ends, the member who was in it and finished first automatically gets **1 treatment credit**. They also get a Home note, "You won October's Class Count! 1 treatment credit was added to your account." Each challenge pays out once.
- **Tie breaker:** if first place ends in a tie, only the tied people race, and a **Tie breaker** card appears at the top of Community. The first of them to finish one more visit that counts for that challenge wins the credit alone. The visit must start after the challenge's last day and be checked in with their QR code. It closes after 7 days, and if none of them finished one, nobody wins. The result is saved once, so who's tied can't change (`runTieBreak` in `lib/community.ts`).
- **Who's in:** being in a challenge means having the leaderboards switch on by its last day, or being on its waitlist, and only challenges that ended during your membership count (never time on a Wellness Account). The boards and results use the same rule (`isEntered`), and a tied member who doesn't win the tie breaker gets no credit. A credit won during a trial carries over when the trial becomes a membership. Leaving a membership turns the switch off and clears waitlists. (`applyChallengePrizes` in `lib/store.tsx`.)
- **Notes on Home stack up:** a prize, a referral credit and a billing change don't overwrite each other. Home shows the newest with "+N more on Account", and Account shows them all.
- **Opt-in:** members turn on **Show me on the leaderboards** and appear as first name and last initial; they can turn it off anytime. The Classic and Gold demo accounts start on. Wellness Accounts can look but not join.
- **Parked, code kept** (switches in `lib/flags.ts`):
  - the **Earlier this month** list of finished weekly sprints (`SHOW_FINISHED_SPRINTS`);
  - the **Cold Plunge Clock** challenge with **Log a plunge** (`SHOW_PLUNGE_CHALLENGE`), which scores at most 3:00 and takes sessions from the last 2 days into a new month.
- **Scores** come from completed visits only. The other people on the boards are made-up demo members whose numbers grow through each challenge and are the same on every reload.

## Referrals (lib/referral.ts)
- **Signing up with a code:** opening the app from a referral link (`?ref=CODE`) fills in **Referral code** on Create account; people can also type or paste it. A valid code shows "✓ Referred by …"; an unknown one asks them to check it or leave it blank. The new account remembers who referred it (`referredBy`).
- **The reward:** when that friend's **first monthly membership payment** goes through, the member who referred them automatically gets **1 treatment credit** and a note on Home ("… became a member with your referral link…"). The $29 trial fee doesn't count; a trial earns the credit when it turns into a paid month. Each friend counts once, so switching plans later doesn't add more.
- Only paying members (Restore, Classic, Gold) earn the credit. A friend who joins while their referrer is on a Wellness Account or a trial shows as "joined before you were a member" (CONFIRM).
- Monthly membership payments are marked `kind: "membership"` in the charges ledger; `applyReferralCredits` in `lib/store.tsx` runs after every change and on open.
- Demo: Account → Demo → "Open the app as a new download", open `/?ref=CODE` with a code from another account's profile, sign up, then join a membership. Switch back to the referrer to see the credit.
- **History (Account, top right)** (`components/BookingHistory.tsx`): every previous booking on one full-screen page, newest first, grouped by month, with filters for Classes, Therapies, Treatments and Events. Each row shows the date, what it was, its type (Class, Therapy, Treatment, Event), the teacher or therapist, the time, length and studio, plus Cancelled or Late cancel when it didn't happen. Tap one for the full details and Book again.
- **Account tab (condensed):** a compact account card (plan, price, where you can book, credits and Restore perks), a one-row stats strip (streak, best, visits, hours) that opens the full dashboard, prices in a two-column grid, short plan rows, and Contact us (with the cancellation policy inside it) and Demo folded into tap-to-open rows (`components/Disclosure.tsx`).
- **Pull-downs scroll into view:** opening any pull-down (Contact us, Explore other Memberships, Demo, the class info under a teacher's name, an hour of therapy times, a booking on the Home calendar, Show all in Activity) scrolls just enough that the whole opened section is on screen, never past its own title row (`lib/reveal.ts`; bars that cover the page are marked `data-top-bar` / `data-bottom-bar`).
- **Home streak card:** current streak (consecutive days with a visit, ending today or yesterday) and this Monday-to-Sunday week; the whole card opens Stats. Best streak, monthly and total visits are on the Stats page. All calendars and the weekly chart start the week on Monday.
- **Your stats:** reached from the streak card or Account. Shows:
  - Current and longest streak, total visits and hours.
  - Visits per week for the last 8 weeks (Monday to Sunday).
  - Visits by service.
  - Favorite class and most-booked instructor or therapist.
- Only completed visits count. Cancelled bookings and future bookings don't.
- Works the same for Wellness accounts and members. Every account also gets a **Visit history** list: date, service, location, therapist or instructor, and what was paid.

## Therapists (lib/therapists.ts)
- Treatments → **Meet your therapists**: Christian, Tiffany and Victor appear as avatars under the treatment. Tapping one shows their specialties and bio, with "See {name}'s times" to show only their times. Bios are placeholders to replace.
- Treatment times are assigned to the therapists who do that treatment.

## Events (lib/events.ts)
Every event has an access level (`access`):
- **Public** (the default): open to everyone. A free RSVP (e.g. Dia De Los Muertos), or a ticket to a special class or workshop at **$10 for every account** (`EVENT_TICKET_PRICE`).
- **Private class** (`access: "private"`): not open to the public. **Free for members** (Trial included); Wellness Accounts always pay, **$19** a ticket by default (`PRIVATE_CLASS_PRICE`, or set `ticket.price`).
- **Members only** (`access: "members"`): industry nights and runs. They **don't show at all for Wellness Accounts** (and can't be booked by one). Members get a free ticket.
- `ticket.membersFree` overrides the default: `false` charges members for a private class, `true` makes a public ticketed event free for members.

How tickets work:
- Buying a ticket goes through a confirm step with the no-show sentence, and the ticket appears on the calendar, where it can be cancelled for a refund until the deadline.
- A free member ticket still holds a spot, so a late cancel or no-show is charged the event's ticket price, like an included class.
- Event cards on Home show **$10**, **$19**, **Free** (RSVP), **Free ticket** (a member's free ticket) or **Sold out**, change to **✓ Ticket** or **✓ Going** once booked, and are tagged with the location hosting them. Add `ticket: { capacity }` to an event to make it ticketed.
- Events are open to members of both studios, whichever studio hosts them.

**Current events:**
- **L2N Run (LA2NOWHERE):** Sat Nov 7, 8 AM, from ARTHA Studio City, open to both studios. Members only, free.
- **Industry Night:** Thu Nov 12, 7 PM, at the Kimpton La Peer Hotel (627 N La Peer Dr, West Hollywood), hosted by West LA. Members only, free.
- Date, time and host for both are CONFIRM.

**Test events** (ids starting `test-`, remove before launch), one for each event state:
- Candlelit Sound Bath, tonight: a private class (free for members, $19 for Wellness) with one ticket left, inside the late-cancel window.
- Cold Plunge Social: a private class, sold out.
- Farmers Market Walk: a free public RSVP off-site.
- Breathwork for Better Sleep: a public $10 ticket.
- `ticket.taken` sets how many tickets others hold, for testing sold-out and last-spot cases.

## 7-day trial (lib/trial.ts)
- **One trial per account.** Starting a trial marks the account as having used it. After that the Trial option no longer appears, even if the trial was cancelled.
- **Choose the membership after the trial.** The trial card has Restore / Classic / Gold. Nothing chosen means Classic. Tapping another plan only preselects it (dashed outline, "Picked") and explains the switch; **Switch to Gold after my trial** confirms it, and "Keep Classic" backs out. After confirming, the card says so, and the member can pick and confirm another plan any time before the trial ends. At the end of the 7th day, counting the start date as day 1, the trial becomes the chosen membership. The first charge is the rest of that month at that membership's rate (Restore always pays the full month), minus the $29 trial fee. The app checks for ended trials on open and once a minute while it's open.
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
- Every booking goes through a final **Confirm your booking** sheet. It shows the price and the policy as one sentence, e.g. "To avoid a no-show charge of $9, cancel by tomorrow at 7:30 AM." The calendar and the success screen use the same sentence.

## Class and event ratings, and the staff admin (lib/ratings.ts, app/admin)
- **After a class or a ticketed event ends, members and guests rate it 1 to 5 stars.** Members get a card on Home under the alerts ("How was Power Flow with Kyla?", day, time, studio, five stars, and ✕ for Not now). Tapping stars only picks them; **Send rating** saves (3 or fewer also asks for a comment first, below), the card says thanks for 3 seconds, then goes. Guests rate on their pass page, inside the class's Done card.
- Only the most recent class or event is asked about, for 7 days after it ends (`RATE_WINDOW_DAYS`), so there's never a backlog to work through. A rating can't be changed, and ✕ counts as an answer. Therapies and treatments aren't rated, and neither are free RSVP events (they aren't bookings, so there's no record anyone came). On `/admin`, events sit with classes: under "By class or event", and under "By instructor" as **Events**.
- **Ratings are for staff only.** The member app and guest page never show averages, counts or other people's ratings. The rater only sees their own stars in the thanks message.
- **All reviews are anonymous.** The rating card says so before and after a tap, and the staff admin never shows who gave a rating.
- **3 stars or fewer needs a reason.** 4 or 5 stars just needs Send rating. 1 to 3 stars also opens "What could have been better?" with a text box, and the rating only saves once the member writes at least 10 characters (`COMMENT_MIN` in `lib/ratings.ts`; `rateClass` refuses it too). The box says all comments are private. Staff read them under **Comments** on `/admin`, newest first, with no name. Demo ratings of 3 or fewer made before this get a sample comment (`seedRatingComments`).
- **Staff admin** (`/admin`, opened from Account → Demo → "Open the staff admin"): outside the member tabs. Class ratings with filters for studio (both, West LA, Studio City) and period (7 days, 30 days, all time); average, number of ratings, and the share of class visits that were rated; stars given (5 to 1); by instructor and by class (average and count); the private comments on ratings of 3 or fewer; and the 25 newest ratings (class, instructor, time and studio, with no names).
- Demo data: about two in three past classes have a rating, mostly 4s and 5s. Data saved before ratings existed gets them once (`ratingsSeeded`). Each demo account's latest class is left unrated, so Home shows the question.
- With a real backend, `/admin` needs its own staff sign-in, and ratings need to be stored on the server. Today anyone with the link can open it.

## Photos
- Book's three section boxes (Classes, Therapies, Treatments) each have a photo (`SECTION_IMAGE` in `lib/images.ts`), and the sign-up welcome screen has one. Inside a section (service menus and time lists) it's text only. To use ARTHA's own photos, add files to `/public/images` and point those entries at `/images/<file>`.
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

All data lives in the browser. No payments are taken. Every demo account is named Karan. On the Account tab, the "Demo" row (tap to open) switches between a new download, Wellness, Classic, Gold, Restore and Trial accounts. Each account except the new user has a visit history generated from an activity profile (`ACTIVITY` in `lib/store.tsx`): Gold and Classic are advanced regulars (121 and 82 visits, 14- and 9-day streaks), and Restore, Wellness and Trial are intermediate (31–40 visits). Many days have **two classes** (morning and evening; the last two days always do), often with a therapy too. Every account also has bookings coming up: two classes tomorrow, then a class and a therapy in three days, so the Home calendar strip shows several visits on one day. Use "Reset demo data" to load them.
