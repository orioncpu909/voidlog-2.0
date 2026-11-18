// "Add to calendar" for a booking. Each phone gets the path that actually adds the event:
// - iPhone/iPad: open /api/ics, which Safari shows as its own "Add to Calendar" screen.
// - Android: open Google Calendar's add-event page (it won't import a downloaded .ics).
// - Computers: download the .ics file.
// CONFIRM on real devices before launch, including from a home-screen web app and the native shell.
import { LOCATIONS } from "./data";
import { Booking } from "./store";
import { sessionStart } from "./schedule";
import { CalendarEvent, eventIcs, googleCalendarUrl } from "./icsFormat";

function local(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}T${p(d.getHours())}${p(d.getMinutes())}00`;
}

export function bookingEvent(b: Booking, note: string): CalendarEvent {
  const start = sessionStart(b.date, b.time);
  const end = new Date(start.getTime() + b.durationMin * 60000);
  const loc = LOCATIONS[b.location];
  return {
    uid: b.id,
    title: `${b.title} · ARTHA`,
    start: local(start),
    end: local(end),
    location: b.instructor && b.serviceId === "event" ? b.instructor : `${loc.name}, ${loc.address}`,
    note,
  };
}

export const bookingIcs = (b: Booking, note: string) => eventIcs(bookingEvent(b, note));

export function addToPhoneCalendar(b: Booking, note: string) {
  const e = bookingEvent(b, note);
  const ua = navigator.userAgent;
  const ios = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (/Android/i.test(ua)) {
    window.open(googleCalendarUrl(e), "_blank", "noopener");
    return;
  }
  if (ios) {
    const q = new URLSearchParams({ uid: e.uid, title: e.title, start: e.start, end: e.end, location: e.location, note: e.note });
    window.location.href = `/api/ics?${q.toString()}`;
    return;
  }
  const url = URL.createObjectURL(new Blob([eventIcs(e)], { type: "text/calendar" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `artha-${b.date}-${b.time.replace(":", "")}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoking right away can cancel the download in some browsers.
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
