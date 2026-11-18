"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { TIERS } from "@/lib/data";
import { useStore } from "@/lib/store";
import { computeStats } from "@/lib/stats";

// One-row stats for the Account tab: the headline numbers, tapping through to the full dashboard
// (visits by service, history and the rest live there). Members only: Wellness accounts don't get
// streaks or stats, to keep a new account simple.
export function StatsOverview() {
  const { member, bookings } = useStore();
  const s = computeStats(bookings);

  if (!TIERS[member.tier].isMember) return null;

  if (s.visits === 0) {
    return (
      <p className="rounded-2xl border border-line bg-card px-4 py-3 text-sm text-muted">Your streaks and visits show up here after your first visit.</p>
    );
  }

  const numbers = [
    { label: "Streak", value: `${s.currentStreak}d` },
    { label: "Best", value: `${s.longestStreak}d` },
    { label: "Visits", value: String(s.visits) },
    { label: "Hours", value: String(Math.round(s.minutes / 60)) },
  ];

  return (
    <Link href="/stats?from=account" className="flex items-center gap-3 rounded-2xl border border-line bg-card px-4 py-3 hover:border-muted">
      <span className="font-heading text-xl">Stats</span>
      <span className="flex flex-1 justify-around text-center">
        {numbers.map((n) => (
          <span key={n.label}>
            <span className="stat-num block text-lg leading-none">{n.value}</span>
            <span className="text-[9px] uppercase tracking-wider text-muted">{n.label}</span>
          </span>
        ))}
      </span>
      <ChevronRight size={18} className="shrink-0 text-muted" />
    </Link>
  );
}
