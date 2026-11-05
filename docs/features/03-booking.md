# Booking

The Book tab: classes, therapies and treatments, prices, the confirm step and cancelling.

44 features, 42 live. Back to the [feature list](README.md).

## Book front page with three boxes

Book opens on three large photo boxes: Classes, Therapies and Treatments. Each box shows what is in it (for example "Yoga, Pilates, HIIT and sound baths" or "Cryo · Sauna · Red Light · Contrast · Float · HBOT"), the soonest time you can still book at your home studio ("Next · Today 4:20 PM · Sauna"), and your price. If nothing is open it says "No open times in the next two weeks". The whole box is one tap target.

- **Where:** Book tab
- **Code:** `app/book/page.tsx`, `lib/images.ts`

## Section photos

Each of the three Book boxes has a photo across the top with the section name over a dark fade so it reads on any photo: yoga at sunset for Classes, lit sauna benches for Therapies, a massage for Treatments. They are free stock photos from Unsplash, ready to be swapped for ARTHA's own. The photos stretch so all three boxes fit on one phone screen.

- **Where:** Book tab > the three section boxes
- **Code:** `lib/images.ts`, `app/book/page.tsx`

## Price shown on each Book box

Each box shows your price for that section. Therapies shows the cheapest therapy with the word "from" in front. If only one therapy is free on your plan (Classic: cryo), it says "Cryo included" so "Included" doesn't read as all of them. The Treatments box adds "or 1 credit" when you have treatment credits.

- **Where:** Book tab > bottom of each box
- **Code:** `app/book/page.tsx`

## Home studio line on Book

Under the Book heading you see your home studio's name plus a hint: members see "classes at both studios", and Wellness Accounts see "switch studios inside each section".

- **Where:** Book tab > under the heading
- **Code:** `app/book/page.tsx`

## Section header with back arrow

