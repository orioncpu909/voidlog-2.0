"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ChevronRight, QrCode } from "lucide-react";
import { LOCATIONS } from "@/lib/data";
import { dateKey } from "@/lib/schedule";
import { useStore } from "@/lib/store";
import { dayLabel, timeRange } from "@/lib/format";
import { roomLabel } from "@/lib/invite";
import { bookingStart } from "./BookingDetails";

const CheckInSheet = dynamic(() => import("./CheckInSheet").then((m) => m.CheckInSheet), { ssr: false });

// Home's bookings card: how many are coming up (always shown, 0 included), the next one in large
// type with Check in and its details one tap away, and a way to the Bookings tab for the rest.
// The full list, the month view and History live on the Bookings tab.
export function NextUpCard() {
  const { bookings } = useStore();
  const [checkingIn, setCheckingIn] = useState(false);
  const now = Date.now();
  const upcoming = bookings.filter((b) => b.status === "booked" && bookingStart(b) > now).sort((a, b) => bookingStart(a) - bookingStart(b));
  const next = upcoming[0];
  const today = next?.date === dateKey(new Date());

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
          <Link href="/calendar" className="mt-1 block rounded-2xl active:bg-sand">
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
              className={`flex min-h-[44px] items-center justify-center gap-1.5 rounded-full px-3 text-sm font-medium active:opacity-80 ${today ? "bg-sage text-ink" : "border border-line"}`}
            >
              <QrCode size={16} /> Check in
            </button>
            <Link href="/calendar" className="flex min-h-[44px] items-center justify-center rounded-full border border-line px-3 text-sm font-medium active:bg-line">
              Manage
            </Link>
          </div>
        </>
      ) : (
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="text-sm text-muted">Nothing booked yet.</p>
          <Link href="/book" className="flex min-h-[44px] items-center rounded-full bg-sage px-4 text-sm font-medium text-ink active:bg-sage-light">
            Book a visit
          </Link>
        </div>
      )}
      {checkingIn && <CheckInSheet onClose={() => setCheckingIn(false)} />}
    </section>
  );
}
