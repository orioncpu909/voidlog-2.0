"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import clsx from "clsx";
import { CalendarDays, ChevronLeft, ChevronRight, List } from "lucide-react";
import { dateKey, sessionStart } from "@/lib/schedule";
import { Booking, useStore } from "@/lib/store";
import { dayLabel } from "@/lib/format";
import { SHOW_CALENDAR_TAB, calendarHref } from "@/lib/flags";
import { CancelSheet } from "@/components/CancelSheet";
import { HistoryButton } from "@/components/BookingHistory";
import { PastVisitRow, PastVisitSheet, UpcomingBookingCard, bookingStart } from "@/components/BookingDetails";

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"]; // weeks start on Monday, like the rest of the app

// The Bookings tab (route /calendar): every upcoming booking as a full-size card with its actions,
// grouped by day, then the month view one tap away. History is at the top right. Built list-first
// because new members look for "my bookings", not a month grid. While the tab is switched off
// (lib/flags.ts), this page sends you Home.
export default function BookingsPage() {
  return <Suspense>{SHOW_CALENDAR_TAB ? <BookingsView /> : <ToHome />}</Suspense>;
}

function ToHome() {
  const router = useRouter();
  const day = useSearchParams().get("day");
  useEffect(() => {
    router.replace(calendarHref(day && /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : undefined));
  }, [router, day]);
  return null;
}

function BookingsView() {
  const { bookings } = useStore();
  const params = useSearchParams();
  const dayParam = params.get("day");
  const validDay = dayParam && /^\d{4}-\d{2}-\d{2}$/.test(dayParam) ? dayParam : null;
  const [cancelling, setCancelling] = useState<Booking | null>(null);
  const [viewing, setViewing] = useState<Booking | null>(null);
  // A link to a day (from Book's "See it in Bookings") opens the month view on that day.
  const [selected, setSelected] = useState<string | null>(validDay);
  const [showMonth, setShowMonth] = useState(!!validDay);
  useEffect(() => {
    if (validDay) {
      setSelected(validDay);
      setShowMonth(true);
    }
  }, [validDay]);
  const [month, setMonth] = useState(() => {
    const d = selected ? sessionStart(selected, "12:00") : new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const now = Date.now();
  const today = dateKey(new Date());
  const start = bookingStart;

  const upcoming = bookings.filter((b) => b.status === "booked" && start(b) > now).sort((a, b) => start(a) - start(b));
  const bookedDays = useMemo(() => new Set(bookings.filter((b) => b.status === "booked").map((b) => b.date)), [bookings]);
  const list = selected ? bookings.filter((b) => b.date === selected && b.status === "booked").sort((a, b) => start(a) - start(b)) : upcoming;
  // Upcoming bookings under a heading per day.
  const groups = list.reduce<{ date: string; items: Booking[] }[]>((acc, b) => {
    const last = acc[acc.length - 1];
    if (last && last.date === b.date) last.items.push(b);
    else acc.push({ date: b.date, items: [b] });
    return acc;
  }, []);

  const firstWeekday = (month.getDay() + 6) % 7; // Monday = 0
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const shiftMonth = (n: number) => {
    setMonth(new Date(month.getFullYear(), month.getMonth() + n, 1));
    setSelected(null);
  };
  const longDate = (d: string) => sessionStart(d, "12:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-4xl leading-none">Bookings</h1>
        <HistoryButton />
      </div>

      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted">{selected ? longDate(selected) : `Coming up (${upcoming.length})`}</h2>
        <button
          onClick={() => {
            setShowMonth(!showMonth);
            setSelected(null);
          }}
          className="-my-2 flex min-h-[44px] items-center gap-1.5 rounded-full px-3 text-sm font-medium text-moss active:bg-line"
        >
          {showMonth ? <List size={16} /> : <CalendarDays size={16} />} {showMonth ? "List" : "Month"}
        </button>
      </div>

      {showMonth && (
        <section className="rounded-3xl border border-line bg-card p-4">
          <div className="mb-2 flex items-center justify-between">
            <button onClick={() => shiftMonth(-1)} aria-label="Previous month" className="flex h-11 w-11 items-center justify-center rounded-full active:bg-line">
              <ChevronLeft size={20} />
            </button>
            <p className="font-heading text-xl">{month.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>
            <button onClick={() => shiftMonth(1)} aria-label="Next month" className="flex h-11 w-11 items-center justify-center rounded-full active:bg-line">
              <ChevronRight size={20} />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted">
            {WEEKDAYS.map((d, i) => (
              <span key={i}>{d}</span>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              if (!day) return <span key={`e${i}`} />;
              const key = dateKey(new Date(month.getFullYear(), month.getMonth(), day));
              const has = bookedDays.has(key);
              const isSel = selected === key;
              return (
                <button
                  key={key}
                  onClick={() => setSelected(isSel ? null : key)}
                  aria-label={`${dayLabel(key, "long")}${has ? ", booked" : ""}`}
                  aria-pressed={isSel}
                  className={clsx(
                    "relative flex h-11 flex-col items-center justify-center rounded-xl text-base",
                    isSel ? "bg-sage text-ink" : key === today ? "ring-1 ring-sage" : "active:bg-line",
                    key < today && !isSel && "text-muted",
                  )}
                >
                  {day}
                  {has && <span className={clsx("absolute bottom-1 h-1.5 w-1.5 rounded-full", isSel ? "bg-ink" : "bg-sage-deep")} />}
                </button>
              );
            })}
          </div>
          {selected && (
            <button onClick={() => setSelected(null)} className="mt-2 min-h-[44px] w-full text-sm font-medium text-moss active:opacity-60">
              Show all upcoming
            </button>
          )}
        </section>
      )}

      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line p-6 text-center text-sm text-muted">
          <p>{selected ? "Nothing booked this day." : "Nothing booked yet. Your bookings show up here."}</p>
          <Link href="/book" className="mt-3 inline-block rounded-full bg-sage px-5 py-2.5 font-medium text-ink">
            Book a visit
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((g) => (
            <section key={g.date} className="space-y-2">
              {!selected && (
                <p className="text-sm font-medium">
                  {dayLabel(g.date) === longDate(g.date) ? longDate(g.date) : `${dayLabel(g.date)} · ${longDate(g.date)}`}
                </p>
              )}
              {g.items.map((b) =>
                start(b) <= now ? (
                  <PastVisitRow key={b.id} booking={b} onOpen={() => setViewing(b)} />
                ) : (
                  <UpcomingBookingCard key={b.id} booking={b} onCancel={() => setCancelling(b)} />
                ),
              )}
            </section>
          ))}
        </div>
      )}

      <CancelSheet booking={cancelling} onClose={() => setCancelling(null)} />
      <PastVisitSheet booking={viewing} onClose={() => setViewing(null)} />
    </div>
  );
}
