"use client";

import Link from "next/link";
import clsx from "clsx";
import { Flame } from "lucide-react";
import { useStore } from "@/lib/store";
import { completedVisits, computeStats } from "@/lib/stats";
import { dateKey, sessionStart } from "@/lib/schedule";

// Home, top: the current streak, the last 7 days at a glance, and the key numbers.
export function StreakCard() {
  const { bookings } = useStore();
  const s = computeStats(bookings);
  const visited = new Set(completedVisits(bookings).map((b) => b.date));
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return dateKey(d);
  });
  const hint =
    s.visits === 0
      ? "Book your first visit to start a streak."
      : s.visitedToday
        ? "Today counts. Come back tomorrow to keep it going."
        : s.currentStreak > 0
          ? "Visit today to keep it going."
          : "Visit today to start a new streak.";

  return (
    <Link href="/stats" className="block shrink-0 rounded-3xl bg-moss p-4 text-shell">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 font-serif text-3xl leading-none">
            <Flame size={22} className="text-copper" />
            {s.currentStreak}-day streak
          </p>
          <p className="mt-1 text-xs opacity-80">{hint}</p>
        </div>
        <span className="shrink-0 text-xs opacity-80">Your stats →</span>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex gap-1" aria-label="Visits in the last 7 days">
          {week.map((d) => (
            <span key={d} className="flex flex-col items-center gap-0.5">
              <span
                className={clsx(
                  "flex h-[22px] w-[22px] items-center justify-center rounded-full text-[10px]",
                  visited.has(d) ? "bg-shell text-moss" : "border border-shell/30 text-shell/70",
                )}
              >
                {sessionStart(d, "12:00").toLocaleDateString("en-US", { weekday: "narrow" })}
              </span>
            </span>
          ))}
        </div>
        <div className="flex shrink-0 gap-2.5 text-right">
          {[
            { label: "Best", value: `${s.longestStreak}d` },
            { label: "Month", value: s.thisMonth },
            { label: "Total", value: s.visits },
          ].map((x) => (
            <div key={x.label}>
              <p className="font-serif text-lg leading-none">{x.value}</p>
              <p className="text-[9px] uppercase tracking-wider opacity-70">{x.label}</p>
            </div>
          ))}
        </div>
      </div>
    </Link>
  );
}
