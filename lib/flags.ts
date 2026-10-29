// Switches for trying the app different ways.

// The Calendar tab. Off: the tab bar is Home, Book, Account; the Home calendar does the Calendar's
// jobs (tap a day, see what's next, cancel, history), and /calendar sends you Home. Flip to true to
// bring the tab back exactly as it was.
export const SHOW_CALENDAR_TAB = false;

// Where "see it in your calendar" goes: the Calendar tab, or Home with that day's bookings open.
export function calendarHref(date?: string): string {
  if (SHOW_CALENDAR_TAB) return date ? `/calendar?day=${date}` : "/calendar";
  return date ? `/?day=${date}` : "/?upcoming=1";
}
