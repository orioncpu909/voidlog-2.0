// Community events shown on Home. Taken from the current ARTHA app (Oct 25, 2026).
// CONFIRM: titles were cut off in the screenshot, and descriptions are placeholders.
import { LocationId } from "./data";

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
  // Ticketed events (special or private classes, workshops) are booked like a class at the flat
  // EVENT_TICKET_PRICE. Everything else is a free RSVP.
  ticket?: { capacity: number };
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
];
