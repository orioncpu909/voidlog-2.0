"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarDays, Check, MapPin, Ticket, Users } from "lucide-react";
import { LOCATIONS, LocationId, TIERS } from "@/lib/data";
import { ArthaEvent, EVENTS, eventTicketPrice, eventVisibleTo, membersGetFree } from "@/lib/events";
import { eventSessions, sessionStart } from "@/lib/schedule";
import { useStore } from "@/lib/store";
import { cancelTerms, policyLine } from "@/lib/policy";
import { dayLabel, money, timeRange } from "@/lib/format";
import { calendarHref } from "@/lib/flags";
import { Button, Sheet } from "./Sheet";

function sessionFor(e: ArthaEvent) {
  return eventSessions(e.host, e.date).find((s) => s.time === e.time);
}

export function EventsSection() {
  const { member, toggleRsvp, myBookingFor, spotsLeft } = useStore();
  const [open, setOpen] = useState<ArthaEvent | null>(null);
  const rsvps = member.rsvps ?? [];
  const now = Date.now();
  const isMember = TIERS[member.tier].isMember;
  // Members-only events (industry nights, runs) don't show for Wellness Accounts.
  const upcoming = EVENTS.filter((e) => eventVisibleTo(e, isMember) && sessionStart(e.date, e.time).getTime() + e.durationMin * 60000 > now).sort(
    (a, b) => sessionStart(a.date, a.time).getTime() - sessionStart(b.date, b.time).getTime(),
  );

  if (upcoming.length === 0) return null;

  return (
    <section className="shrink-0 space-y-2">
      <h2 className="font-serif text-lg leading-none">Upcoming events</h2>
      <div className="no-scrollbar -mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1">
        {upcoming.map((e) => {
          const d = sessionStart(e.date, e.time);
          const session = e.ticket ? sessionFor(e) : undefined;
          const going = session ? !!myBookingFor(session.id) : rsvps.includes(e.id);
          const offsite = !e.venue.startsWith("ARTHA");
          return (
            <button
              key={e.id}
              onClick={() => setOpen(e)}
              className="flex w-56 shrink-0 snap-start gap-2.5 rounded-2xl border border-line bg-card p-3 text-left hover:border-muted"
            >
              <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl bg-moss-soft text-moss">
                <span className="text-[9px] uppercase leading-none">{d.toLocaleDateString("en-US", { month: "short" })}</span>
                <span className="font-serif text-lg leading-none">{d.getDate()}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium leading-tight">{e.title}</p>
                <p className="mt-0.5 truncate text-[11px] text-muted">
                  {d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                  {offsite && ` · ${e.venue}`}
                </p>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <HostTag host={e.host} />
                  {going ? (
                    <span className="whitespace-nowrap text-[11px] text-moss">✓ {e.ticket ? "Ticket" : "Going"}</span>
                  ) : session && spotsLeft(session) === 0 ? (
                    <span className="whitespace-nowrap text-[11px] text-muted">Sold out</span>
                  ) : (
                    <span className="whitespace-nowrap text-[11px] font-medium">{ticketLabel(e, isMember)}</span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <Sheet open={!!open} onClose={() => setOpen(null)} title={open?.title ?? ""}>
        {open && (
          <div className="space-y-4">
            <p className="flex items-center gap-2 text-sm">
              <HostTag host={open.host} /> <span className="text-muted">is hosting</span>
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <CalendarDays size={16} className="text-muted" />
                {dayLabel(open.date, "long")} · {timeRange(open.time, open.durationMin)}
              </li>
              <li className="flex items-center gap-2">
                <MapPin size={16} className="text-muted" />
                {open.venue}, {open.address}
              </li>
            </ul>
            <p className="text-sm text-muted">{open.description}</p>
            {open.ticket ? (
              <TicketPanel key={open.id} event={open} onLeave={() => setOpen(null)} />
            ) : rsvps.includes(open.id) ? (
              <div className="space-y-2">
                <p className="flex items-center justify-center gap-2 rounded-2xl bg-moss-soft py-3 text-sm text-moss">
                  <Check size={16} /> You&apos;re on the list
                </p>
                <Button variant="secondary" onClick={() => toggleRsvp(open.id)}>
                  I can&apos;t make it
                </Button>
              </div>
            ) : (
              <>
                <p className="text-sm">Free · RSVP so we know you&apos;re coming.</p>
                <Button onClick={() => toggleRsvp(open.id)}>RSVP</Button>
              </>
            )}
          </div>
        )}
      </Sheet>
    </section>
  );
}

// The price on an event card: Free (RSVP), Free ticket (a member's free ticket), or what this
// account pays ($10 public, $19 private class). The ticket sheet says when members get in free.
function ticketLabel(e: ArthaEvent, isMember: boolean): string {
  if (!e.ticket) return "Free";
  const price = eventTicketPrice(e, isMember);
  return price === 0 ? "Free ticket" : money(price);
}

// Buying a ticket: $10 for a public special class or workshop, $19 for a private class. Private
// classes and members-only events are free for members; Wellness Accounts always pay. Then a confirm step with the
// no-show sentence, like any other booking.
function TicketPanel({ event, onLeave }: { event: ArthaEvent; onLeave: () => void }) {
  const { member, book, spotsLeft, myBookingFor, termsForBooking } = useStore();
  const [stage, setStage] = useState<"details" | "confirm">("details");
  const [error, setError] = useState<string | null>(null);
  const session = sessionFor(event);
  if (!session) return null;

  const tier = TIERS[member.tier];
  const price = eventTicketPrice(event, tier.isMember);
  const mine = myBookingFor(session.id);
  const left = spotsLeft(session);
  const terms = cancelTerms(tier, { ...session, price, usedCredit: false });
  const access = event.access ?? "public";
  const note = membersGetFree(event)
    ? tier.isMember
      ? `Free with your ${tier.id === "trial" ? "trial" : "membership"}`
      : access === "private"
        ? "Private class · free for members"
        : "Free for members"
    : access === "private"
      ? "Private class · per ticket"
      : access === "members"
        ? "Members only"
        : "Same price for every account";

  if (mine) {
    return (
      <div className="space-y-2">
        <p className="flex items-center justify-center gap-2 rounded-2xl bg-moss-soft py-3 text-sm text-moss">
          <Ticket size={16} /> You have a ticket
        </p>
        <p className="text-center text-xs text-muted">{policyLine(termsForBooking(mine), false)}</p>
        <Link href={calendarHref(mine.date)} onClick={onLeave} className="block w-full rounded-full border border-line py-3 text-center text-sm hover:bg-line">
          See it on your calendar
        </Link>
      </div>
    );
  }

  if (stage === "confirm") {
    return (
      <div className="space-y-3 border-t border-line pt-4 text-sm">
        <p className="font-serif text-xl">Confirm your ticket</p>
        <div className="flex items-baseline justify-between rounded-2xl border border-line p-4">
          <span className="font-medium">You pay today</span>
          <span className="font-serif text-2xl">{money(price)}</span>
        </div>
        <p className="rounded-2xl bg-moss-soft p-4 font-medium text-moss">{policyLine(terms, false)}</p>
        {error && <p className="rounded-2xl bg-clay-soft px-4 py-3 text-clay">{error}</p>}
        <Button
          onClick={() => {
            const r = book(session, false);
            if (!r.ok) setError(r.error);
          }}
        >
          {price > 0 ? `Confirm and pay ${money(price)}` : "Confirm free ticket"}
        </Button>
        <Button variant="secondary" onClick={() => setStage("details")}>
          Go back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-2xl border border-line p-4">
        <div>
          <p className="text-sm font-medium">Ticket</p>
          <p className="text-xs text-muted">{note}</p>
        </div>
        <span className="font-serif text-3xl">{price > 0 ? money(price) : "Free"}</span>
      </div>
      <p className="flex items-center gap-1.5 text-xs text-muted">
        <Users size={13} /> {left > 0 ? `${left} of ${session.capacity} spots left` : "Sold out"}
      </p>
      <Button disabled={left === 0} onClick={() => setStage("confirm")}>
        {left === 0 ? "Sold out" : price > 0 ? `Get a ticket · ${money(price)}` : "Get a free ticket"}
      </Button>
    </div>
  );
}

// Each location gets its own dot color so events are easy to tell apart.
const HOST_STYLE: Record<LocationId, string> = {
  weho: "bg-moss",
  scity: "bg-copper",
};

function HostTag({ host }: { host: LocationId }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border border-line bg-sand px-2 py-0.5 text-[11px] font-medium">
      <span className={`h-1.5 w-1.5 rounded-full ${HOST_STYLE[host]}`} />
      {LOCATIONS[host].short}
    </span>
  );
}
