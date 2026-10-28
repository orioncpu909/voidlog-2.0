"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import clsx from "clsx";
import { ArrowRight, CalendarPlus, Check, ChevronDown, Lock, MapPin, Share, Ticket, X } from "lucide-react";
import { Category, LOCATIONS, LocationId, SERVICES, ServiceId, TIERS, bookableAt } from "@/lib/data";
import { Session, dateKey, findSession, sessionStart, slotsFor, upcomingDays } from "@/lib/schedule";
import { Booking, useStore } from "@/lib/store";
import { canUseCredit, cancelTerms, policyLine } from "@/lib/policy";
import { dayLabel, money, timeLabel, timeRange } from "@/lib/format";
import { Therapist, therapistsFor } from "@/lib/therapists";
import { addToPhoneCalendar } from "@/lib/ics";
import { SERVICE_IMAGE } from "@/lib/images";
import { PriceTag, PromoNote } from "@/components/PriceTag";
import { Button, Sheet } from "@/components/Sheet";
import { EmailStudioButton } from "@/components/EmailStudio";

// Book works like the Open app's In Person screen: pick Classes, Therapies or Treatments, scroll
// one list of upcoming days (the date strip jumps to a day), tap a class or time to open its page,
// and Reserve from there. Reserve always asks for one confirmation before booking.

type Tab = Exclude<Category, "event">;
const TABS: { id: Tab; label: string }[] = [
  { id: "class", label: "Classes" },
  { id: "therapy", label: "Therapies" },
  { id: "treatment", label: "Treatments" },
];
const DAYS_AHEAD = 14;

export default function BookPage() {
  return (
    <Suspense>
      <BookScreen />
    </Suspense>
  );
}

