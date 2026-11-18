// The calendar event for a booking, as plain fields, and the .ics text built from them. No app
// state here, so the /api/ics route (server) and the booking screens (phone) share it.

export interface CalendarEvent {
  uid: string;
  title: string;
  start: string; // local studio time, YYYYMMDDTHHMMSS
  end: string;
  location: string;
  note: string;
}

export const STUDIO_TIME_ZONE = "America/Los_Angeles";

// Commas, semicolons and line breaks have to be escaped inside .ics text.
const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

export function eventIcs(e: CalendarEvent, now = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  const stamp = `${now.getUTCFullYear()}${p(now.getUTCMonth() + 1)}${p(now.getUTCDate())}T${p(now.getUTCHours())}${p(now.getUTCMinutes())}00Z`;
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ARTHA//Booking//EN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${e.uid}@artha.la`,
    `DTSTAMP:${stamp}`,
    `DTSTART;TZID=${STUDIO_TIME_ZONE}:${e.start}`,
    `DTEND;TZID=${STUDIO_TIME_ZONE}:${e.end}`,
    `SUMMARY:${esc(e.title)}`,
    `LOCATION:${esc(e.location)}`,
    `DESCRIPTION:${esc(e.note)}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT1H",
    "ACTION:DISPLAY",
    `DESCRIPTION:${esc(e.title)} in 1 hour`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

// Google Calendar's "add event" page, for Android (it won't import a downloaded .ics).
export function googleCalendarUrl(e: CalendarEvent): string {
  const q = new URLSearchParams({ action: "TEMPLATE", text: e.title, dates: `${e.start}/${e.end}`, ctz: STUDIO_TIME_ZONE, location: e.location, details: e.note });
  return `https://calendar.google.com/calendar/render?${q.toString()}`;
}
