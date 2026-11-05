"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { ChevronLeft, Star } from "lucide-react";
import { LOCATIONS, LocationId } from "@/lib/data";
import { dayLabel, timeLabel } from "@/lib/format";
import { average, classEnd, isRatable } from "@/lib/ratings";
import { Booking, useStore } from "@/lib/store";

// Staff admin: the management side, where the team sees what members and guests don't. For now it
// holds class and event ratings (lib/ratings.ts): 1 to 5 stars after a class or event, never shown in the member app.
// Ratings are anonymous, so this page never names who gave one (members are told so when rating).
// It sits outside the member tabs (AppShell) and opens from Account → Demo. There's no staff sign-in
// yet: with a backend this page needs its own login and the ratings need a server.

const PERIODS = [
  { id: "7", label: "7 days", days: 7 },
  { id: "30", label: "30 days", days: 30 },
  { id: "all", label: "All time", days: Infinity },
] as const;
type Studio = LocationId | "all";

export default function AdminPage() {
  const { allBookings } = useStore();
  const [studio, setStudio] = useState<Studio>("all");
  const [period, setPeriod] = useState<(typeof PERIODS)[number]["id"]>("30");

  const { rated, taken } = useMemo(() => {
    const now = Date.now();
    const days = PERIODS.find((p) => p.id === period)!.days;
    // Classes that happened (not cancelled) and have ended, in this studio and period.
    const taken = allBookings.filter(
      (b) => isRatable(b) && b.status === "booked" && classEnd(b) <= now && now - classEnd(b) < days * 864e5 && (studio === "all" || b.location === studio),
    );
    return { rated: taken.filter((b) => b.rating), taken };
  }, [allBookings, studio, period]);

  const stars = rated.map((b) => b.rating!);
  const byInstructor = group(rated, (b) => b.instructor ?? (b.serviceId === "event" ? "Events" : "No instructor"));
  const byClass = group(rated, (b) => b.title);
  const newest = [...rated].sort((a, b) => (b.ratedAt ?? "").localeCompare(a.ratedAt ?? ""));
  const recent = newest.slice(0, 25);
  const comments = newest.filter((b) => b.ratingComment);
  const counts = [5, 4, 3, 2, 1].map((n) => ({ n, count: stars.filter((s) => s === n).length }));
  const most = Math.max(1, ...counts.map((c) => c.count));

  return (
    <div className="mx-auto min-h-screen max-w-3xl bg-sand px-4 pb-12 pt-4 text-shell">
      <header className="flex items-center justify-between gap-3">
        <Link href="/membership" className="-ml-2 flex min-h-[44px] items-center gap-1 px-2 text-sm active:opacity-60">
          <ChevronLeft size={18} /> Member app
        </Link>
        <span className="flex items-center gap-2">
          <span className="font-wordmark text-lg tracking-[0.35em]">ARTHA</span>
          <span className="rounded-full bg-card px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-widest">Admin</span>
        </span>
      </header>

      <h1 className="mt-3 font-heading text-4xl">Class and event ratings</h1>
      <p className="mt-1 text-sm text-muted">
        Members and guests rate a class or event 1 to 5 stars after it ends. Ratings are anonymous: no one, staff included, sees who gave them. Staff only: the member app never shows ratings.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Chips<Studio>
          value={studio}
          onChange={setStudio}
          options={[
            { id: "all", label: "Both studios" },
            { id: "weho", label: LOCATIONS.weho.short },
            { id: "scity", label: LOCATIONS.scity.short },
          ]}
          label="Studio"
        />
        <Chips value={period} onChange={setPeriod} options={PERIODS.map(({ id, label }) => ({ id, label }))} label="Period" />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <Tile label="Average" value={stars.length ? average(stars).toFixed(1) : "–"} star={!!stars.length} />
        <Tile label="Ratings" value={String(stars.length)} />
        <Tile label="Rated" value={taken.length ? `${Math.round((stars.length / taken.length) * 100)}%` : "–"} note={`of ${taken.length} class and event visits`} />
      </div>

      {stars.length === 0 ? (
        <p className="mt-6 rounded-2xl bg-card p-4 text-sm">No ratings for these filters yet.</p>
      ) : (
        <>
          <section className="mt-4 rounded-2xl bg-card p-4">
            <h2 className="text-xl">Stars given</h2>
            <div className="mt-2 space-y-1.5">
              {counts.map(({ n, count }) => (
                <div key={n} className="flex items-center gap-2 text-sm">
                  <span className="flex w-8 shrink-0 items-center gap-0.5">
                    {n} <Star size={12} className="fill-current" />
                  </span>
                  <span className="h-3 min-w-0 flex-1 rounded-full bg-sand">
                    <span className="block h-3 rounded-full bg-sage" style={{ width: `${(count / most) * 100}%` }} />
                  </span>
                  <span className="w-16 shrink-0 text-right tabular-nums">
                    {count} · {Math.round((count / stars.length) * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </section>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Breakdown title="By instructor" rows={byInstructor} />
            <Breakdown title="By class or event" rows={byClass} />
          </div>

          {/* Why a class or event got 3 stars or fewer. Private: no name, like the stars. */}
          <section className="mt-4 rounded-2xl bg-card p-4">
            <h2 className="text-xl">Comments</h2>
            <p className="text-xs text-muted">Required with 3 stars or fewer. Private, with no name.</p>
            {comments.length === 0 ? (
              <p className="mt-2 text-sm">No comments for these filters yet.</p>
            ) : (
              <ul className="mt-1 divide-y divide-line">
                {comments.map((b) => (
                  <li key={b.id} className="py-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <p className="min-w-0 text-sm font-medium">
                        {b.title}
                        {b.instructor && <span className="font-normal"> · {b.instructor}</span>}
                      </p>
                      <Stars value={b.rating!} />
                    </div>
                    <p className="text-xs text-muted">
                      {dayLabel(b.date)} {timeLabel(b.time)} · {LOCATIONS[b.location].short}
                    </p>
                    <p className="mt-1 whitespace-pre-line break-words text-sm">&ldquo;{b.ratingComment}&rdquo;</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="mt-4 rounded-2xl bg-card p-4">
            <h2 className="text-xl">Latest ratings</h2>
            {rated.length > recent.length && <p className="text-xs text-muted">The {recent.length} newest of {rated.length}</p>}
            <ul className="mt-1 divide-y divide-line">
              {recent.map((b) => (
                <li key={b.id} className="flex items-start justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {b.title}
                      {b.instructor && <span className="font-normal"> · {b.instructor}</span>}
                    </p>
                    <p className="text-xs text-muted">
                      {dayLabel(b.date)} {timeLabel(b.time)} · {LOCATIONS[b.location].short}
                    </p>
                  </div>
                  <Stars value={b.rating!} />
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}

type Row = { name: string; avg: number; count: number };

function group(rated: Booking[], key: (b: Booking) => string): Row[] {
  const map = new Map<string, number[]>();
  for (const b of rated) map.set(key(b), [...(map.get(key(b)) ?? []), b.rating!]);
  return [...map.entries()].map(([name, s]) => ({ name, avg: average(s), count: s.length })).sort((a, b) => b.count - a.count || b.avg - a.avg);
}

function Breakdown({ title, rows }: { title: string; rows: Row[] }) {
  return (
    <section className="min-w-0 rounded-2xl bg-card p-4">
      <h2 className="text-xl">{title}</h2>
      <div className="mt-1 flex justify-between text-[11px] uppercase tracking-widest text-muted">
        <span>Name</span>
        <span>Average · ratings</span>
      </div>
      <ul className="mt-1 divide-y divide-line">
        {rows.map((r) => (
          <li key={r.name} className="flex items-center justify-between gap-3 py-2 text-sm">
            <span className="min-w-0 truncate">{r.name}</span>
            <span className="flex shrink-0 items-center gap-1 tabular-nums">
              <Star size={13} className="fill-sage text-sage" />
              <span className="font-medium">{r.avg.toFixed(1)}</span>
              <span className="w-9 text-right text-muted">{r.count}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <span className="flex shrink-0 items-center" role="img" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={14} className={n <= value ? "fill-sage text-sage" : "text-line"} />
      ))}
    </span>
  );
}

function Tile({ label, value, note, star }: { label: string; value: string; note?: string; star?: boolean }) {
  return (
    <div className="rounded-2xl bg-card p-3">
      <p className="text-[11px] uppercase tracking-widest text-muted">{label}</p>
      <p className="mt-0.5 flex items-center gap-1 font-heading text-3xl leading-none">
        {value}
        {star && <Star size={18} className="fill-sage text-sage" />}
      </p>
      {note && <p className="mt-1 text-[11px] text-muted">{note}</p>}
    </div>
  );
}

function Chips<T extends string>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: { id: T; label: string }[]; label: string }) {
  return (
    <div className="flex rounded-full border border-line p-0.5" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.id}
          role="radio"
          aria-checked={value === o.id}
          onClick={() => onChange(o.id)}
          className={clsx("min-h-[36px] rounded-full px-3 text-xs", value === o.id ? "bg-sage font-medium text-ink" : "active:bg-line")}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
