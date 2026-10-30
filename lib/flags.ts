// Switches for trying the app different ways.

// The Calendar tab. Off: the tab bar is Home, Book, Community, Account; the Home calendar does the Calendar's
// jobs (tap a day, see what's next, cancel, history), and /calendar sends you Home. Flip to true to
// bring the tab back exactly as it was.
export const SHOW_CALENDAR_TAB = false;

// Where "see it in your calendar" goes: the Calendar tab, or Home with that day's bookings open.
export function calendarHref(date?: string): string {
  if (SHOW_CALENDAR_TAB) return date ? `/calendar?day=${date}` : "/calendar";
  return date ? `/?day=${date}` : "/?upcoming=1";
}

// Community, parked for now (code kept so they can come back):
// - the "Earlier this month" list of finished weekly sprints and their winners;
export const SHOW_FINISHED_SPRINTS = false;
// - the Cold Plunge Clock challenge and "Log a cold plunge" (plunge times stay in the demo data).
export const SHOW_PLUNGE_CHALLENGE = false;
