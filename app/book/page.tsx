"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import clsx from "clsx";
import { ArrowLeft, CalendarCheck, CalendarPlus, CheckCircle2, ChevronRight, Clock, MapPin, Ticket, UserRound } from "lucide-react";
import { Category, LOCATIONS, SERVICES, ServiceId, TIERS } from "@/lib/data";
import { Session, dateKey, findSession, sessionStart, slotsFor, upcomingDays } from "@/lib/schedule";
import { Booking, useStore } from "@/lib/store";
import { canUseCredit, cancelTerms, policyLine } from "@/lib/policy";
import { dayLabel, momentLabel, money, timeLabel, timeRange } from "@/lib/format";
import { CategoryTiles } from "@/components/CategoryTiles";
import { LocationBar } from "@/components/LocationBar";
import { THERAPISTS } from "@/lib/therapists";
import { addToPhoneCalendar } from "@/lib/ics";
import { PriceTag, PromoNote } from "@/components/PriceTag";
import { Button, Sheet } from "@/components/Sheet";

type Step =
  | { kind: "category" }
  | { kind: "service"; category: Category }
  | { kind: "time"; serviceId: ServiceId; therapist?: string }
  | { kind: "review"; session: Session }
  | { kind: "done"; booking: Booking };

export default function BookPage() {
  return (
    <Suspense>
      <BookFlow />
    </Suspense>
  );
}

function initialStep(params: URLSearchParams): Step[] {
  const sessionParam = params.get("session");
  const session = sessionParam ? findSession(sessionParam) : undefined;
  if (session) return [{ kind: "category" }, { kind: "time", serviceId: session.serviceId }, { kind: "review", session }];
  const category = params.get("category") as Category | null;
  if (category === "class") return [{ kind: "category" }, { kind: "time", serviceId: "class" }];
  if (category === "therapy" || category === "treatment") return [{ kind: "category" }, { kind: "service", category }];
  return [{ kind: "category" }];
}

function BookFlow() {
  const params = useSearchParams();
  const { member } = useStore();
  const [stack, setStack] = useState<Step[]>(() => initialStep(params));
  const step = stack[stack.length - 1];
  const push = (s: Step) => setStack((st) => [...st, s]);
  const back = () => setStack((st) => (st.length > 1 ? st.slice(0, -1) : st));
  const restart = () => setStack([{ kind: "category" }]);

  // A service may not exist at the newly chosen location; start over if so.
  useEffect(() => {
    if (step.kind === "time" && !SERVICES[step.serviceId].locations.includes(member.home)) restart();
  }, [member.home, step]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [step]);

  const titles: Record<Step["kind"], string> = {
    category: "What would you like to book?",
    service: step.kind === "service" ? `Choose a ${step.category === "therapy" ? "therapy" : "treatment"}` : "",
    time: step.kind === "time" ? (step.serviceId === "class" ? "Choose a class" : step.therapist ? `Times with ${step.therapist}` : "Choose a time") : "",
    review: "Review and confirm",
    done: "You're booked",
  };

  return (
    <div className="space-y-5">
      {step.kind !== "done" && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            {stack.length > 1 && (
              <button onClick={back} aria-label="Back" className="-ml-2 rounded-full p-2 hover:bg-shell">
                <ArrowLeft size={20} />
              </button>
            )}
            <h1 className="font-serif text-3xl leading-tight">{titles[step.kind]}</h1>
          </div>
          {step.kind !== "review" && <LocationBar showHint={step.kind === "category"} />}
        </div>
      )}

      {step.kind === "category" && <CategoryTiles showFirstVisit onPick={(c) => push(c === "class" ? { kind: "time", serviceId: "class" } : { kind: "service", category: c })} />}
      {step.kind === "service" && <ServiceStep category={step.category} onPick={(id, therapist) => push({ kind: "time", serviceId: id, therapist })} />}
      {step.kind === "time" && (
        <TimeStep
          key={`${step.serviceId}-${member.home}-${step.therapist ?? ""}`}
          serviceId={step.serviceId}
          therapist={step.therapist}
          onPick={(s) => push({ kind: "review", session: s })}
        />
      )}
      {step.kind === "review" && <ReviewStep session={step.session} onBooked={(b) => push({ kind: "done", booking: b })} />}
      {step.kind === "done" && <DoneStep booking={step.booking} onAgain={restart} />}
    </div>
  );
}

