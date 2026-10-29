"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import clsx from "clsx";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { dateKey, sessionStart } from "@/lib/schedule";
import { Booking, useStore } from "@/lib/store";
import { dayLabel } from "@/lib/format";
import { SHOW_CALENDAR_TAB, calendarHref } from "@/lib/flags";
import { CancelSheet } from "@/components/CancelSheet";
import { PastVisitRow, PastVisitSheet, UpcomingBookingCard, bookingStart } from "@/components/BookingDetails";

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"]; // weeks start on Monday

// Every booking lands here automatically. Stays available after a membership is cancelled.
// While the Calendar tab is switched off (lib/flags.ts), this page sends you to the Home calendar.
export default function CalendarPage() {
  return (
    <Suspense>
      {SHOW_CALENDAR_TAB ? <CalendarView /> : <ToHome />}
    </Suspense>
  );
}

function ToHome() {
  const router = useRouter();
  const day = useSearchParams().get("day");
  useEffect(() => {
    router.replace(calendarHref(day && /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : undefined));
  }, [router, day]);
  return null;
}

function CalendarView() {
  const { bookings } = useStore();
  const params = useSearchParams();
  const dayParam = params.get("day");
  const [cancelling, setCancelling] = useState<Booking | null>(null);
  // Opened from a day on the Home calendar: start on that day.
  const [selected, setSelected] = useState<string | null>(dayParam && /^\d{4}-\d{2}-\d{2}$/.test(dayParam) ? dayParam : null);
  const [showPast, setShowPast] = useState(false);
  const [viewing, setViewing] = useState<Booking | null>(null);
  const [month, setMonth] = useState(() => {
    const d = selected ? sessionStart(selected, "12:00") : new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const now = Date.now();
  const today = dateKey(new Date());
  const start = bookingStart;

  const upcoming = bookings.filter((b) => b.status === "booked" && start(b) > now).sort((a, b) => start(a) - start(b));
  const past = bookings.filter((b) => b.status !== "booked" || start(b) <= now).sort((a, b) => start(b) - start(a));
  const bookedDays = useMemo(() => new Set(bookings.filter((b) => b.status === "booked").map((b) => b.date)), [bookings]);
  const list = selected ? bookings.filter((b) => b.date === selected && b.status === "booked").sort((a, b) => start(a) - start(b)) : upcoming;

  const firstWeekday = (month.getDay() + 6) % 7; // Monday = 0
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const shiftMonth = (n: number) => {
    setMonth(new Date(month.getFullYear(), month.getMonth() + n, 1));
    setSelected(null);
  };

  return (
    <div className="space-y-5">
      <h1 className="font-serif text-3xl">Calendar</h1>

      <section className="rounded-3xl border border-line bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <button onClick={() => shiftMonth(-1)} aria-label="Previous month" className="rounded-full p-1.5 hover:bg-line">
            <ChevronLeft size={18} />
          </button>
          <p className="font-serif text-xl">{month.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>
          <button onClick={() => shiftMonth(1)} aria-label="Next month" className="rounded-full p-1.5 hover:bg-line">
            <ChevronRight size={18} />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-muted">
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
                className={clsx(
                  "relative flex h-10 flex-col items-center justify-center rounded-xl text-sm",
                  isSel ? "bg-sage text-ink" : key === today ? "ring-1 ring-sage" : "hover:bg-line",
                  key < today && !isSel && "text-muted",
                )}
              >
                {day}
                {has && <span className={clsx("absolute bottom-1 h-1.5 w-1.5 rounded-full", isSel ? "bg-ink" : "bg-sage-deep")} />}
              </button>
            );
          })}
        </div>
      </section>

      <div className="flex items-baseline justify-between">
        <h2 className="font-serif text-2xl">{selected ? dayLabel(selected, "long") : `Upcoming (${upcoming.length})`}</h2>
        {selected && (
          <button onClick={() => setSelected(null)} className="text-xs text-moss underline-offset-2 hover:underline">
            Show all upcoming
          </button>
        )}
      </div>

      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line p-6 text-center text-sm text-muted">
          <p>{selected ? "Nothing booked this day." : "You have no upcoming appointments."}</p>
          <Link href="/book" className="mt-3 inline-block rounded-full bg-sage px-5 py-2 text-ink">
            Book now
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {list.map((b) =>
            start(b) <= now ? (
              <PastVisitRow key={b.id} booking={b} onOpen={() => setViewing(b)} />
            ) : (
              <UpcomingBookingCard key={b.id} booking={b} onCancel={() => setCancelling(b)} />
            ),
          )}
        </div>
      )}

      {past.length > 0 && (
        <section className="space-y-2">
          <button onClick={() => setShowPast(!showPast)} className="text-sm text-muted underline-offset-2 hover:underline">
            {showPast ? "Hide history" : `History (${past.length})`}
          </button>
          {/* Tap a past visit to see who taught it, when, and where. */}
          {showPast && past.map((b) => <PastVisitRow key={b.id} booking={b} onOpen={() => setViewing(b)} />)}
        </section>
      )}

      <CancelSheet booking={cancelling} onClose={() => setCancelling(null)} />
      <PastVisitSheet booking={viewing} onClose={() => setViewing(null)} />
    </div>
  );
}
