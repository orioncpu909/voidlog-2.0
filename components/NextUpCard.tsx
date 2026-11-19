"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ChevronRight, QrCode } from "lucide-react";
import { LOCATIONS } from "@/lib/data";
import { dateKey, sessionStart } from "@/lib/schedule";
import { Booking, useStore } from "@/lib/store";
import { calendarHref } from "@/lib/flags";
import { dayLabel, timeLabel, timeRange } from "@/lib/format";
import { roomLabel } from "@/lib/invite";
import { CHECK_IN_EARLY_MIN, checkInOpen } from "@/lib/checkin";
import { bookingStart } from "./BookingDetails";

const CheckInSheet = dynamic(() => import("./CheckInSheet").then((m) => m.CheckInSheet), { ssr: false });

// Home's bookings card: how many are coming up (always shown, 0 included), this week at a glance,
// the next one in large type with Check in, and the next couple after it written out, so "which
// days am I booked?" is answered on Home without a tap. The full list, the month view and History
// live on the Bookings tab; every booking here opens that tab on its day.
// The week strip starts today (not Monday) and only shows once something is booked, so a brand-new
// account's Home stays as simple as before. Booked days carry the time in words, not just a dot.
export function NextUpCard() {
  const { bookings } = useStore();
  const [checkingIn, setCheckingIn] = useState(false);
  const now = Date.now();
  // A booking stays "next" until it ends, so someone arriving late can still check in from here.
  const upcoming = bookings.filter((b) => b.status === "booked" && bookingStart(b) + b.durationMin * 60000 > now).sort((a, b) => bookingStart(a) - bookingStart(b));
  const next = upcoming[0];
  // Gold only while check-in is actually open (an hour before until it ends); before that, say when it opens.
  const open = !!next && checkInOpen([next]).length > 0;
  const opensAt = next ? new Date(bookingStart(next) - CHECK_IN_EARLY_MIN * 60000) : null;
  const t = new Date();
  const weekEnd = dateKey(new Date(t.getFullYear(), t.getMonth(), t.getDate() + 6)); // the strip's last day
  const opensLabel = opensAt && next?.date === dateKey(new Date()) ? opensAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : null;

  return (
    <section className="shrink-0 rounded-3xl border border-line bg-card p-4">
      <Link href="/calendar" className="-m-2 flex items-center justify-between rounded-2xl p-2 active:bg-sand">
        <span className="text-xs font-semibold uppercase tracking-widest text-muted">Coming up ({upcoming.length})</span>
        <span className="flex items-center gap-0.5 text-sm font-medium text-moss">
          {upcoming.length > 1 ? `See all ${upcoming.length}` : "Bookings"} <ChevronRight size={16} />
        </span>
      </Link>
      {next ? (
        <>
          {upcoming.some((b) => b.date <= weekEnd) && <WeekStrip bookings={upcoming} />}
          <Link href={calendarHref(next.date)} className="mt-3 block rounded-2xl active:bg-sand">
            <p className="font-heading text-2xl leading-tight">{next.title}</p>
            <p className="text-base">
              {dayLabel(next.date)} · {timeRange(next.time, next.durationMin)}
            </p>
            <p className="text-sm text-muted">
              {LOCATIONS[next.location].name}
              {next.room ? ` · ${roomLabel(next.serviceId, next.room)}` : ""}
            </p>
          </Link>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              onClick={() => setCheckingIn(true)}
              className={`flex min-h-[44px] items-center justify-center gap-1.5 rounded-full px-3 text-sm font-medium active:opacity-80 ${open ? "bg-sage text-ink" : "border border-line"}`}
            >
              <QrCode size={16} /> {open ? "Check in now" : "Check in"}
            </button>
            <Link href={calendarHref(next.date)} className="flex min-h-[44px] items-center justify-center rounded-full border border-line px-3 text-sm font-medium active:bg-line">
              Manage
            </Link>
          </div>
          {!open && opensLabel && <p className="mt-1.5 text-center text-xs text-muted">Check-in opens at {opensLabel}.</p>}
          {upcoming.length > 1 && <AlsoBooked bookings={upcoming.slice(1, 3)} />}
        </>
      ) : (
        <>
          <div className="mt-2 flex items-center justify-between gap-3">
            <p className="text-sm text-muted">Nothing booked yet.</p>
            <Link href="/book" className="flex min-h-[44px] items-center rounded-full bg-sage px-4 text-sm font-medium text-ink active:bg-sage-light">
              Book a visit
            </Link>
          </div>
          {/* Walk-ins and guests still need their code at the desk. */}
          <button onClick={() => setCheckingIn(true)} className="mt-2 flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-full border border-line text-sm font-medium active:bg-line">
            <QrCode size={16} /> My check-in code
          </button>
        </>
      )}
      {checkingIn && <CheckInSheet onClose={() => setCheckingIn(false)} />}
    </section>
  );
}

// "7:30p", "10a": short enough for a day cell.
function shortTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  return `${h % 12 || 12}${m ? `:${String(m).padStart(2, "0")}` : ""}${h < 12 ? "a" : "p"}`;
}

// Seven days from today. A booked day is a filled cell with the time of its first booking and opens
// Bookings on that day (its label reads out every booking that day); the others are plain.
function WeekStrip({ bookings }: { bookings: Booking[] }) {
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
    const key = dateKey(d);
    return { key, d, items: bookings.filter((b) => b.date === key) };
  });
  return (
    <ol aria-label="This week" className="mt-2 grid grid-cols-7 gap-1">
      {days.map(({ key, d, items }, i) => {
        const weekday = i === 0 ? "Today" : d.toLocaleDateString("en-US", { weekday: "short" });
        const inner = (
          <>
            <span className="text-[10px] font-medium uppercase tracking-wide opacity-80">{weekday}</span>
            <span className="font-heading text-lg leading-none">{d.getDate()}</span>
            <span className="text-[10px] font-medium leading-none">{items.length ? shortTime(items[0].time) : "\u00a0"}</span>
          </>
        );
        const base = "flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-xl";
        return (
          <li key={key}>
            {items.length ? (
              <Link
                href={calendarHref(key)}
                aria-label={`${sessionStart(key, "12:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}: ${items.map((b) => `${b.title} at ${timeLabel(b.time)}`).join(", ")}`}
                className={`${base} bg-shell text-card active:opacity-80`}
              >
                {inner}
              </Link>
            ) : (
              <div className={`${base} ${i === 0 ? "border border-line" : ""} text-muted`}>{inner}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}

// The next couple of bookings after the big one, one line each, in words. The rest are behind
// "See all N" at the top of the card.
function AlsoBooked({ bookings }: { bookings: Booking[] }) {
  return (
    <ul className="mt-3 divide-y divide-line border-t border-line">
      {bookings.map((b) => (
        <li key={b.id}>
          <Link href={calendarHref(b.date)} className="flex min-h-[44px] items-center gap-2 py-2 text-sm active:bg-sand">
            <span className="w-[5.5rem] shrink-0 font-medium">{dayLabel(b.date).split(",")[0]}</span>
            <span className="w-[4.5rem] shrink-0 text-muted">{timeLabel(b.time)}</span>
            <span className="min-w-0 flex-1 truncate">{b.title}</span>
            <ChevronRight size={14} className="shrink-0 text-muted" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