function ServiceStep({ category, onPick }: { category: Category; onPick: (id: ServiceId, therapist?: string) => void }) {
  const { member, quote } = useStore();
  const [tab, setTab] = useState<"services" | "therapists">("services");
  const today = dateKey(new Date());
  const services = Object.values(SERVICES).filter((s) => s.category === category && s.locations.includes(member.home));
  return (
    <div className="space-y-2">
      {category === "treatment" && (
        <div className="mb-2 grid grid-cols-2 gap-1 rounded-full border border-line bg-shell p-1 text-sm">
          {(["services", "therapists"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={clsx("rounded-full py-1.5", tab === t ? "bg-ink text-shell" : "text-muted")}>
              {t === "services" ? "Treatments" : "Meet your therapists"}
            </button>
          ))}
        </div>
      )}
      {tab === "therapists" ? (
        <TherapistList onPick={onPick} />
      ) : (
      <>
      {services.map((s) => {
        const q = quote(s.id, member.home, today);
        const creditNote = member.credits > 0 && canUseCredit(s.id);
        return (
          <button key={s.id} onClick={() => onPick(s.id)} className="flex w-full items-center gap-3 rounded-2xl border border-line bg-shell px-4 py-3.5 text-left hover:border-muted">
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-serif text-xl leading-tight">{s.name}</p>
                <PriceTag quote={q} />
              </div>
              <p className="mt-0.5 text-[11px] uppercase tracking-wider text-muted">
                {s.pillar ? `${s.pillar} · ` : ""}
                {s.durationMin} min
              </p>
              <p className="mt-1.5 text-sm leading-snug text-ink/80">{s.description}</p>
              {(q.kind === "promo" || q.kind === "firstVisit" || creditNote) && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <PromoNote quote={q} />
                  {creditNote && <span className="rounded-full bg-moss-soft px-2 py-0.5 text-[11px] text-moss">Credit can cover this</span>}
                </div>
              )}
            </div>
            <ChevronRight className="shrink-0 text-muted" size={18} />
          </button>
        );
      })}
      </>
      )}
    </div>
  );
}

