"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import clsx from "clsx";
import { AlertTriangle, CalendarPlus, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, X } from "lucide-react";
import { LOCATIONS } from "@/lib/data";
import { dateKey, sessionStart } from "@/lib/schedule";
import { Booking, useStore } from "@/lib/store";
import { dayLabel, money, timeLabel } from "@/lib/format";
import { Sheet } from "./Sheet";
import { CancelSheet } from "./CancelSheet";
import { PAST_LABEL, PastVisitRow, PastVisitSheet, UpcomingBookingCard, bookingStart, nextSameSession } from "./BookingDetails";
import { policyLine } from "@/lib/policy";
import { addToPhoneCalendar } from "@/lib/ics";

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"]; // weeks start on Monday
const DAY = /^\d{4}-\d{2}-\d{2}$/;

type Open = { kind: "upcoming" } | { kind: "history" } | null;

// Home: the month at a glance, and (with the Calendar tab switched off) everything the Calendar did.
// Gold dots are upcoming bookings, faint dots are past visits. The strip under the grid shows your
// next booking, or the day you tapped, with Cancel right there; the calendar itself stays in view.
// "+n" lists everything coming up, "History" past visits. Links like /?day=2026-10-29 select that day.
export function HomeCalendar() {
  const { bookings } = useStore();
  const router = useRouter();
  const params = useSearchParams();
  const now = new Date();
  const today = dateKey(now);
  const [month, setMonth] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1));
  const [open, setOpen] = useState<Open>(null);
  const [selected, setSelected] = useState<string | null>(null);
  // A booking in the strip opens in place (details, add to phone calendar, book again).
  const [expanded, setExpanded] = useState<string | null>(null);
  const toggle = (b: Booking) => setExpanded(expanded === b.id ? null : b.id);
  const [cancelling, setCancelling] = useState<Booking | null>(null);
  // Cancel from the strip asks right there, so the calendar stays in view.
  const [confirming, setConfirming] = useState<Booking | null>(null);
  const [viewing, setViewing] = useState<Booking | null>(null);

  // Opened from "See it in your calendar" elsewhere in the app.
  const dayParam = params.get("day");
  const upcomingParam = params.get("upcoming");
  useEffect(() => {
    if (dayParam && DAY.test(dayParam)) {
      setSelected(dayParam);
      const d = sessionStart(dayParam, "12:00");
      setMonth(new Date(d.getFullYear(), d.getMonth(), 1));
    } else if (upcomingParam) setOpen({ kind: "upcoming" });
  }, [dayParam, upcomingParam]);
  const clearLink = () => {
    if (dayParam || upcomingParam) router.replace("/", { scroll: false });
  };
  const close = () => {
    setOpen(null);
    clearLink();
  };
  const pickDay = (key: string) => {
    setSelected(selected === key ? null : key);
    clearLink();
  };

  const first = month;
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = [...Array((first.getDay() + 6) % 7).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const isThisMonth = month.getFullYear() === now.getFullYear() && month.getMonth() === now.getMonth();

  const nowMs = now.getTime();
  const active = bookings.filter((b) => b.status === "booked");
  const upcoming = active.filter((b) => bookingStart(b) > nowMs).sort((a, b) => bookingStart(a) - bookingStart(b));
  const past = bookings.filter((b) => b.status !== "booked" || bookingStart(b) <= nowMs).sort((a, b) => bookingStart(b) - bookingStart(a));
  const upcomingDays = new Set(upcoming.map((b) => b.date));
  const pastDays = new Set(active.filter((b) => bookingStart(b) <= nowMs).map((b) => b.date));
  const next = upcoming[0];

  // A past day shows everything that happened (cancellations too); a coming day shows what's booked.
  const dayList = (date: string) =>
    bookings
      .filter((b) => b.date === date && (b.status === "booked" || date < today))
      .sort((a, b) => bookingStart(a) - bookingStart(b));
  const isUpcoming = (b: Booking) => b.status === "booked" && bookingStart(b) > nowMs;
  const row = (b: Booking) =>
    isUpcoming(b) ? (
      <UpcomingBookingCard key={b.id} booking={b} onCancel={() => setCancelling(b)} />
    ) : (
      <PastVisitRow key={b.id} booking={b} onOpen={() => setViewing(b)} />
    );

  return (
    <section className="flex min-h-0 flex-1 flex-col rounded-3xl border border-line bg-card px-4 pb-3 pt-2.5">
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
          <button onClick={() => setOpen({ kind: "history" })} className="text-xs text-moss underline-offset-2 hover:underline">
            History ({past.length})
          </button>
        )}
      </div>
      <div className="mt-1 grid grid-cols-7 text-center text-[10px] text-muted">
        {WEEKDAYS.map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-7 text-center" style={{ gridTemplateRows: `repeat(${Math.ceil(cells.length / 7)}, minmax(0, 1fr))` }}>
        {cells.map((day, i) => {
          if (!day) return <span key={`e${i}`} />;
          const key = dateKey(new Date(month.getFullYear(), month.getMonth(), day));
          const isToday = key === today;
          return (
            <button
              key={key}
              onClick={() => pickDay(key)}
              aria-label={dayLabel(key, "long")}
              aria-pressed={selected === key}
              className={clsx(
                "relative m-auto flex aspect-square h-[min(1.75rem,100%)] items-center justify-center rounded-full text-xs",
                isToday ? "bg-sage text-ink" : key < today ? "text-muted hover:bg-line" : "hover:bg-line",
                selected === key && "ring-2 ring-shell",
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
            </button>
          );
        })}
      </div>
      <div className="mt-2 border-t border-line pt-2 text-xs">
        {confirming ? (
          <CancelConfirm booking={confirming} onDone={() => setConfirming(null)} />
        ) : selected ? (
          <>
            <div className="mb-1 flex items-center justify-between">
              <span className="font-medium text-moss">{dayLabel(selected, "long")}</span>
              <button onClick={() => pickDay(selected)} aria-label="Show my next booking" className="rounded-full p-0.5 text-muted hover:bg-line">
                <X size={14} />
              </button>
            </div>
            {dayList(selected).length ? (
              <div className="max-h-[120px] space-y-1 overflow-y-auto">
                {dayList(selected).map((b) => (
                  <BannerRow key={b.id} booking={b} upcoming={isUpcoming(b)} expanded={expanded === b.id} onToggle={() => toggle(b)} onCancel={() => setConfirming(b)} />
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-between py-1">
                <span className="text-muted">Nothing booked this day.</span>
                {selected >= today && (
                  <Link href="/book" className="font-medium text-moss">
                    Book →
                  </Link>
                )}
              </div>
            )}
          </>
        ) : next ? (
          <>
            <div className="flex items-center gap-2">
              <span className="shrink-0 font-medium text-moss">Next</span>
              <button onClick={() => toggle(next)} aria-expanded={expanded === next.id} className="min-w-0 flex-1 truncate text-left">
                {dayLabel(next.date)} · {timeLabel(next.time)} · {next.title} · {LOCATIONS[next.location].short}
              </button>
              <CancelButton onClick={() => setConfirming(next)} />
              {upcoming.length > 1 && (
                <button onClick={() => setOpen({ kind: "upcoming" })} aria-label="All upcoming bookings" className="flex shrink-0 items-center text-muted">
                  +{upcoming.length - 1}
                  <ChevronRight size={14} />
                </button>
              )}
            </div>
            {expanded === next.id && <RowDetails booking={next} upcoming />}
          </>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-muted">Nothing booked yet.</span>
            <Link href="/book" className="font-medium text-moss">
              Book a visit →
            </Link>
          </div>
        )}
      </div>

      {open?.kind === "upcoming" && (
        <Sheet open onClose={close} title={`Upcoming (${upcoming.length})`}>
          {upcoming.length ? <div className="space-y-2">{upcoming.map(row)}</div> : <Empty text="You have no upcoming appointments." book />}
        </Sheet>
      )}
      {open?.kind === "history" && (
        <Sheet open onClose={close} title={`History (${past.length})`}>
          <div className="space-y-2">{past.map(row)}</div>
        </Sheet>
      )}
      <CancelSheet booking={cancelling} onClose={() => setCancelling(null)} />
      <PastVisitSheet booking={viewing} onClose={() => setViewing(null)} />
    </section>
  );
}

// One booking in the strip under the calendar: time, what and where, then Cancel (coming up) or its
// status (past). Tapping it opens its details right below, in the strip.
function BannerRow({
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
  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="w-[52px] shrink-0 font-medium">{timeLabel(b.time)}</span>
        <button onClick={onToggle} aria-expanded={expanded} className="flex min-w-0 flex-1 items-center gap-1 text-left">
          <span className="truncate">
            {b.title} · {LOCATIONS[b.location].short}
          </span>
          <ChevronDown size={13} className={clsx("shrink-0 text-muted transition", expanded && "rotate-180")} />
        </button>
        {upcoming ? (
          <CancelButton onClick={onCancel} />
        ) : (
          <span className={clsx("shrink-0", b.status === "booked" ? "text-muted" : "text-clay")}>{PAST_LABEL[b.status]}</span>
        )}
      </div>
      {expanded && <RowDetails booking={b} upcoming={upcoming} />}
    </div>
  );
}

// What opens under a booking in the strip. Coming up: who, the cancellation deadline, and Add to
// phone calendar. Past: who and what was paid, and Book again.
function RowDetails({ booking: b, upcoming }: { booking: Booking; upcoming: boolean }) {
  const { termsForBooking } = useStore();
  const who = b.instructor ? `with ${b.instructor} · ` : "";
  if (upcoming) {
    const t = termsForBooking(b);
    return (
      <div className="mt-1 space-y-1 rounded-xl bg-sand px-2.5 py-2">
        <p className={t.late ? "text-clay" : "text-muted"}>
          {who}
          {policyLine(t, b.usedCredit)}
        </p>
        <button onClick={() => addToPhoneCalendar(b, policyLine(t, b.usedCredit))} className="flex items-center gap-1 font-medium text-moss">
          <CalendarPlus size={13} /> Add to phone calendar
        </button>
      </div>
    );
  }
  const again = nextSameSession(b);
  const paid = b.usedCredit ? "paid with a credit" : b.perk ? "monthly perk" : b.price > 0 ? `paid ${money(b.price)}` : "included";
  return (
    <div className="mt-1 flex items-center justify-between gap-2 rounded-xl bg-sand px-2.5 py-2">
      <span className="min-w-0 text-muted">
        {who}
        {timeLabel(b.time)}, {b.durationMin} min · {paid}
      </span>
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
    <button onClick={onClick} className="shrink-0 rounded-full border border-clay/40 px-2.5 py-0.5 font-medium text-clay hover:bg-clay-soft">
      Cancel
    </button>
  );
}

function Empty({ text, book }: { text: string; book: boolean }) {
  return (
    <div className="rounded-2xl border border-dashed border-line p-6 text-center text-sm text-muted">
      <p>{text}</p>
      {book && (
        <Link href="/book" className="mt-3 inline-block rounded-full bg-sage px-5 py-2 text-ink">
          Book now
        </Link>
      )}
    </div>
  );
}
