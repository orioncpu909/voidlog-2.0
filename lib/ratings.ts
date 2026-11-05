// Class and event ratings. After a class or a ticketed event ends, the member or guest who went can
// give it 1 to 5 stars, once. 3 stars or fewer also needs a private comment saying why. Free RSVPs
// aren't bookings, so they aren't asked about. Ratings are for the ARTHA team: the member app and the
// guest page never show them back (no averages, no counts, not even on the class), only the staff
// admin page (app/admin).
// Ratings are anonymous: the admin page never shows who gave one. With a backend, store them apart
// from the member (no member id), so that stays true on the server too.
// The app asks about the most recent class or event only, for a week after it ends, so it never nags about
// a backlog. Skipping it ("Not now") counts as an answer.
import type { Booking } from "./store";
import { sessionStart } from "./schedule";

export const RATE_WINDOW_DAYS = 7;
export const STARS = [1, 2, 3, 4, 5] as const;

// A rating of 3 or below needs a comment saying why before it saves. Comments are private: only the
// ARTHA team reads them on the admin page, with no name, like the stars.
export const COMMENT_AT_OR_BELOW = 3;
export const COMMENT_MIN = 10; // characters, so "bad" alone doesn't count as a reason
export const COMMENT_MAX = 500;
export const needsComment = (stars: number) => stars <= COMMENT_AT_OR_BELOW;
export const commentOk = (comment: string | undefined) => (comment ?? "").trim().length >= COMMENT_MIN;

export const classEnd = (b: Pick<Booking, "date" | "time" | "durationMin">) => sessionStart(b.date, b.time).getTime() + b.durationMin * 60000;

// What can be rated: classes and event tickets.
export const isRatable = (b: Pick<Booking, "serviceId">) => b.serviceId === "class" || b.serviceId === "event";

const ratable = (b: Booking, now: number) =>
  isRatable(b) && b.status === "booked" && classEnd(b) <= now && now - classEnd(b) < RATE_WINDOW_DAYS * 864e5;

// The class or event to ask about: the one that ended most recently, if it isn't answered yet.
// `bookings` should be one person's (a member's, or one guest pass's).
export function ratingDue(bookings: Booking[], now = new Date()): Booking | undefined {
  const last = bookings.filter((b) => ratable(b, now.getTime())).sort((a, b) => classEnd(b) - classEnd(a))[0];
  return last && !last.rating && !last.ratingSkipped ? last : undefined;
}

// Whether a rating for this booking can still be saved (also guards a double tap).
export const canRate = (b: Booking, now = new Date()) => ratable(b, now.getTime()) && !b.rating;

export const average = (stars: number[]) => (stars.length ? stars.reduce((a, b) => a + b, 0) / stars.length : 0);

// Demo history: about two in three past classes got a rating, mostly 4s and 5s, with each
// instructor a little higher or lower so the admin page has something to compare. Each
// account's most recent class is left unrated for the member to rate on Home.
export function seedRatings(bookings: Booking[], now = new Date()): Booking[] {
  const latest = new Map<string, string>();
  for (const b of bookings) {
    if (b.serviceId !== "class" || b.status !== "booked" || classEnd(b) > now.getTime() || b.memberId.startsWith("guest:")) continue;
    const prev = bookings.find((x) => x.id === latest.get(b.memberId));
    if (!prev || classEnd(b) > classEnd(prev)) latest.set(b.memberId, b.id);
  }
  const keep = new Set(latest.values());
  return bookings.map((b) => {
    if (b.serviceId !== "class" || b.status !== "booked" || b.rating || keep.has(b.id) || classEnd(b) > now.getTime() || b.memberId.startsWith("guest:")) return b;
    const roll = unit(`rate|${b.id}`);
    if (roll > 0.66) return b;
    // Odds of each star, nudged by how well this instructor rates: averages land around 4.0 to 4.7.
    const q = unit(`lean|${b.instructor ?? ""}`);
    const five = 0.4 + 0.3 * q;
    const r = unit(`stars|${b.id}`);
    const stars = r < five ? 5 : r < five + 0.35 ? 4 : r < five + 0.5 ? 3 : r < five + 0.56 ? 2 : 1;
    const ratedAt = Math.min(now.getTime(), classEnd(b) + (1 + unit(`at|${b.id}`) * 20) * 3600000);
    return { ...b, rating: stars, ratedAt: new Date(ratedAt).toISOString() };
  });
}

// Demo comments for demo ratings of 3 stars or fewer, which were made before comments were
// required. Real ones always have a comment. Returns the same array when nothing needs one.
const DEMO_COMMENTS = [
  "The room was too warm and the class started late.",
  "Music was too loud to hear the cues.",
  "Felt rushed at the end, no time for savasana.",
  "Too crowded, mats were almost touching.",
  "Hard to follow, not many modifications for beginners.",
  "Great teacher but the AC was off the whole class.",
];
export function seedRatingComments(bookings: Booking[]): Booking[] {
  if (!bookings.some((b) => b.rating && needsComment(b.rating) && !b.ratingComment)) return bookings;
  return bookings.map((b) =>
    b.rating && needsComment(b.rating) && !b.ratingComment ? { ...b, ratingComment: DEMO_COMMENTS[Math.floor(unit(`comment|${b.id}`) * DEMO_COMMENTS.length)] } : b,
  );
}

function unit(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  h = Math.imul(h ^ (h >>> 15), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return ((h ^= h >>> 16) >>> 0) / 4294967296;
}
