"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import clsx from "clsx";
import { CalendarPlus, ChevronLeft, ChevronRight, Clock, MapPin, Ticket, UserRound } from "lucide-react";
import { LOCATIONS, SERVICES } from "@/lib/data";
import { dateKey, sessionStart, slotsFor, upcomingDays } from "@/lib/schedule";
import { Booking, useStore } from "@/lib/store";
import { policyLine } from "@/lib/policy";
import { addToPhoneCalendar } from "@/lib/ics";
import { dayLabel, money, timeLabel, timeRange } from "@/lib/format";
import { CancelSheet } from "@/components/CancelSheet";
import { Sheet } from "@/components/Sheet";

const PAST_LABEL = { booked: "Completed", cancelled: "Cancelled", "late-cancelled": "Late cancel" } as const;
const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"]; // weeks start on Monday

// Every booking lands here automatically. Stays available after a membership is cancelled.
export default function CalendarPage() {
  return (
    <Suspense>
      <CalendarView />
    </Suspense>
  );
}

function CalendarView() {
  const { bookings, termsForBooking } = useStore();
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
  const start = (b: Booking) => sessionStart(b.date, b.time).getTime();

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
          {list.map((b) => {
            const t = termsForBooking(b);
            const isPast = start(b) <= now;
            return (
              <div key={b.id} className="rounded-2xl border border-line bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-serif text-xl leading-tight">{b.title}</p>
                    <p className="text-sm text-muted">
                      {dayLabel(b.date, "long")} · {timeRange(b.time, b.durationMin)}
                    </p>
                    <p className="text-xs text-muted">
                      {LOCATIONS[b.location].short}
                      {b.instructor ? ` · ${b.instructor}` : ""}
                    </p>
                  </div>
                  <div className="shrink-0 text-right text-sm">
                    {b.usedCredit ? (
                      <span className="flex items-center gap-1 text-clay">
                        <Ticket size={14} /> Credit
                      </span>
                    ) : (
                      <span>{b.price === 0 ? "Included" : money(b.price)}</span>
                    )}
                    {b.firstVisit && <p className="text-[11px] text-sage-deep">First visit price</p>}
                  </div>
                </div>
                {!isPast && (
                  <>
                    <p className={clsx("mt-3 border-t border-line pt-3 text-xs", t.late ? "text-clay" : "text-muted")}>{policyLine(t, b.usedCredit)}</p>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <button onClick={() => addToPhoneCalendar(b, policyLine(t, b.usedCredit))} className="flex items-center gap-1.5 text-xs text-moss hover:underline">
                        <CalendarPlus size={14} /> Add to phone calendar
                      </button>
                      <button onClick={() => setCancelling(b)} className="shrink-0 rounded-full border border-line px-3 py-1 text-sm text-clay hover:bg-clay-soft">
                        Cancel
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {past.length > 0 && (
        <section className="space-y-2">
          <button onClick={() => setShowPast(!showPast)} className="text-sm text-muted underline-offset-2 hover:underline">
            {showPast ? "Hide history" : `History (${past.length})`}
          </button>
          {/* Tap a past visit to see who taught it, when, and where. */}
          {showPast &&
            past.map((b) => (
              <button
                key={b.id}
                onClick={() => setViewing(b)}
                className="flex w-full items-center gap-3 rounded-2xl border border-line bg-card/60 px-4 py-3 text-left text-sm hover:border-muted"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate">{b.title}</p>
                  <p className="truncate text-xs text-muted">
                    {dayLabel(b.date)} · {timeLabel(b.time)} · {LOCATIONS[b.location].short}
                  </p>
                </div>
                <span className={clsx("shrink-0 text-xs", b.status === "booked" ? "text-muted" : "text-clay")}>{PAST_LABEL[b.status]}</span>
                <ChevronRight size={16} className="shrink-0 text-muted" />
              </button>
            ))}
        </section>
      )}

      <CancelSheet booking={cancelling} onClose={() => setCancelling(null)} />
      <PastVisitSheet booking={viewing} onClose={() => setViewing(null)} />
    </div>
  );
}

// Details of a past visit from History: who taught it, when, where, and what was paid, with a
// shortcut to book the same class (or service) again.
function PastVisitSheet({ booking, onClose }: { booking: Booking | null; onClose: () => void }) {
  if (!booking) return null;
  const b = booking;
  const service = SERVICES[b.serviceId];
  const location = LOCATIONS[b.location];
  const isClass = service.category === "class";
  const again = nextSameSession(b);
  const paid = b.usedCredit ? "Paid with 1 treatment credit" : b.perk ? "Monthly perk, included" : b.price > 0 ? `Paid ${money(b.price)}` : "Included, nothing charged";
  return (
    <Sheet open onClose={onClose} title={b.title}>
      <div className="space-y-3 text-sm">
        <p className={clsx("inline-block rounded-full px-2.5 py-0.5 text-xs", b.status === "booked" ? "bg-moss-soft text-moss" : "bg-clay-soft text-clay")}>
          {PAST_LABEL[b.status]}
        </p>
        <ul className="space-y-2">
          {b.instructor && (
            <li className="flex items-center gap-2">
              <UserRound size={16} className="shrink-0 text-muted" />
              <span>
                <span className="text-muted">{isClass ? "Instructor" : service.category === "treatment" ? "Therapist" : "Host"}:</span> {b.instructor}
              </span>
            </li>
          )}
          <li className="flex items-center gap-2">
            <Clock size={16} className="shrink-0 text-muted" />
            <span>
              {dayLabel(b.date, "long")} · {timeRange(b.time, b.durationMin)}
            </span>
          </li>
          <li className="flex items-start gap-2">
            <MapPin size={16} className="mt-0.5 shrink-0 text-muted" />
            <a href={`https://maps.google.com/?q=${encodeURIComponent(location.address)}`} target="_blank" rel="noreferrer" className="underline underline-offset-2">
              {location.name}
              <br />
              {location.address}
            </a>
          </li>
        </ul>
        <p className="border-t border-line pt-3 text-muted">
          {isClass ? "Class" : service.name} · {b.durationMin} min · {paid}
          {b.firstVisit && " · first visit price"}
        </p>
        {again && (
          <Link href={`/book?session=${encodeURIComponent(again.id)}`} className="block w-full rounded-full bg-sage px-5 py-3 text-center text-sm font-medium text-ink hover:bg-sage/90">
            Book again · {dayLabel(again.date)} {timeLabel(again.time)}
          </Link>
        )}
      </div>
    </Sheet>
  );
}

// The next upcoming session like this one at the same studio: for a class, the same class (with the
// same instructor if possible); otherwise the same service, preferably at the same time of day.
function nextSameSession(b: Booking) {
  const now = Date.now();
  const future = upcomingDays(14).flatMap((d) => slotsFor(b.location, b.serviceId, d)).filter((s) => sessionStart(s.date, s.time).getTime() > now);
  if (SERVICES[b.serviceId].category === "event") return undefined;
  if (b.serviceId === "class") {
    const same = future.filter((s) => s.title === b.title);
    return same.find((s) => s.instructor === b.instructor) ?? same[0];
  }
  return future.find((s) => s.time === b.time) ?? future[0];
}
