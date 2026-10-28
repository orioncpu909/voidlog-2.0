"use client";

import Link from "next/link";
import clsx from "clsx";
import { ChevronRight, Flame } from "lucide-react";
import { useStore } from "@/lib/store";
import { completedVisits, computeStats } from "@/lib/stats";
import { dateKey } from "@/lib/schedule";

const WEEK_LETTERS = ["M", "T", "W", "T", "F", "S", "S"];

// Home, top: the current streak and this week (Monday to Sunday) at a glance. Visited days are
// filled, today is ringed, the rest of the week is faint. Everything else lives on the Stats page.
export function StreakCard() {
  const { bookings } = useStore();
  const s = computeStats(bookings);
  const visited = new Set(completedVisits(bookings).map((b) => b.date));
  const todayDate = new Date();
  const today = dateKey(todayDate);
  const monday = new Date(todayDate);
  monday.setDate(todayDate.getDate() - ((todayDate.getDay() + 6) % 7));
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return dateKey(d);
  });
  const thisWeek = week.filter((d) => visited.has(d)).length;
  const hint =
    s.visits === 0
      ? "Book your first visit to start a streak."
      : s.visitedToday
        ? "Today counts. Come back tomorrow to keep it going."
        : s.currentStreak > 0
          ? "Visit today to keep it going."
          : "Visit today to start a new streak.";

  return (
    <Link href="/stats" className="block shrink-0 rounded-3xl border border-line bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="stat-num flex items-center gap-1.5 text-2xl leading-none">
          <Flame size={20} className="text-sage-light" />
          {s.currentStreak}-day streak
        </p>
        <span className="flex shrink-0 items-center text-xs text-moss">
          Stats <ChevronRight size={14} />
        </span>
      </div>
      <p className="mt-1 text-xs text-muted">{hint}</p>

      <div className="mt-3 flex items-end justify-between" aria-label={`This week: ${thisWeek} visit${thisWeek === 1 ? "" : "s"}`}>
        {week.map((d, i) => {
          const done = visited.has(d);
          const isToday = d === today;
          const future = d > today;
          return (
            <span key={d} className="flex flex-col items-center gap-1">
              <span className={clsx("text-[10px]", isToday ? "font-semibold text-shell" : "text-muted")}>{WEEK_LETTERS[i]}</span>
              <span
                className={clsx(
                  "h-7 w-7 rounded-full",
                  done ? clsx("bg-sage", isToday && "ring-2 ring-shell ring-offset-2 ring-offset-card") : isToday ? "border-2 border-shell" : future ? "border border-dashed border-line" : "border border-line",
                )}
              />
            </span>
          );
        })}
      </div>
    </Link>
  );
}
