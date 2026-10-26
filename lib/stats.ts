// Streaks and stats, built from completed visits (bookings that weren't cancelled and have started).
import { Category, SERVICES, ServiceId, priceFor } from "./data";
import { dateKey, sessionStart } from "./schedule";
import type { Booking } from "./store";

export interface ServiceCount {
  serviceId: ServiceId;
  label: string;
  count: number;
}

export interface Stats {
  visits: number;
  thisMonth: number;
  minutes: number;
  currentStreak: number; // consecutive days with a visit, ending today or yesterday
  longestStreak: number;
  visitedToday: boolean;
  byService: ServiceCount[];
  byCategory: Record<Category, number>;
  weekly: { label: string; count: number }[]; // last 8 weeks, oldest first
  favoriteClass?: { title: string; count: number };
  favoriteInstructor?: { name: string; count: number };
  saved: number; // vs regular Wellness prices
}

const DAY = 864e5;

function shift(key: string, days: number): string {
  return dateKey(new Date(sessionStart(key, "12:00").getTime() + days * DAY));
}

function top(counts: Map<string, number>): { key: string; count: number } | undefined {
  let best: { key: string; count: number } | undefined;
  counts.forEach((count, key) => {
    if (!best || count > best.count) best = { key, count };
  });
  return best;
}

export function completedVisits(bookings: Booking[], now = new Date()): Booking[] {
  return bookings.filter((b) => b.status === "booked" && sessionStart(b.date, b.time) <= now);
}

export function computeStats(bookings: Booking[], now = new Date()): Stats {
  const done = completedVisits(bookings, now);
  const today = dateKey(now);
  const days = new Set(done.map((b) => b.date));

  let currentStreak = 0;
  let cursor = days.has(today) ? today : shift(today, -1);
  while (days.has(cursor)) {
    currentStreak++;
    cursor = shift(cursor, -1);
  }

  let longestStreak = 0;
  let run = 0;
  let prev = "";
  for (const d of [...days].sort()) {
    run = prev && shift(prev, 1) === d ? run + 1 : 1;
    longestStreak = Math.max(longestStreak, run);
    prev = d;
  }

  const serviceCounts = new Map<ServiceId, number>();
  const classTitles = new Map<string, number>();
  const instructors = new Map<string, number>();
  const byCategory: Record<Category, number> = { class: 0, therapy: 0, treatment: 0, event: 0 };
  let saved = 0;
  for (const b of done) {
    serviceCounts.set(b.serviceId, (serviceCounts.get(b.serviceId) ?? 0) + 1);
    byCategory[SERVICES[b.serviceId].category]++;
    if (b.serviceId === "class") classTitles.set(b.title, (classTitles.get(b.title) ?? 0) + 1);
    if (b.instructor && b.serviceId !== "event") instructors.set(b.instructor, (instructors.get(b.instructor) ?? 0) + 1);
    saved += Math.max(0, priceFor("wellness", b.serviceId, b.location, b.date).regular - b.price);
  }

  const byService = [...serviceCounts.entries()]
    .map(([serviceId, count]) => ({
      serviceId,
      count,
      label: serviceId === "class" ? "Classes" : serviceId === "event" ? "Events" : SERVICES[serviceId].name,
    }))
    .sort((a, b) => b.count - a.count);

  // Rolling 7-day weeks; the last one ends today.
  const weekly = Array.from({ length: 8 }, (_, i) => {
    const weekEnd = shift(today, -(7 - i) * 7);
    const from = shift(weekEnd, -6);
    return {
      label: sessionStart(from, "12:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      count: done.filter((b) => b.date >= from && b.date <= weekEnd).length,
    };
  });

  const fav = top(classTitles);
  const favI = top(instructors);
  const month = today.slice(0, 7);
  return {
    visits: done.length,
    thisMonth: done.filter((b) => b.date.startsWith(month)).length,
    minutes: done.reduce((sum, b) => sum + b.durationMin, 0),
    currentStreak,
    longestStreak,
    visitedToday: days.has(today),
    byService,
    byCategory,
    weekly,
    favoriteClass: fav && { title: fav.key, count: fav.count },
    favoriteInstructor: favI && { name: favI.key, count: favI.count },
    saved: Math.round(saved * 100) / 100,
  };
}
