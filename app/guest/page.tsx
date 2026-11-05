"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import clsx from "clsx";
import { Check, ChevronRight } from "lucide-react";
import { LOCATIONS, SERVICES, ServiceId } from "@/lib/data";
import { GUEST_PASS_INCLUDES, GUEST_SERVICES, GuestPass } from "@/lib/guest";
import { Session, sessionStart, slotsFor, upcomingDays } from "@/lib/schedule";
import { Booking, useStore } from "@/lib/store";
import { dayLabel, shortDate, timeLabel, timeRange } from "@/lib/format";
import { Button, Sheet, useTapGuard } from "@/components/Sheet";
import { RateClass } from "@/components/RateClass";
import { canRate } from "@/lib/ratings";

const DAYS_AHEAD = 14;
const MAX_TIMES = 24; // past this (cryo starts every 5 minutes), pick an hour first

// Where a friend lands from their guest pass email. They have no account: the pass is the way in, so
// this page sits outside the tabs and sign-up (AppShell). Rules: lib/guest.ts.
export default function GuestPage() {
  return (
    <Suspense>
      <GuestPassPage />
    </Suspense>
  );
}

function GuestPassPage() {
  const code = useSearchParams().get("pass");
  const { guestPasses } = useStore();
  const pass = guestPasses.find((p) => p.code === code);
  return (
    <div className="mx-auto min-h-screen max-w-md bg-sand px-4 pb-10 pt-5 text-shell">
      <p className="text-center font-wordmark text-2xl tracking-[0.35em]">ARTHA</p>
      <p className="mt-1 text-center text-[11px] uppercase tracking-[0.3em]">A Wellness Sanctuary</p>
      {pass ? (
        <PassDetails pass={pass} />
      ) : (
        <div className="mt-10 text-center">
          <h1 className="text-3xl">This pass isn&apos;t active</h1>
          <p className="mt-2 text-sm">Ask the friend who sent it to send you a new one.</p>
        </div>
      )}
    </div>
  );
}

const hasStarted = (s: Pick<Session, "date" | "time">) => sessionStart(s.date, s.time).getTime() <= Date.now();

function PassDetails({ pass }: { pass: GuestPass }) {
  const { guestBookings } = useStore();
  const [picking, setPicking] = useState<ServiceId | null>(null);
  const booked = guestBookings(pass);
  const done = GUEST_SERVICES.every((s) => booked.some((b) => b.serviceId === s.id));
  const upcoming = booked.some((b) => hasStarted(b) === false);
  return (
    <div className="mt-6 space-y-3">
      <div>
        <h1 className="text-4xl">Hi {pass.name.split(" ")[0]}</h1>
        <p className="mt-1 text-sm">
          {pass.senderName} sent you a day at {LOCATIONS[pass.location].name}: {GUEST_PASS_INCLUDES.join(", ")}, all complimentary.
        </p>
      </div>
      {GUEST_SERVICES.map((s) => {
        const booking = booked.find((b) => b.serviceId === s.id);
        return booking ? <BookedService key={s.id} pass={pass} booking={booking} /> : <OpenService key={s.id} id={s.id} onOpen={() => setPicking(s.id)} />;
      })}
      <p className="px-1 text-center text-xs">{!done ? "Guest passes are one per person." : upcoming ? "You're all set. Please arrive 5 minutes early." : "Thanks for visiting ARTHA."}</p>
      {picking && <PickTime pass={pass} serviceId={picking} onClose={() => setPicking(null)} />}
    </div>
  );
}

function OpenService({ id, onOpen }: { id: ServiceId; onOpen: () => void }) {
  const service = SERVICES[id];
  return (
    <button onClick={onOpen} className="flex min-h-[84px] w-full items-center gap-3 rounded-3xl border border-line bg-card p-4 text-left transition-colors active:bg-sand">
      <span className="min-w-0 flex-1">
        <span className="block font-heading text-2xl leading-tight">{id === "class" ? "Class" : service.name}</span>
        <span className="block text-sm">Complimentary · pick a time</span>
      </span>
      <ChevronRight size={20} className="shrink-0" />
    </button>
  );
}

function BookedService({ pass, booking: b }: { pass: GuestPass; booking: Booking }) {
  const { guestCancel, rateClass } = useStore();
  const [cancelling, setCancelling] = useState(false);
  const started = hasStarted(b);
  return (
    <div className="rounded-3xl border border-line bg-card p-4">
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest">
        <Check size={14} /> {started ? "Done" : "Booked"}
      </p>
      <p className="mt-1 font-heading text-2xl leading-tight">{b.title}</p>
      <p className="text-sm">
        {dayLabel(b.date, "long")} · {timeRange(b.time, b.durationMin)}
      </p>
      <p className="text-sm">
        {LOCATIONS[b.location].name}
        {b.instructor ? ` · w/ ${b.instructor}` : ""}
      </p>
      {/* After the class: 1 to 5 stars, for the ARTHA team only (lib/ratings.ts). */}
      {b.serviceId === "class" && (b.rating || canRate(b)) && (
        <div className="-mx-4 -mb-4 mt-3 border-t border-line">
          <RateClass booking={b} details={false} onRate={(stars, comment) => rateClass(b.id, stars, pass, comment)} />
        </div>
      )}
      {!started &&
        (cancelling ? (
          <CancelBooking onKeep={() => setCancelling(false)} onCancel={() => guestCancel(pass, b.id)} />
        ) : (
          <button onClick={() => setCancelling(true)} className="mt-2 min-h-[44px] rounded-full border border-line px-4 text-sm font-medium active:bg-line">
            Cancel or change
          </button>
        ))}
    </div>
  );
}

