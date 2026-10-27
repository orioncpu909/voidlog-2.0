"use client";

import Link from "next/link";
import clsx from "clsx";
import { LOCATIONS } from "@/lib/data";
import { dateKey, sessionStart } from "@/lib/schedule";
import { useStore } from "@/lib/store";
import { dayLabel, timeLabel } from "@/lib/format";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

// Home: this month at a glance. Sage dots are upcoming bookings, faint dots are past visits.
// Tapping a day opens it in the Calendar.
export function HomeCalendar() {
  const { bookings } = useStore();
  const now = new Date();
  const today = dateKey(now);
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const cells = [...Array(first.getDay()).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  const active = bookings.filter((b) => b.status === "booked");
  const upcoming = active.filter((b) => sessionStart(b.date, b.time) > now).sort((a, b) => sessionStart(a.date, a.time).getTime() - sessionStart(b.date, b.time).getTime());
  const upcomingDays = new Set(upcoming.map((b) => b.date));
  const pastDays = new Set(active.filter((b) => sessionStart(b.date, b.time) <= now).map((b) => b.date));
  const next = upcoming[0];

  return (
    <section className="flex min-h-0 flex-1 flex-col rounded-3xl border border-line bg-card px-4 pb-3 pt-3">
      <div className="flex items-baseline justify-between">
        <h2 className="font-serif text-xl">{now.toLocaleDateString("en-US", { month: "long" })}</h2>
        <Link href="/calendar" className="text-xs text-moss underline-offset-2 hover:underline">
          Open calendar
        </Link>
      </div>
      <div className="mt-1 grid grid-cols-7 text-center text-[10px] text-muted">
        {WEEKDAYS.map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-7 text-center" style={{ gridTemplateRows: `repeat(${Math.ceil(cells.length / 7)}, minmax(0, 1fr))` }}>
        {cells.map((day, i) => {
          if (!day) return <span key={`e${i}`} />;
          const key = dateKey(new Date(now.getFullYear(), now.getMonth(), day));
          const isToday = key === today;
          return (
            <Link
              key={key}
              href={`/calendar?day=${key}`}
              className={clsx(
                "relative m-auto flex aspect-square h-[min(1.75rem,100%)] items-center justify-center rounded-full text-xs",
                isToday ? "bg-sage text-ink" : key < today ? "text-muted" : "",
              )}
            >
              {day}
              {(upcomingDays.has(key) || pastDays.has(key)) && (
                <span
                  className={clsx(
                    "absolute -bottom-0.5 h-1 w-1 rounded-full",
                    upcomingDays.has(key) ? (isToday ? "bg-ink" : "bg-sage-deep") : "bg-muted/50",
                  )}
                />
              )}
            </Link>
          );
        })}
      </div>
      <div className="mt-2 border-t border-line pt-2 text-xs">
        {next ? (
          <Link href="/calendar" className="flex items-center gap-2">
            <span className="shrink-0 font-medium text-moss">Next</span>
            <span className="truncate">
              {dayLabel(next.date)} · {timeLabel(next.time)} · {next.title} · {LOCATIONS[next.location].short}
            </span>
            {upcoming.length > 1 && <span className="ml-auto shrink-0 text-muted">+{upcoming.length - 1}</span>}
          </Link>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-muted">Nothing booked yet.</span>
            <Link href="/book" className="font-medium text-moss">
              Book a visit →
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
