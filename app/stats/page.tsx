"use client";

import { useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { ArrowLeft, Flame, Heart, Receipt, Sparkles, Timer, Trophy, UserRound } from "lucide-react";
import { LOCATIONS, SERVICES, TIERS } from "@/lib/data";
import { useStore } from "@/lib/store";
import { computeStats } from "@/lib/stats";
import { money, shortDate } from "@/lib/format";

export default function StatsPage() {
  const { member, bookings } = useStore();
  const s = computeStats(bookings);
  const [hover, setHover] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);
  const maxWeek = Math.max(1, ...s.weekly.map((w) => w.count));
  const maxService = Math.max(1, ...s.byService.map((x) => x.count));
  const shownWeek = hover ?? s.weekly.length - 1;
  const hours = Math.round((s.minutes / 60) * 10) / 10;

  if (s.visits === 0) {
    return (
      <div className="space-y-5">
        <Header />
        <div className="rounded-3xl border border-dashed border-line p-8 text-center text-sm text-muted">
          <p>Your stats will show up here after your first visit.</p>
          <Link href="/book" className="mt-3 inline-block rounded-full bg-sage px-5 py-2 text-ink">
            Book a visit
          </Link>
        </div>
      </div>
    );
  }

  const tiles = [
    { icon: Flame, label: "Current streak", value: `${s.currentStreak} day${s.currentStreak === 1 ? "" : "s"}` },
    { icon: Trophy, label: "Longest streak", value: `${s.longestStreak} day${s.longestStreak === 1 ? "" : "s"}` },
    { icon: Heart, label: "Total visits", value: String(s.visits) },
    { icon: Timer, label: "Time in sanctuary", value: `${hours} hr` },
  ];

  return (
    <div className="space-y-6">
      <Header />

      <section className="grid grid-cols-2 gap-2">
        {tiles.map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-2xl border border-line bg-card p-4">
            <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-muted">
              <Icon size={13} className="text-moss" /> {label}
            </p>
            <p className="stat-num mt-1.5 text-3xl leading-none">{value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-3xl border border-line bg-card p-5">
        <div className="flex items-baseline justify-between">
          <h2 className="font-serif text-xl">Visits per week</h2>
          <p className="text-xs text-muted">{s.thisMonth} this month</p>
        </div>
        <p className="mt-1 h-5 text-sm">
          <span className="text-muted">Week of {s.weekly[shownWeek].label}: </span>
          <span className="font-medium">
            {s.weekly[shownWeek].count} visit{s.weekly[shownWeek].count === 1 ? "" : "s"}
          </span>
        </p>
        <div className="mt-3 flex h-32 items-end gap-[2px] border-b border-line" onMouseLeave={() => setHover(null)}>
          {s.weekly.map((w, i) => (
            <button
              key={w.label}
              onMouseEnter={() => setHover(i)}
              onFocus={() => setHover(i)}
              onClick={() => setHover(i)}
              aria-label={`Week of ${w.label}: ${w.count} visits`}
              className="group flex h-full flex-1 items-end justify-center"
            >
              <span
                className={clsx("w-3/5 rounded-t transition-colors", i === shownWeek ? "bg-moss" : "bg-moss/35 group-hover:bg-moss/60")}
                style={{ height: `${w.count === 0 ? 2 : (w.count / maxWeek) * 100}%` }}
              />
            </button>
          ))}
        </div>
        <div className="mt-1.5 flex justify-between text-[10px] text-muted">
          <span>{s.weekly[0].label}</span>
          <span>This week</span>
        </div>
      </section>

      <section className="rounded-3xl border border-line bg-card p-5">
        <h2 className="font-serif text-xl">By service</h2>
        <ul className="mt-3 space-y-2.5">
          {s.byService.map((x) => (
            <li key={x.serviceId} className="text-sm">
              <div className="flex justify-between">
                <span>{x.label}</span>
                <span className="stat-num">{x.count}</span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-sand">
                <div className="h-2 rounded-full bg-moss" style={{ width: `${(x.count / maxService) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-4 border-t border-line pt-3 text-xs text-muted">
          {plural(s.byCategory.class, "class", "classes")} · {plural(s.byCategory.therapy, "therapy", "therapies")} ·{" "}
          {plural(s.byCategory.treatment, "treatment", "treatments")}
          {s.byCategory.event > 0 && ` · ${plural(s.byCategory.event, "event", "events")}`}
        </p>
      </section>

      <section className="grid grid-cols-1 gap-2">
        {s.favoriteClass && (
          <Favorite icon={Sparkles} label="Favorite class" value={s.favoriteClass.title} detail={`${s.favoriteClass.count}×`} />
        )}
        {s.favoriteInstructor && (
          <Favorite icon={UserRound} label="Most booked with" value={s.favoriteInstructor.name} detail={`${s.favoriteInstructor.count}×`} />
        )}
        {s.saved > 0 && (
          <Favorite
            icon={Heart}
            label={TIERS[member.tier].isMember ? "Saved with your membership" : "Saved with specials and offers"}
            value={money(s.saved)}
            detail="vs regular prices"
          />
        )}
        {!TIERS[member.tier].isMember && <Favorite icon={Receipt} label="Spent on visits" value={money(s.spent)} detail={`${s.visits} visits`} />}
      </section>

      <section className="rounded-3xl border border-line bg-card p-5">
        <div className="flex items-baseline justify-between">
          <h2 className="font-serif text-xl">Visit history</h2>
          <p className="text-xs text-muted">{s.history.length} total</p>
        </div>
        <ul className="mt-3 divide-y divide-line">
          {(showAll ? s.history : s.history.slice(0, HISTORY_PREVIEW)).map((b) => (
            <li key={b.id} className="flex items-center gap-3 py-2.5 text-sm">
              <span className="w-12 shrink-0 text-xs text-muted">{shortDate(b.date)}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate">{b.title}</p>
                <p className="truncate text-xs text-muted">
                  {[
                    SERVICES[b.serviceId].category === "class" ? "Class" : SERVICES[b.serviceId].category === "event" ? "Event" : null,
                    LOCATIONS[b.location].short,
                    b.serviceId !== "event" ? b.instructor : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <span className="shrink-0 text-xs">{b.usedCredit ? "Credit" : b.price === 0 ? "Included" : money(b.price)}</span>
            </li>
          ))}
        </ul>
        {s.history.length > HISTORY_PREVIEW && (
          <button onClick={() => setShowAll(!showAll)} className="mt-2 text-sm text-moss underline-offset-2 hover:underline">
            {showAll ? "Show less" : `Show all ${s.history.length}`}
          </button>
        )}
      </section>
    </div>
  );
}

const HISTORY_PREVIEW = 8;

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

function Header() {
  return (
    <div className="flex items-center gap-2">
      <Link href="/" aria-label="Back to Home" className="-ml-2 rounded-full p-2 hover:bg-card">
        <ArrowLeft size={20} />
      </Link>
      <h1 className="font-serif text-3xl">Your stats</h1>
    </div>
  );
}

function Favorite({ icon: Icon, label, value, detail }: { icon: typeof Heart; label: string; value: string; detail: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-line bg-card p-4">
      <Icon size={18} className="shrink-0 text-moss" />
      <div className="min-w-0 flex-1">
        <p className="text-[11px] uppercase tracking-widest text-muted">{label}</p>
        <p className="truncate font-medium">{value}</p>
      </div>
      <span className="shrink-0 text-sm text-muted">{detail}</span>
    </div>
  );
}
