"use client";

import { useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { Footprints } from "lucide-react";
import { STEP_GOAL, demoSteps, stepSource } from "@/lib/devices";
import { dateKey, sessionStart } from "@/lib/schedule";
import { completedVisits } from "@/lib/stats";
import { useStore } from "@/lib/store";

// Last 7 days of steps from the connected app (oldest first; today is partial so far).
export function useSteps() {
  const { member, bookings } = useStore();
  const source = stepSource(member.connections ?? []);
  if (!source) return null;
  const visited = new Set(completedVisits(bookings).map((b) => b.date));
  const now = new Date();
  const dayFraction = Math.min(1, (now.getHours() * 60 + now.getMinutes()) / (21 * 60));
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = dateKey(d);
    const full = demoSteps(`${member.id}|${source.id}`, key, visited.has(key));
    return { date: key, steps: i === 6 ? Math.round((full * dayFraction) / 10) * 10 : full };
  });
  const today = days[6].steps;
  const average = Math.round(days.slice(0, 6).reduce((sum, d) => sum + d.steps, 0) / 6);
  return { source, days, today, average, atGoal: days.slice(0, 6).filter((d) => d.steps >= STEP_GOAL).length };
}

const fmt = (n: number) => n.toLocaleString("en-US");

export function StepsCard() {
  const steps = useSteps();
  const [hover, setHover] = useState<number | null>(null);

  if (!steps) {
    return (
      <section className="flex items-center gap-3 rounded-3xl border border-dashed border-line p-4 text-sm">
        <Footprints size={20} className="shrink-0 text-moss" />
        <div className="flex-1">
          <p className="font-medium">Track your steps</p>
          <p className="text-xs text-muted">Connect Apple Health, Garmin, WHOOP or Strava.</p>
        </div>
        <Link href="/membership#connected-apps" className="shrink-0 rounded-full bg-moss px-3 py-1.5 text-xs text-shell">
          Connect an app
        </Link>
      </section>
    );
  }

  const max = Math.max(STEP_GOAL, ...steps.days.map((d) => d.steps));
  const shown = hover ?? 6;
  const pct = Math.min(100, Math.round((steps.today / STEP_GOAL) * 100));

  return (
    <section className="rounded-3xl border border-line bg-shell p-5">
      <div className="flex items-baseline justify-between">
        <h2 className="flex items-center gap-1.5 font-serif text-xl">
          <Footprints size={18} className="text-moss" /> Steps
        </h2>
        <span className="text-xs text-muted">from {steps.source.name}</span>
      </div>

      <div className="mt-3 flex items-end justify-between">
        <div>
          <p className="font-serif text-4xl leading-none">{fmt(steps.today)}</p>
          <p className="mt-1 text-xs text-muted">today · goal {fmt(STEP_GOAL)}</p>
        </div>
        <div className="text-right">
          <p className="font-serif text-2xl leading-none">{fmt(steps.average)}</p>
          <p className="mt-1 text-xs text-muted">daily avg, last 6 days</p>
        </div>
      </div>
      <div className="mt-2 h-2 rounded-full bg-sand">
        <div className="h-2 rounded-full bg-moss" style={{ width: `${pct}%` }} />
      </div>

      <p className="mt-4 h-5 text-sm">
        <span className="text-muted">{shown === 6 ? "Today" : sessionStart(steps.days[shown].date, "12:00").toLocaleDateString("en-US", { weekday: "long" })}: </span>
        <span className="font-medium">{fmt(steps.days[shown].steps)} steps</span>
      </p>
      <div className="relative mt-2 flex h-24 items-end gap-[2px] border-b border-line" onMouseLeave={() => setHover(null)}>
        <span className="pointer-events-none absolute inset-x-0 border-t border-dashed border-muted/40" style={{ bottom: `${(STEP_GOAL / max) * 100}%` }} aria-hidden />
        {steps.days.map((d, i) => (
          <button
            key={d.date}
            onMouseEnter={() => setHover(i)}
            onFocus={() => setHover(i)}
            onClick={() => setHover(i)}
            aria-label={`${d.date}: ${d.steps} steps`}
            className="group flex h-full flex-1 items-end justify-center"
          >
            <span className={clsx("w-3/5 rounded-t", i === shown ? "bg-moss" : "bg-moss/35 group-hover:bg-moss/60")} style={{ height: `${(d.steps / max) * 100}%` }} />
          </button>
        ))}
      </div>
      <div className="mt-1 flex text-center text-[10px] text-muted">
        {steps.days.map((d) => (
          <span key={d.date} className="flex-1">
            {sessionStart(d.date, "12:00").toLocaleDateString("en-US", { weekday: "narrow" })}
          </span>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted">
        Hit your goal {steps.atGoal} of the last 6 days. Dashed line = {fmt(STEP_GOAL)} steps.
      </p>
    </section>
  );
}
