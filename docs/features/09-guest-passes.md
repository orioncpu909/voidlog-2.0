# Guest passes

Sending complimentary passes and the friend's booking page.

10 features, 10 live. Back to the [feature list](README.md).

## Guest passes tile

Paying members (Restore, Classic, Gold) see a Guest passes tile with how many passes they have left this month and "Send to a friend". Trials and Wellness Accounts do not get passes.

- **Where:** Account tab > Guest passes tile
- **Code:** `components/GuestPasses.tsx`, `app/membership/page.tsx`

## Send a guest pass

Send a friend a complimentary day: 1 class, 1 sauna and 1 cryotherapy, at your home studio only. You get 8 passes each calendar month, and unused ones don't roll over. A line shows 'X of 8 left this month · New/More passes on [the 1st]'. You enter the friend's first name, last name and email. The names follow the same letters-only rules as sign-up, and the email must look like name@example.com. A pass counts as soon as it is sent. When all 8 are used, the form is replaced by 'You've sent all 8 this month.'

- **Where:** Account tab > Guest passes > Send guest pass
- **Code:** `components/GuestPasses.tsx`, `lib/guest.ts`, `lib/store.tsx`

## One pass per guest, ever

A pass can't go to your own email. Each guest can claim only one pass, ever, from any member. If a pass is already waiting for that friend, a second one is blocked. Emails are matched loosely, so capital letters, "+tags" and dots in Gmail addresses don't create a new person.

- **Where:** Account tab > Guest passes > Send guest pass (error messages)
- **Code:** `lib/guest.ts`, `lib/store.tsx`

## Pass ready email preview

After sending, the sheet shows "[Name]'s pass is ready" and a preview of the email the friend gets: subject "[You] sent you a day at ARTHA", a short body, and a "Book my services" button that opens the guest page. A demo note says the email isn't really sent yet.

- **Where:** Account tab > Guest passes > after sending, or See email
- **Code:** `components/GuestPasses.tsx`, `lib/guest.ts`

## Your passes list and cancel

Lists passes still waiting (from any month) and passes claimed this month, each with "Sent [date]" or "Claimed [date]". A waiting pass has "See email" and "Cancel". Cancelling asks for confirmation ("Keep it" or "Yes, cancel"), gives the pass back if it was sent this month, and stops the friend's link from working. Claimed passes can't be cancelled.

- **Where:** Account tab > Guest passes > Your passes
- **Code:** `components/GuestPasses.tsx`, `lib/guest.ts`, `lib/store.tsx`

## Waiting passes end with membership

If the sender stops being a paying member, any of their guest passes still waiting to be claimed are removed, which frees those email addresses. Claimed passes are kept forever, so that guest can't claim another one.

- **Where:** Automatic
- **Code:** `lib/guest.ts`, `lib/store.tsx`

## Guest pass landing page

A friend opening the pass link sees an ARTHA page without needing an account: "Hi [name]", who sent the pass and at which studio, and three tiles (Class, Infrared Sauna, Cryo Therapy), each "Complimentary · pick a time". A cancelled or unknown pass shows "This pass isn't active. Ask the friend who sent it to send you a new one." The footer changes from "Guest passes are one per person" to "You're all set. Please arrive 5 minutes early" to "Thanks for visiting ARTHA".

- **Where:** Guest pass email link (guest page)
- **Code:** `app/guest/page.tsx`

## Guest picks a time

The guest picks a day in the next 14 days and a time at the sender's home studio. Times that have started are hidden, and full times show "Full" and can't be picked. When a day has more than 24 times (cryo runs every 5 minutes), the guest picks an hour first. If nothing is left, it says "No times left this day. Try another day."

- **Where:** Guest page > tap a service
- **Code:** `app/guest/page.tsx`

## Guest confirms a booking

The confirm screen shows the session, day, time, studio, address and "You pay: Complimentary". The guest can book each of the three services once, at the pass's studio only, with no overlapping times and only if a spot is open. Guest bookings take real spots. Booking the first service claims the pass.

- **Where:** Guest page > pick a time > Confirm booking
- **Code:** `app/guest/page.tsx`, `lib/store.tsx`

## Guest cancels or changes

A booked service shows "Booked" (or "Done" once it has started) with its time, studio and instructor. Before it starts, "Cancel or change" asks "Cancel this? You can pick another time on your pass" with "Keep it" or "Yes, cancel". After cancelling, the service can be booked again.

- **Where:** Guest page > a booked service
- **Code:** `app/guest/page.tsx`, `lib/store.tsx`