function TherapistList({ onPick }: { onPick: (id: ServiceId, therapist?: string) => void }) {
  const { member } = useStore();
  return (
    <div className="space-y-2">
      {THERAPISTS.map((t) => {
        const bookable = t.services.filter((id) => SERVICES[id].locations.includes(member.home));
        return (
          <div key={t.name} className="rounded-2xl border border-line bg-shell p-4">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-walnut font-serif text-xl text-shell">{t.name[0]}</span>
              <div>
                <p className="font-serif text-xl leading-tight">{t.name}</p>
                <p className="text-[11px] uppercase tracking-wider text-muted">{t.specialties.join(" · ")}</p>
              </div>
            </div>
            <p className="mt-2 text-sm leading-snug text-ink/80">{t.bio}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {bookable.map((id) => (
                <button key={id} onClick={() => onPick(id, t.name)} className="rounded-full border border-line px-3 py-1.5 text-xs hover:border-moss">
                  Book {SERVICES[id].name} with {t.name} →
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TimeStep({ serviceId, therapist, onPick }: { serviceId: ServiceId; therapist?: string; onPick: (s: Session) => void }) {
  const { member, spotsLeft, myBookingFor, quote } = useStore();
  const days = useMemo(() => upcomingDays(7), []);
  const future = (d: string) =>
    slotsFor(member.home, serviceId, d).filter((s) => sessionStart(s.date, s.time).getTime() > Date.now() && (!therapist || s.instructor === therapist));
  // Open on the first day that still has times, so nobody lands on an empty "today".
  const [day, setDay] = useState(() => days.find((d) => future(d).length > 0) ?? days[0]);
  const slots = future(day);
  const service = SERVICES[serviceId];
  const q = quote(serviceId, member.home, day);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-shell px-4 py-3 text-sm">
        <div className="flex items-center justify-between gap-3">
          <span>
            {serviceId === "class" ? "Every class" : service.name}
            {therapist ? ` with ${therapist}` : ""} · <span className="text-muted">your price</span>
          </span>
          <PriceTag quote={q} />
        </div>
        {(q.kind === "promo" || q.kind === "firstVisit") && (
          <div className="mt-1.5">
            <PromoNote quote={q} />
          </div>
        )}
        {member.credits > 0 && canUseCredit(serviceId) && (
          <p className="mt-1 text-xs text-moss">
            Or use 1 of your {member.credits} treatment credits and pay $0.
          </p>
        )}
      </div>

      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        {days.map((d) => {
          const date = sessionStart(d, "12:00");
          return (
            <button
              key={d}
              onClick={() => setDay(d)}
              className={clsx("flex w-14 shrink-0 flex-col items-center rounded-2xl border py-2", d === day ? "border-moss bg-moss text-shell" : "border-line bg-shell")}
            >
              <span className="text-[11px] uppercase tracking-wide opacity-80">{date.toLocaleDateString("en-US", { weekday: "short" })}</span>
              <span className="font-serif text-xl">{date.getDate()}</span>
            </button>
          );
        })}
      </div>

      <p className="text-xs uppercase tracking-widest text-muted">{dayLabel(day, "long")}</p>

      {slots.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line p-6 text-center text-sm text-muted">No more times this day. Pick another day above.</p>
      ) : serviceId === "class" ? (
        <div className="space-y-2">
          {slots.map((s) => {
            const left = spotsLeft(s);
            const mine = !!myBookingFor(s.id);
            return (
              <button
                key={s.id}
                disabled={left === 0 || mine}
                onClick={() => onPick(s)}
                className={clsx(
                  "flex w-full items-center gap-3 rounded-2xl border bg-shell px-4 py-3 text-left",
                  mine ? "border-moss" : "border-line hover:border-muted",
                  left === 0 && !mine && "opacity-50",
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-serif text-lg leading-tight">{s.title}</p>
                  <p className="text-xs text-muted">
                    {timeRange(s.time, s.durationMin)} · {s.instructor}
                  </p>
                </div>
                <span className={clsx("shrink-0 text-xs", mine ? "rounded-full bg-moss px-2.5 py-0.5 text-shell" : left === 0 ? "text-muted" : left <= 3 ? "text-clay" : "text-muted")}>
                  {mine ? "Booked" : left === 0 ? "Full" : `${left} left`}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <SlotPicker key={day} slots={slots} onPick={onPick} />
      )}
    </div>
  );
}

// Many slots a day (cryo starts every 5 minutes): pick the hour first, then the exact time.
const HOUR_PICKER_THRESHOLD = 24;

function SlotPicker({ slots, onPick }: { slots: Session[]; onPick: (s: Session) => void }) {
  const { spotsLeft, myBookingFor } = useStore();
  const byHour = useMemo(() => {
    const map = new Map<string, Session[]>();
    for (const s of slots) {
      const h = s.time.slice(0, 2);
      map.set(h, [...(map.get(h) ?? []), s]);
    }
    return map;
  }, [slots]);
  const hours = [...byHour.keys()];
  const firstOpen = hours.find((h) => byHour.get(h)!.some((s) => spotsLeft(s) > 0)) ?? hours[0];
  const [hour, setHour] = useState(firstOpen);
  const useHours = slots.length > HOUR_PICKER_THRESHOLD;
  const shown = useHours ? (byHour.get(hour) ?? []) : slots;
  const showEnd = (shown[0]?.durationMin ?? 0) >= 15;

  return (
    <div className="space-y-3">
      {useHours && (
        <>
          <p className="text-xs text-muted">Pick an hour, then a time.</p>
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
            {hours.map((h) => {
              const open = byHour.get(h)!.filter((s) => spotsLeft(s) > 0).length;
              return (
                <button
                  key={h}
                  onClick={() => setHour(h)}
                  disabled={open === 0}
                  className={clsx(
                    "shrink-0 rounded-full border px-3.5 py-1.5 text-sm",
                    h === hour ? "border-moss bg-moss text-shell" : "border-line bg-shell disabled:opacity-40",
                  )}
                >
                  {timeLabel(`${h}:00`).replace(":00", "")}
                </button>
              );
            })}
          </div>
        </>
      )}
      <div className={clsx("grid gap-2", useHours ? "grid-cols-4" : "grid-cols-3")}>
        {shown.map((s) => {
          const left = spotsLeft(s);
          const mine = !!myBookingFor(s.id);
          const end = new Date(sessionStart(s.date, s.time).getTime() + s.durationMin * 60000).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
          return (
            <button
              key={s.id}
              disabled={left === 0 || mine}
              onClick={() => onPick(s)}
              className={clsx(
                "flex h-14 flex-col items-center justify-center rounded-xl border text-sm leading-tight",
                mine ? "border-moss bg-moss text-shell" : left === 0 ? "border-line text-muted opacity-40" : "border-line bg-shell hover:border-moss",
              )}
            >
              {timeLabel(s.time)}
              <span className="block text-[10px] opacity-70">{mine ? "Booked" : left === 0 ? "Full" : showEnd ? `to ${end}` : ""}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ReviewStep({ session, onBooked }: { session: Session; onBooked: (b: Booking) => void }) {
  const { member, book, spotsLeft, quote } = useStore();
  const tier = TIERS[member.tier];
  const q = quote(session.serviceId, session.location, session.date);
  const creditAvailable = canUseCredit(session.serviceId) && member.credits > 0 && q.price > 0;
  const [useCredit, setUseCredit] = useState(creditAvailable);
  const [error, setError] = useState<string | null>(null);
  const total = useCredit && creditAvailable ? 0 : q.price;
  const credit = useCredit && creditAvailable;
  const terms = cancelTerms(tier, { ...session, price: total, usedCredit: credit });
  const left = spotsLeft(session);
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-line bg-shell p-5">
        <p className="font-serif text-2xl leading-tight">{session.title}</p>
        {session.serviceId !== "class" && <p className="mt-1 text-sm text-muted">{SERVICES[session.serviceId].description}</p>}
        <ul className="mt-3 space-y-2 text-sm">
          <li className="flex items-center gap-2">
            <Clock size={16} className="text-muted" />
            {dayLabel(session.date, "long")} · {timeRange(session.time, session.durationMin)}
          </li>
          <li className="flex items-center gap-2">
            <MapPin size={16} className="text-muted" />
            {LOCATIONS[session.location].name}
          </li>
          {session.instructor && (
            <li className="flex items-center gap-2">
              <UserRound size={16} className="text-muted" />
              {session.serviceId === "class" ? "With" : "Therapist:"} {session.instructor}
            </li>
          )}
        </ul>
      </div>

      <div className="rounded-3xl border border-line bg-shell p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm">{q.label}</p>
            <div className="mt-1">
              <PromoNote quote={q} />
            </div>
          </div>
          <PriceTag quote={q} size="lg" />
        </div>

        {creditAvailable && (
          <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-2xl bg-moss-soft p-3 text-sm text-moss">
            <input type="checkbox" checked={useCredit} onChange={(e) => setUseCredit(e.target.checked)} className="h-4 w-4 accent-moss" />
            <Ticket size={16} />
            <span>
              Use 1 treatment credit <span className="opacity-70">({member.credits} left)</span>
            </span>
          </label>
        )}

        <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
          <span className="font-medium">You pay today</span>
          <span className="font-serif text-3xl">{total === 0 ? "$0" : money(total)}</span>
        </div>
        <p className="mt-1 text-xs text-muted">
          {total > 0 ? "Charged to your card on file when you confirm." : useCredit && creditAvailable ? "Covered by your credit." : "Nothing is charged."}
        </p>
      </div>

      <div className={clsx("rounded-3xl p-5 text-sm", terms.late ? "bg-clay-soft text-clay" : "bg-moss-soft text-moss")}>
        <p className="text-xs font-medium uppercase tracking-widest opacity-80">Cancellation policy</p>
        <p className="mt-1">{policyLine(terms, credit)}</p>
      </div>

      {error && <p className="rounded-2xl bg-clay-soft px-4 py-3 text-sm text-clay">{error}</p>}

      <Button disabled={left === 0} onClick={() => setConfirming(true)}>
        {left === 0 ? "Full" : total > 0 ? `Book · ${money(total)}` : "Book"}
      </Button>
      <p className="text-center text-xs text-muted">Please arrive 5 minutes early.</p>

      <Sheet open={confirming} onClose={() => setConfirming(false)} title="Confirm your booking">
        <div className="space-y-4 text-sm">
          <div className="rounded-2xl border border-line p-4">
            <p className="font-serif text-xl leading-tight">{session.title}</p>
            <p className="mt-1 text-muted">
              {dayLabel(session.date, "long")} · {timeRange(session.time, session.durationMin)}
            </p>
            <p className="text-muted">{LOCATIONS[session.location].name}</p>
            <div className="mt-3 flex items-baseline justify-between border-t border-line pt-3">
              <span className="font-medium">You pay today</span>
              <span className="font-serif text-2xl">{money(total)}</span>
            </div>
            {credit && <p className="text-xs text-moss">Covered by 1 treatment credit.</p>}
          </div>
          <p className={clsx("rounded-2xl p-4 font-medium", terms.late ? "bg-clay-soft text-clay" : "bg-moss-soft text-moss")}>{policyLine(terms, credit)}</p>
          {error && <p className="rounded-2xl bg-clay-soft px-4 py-3 text-clay">{error}</p>}
          <div className="space-y-2">
            <Button
              onClick={() => {
                const r = book(session, credit);
                if (r.ok) onBooked(r.booking);
                else setError(r.error);
              }}
            >
              {total > 0 ? `Confirm and pay ${money(total)}` : "Confirm booking"}
            </Button>
            <Button variant="secondary" onClick={() => setConfirming(false)}>
              Go back
            </Button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}

function DoneStep({ booking, onAgain }: { booking: Booking; onAgain: () => void }) {
  const { termsForBooking } = useStore();
  const terms = termsForBooking(booking);
  return (
    <div className="space-y-6 pt-6 text-center">
      <CheckCircle2 className="mx-auto text-moss" size={56} strokeWidth={1.4} />
      <div>
        <h1 className="font-serif text-4xl">You&apos;re booked</h1>
        <p className="mt-2 font-serif text-2xl">{booking.title}</p>
        <p className="text-sm text-muted">
          {dayLabel(booking.date, "long")} · {timeRange(booking.time, booking.durationMin)}
        </p>
        <p className="text-sm text-muted">{LOCATIONS[booking.location].name}</p>
      </div>
      <div className="rounded-2xl bg-shell p-4 text-sm">
        <p>
          {booking.usedCredit ? "Paid with 1 treatment credit" : booking.price > 0 ? `Paid ${money(booking.price)}` : "Included, nothing charged"}
          {booking.firstVisit && " · first visit 50% off"}
        </p>
        <p className="mt-1 text-muted">{policyLine(terms, booking.usedCredit)}</p>
      </div>
      <p className="flex items-center justify-center gap-1.5 text-sm text-moss">
        <CalendarCheck size={16} /> Added to your Calendar
      </p>
      <div className="space-y-2">
        <Link href="/calendar" className="block w-full rounded-full bg-moss px-5 py-3 text-sm font-medium text-shell">
          See my calendar
        </Link>
        <Button variant="secondary" onClick={() => addToPhoneCalendar(booking, policyLine(terms, booking.usedCredit))}>
          <span className="inline-flex items-center gap-1.5">
            <CalendarPlus size={16} /> Add to phone calendar
          </span>
        </Button>
        <Button variant="secondary" onClick={onAgain}>
          Book something else
        </Button>
      </div>
    </div>
  );
}
