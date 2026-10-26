// "Add to phone calendar": builds a standard .ics file for a booking. Opening it on iPhone or
// Android offers to add the appointment to the phone's calendar.
import { LOCATIONS } from "./data";
import { Booking } from "./store";
import { sessionStart } from "./schedule";

function stamp(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}T${p(d.getHours())}${p(d.getMinutes())}00`;
}

export function bookingIcs(b: Booking, note: string): string {
  const start = sessionStart(b.date, b.time);
  const end = new Date(start.getTime() + b.durationMin * 60000);
  const loc = LOCATIONS[b.location];
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ARTHA//Booking//EN",
    "BEGIN:VEVENT",
    `UID:${b.id}@artha.la`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${b.title} · ARTHA`,
    `LOCATION:${b.instructor && b.serviceId === "event" ? b.instructor : `${loc.name}, ${loc.address}`}`,
    `DESCRIPTION:${note}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT1H",
    "ACTION:DISPLAY",
    `DESCRIPTION:${b.title} in 1 hour`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export function addToPhoneCalendar(b: Booking, note: string) {
  const blob = new Blob([bookingIcs(b, note)], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `artha-${b.date}-${b.time.replace(":", "")}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}
