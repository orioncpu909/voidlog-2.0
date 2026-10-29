"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import clsx from "clsx";
import { AlertTriangle, CalendarPlus, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { LOCATIONS } from "@/lib/data";
import { dateKey, sessionStart } from "@/lib/schedule";
import { Booking, useStore } from "@/lib/store";
import { dayLabel, money, timeLabel } from "@/lib/format";
import { policyLine } from "@/lib/policy";
import { addToPhoneCalendar } from "@/lib/ics";
import { Sheet } from "./Sheet";
import { PAST_LABEL, PastVisitRow, PastVisitSheet, bookingStart, nextSameSession } from "./BookingDetails";

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"]; // weeks start on Monday
const DAY = /^\d{4}-\d{2}-\d{2}$/;

// Home: a compact month grid on top, and under it the list of what's booked (with the Calendar tab
// switched off, this is where bookings live). Each day shows a dot per booking: gold coming up,
// faint for past visits. The list shows everything coming up, grouped by day, or the day you tapped,
// with who, where, how long and the price, plus Cancel right there (tap the day again to go back). Tap a booking to open its
// details in place. "History" lists past visits. Links like /?day=2026-10-29 select that day.
// The selected day is shared with the streak card (Home owns it), so picking a day in either one
// shows it in both.
export function HomeCalendar({ selected, onSelect }: { selected: string | null; onSelect: (day: string | null) => void }) {
  const { bookings } = useStore();
  const router = useRouter();
  const params = useSearchParams();
  const now = new Date();
  const today = dateKey(now);
  const [month, setMonth] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1));
  const [history, setHistory] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const toggle = (b: Booking) => setExpanded(expanded === b.id ? null : b.id);
  // Cancel asks right in the list, so the calendar stays in view.
  const [confirming, setConfirming] = useState<Booking | null>(null);
  const [viewing, setViewing] = useState<Booking | null>(null);

  // Opened from "See it on your calendar" elsewhere in the app.
  const dayParam = params.get("day");
  const upcomingParam = params.get("upcoming");
  useEffect(() => {
    if (dayParam && DAY.test(dayParam)) onSelect(dayParam);
    else if (upcomingParam) onSelect(null);
  }, [dayParam, upcomingParam]);
  // Show the selected day's month, e.g. when a streak-week day falls in the next month.
  useEffect(() => {
    if (!selected) return;
    const d = sessionStart(selected, "12:00");
    setMonth((m) => (m.getFullYear() === d.getFullYear() && m.getMonth() === d.getMonth() ? m : new Date(d.getFullYear(), d.getMonth(), 1)));
  }, [selected]);
  const clearLink = () => {
    if (dayParam || upcomingParam) router.replace("/", { scroll: false });
  };
  const pickDay = (key: string) => {
    onSelect(selected === key ? null : key);
    setExpanded(null);
    clearLink();
  };

  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = [...Array((month.getDay() + 6) % 7).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const rows = Math.ceil(cells.length / 7);
  const isThisMonth = month.getFullYear() === now.getFullYear() && month.getMonth() === now.getMonth();

  const nowMs = now.getTime();
  const isUpcoming = (b: Booking) => b.status === "booked" && bookingStart(b) > nowMs;
  const upcoming = bookings.filter(isUpcoming).sort((a, b) => bookingStart(a) - bookingStart(b));
  const past = bookings.filter((b) => !isUpcoming(b)).sort((a, b) => bookingStart(b) - bookingStart(a));
  const perDay = new Map<string, { up: number; past: number }>();
  for (const b of bookings) {
    if (b.status !== "booked") continue;
    const c = perDay.get(b.date) ?? { up: 0, past: 0 };
    if (isUpcoming(b)) c.up++;
    else c.past++;
    perDay.set(b.date, c);
  }

  // A past day shows everything that happened (cancellations too); a coming day shows what's booked.
  const dayList = (date: string) =>
    bookings.filter((b) => b.date === date && (b.status === "booked" || date < today)).sort((a, b) => bookingStart(a) - bookingStart(b));
  const shown = selected ? dayList(selected) : upcoming;
  const groups: [string, Booking[]][] = [];
  for (const b of shown) {
    const last = groups[groups.length - 1];
    if (last && last[0] === b.date) last[1].push(b);
    else groups.push([b.date, [b]]);
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col rounded-3xl border border-line bg-card px-4 pb-2 pt-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-0.5">
          <h2 className="mr-1 font-serif text-xl">{month.toLocaleDateString("en-US", isThisMonth ? { month: "long" } : { month: "long", year: "numeric" })}</h2>
          <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} aria-label="Previous month" className="rounded-full p-1 text-muted hover:bg-line">
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} aria-label="Next month" className="rounded-full p-1 text-muted hover:bg-line">
            <ChevronRight size={16} />
          </button>
        </div>
        {past.length > 0 && (
          <button onClick={() => setHistory(true)} className="text-xs text-moss underline-offset-2 hover:underline">
            History ({past.length})
          </button>
        )}
      </div>

      {/* Rows are 42px, shrinking toward 26px only when Home is short on room (an alert row, a
          six-week month), so the bookings list below always keeps space for at least one booking. */}
      <div className="mt-1 grid grid-cols-7 text-center text-[11px] text-muted">
        {WEEKDAYS.map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>
      <div
        className="grid min-h-0 grid-cols-7 text-center"
        style={{ gridTemplateRows: `repeat(${rows}, minmax(26px, 42px))`, flex: "0 1 auto", minHeight: rows * 26 }}
      >
        {cells.map((day, i) => {
          if (!day) return <span key={`e${i}`} />;
          const key = dateKey(new Date(month.getFullYear(), month.getMonth(), day));
          const isToday = key === today;
          const c = perDay.get(key);
          const dots = c ? Math.min(3, c.up + c.past) : 0;
          return (
            <button
              key={key}
              onClick={() => pickDay(key)}
              aria-label={`${dayLabel(key, "long")}${c ? `, ${c.up + c.past} booked` : ""}`}
              aria-pressed={selected === key}
              className="flex h-full min-h-0 flex-col items-center justify-center"
            >
              <span
                className={clsx(
                  "flex aspect-square h-[calc(100%-6px)] max-h-9 items-center justify-center rounded-full text-base leading-none",
                  isToday ? "bg-sage text-ink" : key < today ? "text-muted" : "",
                  selected === key && "ring-2 ring-shell",
                )}
              >
                {day}
              </span>
              <span className="mt-0.5 flex h-1 gap-0.5">
                {Array.from({ length: dots }, (_, j) => (
                  <span key={j} className={clsx("h-1 w-1 rounded-full", c!.up > j ? "bg-sage-deep" : "bg-muted/50")} />
                ))}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-1 flex min-h-[76px] flex-1 flex-col border-t border-line pt-1.5 text-xs">
        {confirming ? (
          <CancelConfirm booking={confirming} onDone={() => setConfirming(null)} />
        ) : (
          <>
            <div className="mb-0.5 flex items-center justify-between">
              <span className="font-medium text-moss">
                {selected ? dayLabel(selected, "long") : upcoming.length ? `Coming up (${upcoming.length})` : "Coming up"}
              </span>
            </div>
            {shown.length ? (
              <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto">
                {groups.map(([date, list]) => (
                  <div key={date}>
                    {!selected && <p className="pt-0.5 text-[10px] font-medium uppercase tracking-wider text-muted">{dayLabel(date, "long")}</p>}
                    <div className="divide-y divide-line">
                      {list.map((b) => (
                        <BookingRow key={b.id} booking={b} upcoming={isUpcoming(b)} expanded={expanded === b.id} onToggle={() => toggle(b)} onCancel={() => setConfirming(b)} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-between py-1">
                <span className="text-muted">{selected ? "Nothing booked this day." : "Nothing booked yet."}</span>
                {(!selected || selected >= today) && (
                  <Link href="/book" className="font-medium text-moss">
                    Book a visit →
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {history && (
        <Sheet open onClose={() => setHistory(false)} title={`History (${past.length})`}>
          <div className="space-y-2">
            {past.map((b) => (
              <PastVisitRow key={b.id} booking={b} onOpen={() => setViewing(b)} />
            ))}
          </div>
        </Sheet>
      )}
      <PastVisitSheet booking={viewing} onClose={() => setViewing(null)} />
    </section>
  );
}

// One booking in the list: time, then what it is and (second line) who, where, how long and the
// price; Cancel on the right while it's coming up, or what happened once it's past. Tapping it opens
// its details right below.
function BookingRow({
  booking: b,
  upcoming,
  expanded,
  onToggle,
  onCancel,
}: {
  booking: Booking;
  upcoming: boolean;
  expanded: boolean;
  onToggle: () => void;
  onCancel: () => void;
}) {
  // Only what you actually paid or used; nothing for an included visit.
  const paid = b.usedCredit ? "1 credit" : b.perk ? "Perk" : b.price > 0 ? money(b.price) : null;
  const facts = [b.instructor?.split(" ")[0], LOCATIONS[b.location].short, `${b.durationMin} min`, paid].filter(Boolean).join(" · ");
  return (
    <div className="flex gap-2 py-1">
      <span className="stat-num w-[56px] shrink-0 whitespace-nowrap pt-0.5 font-medium">{timeLabel(b.time)}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <button onClick={onToggle} aria-expanded={expanded} className="flex min-w-0 flex-1 items-center gap-1 text-left">
            <span className="truncate text-[13px] font-medium leading-tight">{b.title}</span>
            <ChevronDown size={12} className={clsx("shrink-0 text-muted transition", expanded && "rotate-180")} />
          </button>
          {upcoming ? (
            <CancelButton onClick={onCancel} />
          ) : (
            <span className={clsx("shrink-0", b.status === "booked" ? "text-muted" : "text-clay")}>{PAST_LABEL[b.status]}</span>
          )}
        </div>
        <button onClick={onToggle} tabIndex={-1} className="block w-full truncate text-left text-muted">
          {facts}
        </button>
        {expanded && <RowDetails booking={b} upcoming={upcoming} />}
      </div>
    </div>
  );
}

// What opens under a booking. Coming up: the cancellation deadline and Add to phone calendar.
// Past: Book again.
function RowDetails({ booking: b, upcoming }: { booking: Booking; upcoming: boolean }) {
  const { termsForBooking } = useStore();
  if (upcoming) {
    const t = termsForBooking(b);
    return (
      <div className="mt-1 space-y-1 rounded-xl bg-sand px-2.5 py-2">
        <p className={t.late ? "text-clay" : "text-muted"}>{policyLine(t, b.usedCredit)}</p>
        <button onClick={() => addToPhoneCalendar(b, policyLine(t, b.usedCredit))} className="flex items-center gap-1 font-medium text-moss">
          <CalendarPlus size={13} /> Add to phone calendar
        </button>
      </div>
    );
  }
  const again = nextSameSession(b);
  return (
    <div className="mt-1 flex items-center justify-between gap-2 rounded-xl bg-sand px-2.5 py-2">
      <span className="text-muted">{again ? `Next one: ${dayLabel(again.date)} ${timeLabel(again.time)}` : "Not on the schedule in the next two weeks."}</span>
      {again && (
        <Link href={`/book?session=${encodeURIComponent(again.id)}`} className="shrink-0 font-medium text-moss">
          Book again
        </Link>
      )}
    </div>
  );
}

// The cancel question, inside the strip: what you're cancelling, whether it's free (and what comes
// back) or late (and what it costs), then Keep or Yes, cancel. Same rules as CancelSheet.
function CancelConfirm({ booking: b, onDone }: { booking: Booking; onDone: () => void }) {
  const { termsForBooking, cancel } = useStore();
  const t = termsForBooking(b);
  const back = [t.refund > 0 && `${money(t.refund)} back to your card`, t.creditBack && "your credit comes back"].filter(Boolean).join(", ");
  return (
    <div className="space-y-1.5">
      <p className="font-medium">
        Cancel {b.title}, {dayLabel(b.date)} {timeLabel(b.time)}?
      </p>
      <p className={clsx("flex items-start gap-1.5", t.late ? "text-clay" : "text-moss")}>
        {t.late ? <AlertTriangle size={13} className="mt-px shrink-0" /> : <CheckCircle2 size={13} className="mt-px shrink-0" />}
        <span>{t.late ? `Free cancellation has passed: ${t.lateConsequence}` : `Free to cancel${back ? `: ${back}.` : "."}`}</span>
      </p>
      <div className="flex gap-2">
        <button onClick={onDone} className="flex-1 rounded-full border border-line py-1.5 font-medium hover:bg-line">
          Keep it
        </button>
        <button
          onClick={() => {
            cancel(b.id);
            onDone();
          }}
          className={clsx("flex-1 rounded-full py-1.5 font-medium", t.late ? "bg-clay text-ink" : "bg-sage text-ink")}
        >
          {t.late ? "Cancel anyway" : "Yes, cancel"}
        </button>
      </div>
    </div>
  );
}

function CancelButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="shrink-0 rounded-full border border-clay/40 px-2 py-0.5 text-[11px] font-medium text-clay hover:bg-clay-soft">
      Cancel
    </button>
  );
}