function BookScreen() {
  const params = useSearchParams();
  const { member, setLocation } = useStore();
  const tier = TIERS[member.tier];
  // A link can open one session's page directly (/book?session=…) or a tab (/book?category=therapy).
  const linked = useMemo(() => {
    const id = params.get("session");
    return id ? findSession(id) : undefined;
  }, [params]);
  const [tab, setTab] = useState<Tab>(() => {
    const c = linked ? SERVICES[linked.serviceId].category : params.get("category");
    return c === "therapy" || c === "treatment" ? c : "class";
  });
  const [picked, setPicked] = useState<Partial<Record<Tab, ServiceId>>>(() =>
    linked && linked.serviceId !== "class" ? { [SERVICES[linked.serviceId].category]: linked.serviceId } : {},
  );
  const [therapist, setTherapist] = useState<string | null>(null);
  const [open, setOpen] = useState<Session | null>(linked ?? null);
  const days = useMemo(() => upcomingDays(DAYS_AHEAD), []);

  // Wellness Accounts switch their location for everything. Members switch only for classes:
  // their therapies and treatments are always at their home location.
  const [classLocation, setClassLocation] = useState<LocationId | null>(linked?.serviceId === "class" ? linked.location : null);
  const memberClasses = tier.lockedToHome && tab === "class";
  const location: LocationId = memberClasses ? (classLocation ?? member.home) : member.home;
  const lockedHere = tier.lockedToHome && tab !== "class";
  const pickLocation = (id: LocationId) => (tier.lockedToHome ? setClassLocation(id) : setLocation(id));

  const services = Object.values(SERVICES).filter((s) => s.category === tab && s.locations.includes(location));
  // The picked service may not exist at a newly chosen location; fall back to the first one there.
  const serviceId: ServiceId =
    tab === "class" ? "class" : picked[tab] && SERVICES[picked[tab]!].locations.includes(location) ? picked[tab]! : services[0].id;
  const shownTherapist = therapist && therapistsFor(serviceId).some((t) => t.name === therapist) ? therapist : null;

  // Date strip: jump to a day, and follow along as the list scrolls.
  const stickyRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const [activeDay, setActiveDay] = useState(days[0]);
  const stickyBottom = () => stickyRef.current?.getBoundingClientRect().bottom ?? 0;
  const jumpTo = (d: string) => {
    const el = document.getElementById(`day-${d}`);
    if (!el) return;
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - stickyBottom() - 8, behavior: "smooth" });
    setActiveDay(d);
  };
  useEffect(() => {
    const onScroll = () => {
      const edge = stickyBottom() + 40;
      let current = days[0];
      for (const d of days) {
        const el = document.getElementById(`day-${d}`);
        if (el && el.getBoundingClientRect().top <= edge) current = d;
      }
      setActiveDay(current);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [days]);
  useEffect(() => {
    const strip = stripRef.current;
    const btn = strip?.querySelector<HTMLElement>(`[data-day="${activeDay}"]`);
    if (strip && btn) strip.scrollTo({ left: btn.offsetLeft - strip.clientWidth / 2 + btn.clientWidth / 2, behavior: "smooth" });
  }, [activeDay]);
  useEffect(() => {
    window.scrollTo({ top: 0 });
    setActiveDay(days[0]);
  }, [tab, serviceId, location, days]);

  return (
    <div className="space-y-5">
      <div ref={stickyRef} className="sticky top-[53px] z-10 -mx-4 -mt-3 border-b border-line bg-sand px-4">
        <div className="grid grid-cols-3" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={clsx("border-b-2 py-3 text-sm", tab === t.id ? "border-sage text-shell" : "border-transparent text-muted")}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div ref={stripRef} className="no-scrollbar -mx-4 flex overflow-x-auto px-2 py-2.5">
          {days.map((d) => {
            const date = sessionStart(d, "12:00");
            const active = d === activeDay;
            return (
              <button key={d} data-day={d} onClick={() => jumpTo(d)} className="flex w-[13.5%] min-w-[46px] shrink-0 flex-col items-center gap-1">
                <span className="text-[11px] text-muted">{date.toLocaleDateString("en-US", { weekday: "narrow" })}</span>
                <span className={clsx("flex h-8 w-8 items-center justify-center rounded-full text-base", active ? "bg-sage text-ink" : "text-shell")}>
                  {date.getDate()}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <LocationRow serviceId={serviceId} location={location} locked={lockedHere} onPick={pickLocation} />
      {tier.lockedToHome && (
        <p className="-mt-3 text-xs text-muted">
          {tab === "class"
            ? "Your membership covers classes at both locations."
            : "Therapies and treatments are at your home location only."}
        </p>
      )}

      {tab !== "class" && (
        <ServiceIntro
          services={services.map((s) => s.id)}
          serviceId={serviceId}
          onPick={(id) => setPicked((p) => ({ ...p, [tab]: id }))}
          therapist={shownTherapist}
          onTherapist={setTherapist}
        />
      )}

      <div className="space-y-8">
        {days.map((d) => (
          <section key={d} id={`day-${d}`} aria-label={dayLabel(d, "long")}>
            <h2 className="mb-3 text-3xl font-medium tracking-tight">{dayLabel(d, "long")}</h2>
            <DayList date={d} serviceId={serviceId} location={location} therapist={shownTherapist} onOpen={setOpen} />
          </section>
        ))}
      </div>
      <p className="pb-4 text-center text-xs text-muted">That&apos;s the next two weeks. New times open every day.</p>

      {open && <SessionPage key={open.id} session={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

// The location on the left (a switch, or locked to a member's home for therapies and treatments),
// your price on the right.
function LocationRow({
  serviceId,
  location,
  locked,
  onPick,
}: {
  serviceId: ServiceId;
  location: LocationId;
  locked: boolean;
  onPick: (id: LocationId) => void;
}) {
  const { quote } = useStore();
  const q = quote(serviceId, location, dateKey(new Date()));
  return (
    <div className="flex items-center justify-between gap-3">
      {locked ? (
        <p className="flex items-center gap-1.5 whitespace-nowrap text-sm">
          <MapPin size={15} className="text-muted" />
          {LOCATIONS[location].short}
          <Lock size={12} className="ml-0.5 text-muted" aria-label="Your home location" />
        </p>
      ) : (
        <div className="flex rounded-full border border-line p-0.5 text-xs" role="radiogroup" aria-label="Location">
          {(Object.keys(LOCATIONS) as LocationId[]).map((id) => (
            <button
              key={id}
              role="radio"
              aria-checked={location === id}
              onClick={() => onPick(id)}
              className={clsx("rounded-full px-3 py-1.5", location === id ? "bg-sage text-ink" : "text-muted")}
            >
              {LOCATIONS[id].short}
            </button>
          ))}
        </div>
      )}
      <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-line px-3 py-1.5 text-xs">
        <span className="text-muted">Your price</span>
        <PriceTag quote={q} />
      </span>
    </div>
  );
}

// Therapies and Treatments: pick the service (pills, like Open's filters), then see its photo and details.
function ServiceIntro({
  services,
  serviceId,
  onPick,
  therapist,
  onTherapist,
}: {
  services: ServiceId[];
  serviceId: ServiceId;
  onPick: (id: ServiceId) => void;
  therapist: string | null;
  onTherapist: (name: string | null) => void;
}) {
  const { member, quote } = useStore();
  const service = SERVICES[serviceId];
  const q = quote(serviceId, member.home, dateKey(new Date()));
  const [about, setAbout] = useState<Therapist | null>(null);
  const isTreatment = service.category === "treatment";

  return (
    <div className="space-y-4">
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        {services.map((id) => (
          <button
            key={id}
            onClick={() => onPick(id)}
            className={clsx("shrink-0 rounded-full px-4 py-2 text-sm", id === serviceId ? "bg-sage text-ink" : "bg-card text-shell")}
          >
            {SHORT_NAME[id] ?? SERVICES[id].name}
          </button>
        ))}
      </div>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={SERVICE_IMAGE[serviceId]} alt="" className="aspect-[2/1] w-full rounded-xl object-cover" />
      <div>
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-2xl font-medium tracking-tight">{service.name}</h2>
          <PriceTag quote={q} size="lg" />
        </div>
        <p className="text-xs text-muted">
          {service.pillar ? `${service.pillar} · ` : ""}
          {service.durationMin} min
        </p>
        <p className="mt-2 text-sm leading-snug text-shell">{service.description}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <PromoNote quote={q} />
          {member.credits > 0 && canUseCredit(serviceId) && (
            <span className="inline-flex items-center gap-1 rounded-full bg-card px-2 py-0.5 text-[11px] text-moss">
              <Ticket size={11} /> A credit can cover this ({member.credits} left)
            </span>
          )}
        </div>
      </div>

      {isTreatment && (
        <div>
          <p className="mb-2 text-[11px] uppercase tracking-widest text-muted">Meet your therapists</p>
          <div className="flex gap-4">
            {therapistsFor(serviceId).map((t) => (
              <button key={t.name} onClick={() => setAbout(t)} className="flex flex-col items-center gap-1 text-xs">
                <Avatar name={t.name} size="lg" ring={therapist === t.name} />
                {t.name}
              </button>
            ))}
          </div>
          {therapist && (
            <button onClick={() => onTherapist(null)} className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-xs">
              Only {therapist}&apos;s times <X size={12} />
            </button>
          )}
        </div>
      )}

      <Sheet open={!!about} onClose={() => setAbout(null)} title={about?.name ?? ""}>
        {about && (
          <div className="space-y-4 text-sm">
            <div className="flex items-center gap-3">
              <Avatar name={about.name} size="lg" />
              <p className="text-[11px] uppercase tracking-wider text-muted">{about.specialties.join(" · ")}</p>
            </div>
            <p className="leading-snug text-shell">{about.bio}</p>
            <Button
              variant="primary"
              onClick={() => {
                onTherapist(about.name);
                setAbout(null);
              }}
            >
              See {about.name}&apos;s times
            </Button>
          </div>
        )}
      </Sheet>
    </div>
  );
}

const SHORT_NAME: Partial<Record<ServiceId, string>> = {
  "ir-sauna": "Sauna",
  "red-light": "Red Light",
  contrast: "Contrast",
  hbot: "HBOT",
  "em-sculpt": "EM Sculpt",
};

function upcoming(date: string, serviceId: ServiceId, location: LocationId, therapist: string | null): Session[] {
  return slotsFor(location, serviceId, date).filter(
    (s) => sessionStart(s.date, s.time).getTime() > Date.now() && (!therapist || s.instructor === therapist),
  );
}

function DayList({
  date,
  serviceId,
  location,
  therapist,
  onOpen,
}: {
  date: string;
  serviceId: ServiceId;
  location: LocationId;
  therapist: string | null;
  onOpen: (s: Session) => void;
}) {
  const sessions = upcoming(date, serviceId, location, therapist);
  if (sessions.length === 0) {
    return <p className="text-sm text-muted">{date === dateKey(new Date()) ? "Nothing left today." : "Nothing this day."}</p>;
  }
  if (serviceId === "class") {
    return (
      <div className="divide-y divide-line border-y border-line">
        {sessions.map((s) => (
          <ClassCard key={s.id} session={s} onOpen={() => onOpen(s)} />
        ))}
      </div>
    );
  }
  // Cryo starts every 5 minutes, which is too many rows: group by hour, open an hour to pick a time.
  if (sessions.length > HOUR_GROUP_THRESHOLD) return <HourGroups sessions={sessions} onOpen={onOpen} />;
  return (
    <div className="divide-y divide-line border-y border-line">
      {sessions.map((s) => (
        <SlotRow key={s.id} session={s} onOpen={() => onOpen(s)} />
      ))}
    </div>
  );
}

const HOUR_GROUP_THRESHOLD = 24;

// Time on the left, then the class, teacher and price, like Open's schedule (without photos).
function ClassCard({ session, onOpen }: { session: Session; onOpen: () => void }) {
  const { spotsLeft, myBookingFor, quote } = useStore();
  const left = spotsLeft(session);
  const mine = !!myBookingFor(session.id);
  const q = quote(session.serviceId, session.location, session.date);
  return (
    <button onClick={onOpen} className={clsx("flex w-full items-start gap-3 py-4 text-left", left === 0 && !mine && "opacity-50")}>
      <div className="w-[76px] shrink-0">
        <p className="stat-num text-base leading-tight">{timeLabel(session.time)}</p>
        <p className="text-xs text-muted">{session.durationMin} min</p>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-base font-medium leading-tight">{session.title}</p>
        {session.instructor && <p className="mt-0.5 text-sm text-muted">w/ {session.instructor}</p>}
        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm">
          <PriceTag quote={q} />
          {q.kind === "memberOff" && <PromoNote quote={q} />}
          <Status left={left} mine={mine} />
        </div>
      </div>
      {session.instructor && <Avatar name={session.instructor} size="lg" />}
    </button>
  );
}

// One time on its own row, like Open's Hot + Cold list.
function SlotRow({ session, onOpen }: { session: Session; onOpen: () => void }) {
  const { spotsLeft, myBookingFor } = useStore();
  const left = spotsLeft(session);
  const mine = !!myBookingFor(session.id);
  const full = left === 0 && !mine;
  return (
    <button onClick={onOpen} className={clsx("flex w-full items-center gap-3 py-3 text-left", full && "opacity-50")}>
      <div className="min-w-0 flex-1">
        <p className="text-base">{session.durationMin >= 15 ? timeRange(session.time, session.durationMin) : timeLabel(session.time)}</p>
        <p className={clsx("text-sm", mine ? "text-moss" : session.capacity > 3 && left > 0 && left <= 2 ? "text-clay" : "text-muted")}>
          {session.instructor ? `with ${session.instructor} · ` : ""}
          {mine ? "Booked" : full ? "Full" : session.capacity === 1 ? "Available" : `${left} ${left === 1 ? "spot" : "spots"} left`}
        </p>
      </div>
      {mine ? <Check size={18} className="text-moss" /> : <ArrowRight size={18} className="text-muted" />}
    </button>
  );
}

function HourGroups({ sessions, onOpen }: { sessions: Session[]; onOpen: (s: Session) => void }) {
  const { spotsLeft, myBookingFor } = useStore();
  const [openHour, setOpenHour] = useState<string | null>(null);
  const byHour = new Map<string, Session[]>();
  for (const s of sessions) byHour.set(s.time.slice(0, 2), [...(byHour.get(s.time.slice(0, 2)) ?? []), s]);
  return (
    <div className="divide-y divide-line border-y border-line">
      {[...byHour.entries()].map(([hour, list]) => {
        const free = list.filter((s) => spotsLeft(s) > 0).length;
        const expanded = openHour === hour;
        return (
          <div key={hour}>
            <button
              onClick={() => setOpenHour(expanded ? null : hour)}
              aria-expanded={expanded}
              className={clsx("flex w-full items-center gap-3 py-3 text-left", free === 0 && "opacity-50")}
            >
              <div className="flex-1">
                <p className="text-base">{timeLabel(`${hour}:00`).replace(":00", "")}</p>
                <p className="text-sm text-muted">
                  {free} {free === 1 ? "time" : "times"} open · every 5 min
                </p>
              </div>
              <ChevronDown size={18} className={clsx("text-muted transition", expanded && "rotate-180")} />
            </button>
            {expanded && (
              <div className="grid grid-cols-4 gap-2 pb-3">
                {list.map((s) => {
                  const mine = !!myBookingFor(s.id);
                  const full = spotsLeft(s) === 0 && !mine;
                  return (
                    <button
                      key={s.id}
                      onClick={() => onOpen(s)}
                      disabled={full}
                      className={clsx(
                        "rounded-lg py-2 text-sm",
                        mine ? "bg-moss text-ink" : full ? "bg-card text-muted line-through opacity-50" : "bg-card hover:bg-line",
                      )}
                    >
                      {timeLabel(s.time).replace(/ [AP]M/, "")}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Full-screen page for one class or time, like Open's class page: photo, details, and Reserve at the bottom.
function SessionPage({ session, onClose }: { session: Session; onClose: () => void }) {
  const { member, book, spotsLeft, quote, myBookingFor, termsForBooking } = useStore();
  const tier = TIERS[member.tier];
  const service = SERVICES[session.serviceId];
  const location = LOCATIONS[session.location];
  const q = quote(session.serviceId, session.location, session.date);
  const creditAvailable = canUseCredit(session.serviceId) && member.credits > 0 && q.price > 0;
  const [useCredit, setUseCredit] = useState(creditAvailable);
  const credit = useCredit && creditAvailable;
  const total = credit ? 0 : q.price;
  const terms = cancelTerms(tier, { ...session, price: total, usedCredit: credit, perk: !credit && q.kind === "perk" });
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justBooked, setJustBooked] = useState<Booking | null>(null);
  const existing = myBookingFor(session.id);
  const booking = justBooked ?? existing;
  const left = spotsLeft(session);
  const past = sessionStart(session.date, session.time).getTime() <= Date.now();
  // A link can open a member's therapy or treatment at the other location; say so before they try.
  const elsewhere = !bookableAt(tier, session.serviceId, session.location, member.home);

  useEffect(() => {
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = before;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const share = async () => {
    const url = `${window.location.origin}/book?session=${encodeURIComponent(session.id)}`;
    const text = `${session.title} at ARTHA ${location.short}, ${dayLabel(session.date, "long")} ${timeLabel(session.time)}`;
    try {
      if (navigator.share) await navigator.share({ title: session.title, text, url });
      else await navigator.clipboard.writeText(`${text}: ${url}`);
    } catch {
      // Closing the share sheet is not an error.
    }
  };

  // Classes have no photo; therapies and treatments open with theirs.
  const image = session.serviceId === "class" ? undefined : SERVICE_IMAGE[session.serviceId];
  const close = (
    <button onClick={onClose} aria-label="Close" className="rounded-full bg-sand/70 p-2 backdrop-blur">
      <X size={20} />
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-sand text-shell" role="dialog" aria-modal="true" aria-label={session.title}>
      <div className="mx-auto max-w-md pb-40">
        {image ? (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} alt="" className="h-64 w-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-sand" aria-hidden />
            <div className="absolute right-3 top-3">{close}</div>
          </div>
        ) : (
          <div className="flex justify-end px-3 pb-2 pt-3">{close}</div>
        )}

        <div className="space-y-5 px-4">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="text-2xl font-medium leading-tight tracking-tight">{session.title}</h2>
              {session.instructor && <p className="mt-0.5">{session.serviceId === "class" ? `w/ ${session.instructor}` : `with ${session.instructor}`}</p>}
              <p className="mt-0.5 text-sm text-muted">{dayLabel(session.date, "long")}</p>
              <p className="text-sm text-muted">{timeRange(session.time, session.durationMin)}</p>
            </div>
            {session.instructor && <Avatar name={session.instructor} size="xl" />}
          </div>

          <div className="flex gap-2">
            <IconButton label="Share" onClick={share}>
              <Share size={18} />
            </IconButton>
            {booking && (
              <IconButton label="Add to phone calendar" onClick={() => addToPhoneCalendar(booking, policyLine(termsForBooking(booking), booking.usedCredit))}>
                <CalendarPlus size={18} />
              </IconButton>
            )}
          </div>

          {booking && (
            <div className="rounded-2xl bg-card p-4 text-sm">
              <p className="flex items-center gap-2 font-medium text-moss">
                <Check size={18} /> You&apos;re booked
              </p>
              <p className="mt-1 text-shell">
                {booking.usedCredit ? "Paid with 1 treatment credit" : booking.price > 0 ? `Paid ${money(booking.price)}` : "Included, nothing charged"}
                {booking.firstVisit && " · first visit price"}. It&apos;s in your Calendar.
              </p>
              <p className="mt-1 text-muted">{policyLine(termsForBooking(booking), booking.usedCredit)}</p>
            </div>
          )}

          <Section label="About">
            <p className="text-muted">
              {session.durationMin} minutes{service.pillar ? ` · ${service.pillar}` : ""}
            </p>
            <p className="mt-1.5 leading-snug text-shell">{service.description}</p>
          </Section>

          {!booking && (
            <Section label="Your price">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p>{q.label}</p>
                  <div className="mt-1">
                    <PromoNote quote={q} />
                  </div>
                </div>
                <PriceTag quote={q} size="lg" />
              </div>
              {creditAvailable && (
                <label className="mt-3 flex cursor-pointer items-center gap-3 rounded-xl bg-card p-3 text-moss">
                  <input type="checkbox" checked={useCredit} onChange={(e) => setUseCredit(e.target.checked)} className="h-4 w-4 accent-moss" />
                  <Ticket size={16} />
                  <span>
                    Use 1 treatment credit <span className="text-muted">({member.credits} left)</span>
                  </span>
                </label>
              )}
              <div className="mt-3 flex items-baseline justify-between border-t border-line pt-3">
                <span>You pay today</span>
                <span className="stat-num text-2xl">{money(total)}</span>
              </div>
              <p className="mt-0.5 text-xs text-muted">
                {total > 0 ? "Charged to your card on file when you confirm." : credit ? "Covered by your credit." : "Nothing is charged."}
              </p>
            </Section>
          )}

          <Section label="Location">
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(location.address)}`}
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2"
            >
              {location.name}
              <br />
              {location.address}
            </a>
            <div>
              <EmailStudioButton location={session.location} className="mt-3" />
            </div>
          </Section>

          {!booking && (
            <Section label="Cancellation policy">
              <p className={terms.late ? "text-clay" : "text-shell"}>{policyLine(terms, credit)}</p>
            </Section>
          )}
          <p className="text-xs text-muted">Please arrive 5 minutes early.</p>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-10 bg-gradient-to-t from-sand via-sand to-transparent pb-6 pt-8">
        <div className="mx-auto max-w-md space-y-2 px-4">
          {booking ? (
            <>
              <Link href="/calendar" className="block w-full rounded-full bg-sage px-5 py-3 text-center text-sm font-medium text-ink">
                See it in my Calendar
              </Link>
              <Button variant="secondary" onClick={onClose}>
                Done
              </Button>
            </>
          ) : (
            <Button variant="primary" disabled={past || elsewhere || left === 0} onClick={() => setConfirming(true)}>
              {past ? (
                "This time has passed"
              ) : elsewhere ? (
                `Only at your home location, ${LOCATIONS[member.home].short}`
              ) : left === 0 ? (
                "Full"
              ) : (
                <span className="inline-flex items-center gap-1.5">
                  Reserve{total > 0 ? ` · ${money(total)}` : ""} <ArrowRight size={16} />
                </span>
              )}
            </Button>
          )}
        </div>
      </div>

      <Sheet open={confirming} onClose={() => setConfirming(false)} title="Confirm your booking">
        <div className="space-y-4 text-sm">
          <div className="rounded-2xl border border-line p-4">
            <p className="text-lg leading-tight">{session.title}</p>
            <p className="mt-1 text-muted">
              {dayLabel(session.date, "long")} · {timeRange(session.time, session.durationMin)}
            </p>
            <p className="text-muted">{location.name}</p>
            <div className="mt-3 flex items-baseline justify-between border-t border-line pt-3">
              <span>You pay today</span>
              <span className="stat-num text-2xl">{money(total)}</span>
            </div>
            {credit && <p className="text-xs text-moss">Covered by 1 treatment credit.</p>}
          </div>
          <p className={clsx("rounded-2xl bg-sand p-4 font-medium", terms.late ? "text-clay" : "text-shell")}>{policyLine(terms, credit)}</p>
          {error && <p className="rounded-2xl bg-sand p-4 text-clay">{error}</p>}
          <div className="space-y-2">
            <Button
              variant="primary"
              onClick={() => {
                const r = book(session, credit);
                if (r.ok) {
                  setJustBooked(r.booking);
                  setConfirming(false);
                } else setError(r.error);
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

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-line pt-4 text-sm">
      <p className="mb-1.5 text-[11px] uppercase tracking-widest text-muted">{label}</p>
      {children}
    </section>
  );
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} aria-label={label} title={label} className="flex h-10 w-10 items-center justify-center rounded-full border border-line hover:bg-card">
      {children}
    </button>
  );
}

// Instructors and therapists show as their initial. Real photos can replace these later.
function Avatar({ name, size, ring = false }: { name: string; size: "lg" | "xl"; ring?: boolean }) {
  return (
    <span
      aria-hidden
      className={clsx(
        "flex shrink-0 items-center justify-center rounded-full border border-line bg-card font-serif text-shell",
        size === "xl" ? "h-16 w-16 text-2xl" : "h-12 w-12 text-xl",
        ring && "ring-2 ring-sage ring-offset-2 ring-offset-sand",
      )}
    >
      {name[0]}
    </span>
  );
}

function Status({ left, mine, className }: { left: number; mine: boolean; className?: string }) {
  if (!mine && left > 3) return null;
  return (
    <span
      className={clsx(
        "rounded-full px-2.5 py-0.5 text-[11px] font-medium",
        mine ? "bg-moss text-ink" : left === 0 ? "bg-line text-shell" : "bg-clay-soft text-clay",
        className,
      )}
    >
      {mine ? "Booked ✓" : left === 0 ? "Full" : `${left} ${left === 1 ? "spot" : "spots"} left`}
    </span>
  );
}