function CancelBooking({ onKeep, onCancel }: { onKeep: () => void; onCancel: () => void }) {
  const ready = useTapGuard();
  return (
    <div className="mt-2 space-y-2 text-sm">
      <p>Cancel this? You can pick another time on your pass.</p>
      <div className="flex gap-2">
        <button disabled={!ready} onClick={onKeep} className="min-h-[44px] flex-1 rounded-full border border-line font-medium active:bg-line">
          Keep it
        </button>
        <button disabled={!ready} onClick={onCancel} className="min-h-[44px] flex-1 rounded-full bg-sage font-medium text-ink active:bg-sage-light">
          Yes, cancel
        </button>
      </div>
    </div>
  );
}

function PickTime({ pass, serviceId, onClose }: { pass: GuestPass; serviceId: ServiceId; onClose: () => void }) {
  const { spotsLeft, guestBook } = useStore();
  const service = SERVICES[serviceId];
  const days = upcomingDays(DAYS_AHEAD);
  const [date, setDate] = useState(days[0]);
  const [chosen, setChosen] = useState<Session | null>(null);
  const [hour, setHour] = useState<string | null>(null);
  const [error, setError] = useState("");
  const times = slotsFor(pass.location, serviceId, date).filter((s) => !hasStarted(s));
  const byHour = times.length > MAX_TIMES;
  const open = byHour ? times.filter((s) => spotsLeft(s) > 0) : times;
  const hours = byHour ? Array.from(new Set(open.map((s) => s.time.slice(0, 2)))) : [];
  const shownHour = hour && hours.includes(hour) ? hour : hours[0];
  const shown = byHour ? open.filter((s) => s.time.slice(0, 2) === shownHour) : open;
  const title = serviceId === "class" ? "Pick a class" : service.name;
  const choose = (s: Session | null) => {
    setError("");
    setChosen(s);
  };

  if (chosen) {
    return (
      <Sheet key="confirm" open onClose={onClose} title="Confirm your booking">
        <div className="space-y-3 text-sm">
          <div className="rounded-2xl border border-line p-4">
            <p className="text-lg leading-tight">{chosen.title}</p>
            <p>
              {dayLabel(chosen.date, "long")} · {timeRange(chosen.time, chosen.durationMin)}
            </p>
            <p>
              {LOCATIONS[chosen.location].name}
              {chosen.instructor ? ` · w/ ${chosen.instructor}` : ""}
            </p>
            <p>{LOCATIONS[chosen.location].address}</p>
            <p className="mt-3 flex items-baseline justify-between border-t border-line pt-3 font-medium">
              <span>You pay</span> <span>Complimentary</span>
            </p>
          </div>
          {error && <p role="alert" className="rounded-xl bg-sand px-3 py-2 text-clay">{error}</p>}
          <Button
            onClick={() => {
              const r = guestBook(pass, chosen);
              if (r.ok) onClose();
              else setError(r.error);
            }}
          >
            Confirm booking
          </Button>
          <Button variant="secondary" onClick={() => choose(null)}>
            Go back
          </Button>
        </div>
      </Sheet>
    );
  }

  return (
    <Sheet key="times" open onClose={onClose} title={title}>
      <div className="space-y-3 text-sm">
        <p className="font-medium">{LOCATIONS[pass.location].name}</p>
        <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">
          {days.map((d) => (
            <button key={d} onClick={() => setDate(d)} className={clsx("min-h-[44px] shrink-0 rounded-xl border px-3 py-1.5 text-center", d === date ? "border-sage bg-sage text-ink" : "border-line active:bg-line")}>
              <span className="block whitespace-nowrap font-medium">{dayLabel(d).split(",")[0]}</span>
              <span className="block whitespace-nowrap text-xs">{shortDate(d)}</span>
            </button>
          ))}
        </div>
        {byHour && (
          <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">
            {hours.map((h) => (
              <button key={h} onClick={() => setHour(h)} className={clsx("min-h-[44px] shrink-0 whitespace-nowrap rounded-full border px-4 font-medium", h === shownHour ? "border-sage bg-sage text-ink" : "border-line active:bg-line")}>
                {timeLabel(`${h}:00`).replace(":00", "")}
              </button>
            ))}
          </div>
        )}
        {open.length === 0 && <p className="py-4 text-center">No times left this day. Try another day.</p>}
        <ul className="divide-y divide-line">
          {shown.map((s) => {
            const full = spotsLeft(s) <= 0;
            return (
              <li key={s.id}>
                <button disabled={full} onClick={() => choose(s)} className="flex min-h-[52px] w-full items-center gap-3 py-2 text-left active:bg-line disabled:opacity-50">
                  <span className="w-20 shrink-0 font-medium">{timeLabel(s.time)}</span>
                  <span className="min-w-0 flex-1 truncate">{serviceId === "class" ? s.title : `${s.durationMin} min`}</span>
                  <span className="shrink-0 text-xs">{full ? "Full" : ""}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </Sheet>
  );
}
