"use client";

import Link from "next/link";
import clsx from "clsx";
import { CalendarPlus, ChevronRight, Clock, MapPin, Ticket, UserRound } from "lucide-react";
import { LOCATIONS, SERVICES } from "@/lib/data";
import { sessionStart, slotsFor, upcomingDays } from "@/lib/schedule";
import { Booking, useStore } from "@/lib/store";
import { policyLine } from "@/lib/policy";
import { addToPhoneCalendar } from "@/lib/ics";
import { dayLabel, money, timeLabel, timeRange } from "@/lib/format";
import { Sheet } from "./Sheet";
import { roomLabel } from "@/lib/invite";
import { JoinInviteRow } from "./JoinInvite";

// Booking pieces shared by Home and the Bookings tab.

export const PAST_LABEL = { booked: "Completed", cancelled: "Cancelled", "late-cancelled": "Late cancel" } as const;

export const bookingStart = (b: Booking) => sessionStart(b.date, b.time).getTime();

// An upcoming booking on the Bookings tab: what, when, where (full studio name, address and room),
// what it cost, the cancellation line, then its actions as real buttons: Add to phone calendar,
// Invite a friend (Wellness, sauna/contrast/class), and Cancel as a quieter outlined button.
export function UpcomingBookingCard({ booking: b, onCancel }: { booking: Booking; onCancel: () => void }) {
  const { termsForBooking } = useStore();
  const t = termsForBooking(b);
  const location = LOCATIONS[b.location];
  return (
    <div className="rounded-2xl border border-line bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-heading text-xl leading-tight">{b.title}</p>
          <p className="mt-0.5 text-base">{timeRange(b.time, b.durationMin)}</p>
          <p className="text-sm text-muted">
            {location.name}
            {b.room ? ` · ${roomLabel(b.serviceId, b.room)}` : ""}
            {b.instructor ? ` · ${b.serviceId === "class" ? "w/" : "with"} ${b.instructor}` : ""}
          </p>
          <p className="text-xs text-muted">{location.address}</p>
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
      <p className={clsx("mt-3 border-t border-line pt-3 text-sm", t.late ? "text-clay" : "text-muted")}>{policyLine(t, b.usedCredit)}</p>
      <div className="mt-2 text-sm">
        <JoinInviteRow booking={b} />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          onClick={() => addToPhoneCalendar(b, policyLine(t, b.usedCredit))}
          className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-full bg-sage px-3 text-sm font-medium text-ink active:bg-sage-light"
        >
          <CalendarPlus size={16} /> Add to calendar
        </button>
        <button onClick={onCancel} className="min-h-[44px] rounded-full border border-line px-3 text-sm font-medium active:bg-line">
          Cancel booking
        </button>
      </div>
    </div>
  );
}

// A past (or cancelled) visit as one row; tapping it opens PastVisitSheet.
export function PastVisitRow({ booking: b, onOpen }: { booking: Booking; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="flex w-full items-center gap-3 rounded-2xl border border-line bg-card px-4 py-3 text-left text-sm hover:border-muted"
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
  );
}

// Details of a past visit: who taught it, when, where, and what was paid, with a shortcut to book
// the same class (or service) again.
export function PastVisitSheet({ booking, onClose }: { booking: Booking | null; onClose: () => void }) {
  if (!booking) return null;
  const b = booking;
  const service = SERVICES[b.serviceId];
  const location = LOCATIONS[b.location];
  const isClass = service.category === "class";
  const again = nextSameSession(b);
  // Only what was paid or used; an included visit just shows the class and length.
  const paid = b.usedCredit ? "Paid with 1 treatment credit" : b.perk ? "Monthly perk" : b.price > 0 ? `Paid ${money(b.price)}` : null;
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
          {isClass ? "Class" : service.name} · {b.durationMin} min{paid ? ` · ${paid}` : ""}
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
export function nextSameSession(b: Booking) {
  const now = Date.now();
  const future = upcomingDays(14).flatMap((d) => slotsFor(b.location, b.serviceId, d)).filter((s) => sessionStart(s.date, s.time).getTime() > now);
  if (SERVICES[b.serviceId].category === "event") return undefined;
  if (b.serviceId === "class") {
    const same = future.filter((s) => s.title === b.title);
    return same.find((s) => s.instructor === b.instructor) ?? same[0];
  }
  return future.find((s) => s.time === b.time) ?? future[0];
}
