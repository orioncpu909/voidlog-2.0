// Switches for trying the app different ways.

// The Bookings tab (route /calendar): every upcoming booking with its actions, a month view and
// History. On since the Nov 2026 new-user study, which found everyone looking for "my bookings" and
// Home too crowded holding them. Off: no tab, /calendar sends you Home, and Home has no bookings list.
export const SHOW_CALENDAR_TAB = true;

// Where "see it in Bookings" goes: the Bookings tab (on a day), or Home when the tab is off.
export function calendarHref(date?: string): string {
  if (SHOW_CALENDAR_TAB) return date ? `/calendar?day=${date}` : "/calendar";
  return date ? `/?day=${date}` : "/?upcoming=1";
}

// The Community tab, pushed back until challenges are fair across plans. Off: no tab, /community
// sends you Home, and no prizes or tie breakers run. Flip to true to bring it back.
export const SHOW_COMMUNITY = false;

// Community, parked for now (code kept so they can come back):
// - the "Earlier this month" list of finished weekly sprints and their winners;
export const SHOW_FINISHED_SPRINTS = false;
// - the Cold Plunge Clock challenge and "Log a cold plunge" (plunge times stay in the demo data).
export const SHOW_PLUNGE_CHALLENGE = false;

// The create-account form. Off: the form is read-only and Create account opens the New user
// account at the app intro, so nobody types real details into the demo. Flip to true for a
// working form.
export const SHOW_SIGNUP_FORM = false;
