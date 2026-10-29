// Profile numbers: visit levels, achievements and per-period highlights, all built from completed
// visits (bookings that weren't cancelled and have started). Stats (lib/stats.ts) covers streaks
// and weekly charts; this file adds what the Profile page shows on top of that.
import { LocationId, SERVICES, ServiceId } from "./data";
import { dateKey, sessionStart } from "./schedule";
import { completedVisits } from "./stats";
import type { Booking } from "./store";

export type Period = "1m" | "3m" | "all";
export const PERIODS: { id: Period; label: string; days: number | null }[] = [
  { id: "1m", label: "1M", days: 30 },
  { id: "3m", label: "3M", days: 90 },
  { id: "all", label: "All time", days: null },
];

const DAY = 864e5;

function shift(key: string, days: number): string {
  return dateKey(new Date(sessionStart(key, "12:00").getTime() + days * DAY));
}

function top<K>(counts: Map<K, number>): { key: K; count: number } | undefined {
  let best: { key: K; count: number } | undefined;
  counts.forEach((count, key) => {
    if (!best || count > best.count) best = { key, count };
  });
  return best;
}

const bump = <K>(m: Map<K, number>, k: K, by = 1) => m.set(k, (m.get(k) ?? 0) + by);

// Visit levels: each milestone passed is a level. CONFIRM: demo milestones, not an ARTHA program.
export const LEVEL_MILESTONES = [10, 25, 50, 100, 250, 500, 1000];

export function visitLevel(visits: number): { level: number; next?: number } {
  const passed = LEVEL_MILESTONES.filter((m) => visits >= m).length;
  return { level: passed + 1, next: LEVEL_MILESTONES[passed] };
}

export interface ActivityRow {
  serviceId: ServiceId;
  label: string;
  count: number;
  minutes: number;
}

export interface Highlights {
  visits: number;
  visitDays: number;
  minutes: number;
  consistency: number; // share of days in the period with a visit, 0 to 1
  bestWeek: number; // most visit days in one Monday-to-Sunday week, 0 to 7
  recovery: number; // share of visit days that included a therapy or treatment, 0 to 1
  longestStreak: number;
  mostInDay: number;
  doubleDays: number; // days with two or more visits
  earliest?: Booking;
  latest?: Booking;
  favoriteClass?: { title: string; count: number };
  favoriteInstructor?: { name: string; count: number };
  creditsUsed: number;
  perksUsed: number;
  activity: ActivityRow[]; // by service, most visits first
}

export function computeHighlights(bookings: Booking[], period: Period, now = new Date()): Highlights {
  const all = completedVisits(bookings, now);
  const today = dateKey(now);
  const days = PERIODS.find((p) => p.id === period)!.days;
  const from = days ? shift(today, -(days - 1)) : "";
  const done = all.filter((b) => b.date >= from);

  // The period never starts before the first visit, so a new account isn't scored on days it didn't exist.
  const first = all.reduce((min, b) => (b.date < min ? b.date : min), today);
  const start = from > first ? from : first;
  const spanDays = Math.max(1, Math.round((sessionStart(today, "12:00").getTime() - sessionStart(start, "12:00").getTime()) / DAY) + 1);

  const perDay = new Map<string, Booking[]>();
  for (const b of done) perDay.set(b.date, [...(perDay.get(b.date) ?? []), b]);
  const visitDays = [...perDay.keys()].sort();

  let longestStreak = 0;
  let run = 0;
  let prev = "";
  for (const d of visitDays) {
    run = prev && shift(prev, 1) === d ? run + 1 : 1;
    longestStreak = Math.max(longestStreak, run);
    prev = d;
  }

  const weeks = new Map<string, number>();
  for (const d of visitDays) bump(weeks, shift(d, -((sessionStart(d, "12:00").getDay() + 6) % 7)));

  const services = new Map<ServiceId, { count: number; minutes: number }>();
  const classTitles = new Map<string, number>();
  const instructors = new Map<string, number>();
  for (const b of done) {
    const s = services.get(b.serviceId) ?? { count: 0, minutes: 0 };
    services.set(b.serviceId, { count: s.count + 1, minutes: s.minutes + b.durationMin });
    if (b.serviceId === "class") bump(classTitles, b.title);
    if (b.instructor && b.serviceId !== "event") bump(instructors, b.instructor);
  }

  const byTime = [...done].sort((a, b) => a.time.localeCompare(b.time));
  const fav = top(classTitles);
  const favI = top(instructors);
  const recoveryDays = visitDays.filter((d) => perDay.get(d)!.some((b) => ["therapy", "treatment"].includes(SERVICES[b.serviceId].category))).length;

  return {
    visits: done.length,
    visitDays: visitDays.length,
    minutes: done.reduce((sum, b) => sum + b.durationMin, 0),
    consistency: done.length ? Math.min(1, visitDays.length / spanDays) : 0,
    bestWeek: Math.max(0, ...weeks.values()),
    recovery: visitDays.length ? recoveryDays / visitDays.length : 0,
    longestStreak,
    mostInDay: Math.max(0, ...[...perDay.values()].map((l) => l.length)),
    doubleDays: [...perDay.values()].filter((l) => l.length >= 2).length,
    earliest: byTime[0],
    latest: byTime[byTime.length - 1],
    favoriteClass: fav && { title: fav.key, count: fav.count },
    favoriteInstructor: favI && { name: favI.key, count: favI.count },
    creditsUsed: done.filter((b) => b.usedCredit).length,
    perksUsed: done.filter((b) => b.perk).length,
    activity: [...services.entries()]
      .map(([serviceId, v]) => ({ serviceId, ...v, label: serviceId === "class" ? "Classes" : serviceId === "event" ? "Events" : SERVICES[serviceId].name }))
      .sort((a, b) => b.count - a.count || b.minutes - a.minutes),
  };
}

