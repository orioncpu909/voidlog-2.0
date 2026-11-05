# Events

Ticketed events, free RSVPs, members-only and private classes.

9 features, 9 live. Back to the [feature list](README.md).

## Upcoming events strip

A sideways row of event cards, about two per screen. Each card shows a date tile, the start time, the venue name if it's off-site, the host studio (each studio has its own dot color) and a status: '✓ Ticket' or '✓ Going', 'Sold out', or the price ('Free', 'Free ticket', '$10' or '$19'). Events drop off once they've ended, and the whole section disappears when there are none.

- **Where:** Home > Upcoming events
- **Code:** `components/EventsSection.tsx`, `lib/events.ts`

## Event details pop-up

Tap an event to see which studio is hosting, the day and time range, the venue and address, and a description, followed by the RSVP or ticket options.

- **Where:** Home > Upcoming events > tap an event
- **Code:** `components/EventsSection.tsx`

## Free RSVP events

Public events without tickets are free: 'Free · RSVP so we know you're coming' with an RSVP button. RSVP is blocked with a message if the event overlaps another of your bookings. Once you've RSVP'd it says 'You're on the list', with an 'I can't make it' button to undo.

- **Where:** Home > Upcoming events > a free event
- **Code:** `components/EventsSection.tsx`, `lib/events.ts`

## Event ticket pricing

Ticketed events are booked like a class, with limited spots ('N of [capacity] spots left', or 'Sold out' with the button disabled). Public special classes and workshops cost $10 for every account. Private classes are free for members (trials included) and $19 for Wellness accounts. Members-only events are free for members. A single event can override these rules with its own price or by charging members. The ticket box explains the price, for example 'Free with your membership', 'Private class · free for members' or 'Same price for every account'.

- **Where:** Home > Upcoming events > a ticketed event
- **Code:** `components/EventsSection.tsx`, `lib/events.ts`

## Members-only events

Members-only events, such as Industry Night and the L2N Run, are hidden completely from Wellness accounts. Booking one without a membership is refused with 'This event is for members only.'

- **Where:** Home > Upcoming events (members only)
- **Code:** `lib/events.ts`, `components/EventsSection.tsx`

## Ticket confirm step

After 'Get a ticket · $X' or 'Get a free ticket', a confirm step shows 'You pay today' with the amount, plus the cancellation sentence. Free cancellation ends 3 hours before an event. After that, a late cancel or no-show keeps what you paid; a member's free ticket is charged the price a Wellness Account would pay ($10, or $19 for a private class, even for a members-only event); and on a 7-Day Trial there's no charge. The buttons are 'Confirm and pay $X' (or 'Confirm free ticket') and 'Go back'. Problems show as a message, for example the event overlapping another booking, already having a ticket, or the event just filling up. If your card is declined, a panel lets you save a new card and then returns you to the confirm step.

- **Where:** Event details > Get a ticket
- **Code:** `components/EventsSection.tsx`, `lib/policy.ts`

## Your ticket

Once you hold a ticket, the event shows 'You have a ticket', the cancellation deadline sentence, and a 'See it on your calendar' button that opens the Home calendar on that day.

- **Where:** Event details (after booking)
- **Code:** `components/EventsSection.tsx`

## Current events lineup

As of today (Nov 4, 2026) three events are still coming up: L2N Run (LA2NOWHERE), Sat Nov 7 at 8 AM from ARTHA Studio City, members only, free, 40 spots, 1 hour; Industry Night, Thu Nov 12 at 7 PM at the Kimpton La Peer Hotel (627 N La Peer Dr, West Hollywood), hosted by West LA, members only, free, 60 spots, 3 hours; and the Arm Balances & Inversions Workshop, Sat Nov 14 at 2 PM at West LA, public, $10 ticket, 15 spots, 2 hours. Every other event in the app, including the four test events (Candlelit Sound Bath, Cold Plunge Social, Farmers Market Walk, Breathwork for Better Sleep), Breathwork & Visualization and Dia De Los Muertos, has a fixed date that has already passed, so none of them show any more. Wellness Accounts see only the workshop. The dates, times and hosts of the run and Industry Night are still placeholders to confirm.

- **Where:** Home > Upcoming events
- **Code:** `lib/events.ts`, `components/EventsSection.tsx`

## Free RSVPs stay off the calendar

RSVPing to a free event only puts you on that event's list ('You're on the list'). It is not a booking, so it doesn't show on the Home calendar or in history, can't be added to the phone calendar, can't be checked in with the QR code, doesn't count toward stats or streaks, and you aren't asked to rate it. It still blocks you from booking anything that overlaps it.

- **Where:** Home > Upcoming events > a free event > RSVP
- **Code:** `components/EventsSection.tsx`, `lib/store.tsx`, `lib/ratings.ts`