Inside a section, a header stays pinned at the top while you scroll. It has a back arrow to the three boxes (or, from one therapy's schedule, back to the therapy menu), the section name, the studio picker, your price, and the date strip. The phone's back button works the same way.

- **Where:** Book tab > Classes, Therapies or Treatments
- **Code:** `app/book/page.tsx`

## Two-week date strip

A row of the next 14 days (weekday letter and date). Tapping a day scrolls the list to it, and as you scroll the list the highlighted day follows along. Each day in the list starts with a solid band reading "Today", "Tomorrow" or the weekday, with the date on the right. The list ends with "That's the next two weeks. New times open every day."

- **Where:** Book tab > Classes, or a therapy or treatment's schedule
- **Code:** `app/book/page.tsx`, `lib/schedule.ts`

## Studio picker for Wellness Accounts

Wellness Accounts get a West LA / Studio City switch in every section and can book anything at either studio. Choosing a studio also changes their saved home studio, so the rest of the app follows. Every bookable row for them shows which studio it is at.

- **Where:** Book tab > any section > studio switch at the top
- **Code:** `app/book/page.tsx`, `lib/data.ts`, `lib/store.tsx`

## Members' location rule

Members (Trial, Restore, Classic, Gold) can take classes (and events) at both studios: the Classes section has a studio switch that only affects that list. Therapies and treatments are locked to their home studio, shown with a pin and lock icon and the notes "Your membership covers classes at both locations." or "Therapies and treatments are at your home location only." Trying to book a therapy or treatment at the other studio is refused with "With a membership, therapies and treatments are at your home location. Classes work at both."

- **Where:** Book tab > any section, under the header
- **Code:** `app/book/page.tsx`, `lib/data.ts`, `lib/store.tsx`

## Treatments differ by studio

West LA offers Massage and EM BodySculpting. Studio City offers Massage, Cryo Facial, T-Shock Therapy and Endermologie. All six therapies (Cryo, Infrared Sauna, Full Body Red Light, Contrast, Float, Hyperbaric Oxygen) are at both studios. If you switch studios while viewing a service that isn't offered there, the app shows the first service that is.

- **Where:** Book tab > Treatments
- **Code:** `lib/data.ts`, `app/book/page.tsx`

## Weekly class schedule

Classes follow ARTHA's real weekly timetable for each studio (week of Oct 25-31, 2026, repeated every week), with class name, teacher, start time and length (45, 50, 60 or 75 minutes). Each class holds 15 people.

- **Where:** Book tab > Classes
- **Code:** `lib/schedule.ts`, `lib/data.ts`

## Therapy and treatment opening times

Therapies can be booked 7 AM to 9 PM and treatments 9 AM to 8 PM; a session must finish by closing. Start times: cryo every 5 minutes (3 min sessions), sauna every hour at :20 (45 min), red light every 30 minutes (15 min), float every 90 minutes (45 min), and contrast, HBOT and treatments on the hour (45-50 min). Rooms per time: sauna 3, contrast 2, float 2, massage 2, everything else 1.

- **Where:** Book tab > Therapies or Treatments > a service
- **Code:** `lib/schedule.ts`, `lib/data.ts`

## Therapy and treatment menu

Therapies and Treatments open on a menu of every service at your studio. Each row shows the name, length, your price, a "Details" link, and the first day that still has openings with how many are open and every open time that day as buttons you can swipe sideways. Tapping a time goes straight to the confirm step; tapping anywhere else on the row opens that service's details and full schedule. If nothing is open it says "No open times in the next two weeks."

- **Where:** Book tab > Therapies or Treatments
- **Code:** `app/book/page.tsx`

## Service details page

One therapy or treatment's page shows its name, your price, its pillar (Move, Sweat, Freeze, Sweat + Freeze, Restore) and length, a short description, any special or discount tag, and then every open time over the next two weeks.

- **Where:** Book tab > Therapies or Treatments > tap a service
- **Code:** `app/book/page.tsx`, `lib/data.ts`

## Credit note on a service

On HBOT and treatments, if you have treatment credits, a chip reads "A credit can cover this (N left)". Tapping it opens the Treatment credits explainer.

- **Where:** Book tab > Therapies > HBOT, or Treatments > a service
- **Code:** `app/book/page.tsx`

## Meet your therapists

Treatment pages show the therapists who do that treatment as initial circles: Christian (deep tissue, sports recovery; massage), Tiffany (body sculpting, skin treatments; all treatments) and Victor (relaxation, lymphatic drainage; massage). Tapping one opens their specialties and bio with a "See [name]'s times" button. Bios are still placeholders.

- **Where:** Book tab > Treatments > a treatment > Meet your therapists
- **Code:** `app/book/page.tsx`, `lib/therapists.ts`

## Filter times by therapist

After choosing "See [name]'s times", the schedule shows only that therapist's times and a chip "Only [name]'s times" with an X to clear it. Each treatment time already has a therapist assigned, shown as "with [name]".

- **Where:** Book tab > Treatments > a treatment
- **Code:** `app/book/page.tsx`, `lib/schedule.ts`, `lib/therapists.ts`

## Class list rows

Each class shows start time and length, class name, teacher, your price, and a Book button on the right. Tapping the time or name opens the class page; tapping Book goes straight to the confirm step. A class you already booked shows "Booked" (tap to open it) and a full class shows "Full".

- **Where:** Book tab > Classes
- **Code:** `app/book/page.tsx`

## Class pull-down info

A small arrow next to the teacher's name opens a panel with a short teacher bio and "About the class": what the class is, whether it is held under infrared heat, and its level ("Open to all levels.", "For students with some experience." or "Beginner friendly."). The teacher bio is built from the schedule (what they teach, which studio, how many classes a week), since real bios aren't in yet.

- **Where:** Book tab > Classes > arrow beside the teacher's name
- **Code:** `app/book/page.tsx`, `lib/classInfo.ts`

## Spots-left and Full labels

Classes show an orange "N spots left" badge when 3 or fewer are left. Therapy and treatment times show "Available" for single rooms or "N spots left" otherwise, and only open times (plus your own bookings) are listed. Empty days say "Fully booked this day.", "No open times left today.", "Nothing left today." or "Nothing this day." Other people's bookings are simulated in the demo so the schedule looks real.

- **Where:** Book tab > any schedule
- **Code:** `app/book/page.tsx`, `lib/schedule.ts`, `lib/store.tsx`

## Cryo grouped by hour

Services with more than 24 start times in a day (cryo, which starts every 5 minutes) are grouped by hour. Each hour shows how many times are open, "every 5 min" and the price, and opens to a grid of times. On today, the soonest hour with an opening starts open. Only open times and your own booking are listed: taken times are left out rather than crossed out, and an hour with nothing open doesn't appear. Your own time is highlighted.

- **Where:** Book tab > Therapies > Cryo Therapy
- **Code:** `app/book/page.tsx`

## Prices by account type

Wellness Account (free): classes and cryo $29, sauna $49, float, contrast and red light $69, HBOT and treatments $200. 7-Day Trial: classes and cryo included, sauna and float $5, contrast $19, red light $69, HBOT $200, treatments $125. Classic: classes and cryo included, sauna $5, float, contrast and red light $19, HBOT and treatments $125. Gold: classes and all therapies included except HBOT $125, treatments $125. Restore: 25% off regular prices (classes and cryo $21.75, sauna $36.75, float, contrast and red light $51.75, HBOT $150) with treatments $125.

- **Where:** Every price on Book, the confirm step and price lists
- **Code:** `lib/data.ts`, `components/PriceTag.tsx`

## How prices are shown

You only ever see the one price you pay. Free items show an "Included" bubble. When it is a discount (a special, first-visit price or Restore's 25% off) the regular price is shown crossed out next to it, with a tag such as "Restore · 25% off". In a section header a "Your price" bubble shows the price for that service.

- **Where:** Book tab > any row, header or class page
- **Code:** `components/PriceTag.tsx`, `app/book/page.tsx`

## Wellness Account specials

Specials give Wellness Accounts (not members) a lower price for a set period at both studios: "$9 classes" from Oct 1 to Nov 1, 2026 (already over), and "Cryo special" $10 cryo from Oct 1 to Dec 31, 2026 (end date still to confirm). Specials show the regular price crossed out and a tag like "Cryo special · until Dec 31". The special rows on Home link straight to that service on Book (classes and treatments open their section).

- **Where:** Book tab > Classes or Cryo; Home > Special rows
- **Code:** `lib/data.ts`, `components/PriceTag.tsx`, `components/PromoBanner.tsx`

## First visit price

An account's very first paid appointment is discounted: classes and therapies are half off, and HBOT and treatments drop to $125. It shows as "First visit price" with the regular price crossed out (never as a percentage). It doesn't combine with specials, event tickets, included items or Restore monthly perks, and it isn't used when a credit pays. It applies to any account type that hasn't used it yet. Cancelling that booking in time gives the first-visit price back; a late cancel uses it up. In the demo right now nobody sees it: every sample account starts with it already used, and a new sign-up takes over the Wellness sample account, so it is already used for them too.

- **Where:** Book tab > any paid service, and the confirm step
- **Code:** `lib/data.ts`, `lib/store.tsx`, `components/PriceTag.tsx`

## Restore monthly perks

Restore members get 1 class, 1 infrared sauna, 1 cryo and 1 massage free each calendar month. While a perk is left, that service shows "Included" with a "Restore monthly perk" tag; once used, it is back to the Restore price. A free cancel gives the perk back; a late cancel uses it up with no extra charge. Unused massages rolling over is not built.

- **Where:** Book tab (Restore accounts)
- **Code:** `lib/store.tsx`, `lib/data.ts`, `lib/policy.ts`

## Pay with a treatment credit

Treatment credits cover HBOT and every treatment. When you have a credit and the item has a price, the confirm step uses one by default with a checkbox "Use 1 treatment credit (N left)" that you can untick, and the price becomes $0. Rows and the class page show "or 1 credit" or "1 of your N credits covers this, so you pay $0." Credits only work for members and not for dates after a membership ends.

- **Where:** Book tab > HBOT or a treatment > confirm step
- **Code:** `app/book/page.tsx`, `lib/policy.ts`, `lib/store.tsx`, `lib/data.ts`

## Price follows your future plan

Prices are set by what your account will be on the day of the booking. If your membership is cancelled, dates after it ends are priced as a Wellness Account and treatment credits can't be used on them. On a trial, dates after the trial ends are priced at the plan it turns into (Classic unless you chose another), or as Wellness if you cancelled the trial.

- **Where:** Book tab > any future date
- **Code:** `lib/store.tsx`

## Class or service page

A full-screen page for one time shows the title, the teacher ('w/ [name]') or therapist ('with [name]') with an initial circle, the date and time range, and an About section (length, pillar, description). Before you book, a 'Your price' section shows a plain label ('Wellness Account price', 'Special rate for Wellness Accounts', 'Included with [plan]', '[plan] member price' or 'This month's included [perk]') with the price bubble, any special tag, and the credit note. Then come Location (with a Google Maps link to the address and Email this studio), the cancellation line (in red once it's too late to cancel free), and 'Please arrive 5 minutes early.' A Reserve button at the bottom shows the price (for example 'Reserve · $29'; just 'Reserve' when it's free or a credit covers it). The X or the Escape key closes the page. After booking, the box reads 'You're booked', what was paid, 'It's in your Calendar.', and the cancellation line.

- **Where:** Book tab > Classes > tap a class name or time; or a shared link
- **Code:** `app/book/page.tsx`

## Reserve button states

The Reserve button is greyed out with the reason when you can't book: "This time has passed", "Only at your home location, [studio]" (a member opening a therapy or treatment at the other studio) or "Full".

- **Where:** Class or service page > bottom button
- **Code:** `app/book/page.tsx`, `lib/data.ts`

## Share a class

A Share button opens the phone's share sheet with the class name, studio, day and time and a link that opens that exact class page in the app. If sharing isn't available, it copies the text and link instead.

- **Where:** Class or service page > Share icon
- **Code:** `app/book/page.tsx`

## Email this studio from a class

The Location section has an "Email this studio" button. It is hidden for members looking at a time at the studio that isn't their home.

- **Where:** Class or service page > Location
- **Code:** `app/book/page.tsx`

## Confirm your booking step

Every booking goes through one confirm sheet: what, day and time, studio and teacher (plus the address for Wellness Accounts), any special or first-visit tag, the credit checkbox when it applies, "You pay today" with the total, and the cancellation line. The button reads "Confirm and pay $X" or "Confirm booking" when it is free, with "Go back" below.

- **Where:** Book tab > tap Book or a time, or Reserve on a class page
- **Code:** `app/book/page.tsx`

## Booked confirmation and toast

After booking from a list, the row's button pops to "Booked" with a check mark, and a note at the bottom reads "Booked · [class], [day] [time]" with a View link to that day on the Home calendar; it goes away after 3.5 seconds. Booking from a class page shows a "You're booked" box ("Paid $X", "Paid with 1 treatment credit" or "Included, nothing charged", plus "first visit price" if used) and buttons "See it on my calendar" and Done.

- **Where:** Book tab after confirming
- **Code:** `app/book/page.tsx`, `lib/flags.ts`

## Can't-book banner

When a booking isn't allowed, a banner across the top reads "You can't book this time" with the reason. It closes on its own after 7 seconds or with the X.

- **Where:** Book tab > tapping Book on a blocked time
- **Code:** `components/BlockedBanner.tsx`, `app/book/page.tsx`

## One of each therapy a day

Each therapy can be booked once per day. A second one the same day is blocked with "You already have [therapy] at [time] that day. Each therapy can be booked once a day."

- **Where:** Book tab > Therapies
- **Code:** `lib/store.tsx`

## No overlapping bookings

You can't book anything that overlaps another of your bookings or an event you RSVP'd to: "This overlaps with your [booking], [time range]. Please pick a time that doesn't overlap."

- **Where:** Book tab > any time
- **Code:** `lib/store.tsx`

## Therapist can't be double-booked

A treatment time is blocked if its therapist is already with another client then, at either studio and for any treatment: "[Therapist] is with another client then. Please pick a different time."

- **Where:** Book tab > Treatments
- **Code:** `lib/store.tsx`

## Other booking checks

Alongside the home-location rule for members, the one-of-each-therapy-a-day rule, the no-overlap rule (events you RSVP'd to included) and the therapist double-booking rule, a booking is refused if the time has started ("This time has already started. Please pick a later time."), you are already booked ("You're already booked for this time."), it just filled ("This time just filled up. Please pick another."), or it is a members-only event and you're not a member. A quick double tap can't book the same time twice.

- **Where:** Book tab > confirm step
- **Code:** `lib/store.tsx`

## Free-cancellation window

Classes, cryo, sauna, red light, float, HBOT and events can be cancelled free until 3 hours before the start. Contrast and every treatment need 12 hours. Every booking shows one cancellation line, for example "To avoid a no-show charge of $29, cancel by tomorrow at 6:00 AM." or "To keep your treatment credit, cancel by ...". Inside the window it reads "This starts soon, so it's past the free-cancellation time..." in red.

- **Where:** Class page, confirm step, booking cards, phone calendar note
- **Code:** `lib/policy.ts`, `lib/data.ts`

## Late cancel and no-show rules

Cancel late or don't show: if you paid, you are charged what you paid (no refund); if it was included in your membership, you are charged the service's current regular price (specials included) as a late-cancel fee; if a credit paid, the credit is used up; if it was a Restore perk, that month's perk is used up. On a 7-Day Trial there is never a charge, and anything paid is refunded even when late. The booking is marked "Late cancel".

- **Where:** Cancelling a booking (Home calendar)
- **Code:** `lib/policy.ts`, `lib/store.tsx`

## Free cancel refunds and give-backs

Cancelling in time refunds the full price to your card, gives back a treatment credit (if you are still a member), returns a Restore monthly perk, and restores the first-visit price if that booking used it. A late cancel uses the credit, perk or first-visit price up instead. Every refund and late-cancel fee is recorded on the account's charges.

- **Where:** Cancelling a booking (Home calendar)
- **Code:** `lib/policy.ts`, `lib/store.tsx`

## Add to phone calendar

Once booked, a calendar button downloads a calendar file that iPhone and Android offer to add. It is titled "[class] · ARTHA", has the start and end time and the studio's name and address (or the off-site venue for events), puts the cancellation line in the notes, and sets a reminder 1 hour before.

- **Where:** Class or service page > calendar icon (after booking)
- **Code:** `lib/ics.ts`, `app/book/page.tsx`, `components/BookingDetails.tsx`

## Cancel booking sheet (Calendar tab)

A "Cancel this booking?" sheet showing either "This cancellation is free." with what comes back, or "Free cancellation has passed." with the consequence, then "Yes, cancel" or "Cancel anyway" and "Keep my booking". Used only by the Calendar tab; the live app uses the same rules in the Home calendar.

- **Where:** Calendar tab > upcoming booking > Cancel
- **Status:** Hidden (switched off in lib/flags.ts)
- **Code:** `components/CancelSheet.tsx`

## Upcoming booking card (Calendar tab)

A card for each upcoming booking with day, time, studio, teacher, what it cost (Included, price or Credit, plus "First visit price"), the cancellation line, "Add to phone calendar" and Cancel.

- **Where:** Calendar tab > upcoming
- **Status:** Hidden (switched off in lib/flags.ts)
- **Code:** `components/BookingDetails.tsx`