// Achievements: one badge per habit, numbered by how many times it's been done. CONFIRM: demo
// names, not an ARTHA program.
export type AchievementId =
  | "cold" | "heat" | "contrast" | "float" | "glow" | "oxygen" | "bodywork"
  | "early" | "night" | "heated" | "sound" | "double" | "week" | "explorer";

export interface Achievement {
  id: AchievementId;
  name: string;
  detail: string; // what the number counts
  count: number;
}

export function computeAchievements(bookings: Booking[], home: LocationId, now = new Date()): Achievement[] {
  const done = completedVisits(bookings, now);
  const n = (f: (b: Booking) => boolean) => done.filter(f).length;
  const isClass = (b: Booking) => b.serviceId === "class";

  const perDay = new Map<string, number>();
  for (const b of done) bump(perDay, b.date);
  // Every full 7 days in a row counts once (a 15-day streak is 2).
  let weeks = 0;
  let run = 0;
  let prev = "";
  for (const d of [...perDay.keys()].sort()) {
    run = prev && shift(prev, 1) === d ? run + 1 : 1;
    if (run % 7 === 0) weeks++;
    prev = d;
  }

  const list: Achievement[] = [
    { id: "cold", name: "Cold-Blooded", detail: "cryo sessions", count: n((b) => b.serviceId === "cryo") },
    { id: "heat", name: "Heat Seeker", detail: "infrared saunas", count: n((b) => b.serviceId === "ir-sauna") },
    { id: "contrast", name: "Hot & Cold", detail: "contrast sessions", count: n((b) => b.serviceId === "contrast") },
    { id: "float", name: "Weightless", detail: "floats", count: n((b) => b.serviceId === "float") },
    { id: "glow", name: "Glow Getter", detail: "red light sessions", count: n((b) => b.serviceId === "red-light") },
    { id: "oxygen", name: "Deep Breath", detail: "HBOT sessions", count: n((b) => b.serviceId === "hbot") },
    { id: "bodywork", name: "Well Kneaded", detail: "treatments", count: n((b) => SERVICES[b.serviceId].category === "treatment") },
    { id: "early", name: "Early Riser", detail: "classes before 8 AM", count: n((b) => isClass(b) && b.time < "08:00") },
    { id: "night", name: "Night Owl", detail: "classes at 6 PM or later", count: n((b) => isClass(b) && b.time >= "18:00") },
    { id: "heated", name: "Turn Up the Heat", detail: "heated classes", count: n((b) => isClass(b) && /Infrared Heated/.test(b.title)) },
    { id: "sound", name: "Sound Mind", detail: "sound baths", count: n((b) => /Sound Bath|Sound Healing/.test(b.title)) },
    { id: "double", name: "Double Up", detail: "days with 2+ visits", count: [...perDay.values()].filter((c) => c >= 2).length },
    { id: "week", name: "On a Roll", detail: "7-day streaks", count: weeks },
    { id: "explorer", name: "Both Studios", detail: "visits at your other studio", count: n((b) => b.location !== home) },
  ];
  // Earned first, biggest numbers first; the rest keep their order.
  return [...list.filter((a) => a.count > 0).sort((a, b) => b.count - a.count), ...list.filter((a) => a.count === 0)];
}
