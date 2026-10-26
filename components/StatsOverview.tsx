"use client";

import Link from "next/link";
import { Flame, Heart, Timer, Trophy } from "lucide-react";
import { useStore } from "@/lib/store";
import { computeStats } from "@/lib/stats";

// Compact stats for the Account tab: the headline numbers and top services, with a link to the
// full dashboard.
export function StatsOverview() {
  const { bookings } = useStore();
  const s = computeStats(bookings);
  const top = s.byService.slice(0, 3);
  const max = Math.max(1, ...top.map((x) => x.count));

  if (s.visits === 0) {
    return (
      <section className="rounded-3xl border border-line bg-shell p-5 text-sm">
        <h2 className="font-serif text-2xl">Your stats</h2>
        <p className="mt-1 text-muted">Your streaks, visits and favorites show up here after your first visit.</p>
      </section>
    );
  }

  const tiles = [
    { icon: Flame, label: "Streak", value: `${s.currentStreak}d` },
    { icon: Trophy, label: "Best", value: `${s.longestStreak}d` },
    { icon: Heart, label: "Visits", value: String(s.visits) },
    { icon: Timer, label: "Hours", value: String(Math.round(s.minutes / 60)) },
  ];

  return (
    <section className="rounded-3xl border border-line bg-shell p-5">
      <div className="flex items-baseline justify-between">
        <h2 className="font-serif text-2xl">Your stats</h2>
        <span className="text-xs text-muted">{s.thisMonth} visits this month</span>
      </div>
      <div className="mt-3 grid grid-cols-4 gap-2">
        {tiles.map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-2xl bg-sand/70 px-2 py-3 text-center">
            <Icon size={14} className="mx-auto text-moss" />
            <p className="mt-1 font-serif text-2xl leading-none">{value}</p>
            <p className="mt-1 text-[10px] uppercase tracking-wider text-muted">{label}</p>
          </div>
        ))}
      </div>
      <ul className="mt-4 space-y-2">
        {top.map((x) => (
          <li key={x.serviceId} className="text-sm">
            <div className="flex justify-between">
              <span>{x.label}</span>
              <span className="font-medium">{x.count}</span>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-sand">
              <div className="h-1.5 rounded-full bg-moss" style={{ width: `${(x.count / max) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
      <Link href="/stats" className="mt-4 block text-sm text-moss underline-offset-2 hover:underline">
        See all stats and visit history →
      </Link>
    </section>
  );
}
