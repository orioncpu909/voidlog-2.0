// Community events shown on Home. Taken from the current ARTHA app (Oct 25, 2026).
// CONFIRM: titles were cut off in the screenshot, and descriptions are placeholders.
import { EVENT_TICKET_PRICE, LocationId, PRIVATE_CLASS_PRICE } from "./data";

export interface ArthaEvent {
  id: string;
  title: string;
  host: LocationId; // which ARTHA location is putting on the event
  venue: string; // where it happens; may be off-site
  address: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  durationMin: number;
  description: string;
  access?: EventAccess; // who it's for; "public" when left out
  // Ticketed events are booked like a class. Without a ticket, an event is a free RSVP (public
  // events only: private classes and members-only events always have a ticket).
  ticket?: {
    capacity: number;
    price?: number; // otherwise EVENT_TICKET_PRICE ($10), or PRIVATE_CLASS_PRICE ($19) for a private class
    // Members (trial included) get the ticket free. On by default for private classes and members-only
    // events; set it to false to charge members too. Wellness Accounts always pay.
    membersFree?: boolean;
    taken?: number; // demo: tickets other people already hold (otherwise a random-looking number)
  };
}

// - "public": open to everyone. A free RSVP, or a $10 ticket for special classes and workshops.
// - "private": a private class, not open to the public. Free for members; always a paid ticket for
//   Wellness Accounts.
// - "members": members only (industry nights, runs), free for members. Wellness Accounts don't see
//   these at all.
export type EventAccess = "public" | "private" | "members";

// Members-only events are hidden from Wellness Accounts; everything else shows for everyone.
export function eventVisibleTo(e: ArthaEvent, isMember: boolean): boolean {
  return isMember || (e.access ?? "public") !== "members";
}

// Whether members get this event's ticket free: private classes and members-only events unless
// the event says otherwise, public events only when marked.
export function membersGetFree(e: ArthaEvent): boolean {
  return e.ticket?.membersFree ?? (e.access === "private" || e.access === "members");
}

// What this account pays for an event's ticket. Wellness Accounts always pay the ticket price, so
// anything that isn't open to the public stays behind a paywall for them.
export function eventTicketPrice(e: ArthaEvent, isMember: boolean): number {
  if (isMember && membersGetFree(e)) return 0;
  return e.ticket?.price ?? (e.access === "private" ? PRIVATE_CLASS_PRICE : EVENT_TICKET_PRICE);
}

// The event behind a booked or bookable event session.
export function eventAt(host: LocationId, date: string, time: string): ArthaEvent | undefined {
  return EVENTS.find((e) => e.host === host && e.date === date && e.time === time);
}

export const EVENTS: ArthaEvent[] = [
  {
    id: "breathwork-visualization",
    title: "Breathwork & Visualization",
    host: "weho",
    venue: "ARTHA West LA",
    address: "12121 Olympic Blvd",
    date: "2026-10-25",
    time: "14:00",
    durationMin: 90,
    description: "A guided breathwork and visualization session to reset and set intentions.",
    ticket: { capacity: 15 },
  },
  {
    id: "dia-de-los-muertos",
    title: "Dia De Los Muertos",
    host: "weho", // CONFIRM: assumed West LA (it appeared in the West LA app)
    venue: "Esquela Taqueria",
    address: "Los Angeles",
    date: "2026-11-02",
    time: "18:00",
    durationMin: 150,
    description: "An evening with the ARTHA community to celebrate Dia De Los Muertos.",
  },
  {
    id: "arm-balances-inversions",
    title: "Arm Balances & Inversions Workshop",
    host: "weho",
    venue: "ARTHA West LA",
    address: "12121 Olympic Blvd",
    date: "2026-11-14",
    time: "14:00",
    durationMin: 120,
    description: "Build the strength and confidence to fly. All levels welcome.",
    ticket: { capacity: 15 },
  },
  {
    // CONFIRM: date, time, meeting point and route of the L2N run.
    id: "l2n-run",
    title: "L2N Run (LA2NOWHERE)",
    host: "scity",
    venue: "ARTHA Studio City",
    address: "12169 Ventura Blvd",
    date: "2026-11-07",
    time: "08:00",
    durationMin: 60,
    description: "A community run with LA2NOWHERE, starting and finishing at ARTHA Studio City. All paces welcome. Open to members of both studios.",
    access: "members",
    ticket: { capacity: 40 },
  },
  {
    // CONFIRM: date, time, and which studio hosts it (assumed West LA, the closer studio).
    id: "industry-night",
    title: "Industry Night",
    host: "weho",
    venue: "Kimpton La Peer Hotel",
    address: "627 N La Peer Dr, West Hollywood",
    date: "2026-11-12",
    time: "19:00",
    durationMin: 180,
    description: "An evening for wellness and hospitality industry friends of ARTHA at the Kimpton La Peer Hotel.",
    access: "members",
    ticket: { capacity: 60 },
  },

  // TEST: four made-up events for trying every event state (remove before launch).
  // A private class tonight with one ticket left; a sold-out private class; a free public RSVP
  // off-site; a public $10 ticket. Private classes are free for members and $19 for Wellness.
  {
    id: "test-candlelit-sound-bath",
    title: "Candlelit Sound Bath",
    host: "weho",
    venue: "ARTHA West LA",
    address: "12121 Olympic Blvd",
    date: "2026-10-29",
    time: "19:30",
    durationMin: 75,
    description: "Test event: a private class tonight (free for members, $19 for Wellness Accounts), one ticket left, inside the 3-hour late-cancel window after 4:30 PM.",
    access: "private",
    ticket: { capacity: 12, taken: 11 },
  },
  {
    id: "test-cold-plunge-social",
    title: "Cold Plunge Social",
    host: "scity",
    venue: "ARTHA Studio City",
    address: "12169 Ventura Blvd",
    date: "2026-10-30",
    time: "18:00",
    durationMin: 90,
    description: "Test event: a private class (free for members, $19 for Wellness Accounts), sold out.",
    access: "private",
    ticket: { capacity: 10, taken: 10 },
  },
  {
    id: "test-farmers-market-walk",
    title: "Farmers Market Walk",
    host: "scity",
    venue: "Studio City Farmers Market",
    address: "Ventura Pl, Studio City",
    date: "2026-11-01",
    time: "10:00",
    durationMin: 60,
    description: "Test event: a free RSVP at an off-site venue.",
  },
  {
    id: "test-breathwork-sleep",
    title: "Breathwork for Better Sleep",
    host: "weho",
    venue: "ARTHA West LA",
    address: "12121 Olympic Blvd",
    date: "2026-11-03",
    time: "19:00",
    durationMin: 60,
    description: "Test event: a public ticketed class, the same $10 for every account.",
    ticket: { capacity: 15 },
  },
];
