"use client";

import Link from "next/link";
import { Flame } from "lucide-react";
import { useStore } from "@/lib/store";
import { computeStats } from "@/lib/stats";

// Home: current streak and total visits, linking to the full stats dashboard.
export function StreakCard() {
  const { bookings } = useStore();
  const s = computeStats(bookings);
  const hint =
    s.visits === 0
      ? "Book your first visit to start a streak."
      : s.visitedToday
        ? "Today counts. Come back tomorrow to keep it going."
        : s.currentStreak > 0
          ? "Visit today to keep your streak going."
          : "Visit today to start a new streak.";

  return (
    <Link href="/stats" className="block rounded-3xl border border-line bg-shell p-5 hover:border-muted">
      <div className="grid grid-cols-2 divide-x divide-line">
        <div className="pr-4">
          <p className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-muted">
            <Flame size={14} className="text-clay" /> Current streak
          </p>
          <p className="mt-1 font-serif text-4xl leading-none">
            {s.currentStreak} <span className="text-lg">day{s.currentStreak === 1 ? "" : "s"}</span>
          </p>
        </div>
        <div className="pl-4">
          <p className="text-xs uppercase tracking-widest text-muted">Total visits</p>
          <p className="mt-1 font-serif text-4xl leading-none">{s.visits}</p>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-line pt-3 text-xs">
        <span className="text-muted">{hint}</span>
        <span className="shrink-0 text-moss">Your stats →</span>
      </div>
    </Link>
  );
}
