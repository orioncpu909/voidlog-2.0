# Calendar & history

Upcoming bookings, past visits and booking details.

8 features, 7 live. Back to the [feature list](README.md).

## Past visit details and Book again

Tapping a past or cancelled visit shows Completed, Cancelled or Late cancel, the instructor or therapist, time, studio with a map link, and what was paid ("Paid $X", "Paid with 1 treatment credit", "Monthly perk", first visit price). A "Book again" button opens the next same class at that studio (same teacher if possible) or the same service, preferably at the same time of day. Not offered for events.

- **Where:** Home calendar or booking history > tap a past visit
- **Code:** `components/BookingDetails.tsx`

## Coming-up bookings list

Above the calendar grid, a list shows everything you have coming up, grouped by day, or only the day you tapped. For a past day it also shows cancellations. Bookings show two at a time and scroll a pair at a time, with a '1–2 of N, scroll for more' hint. Each row shows the time, the name, and a facts line: 'Checked in' if you have, the teacher's first name, the studio, the length, and what you paid ('1 credit', 'Perk' or the price; nothing for an included visit). Past rows show Completed, Cancelled or Late cancel. If nothing is booked, it says 'Nothing booked yet' or 'Nothing booked this day', with a 'Book a visit' link (not shown for past days).

- **Where:** Home > calendar card > list
- **Code:** `components/HomeCalendar.tsx`

## Booking row details

Tap a booking to open its details right under it. For an upcoming booking you see the cancellation deadline sentence (in red once it's too late to cancel for free) and an 'Add to phone calendar' button. For a past one you see 'Next one: [day time]' with a 'Book again' link to the next matching session in the coming two weeks, or 'Not on the schedule in the next two weeks.'

- **Where:** Home > calendar card > tap a booking
- **Code:** `components/HomeCalendar.tsx`, `components/BookingDetails.tsx`

## Cancel from the Home calendar

Every upcoming booking has a Cancel button. Tapping it asks for confirmation right in the list. Free cancellation ends 3 hours before classes, events and most therapies, and 12 hours before Contrast and all treatments. Inside the free window it says 'Free to cancel', plus any money going back to your card or 'your credit comes back'. After the deadline it warns what happens: no charge during a trial; a treatment credit or monthly perk is used up; a paid visit is charged in full with no refund; an included visit is charged at the service's current price. The buttons are 'Keep it' and 'Yes, cancel' ('Cancel anyway' when it's late). The buttons ignore taps for a brief moment so a double tap can't cancel by accident.

- **Where:** Home > calendar card > Cancel on a booking
- **Code:** `components/HomeCalendar.tsx`, `lib/policy.ts`

## Home history list

A 'History (N)' link opens a pop-up listing every past visit and cancellation, newest first. Tap one to see who taught it, when and where.

- **Where:** Home > calendar card > History
- **Code:** `components/HomeCalendar.tsx`, `components/BookingDetails.tsx`

## 'See it on your calendar' links

Links elsewhere in the app, such as after buying an event ticket, open Home with that day already picked in the calendar, or with the full coming-up list. Old links to the Calendar page also redirect to Home on the same day.

- **Where:** Links like 'See it on your calendar'
- **Code:** `lib/flags.ts`, `components/HomeCalendar.tsx`, `app/calendar/page.tsx`

## Full booking history page

A full-screen History page listing every past booking, including cancellations and late cancels, newest first and grouped by month, with the total count at the top. Filter chips (All, Classes, Therapies, Treatments, Events) only appear for types you have. Each row shows the weekday and date, the name, a Cancelled or Late cancel label, the type, the teacher or therapist, the time, the length and the studio. Tap a row for full details and Book again.

- **Where:** Account > History (top right)
- **Code:** `components/BookingHistory.tsx`

## Calendar tab

A full Calendar tab with a larger month grid (one dot on each day that has bookings), an 'Upcoming (N)' list of booking cards with a Cancel pop-up, 'Show all upcoming' after picking a day, a 'Book now' button when empty, and a History list you can show or hide. It's built to stay available after a membership is cancelled. It's switched off right now, and the Home calendar does its job.

- **Where:** Calendar tab (switched off)
- **Status:** Hidden (switched off in lib/flags.ts)
- **Code:** `app/calendar/page.tsx`, `lib/flags.ts`
