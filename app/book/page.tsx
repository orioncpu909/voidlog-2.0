"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import clsx from "clsx";
import { ArrowRight, CalendarPlus, Check, ChevronDown, ChevronLeft, ChevronRight, Dumbbell, HandHeart, Info, Lock, MapPin, Share, Snowflake, Ticket, X } from "lucide-react";
import { Category, LOCATIONS, LocationId, SERVICES, ServiceId, TIERS, bookableAt } from "@/lib/data";
import { Session, dateKey, findSession, sessionStart, slotsFor, upcomingDays } from "@/lib/schedule";
import { Booking, useStore } from "@/lib/store";
import { canUseCredit, cancelTerms, policyLine } from "@/lib/policy";
import { dayLabel, money, timeLabel, timeRange } from "@/lib/format";
import { Therapist, therapistsFor } from "@/lib/therapists";
import { addToPhoneCalendar } from "@/lib/ics";
import { PriceTag, PromoNote } from "@/components/PriceTag";
import { Button, Sheet } from "@/components/Sheet";
import { EmailStudioButton } from "@/components/EmailStudio";
import { CreditsInfoButton } from "@/components/CreditsInfo";
import { SHOW_CALENDAR_TAB, calendarHref } from "@/lib/flags";
import { classDescription } from "@/lib/classInfo";

// Book opens on three stacked boxes: Classes, Therapies, Treatments, each with what's in it and the
// next open time. Tapping one opens that section (/book?category=…): classes as one list of upcoming
// days (the date strip jumps to a day), therapies and treatments as a menu of services with their next
// times. Tap Book or a time; every booking asks for one confirmation. "‹ Book" goes back.

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
  const router = useRouter();
  const { member, setLocation } = useStore();
  const tier = TIERS[member.tier];
  // A link can open one session's page directly (/book?session=…) or a tab (/book?category=therapy).
  const linked = useMemo(() => {
    const id = params.get("session");
    return id ? findSession(id) : undefined;
  }, [params]);
  // The open section lives in the URL, so the Book tab and the back button return to the boxes.
  const category = linked ? SERVICES[linked.serviceId].category : params.get("category");
  const section: Tab | null = category === "class" || category === "therapy" || category === "treatment" ? category : null;
  const tab: Tab = section ?? "class";
  const openSection = (id: Tab | null) => router.push(id ? `/book?category=${id}` : "/book");
  // Therapies and Treatments open on a menu of every service with today's open times; Details
  // opens one service's full schedule. That service is in the URL too (&service=…), so the back
  // button (and "‹") returns to the menu rather than the boxes.
  const serviceParam = params.get("service");
  const openedService: ServiceId | null = linked
    ? linked.serviceId !== "class"
      ? linked.serviceId
      : null
    : serviceParam && serviceParam in SERVICES && SERVICES[serviceParam as ServiceId].category === section
      ? (serviceParam as ServiceId)
      : null;
  const openService = (id: ServiceId) => router.push(`/book?category=${section}&service=${id}`);
  const backToMenu = () => router.replace(`/book?category=${section}`);
  const [therapist, setTherapist] = useState<string | null>(null);
  const [open, setOpen] = useState<Session | null>(linked ?? null);
  // Tapping Book or a time goes straight to the confirm sheet; the class page is only for details.
  const [quickBook, setQuickBook] = useState<Session | null>(null);
  const [toast, setToast] = useState<Booking | null>(null);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);
  const days = useMemo(() => upcomingDays(DAYS_AHEAD), []);

  // Wellness Accounts switch their location for everything. Members switch only for classes:
  // their therapies and treatments are always at their home location.
  const [classLocation, setClassLocation] = useState<LocationId | null>(linked?.serviceId === "class" ? linked.location : null);
  const memberClasses = tier.lockedToHome && tab === "class";
  const location: LocationId = memberClasses ? (classLocation ?? member.home) : member.home;
  const lockedHere = tier.lockedToHome && tab !== "class";
  const pickLocation = (id: LocationId) => (tier.lockedToHome ? setClassLocation(id) : setLocation(id));

  const services = Object.values(SERVICES).filter((s) => s.category === tab && s.locations.includes(location));
  // The opened service may not exist at a newly chosen location; fall back to the first one there.
  const preferred = openedService;
  const serviceId: ServiceId =
    tab === "class" ? "class" : preferred && SERVICES[preferred].locations.includes(location) ? preferred : services[0].id;
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
  }, [tab, serviceId, location, days, openedService]);
  const showMenu = tab !== "class" && !openedService;

  if (!section) return <BookFront onOpen={openSection} />;

  return (
    <div className="space-y-5">
      {/* Pinned while you scroll: back to the boxes and the section's name, the location (and your
          price), then the date strip. */}
      <div ref={stickyRef} className={clsx("sticky top-[53px] z-10 -mx-4 -mt-3 border-b border-line bg-sand px-4", showMenu && "pb-2.5")}>
        <div className="flex items-center gap-1 pt-2">
          <button
            onClick={() => (showMenu || tab === "class" ? openSection(null) : backToMenu())}
            aria-label={showMenu || tab === "class" ? "Back to all services" : `Back to all ${tab === "therapy" ? "therapies" : "treatments"}`}
            className="-ml-1.5 rounded-full p-1 hover:bg-line"
          >
            <ChevronLeft size={22} />
          </button>
          <h1 className="font-serif text-2xl">{TABS.find((t) => t.id === tab)!.label}</h1>
        </div>
        <div className="pt-1.5">
          <LocationRow serviceId={showMenu ? null : serviceId} location={location} locked={lockedHere} onPick={pickLocation} />
        </div>
        <div ref={stripRef} className={clsx("no-scrollbar -mx-4 flex overflow-x-auto px-2 py-2.5", showMenu && "hidden")}>
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

      {tier.lockedToHome && (
        <p className="text-xs text-muted">
          {tab === "class"
            ? "Your membership covers classes at both locations."
            : "Therapies and treatments are at your home location only."}
        </p>
      )}

      {showMenu ? (
        <ServiceMenu
          services={services.map((s) => s.id)}
          location={location}
          days={days}
          onBook={setQuickBook}
          onAll={openService}
        />
      ) : (
        <>
          {/* The "‹" at the top (or the phone's back button) returns to the menu. */}
          {tab !== "class" && <ServiceIntro serviceId={serviceId} therapist={shownTherapist} onTherapist={setTherapist} />}

          <div className="space-y-6">
            {days.map((d) => (
              <section key={d} id={`day-${d}`} aria-label={dayLabel(d, "long")}>
                <DayHeader date={d} />
                <DayList date={d} serviceId={serviceId} location={location} therapist={shownTherapist} onOpen={setOpen} onBook={setQuickBook} first={d === days[0]} />
              </section>
            ))}
          </div>
          <p className="pb-4 text-center text-xs text-muted">That&apos;s the next two weeks. New times open every day.</p>
        </>
      )}

      {open && <SessionPage key={open.id} session={open} onClose={() => setOpen(null)} />}
      {quickBook && (
        <ConfirmBooking
          key={quickBook.id}
          session={quickBook}
          onClose={() => setQuickBook(null)}
          onBooked={(b) => {
            setQuickBook(null);
            setToast(b);
          }}
        />
      )}
      {toast && (
        <div role="status" className="fixed inset-x-4 bottom-24 z-[70] mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-shell px-4 py-3 text-sm text-sand shadow-lg">
          <Check size={18} className="shrink-0 text-sage" />
          <p className="min-w-0 flex-1 leading-tight">
            <span className="font-medium">Booked</span> · {toast.title}, {dayLabel(toast.date, "short")} {timeLabel(toast.time)}
          </p>
          <Link href={calendarHref(toast.date)} className="shrink-0 font-medium text-sage">
            View
          </Link>
        </div>
      )}
    </div>
  );
}

// Every therapy (or treatment) on one screen, stacked: name, length and your price, then the next three open times
// (tap one to go straight to the confirm sheet). Tapping the therapy's name shows all its times.
function ServiceMenu({
  services,
  location,
  days,
  onBook,
  onAll,
}: {
  services: ServiceId[];
  location: LocationId;
  days: string[];
  onBook: (s: Session) => void;
  onAll: (id: ServiceId) => void;
}) {
  const { spotsLeft, myBookingFor, quote } = useStore();
  // The first day that still has an open time, and every open time left that day.
  const nextOpen = (id: ServiceId) => {
    for (const d of days) {
      const open = upcoming(d, id, location, null).filter((s) => spotsLeft(s) > 0 && !myBookingFor(s.id));
      if (open.length) return { date: d, times: open };
    }
    return null;
  };
  return (
    <div className="-mx-4 divide-y divide-line border-y border-line">
      {services.map((id) => {
        const service = SERVICES[id];
        const next = nextOpen(id);
        return (
          // The whole block opens Details (what it is, therapists and every day's times), except the
          // times, which book. Everyone is on a phone, so the tap target is as big as it can be.
          <div
            key={id}
            role="button"
            tabIndex={0}
            onClick={() => onAll(id)}
            onKeyDown={(e) => e.key === "Enter" && onAll(id)}
            aria-label={`About ${service.name} and more days`}
            className="cursor-pointer px-4 py-2 transition-colors [&:active:not(:has(button:active))]:bg-line/50"
          >
            <div className="flex items-center gap-2">
              <span className="min-w-0 flex-1 leading-tight">
                <span className="font-medium">{service.name}</span> <span className="whitespace-nowrap text-xs text-muted">· {service.durationMin} min</span>
              </span>
              <PriceTag quote={quote(id, location, dateKey(new Date()))} pill />
              <span className="flex shrink-0 items-center py-1 text-sm font-medium text-moss">
                Details
                <ChevronRight size={16} />
              </span>
            </div>
            {next ? (
              <div className="mt-1.5 flex items-center gap-2">
                <span className="w-[58px] shrink-0 text-xs leading-tight text-muted">
                  {dayLabel(next.date)}
                  <span className="block text-[10px]">{next.times.length} open</span>
                </span>
                {/* Every open time that day: swipe sideways, tap one to book. */}
                <div className="relative min-w-0 flex-1">
                  <div className="no-scrollbar flex snap-x gap-1.5 overflow-x-auto pr-6">
                    {next.times.map((s) => (
                      <button
                        key={s.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onBook(s);
                        }}
                        aria-label={`Book ${service.name} ${dayLabel(s.date)} at ${timeLabel(s.time)}`}
                        className="w-[74px] shrink-0 snap-start whitespace-nowrap rounded-lg border border-line bg-card py-1.5 text-[13px] font-medium active:bg-sage"
                      >
                        {timeLabel(s.time)}
                      </button>
                    ))}
                  </div>
                  {next.times.length > 3 && <span className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-sand" aria-hidden />}
                </div>
              </div>
            ) : (
              <p className="mt-1 text-xs text-muted">No open times in the next two weeks.</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

// The Book front page: Classes, Therapies and Treatments stacked as boxes. Each shows what's in it,
// your price and the next open time at your home studio, and opens its section when tapped.
const SECTION_ICON = { class: Dumbbell, therapy: Snowflake, treatment: HandHeart } as const;
const SHORT_NAME: Partial<Record<ServiceId, string>> = {
  cryo: "Cryo",
  "ir-sauna": "Sauna",
  "red-light": "Red Light",
  contrast: "Contrast",
  hbot: "HBOT",
};

function BookFront({ onOpen }: { onOpen: (id: Tab) => void }) {
  const { member, spotsLeft, myBookingFor, quote } = useStore();
  const tier = TIERS[member.tier];
  const home = member.home;
  const days = upcomingDays(DAYS_AHEAD);
  const today = dateKey(new Date());
  const ids = (tab: Tab) => Object.values(SERVICES).filter((s) => s.category === tab && s.locations.includes(home)).map((s) => s.id);
  // The soonest time you could still book in this section.
  const nextOpen = (tab: Tab) => {
    for (const d of days) {
      const open = ids(tab)
        .flatMap((id) => upcoming(d, id, home, null))
        .filter((s) => spotsLeft(s) > 0 && !myBookingFor(s.id))
        .sort((a, b) => a.time.localeCompare(b.time));
      if (open.length) return open[0];
    }
    return undefined;
  };
  const summary: Record<Tab, string> = {
    class: "Yoga, Pilates, HIIT and sound baths",
    therapy: ids("therapy").map((id) => SHORT_NAME[id] ?? SERVICES[id].name).join(" · "),
    treatment: ids("treatment").map((id) => SERVICES[id].name).join(" · "),
  };

  return (
    <div className="space-y-3">
      <div>
        <h1 className="font-serif text-3xl">Book</h1>
        <p className="text-xs text-muted">
          {LOCATIONS[home].name}
          {tier.lockedToHome ? " · classes at both studios" : " · switch studios inside each section"}
        </p>
      </div>
      {TABS.map(({ id, label }) => {
        const Icon = SECTION_ICON[id];
        const next = nextOpen(id);
        const q = id === "therapy" ? cheapest(ids(id), quote, home, today) : quote(ids(id)[0], home, today);
        const credit = id !== "class" && member.credits > 0 && ids(id).some(canUseCredit);
        return (
          <button key={id} onClick={() => onOpen(id)} className="block w-full rounded-3xl border border-line bg-card p-4 text-left transition active:scale-[0.99] active:bg-line">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-moss-soft text-moss">
                <Icon size={20} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-serif text-2xl leading-tight">{label}</span>
                <span className="block truncate text-xs text-muted">{summary[id]}</span>
              </span>
              <ChevronRight size={20} className="shrink-0 text-muted" />
            </div>
            <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-2.5 text-sm">
              <span className="min-w-0 truncate">
                {next ? (
                  <>
                    <span className="text-muted">Next · </span>
                    {dayLabel(next.date)} {timeLabel(next.time)} · {id === "class" ? next.title : SHORT_NAME[next.serviceId] ?? SERVICES[next.serviceId].name}
                  </>
                ) : (
                  <span className="text-muted">No open times in the next two weeks</span>
                )}
              </span>
              <span className="flex shrink-0 items-center gap-1.5">
                {id === "therapy" && q.price > 0 && <span className="text-xs text-muted">from</span>}
                <PriceTag quote={q} pill />
                {credit && id === "treatment" && <span className="text-xs text-moss">or 1 credit</span>}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// The lowest price among a section's services (what "from" means on the Therapies box).
function cheapest(ids: ServiceId[], quote: ReturnType<typeof useStore>["quote"], home: LocationId, today: string) {
  return ids.map((id) => quote(id, home, today)).sort((a, b) => a.price - b.price)[0];
}

// A solid band at the top of each day, so where one day ends and the next begins is unmistakable.
function DayHeader({ date }: { date: string }) {
  const d = sessionStart(date, "12:00");
  const label = dayLabel(date);
  const relative = label === "Today" || label === "Tomorrow";
  const weekday = d.toLocaleDateString("en-US", { weekday: "long" });
  const monthDay = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return (
    <h2 className="-mx-4 flex items-baseline justify-between bg-shell px-4 py-2.5 text-sand">
      <span className="text-lg font-semibold tracking-tight">{relative ? label : weekday}</span>
      <span className="text-sm text-sage">{relative ? `${weekday}, ${monthDay}` : monthDay}</span>
    </h2>
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
  serviceId: ServiceId | null; // null: no single price to show (the therapy menu prices each row)
  location: LocationId;
  locked: boolean;
  onPick: (id: LocationId) => void;
}) {
  const { quote } = useStore();
  const q = serviceId && quote(serviceId, location, dateKey(new Date()));
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
      {q && (
        <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-line px-3 py-1.5 text-xs">
          <span className="text-muted">Your price</span>
          <PriceTag quote={q} />
        </span>
      )}
    </div>
  );
}

// One therapy's or treatment's details above its full schedule (reached from the menu).
function ServiceIntro({
  serviceId,
  therapist,
  onTherapist,
}: {
  serviceId: ServiceId;
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
            <CreditsInfoButton className="rounded-full bg-card px-2 py-0.5 text-[11px]">
              <Ticket size={11} /> A credit can cover this ({member.credits} left) · <Info size={11} />
            </CreditsInfoButton>
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
  onBook,
  first,
}: {
  date: string;
  serviceId: ServiceId;
  location: LocationId;
  therapist: string | null;
  onOpen: (s: Session) => void;
  onBook: (s: Session) => void;
  first: boolean;
}) {
  const { spotsLeft, myBookingFor } = useStore();
  const all = upcoming(date, serviceId, location, therapist);
  // Therapies and treatments list only times you can still book (plus your own); taken times are left out.
  const isService = serviceId !== "class";
  const sessions = isService ? all.filter((s) => spotsLeft(s) > 0 || !!myBookingFor(s.id)) : all;
  if (sessions.length === 0) {
    const today = date === dateKey(new Date());
    return (
      <p className="py-2 text-sm text-muted">
        {all.length > 0 ? (today ? "No open times left today." : "Fully booked this day.") : today ? "Nothing left today." : "Nothing this day."}
      </p>
    );
  }
  if (serviceId === "class") {
    return (
      <div className="divide-y divide-line border-y border-line">
        {sessions.map((s) => (
          <ClassCard key={s.id} session={s} onOpen={() => onOpen(s)} onBook={() => onBook(s)} />
        ))}
      </div>
    );
  }
  // Cryo starts every 5 minutes, which is too many rows: group by hour, open an hour to pick a time.
  if (all.length > HOUR_GROUP_THRESHOLD) return <HourGroups sessions={sessions} onOpen={onOpen} onBook={onBook} expandFirst={first} />;
  return (
    <div className="divide-y divide-line border-y border-line">
      {sessions.map((s) => (
        <SlotRow key={s.id} session={s} onOpen={() => onOpen(s)} onBook={() => onBook(s)} showPrice={isService} />
      ))}
    </div>
  );
}

const HOUR_GROUP_THRESHOLD = 24;

// Time on the left, then the class, teacher and price, like Open's schedule (without photos).
// Book on the right goes straight to the confirm sheet; the rest of the row opens the class page.
function ClassCard({ session, onOpen, onBook }: { session: Session; onOpen: () => void; onBook: () => void }) {
  const { spotsLeft, myBookingFor, quote } = useStore();
  const left = spotsLeft(session);
  const mine = !!myBookingFor(session.id);
  const full = left === 0 && !mine;
  const q = quote(session.serviceId, session.location, session.date);
  const [about, setAbout] = useState(false);
  return (
    <div className={clsx(full && "opacity-50")}>
      <div className="flex items-center gap-3 py-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <button onClick={onOpen} className="w-[72px] shrink-0 text-left">
            <p className="stat-num whitespace-nowrap text-[15px] leading-tight">{timeLabel(session.time)}</p>
            <p className="text-xs text-muted">{session.durationMin} min</p>
          </button>
          <div className="min-w-0 flex-1">
            <button onClick={onOpen} className="block text-left text-base font-medium leading-tight">
              {session.title}
            </button>
            {/* The little pull-down next to the teacher: what the class is, heat and level. */}
            <button
              onClick={() => setAbout(!about)}
              aria-expanded={about}
              className="mt-0.5 flex max-w-full items-center gap-1 text-left text-sm text-muted"
            >
              <span className="truncate">{session.instructor ? `w/ ${session.instructor}` : "About this class"}</span>
              <ChevronDown size={15} className={clsx("shrink-0 rounded-full bg-line/70 transition", about && "rotate-180")} />
            </button>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm">
              <PriceTag quote={q} pill />
              {q.kind === "memberOff" && <PromoNote quote={q} />}
              {!mine && !full && <Status left={left} mine={false} />}
            </div>
          </div>
        </div>
        <BookPill mine={mine} full={full} onBook={onBook} onOpen={onOpen} label={`${session.title} at ${timeLabel(session.time)}`} />
      </div>
      {about && <p className="-mt-1 mb-3 ml-[84px] rounded-xl bg-card px-3 py-2 text-[13px] leading-snug text-shell">{classDescription(session.title)}</p>}
    </div>
  );
}

// The row's action: Book (to the confirm sheet), Booked (to its page, to cancel or add to a calendar) or Full.
function BookPill({ mine, full, onBook, onOpen, label }: { mine: boolean; full: boolean; onBook: () => void; onOpen: () => void; label: string }) {
  if (full) return <span className="w-[80px] shrink-0 rounded-full bg-line py-2 text-center text-sm text-shell">Full</span>;
  return (
    <button
      onClick={mine ? onOpen : onBook}
      aria-label={`${mine ? "Booked" : "Book"} ${label}`}
      className={clsx(
        "flex w-[80px] shrink-0 items-center justify-center gap-1 rounded-full py-2 text-sm font-semibold",
        mine ? "bg-moss text-sand" : "bg-sage text-ink active:bg-sage-light",
      )}
    >
      {mine ? (
        <>
          <Check size={14} /> Booked
        </>
      ) : (
        "Book"
      )}
    </button>
  );
}

// One time on its own row, like Open's Hot + Cold list. The whole row books: it opens the confirm
// sheet (the service is already described above the list). A booked time opens its page instead.
// Therapy and treatment times show their price bubble, the way classes show "Included".
function SlotRow({ session, onOpen, onBook, showPrice }: { session: Session; onOpen: () => void; onBook: () => void; showPrice: boolean }) {
  const { member, spotsLeft, myBookingFor, quote } = useStore();
  const left = spotsLeft(session);
  const mine = !!myBookingFor(session.id);
  const full = left === 0 && !mine;
  const q = quote(session.serviceId, session.location, session.date);
  // HBOT: a credit can pay instead, and the confirm sheet uses one by default.
  const orCredit = canUseCredit(session.serviceId) && member.credits > 0 && q.price > 0;
  return (
    <button
      onClick={mine ? onOpen : onBook}
      disabled={full}
      className={clsx("flex w-full items-center gap-3 py-2.5 text-left", full && "opacity-50")}
    >
      <div className="min-w-0 flex-1">
        <p className="text-base">{session.durationMin >= 15 ? timeRange(session.time, session.durationMin) : timeLabel(session.time)}</p>
        <p className={clsx("text-sm", mine ? "text-moss" : session.capacity > 3 && left > 0 && left <= 2 ? "text-clay" : "text-muted")}>
          {session.instructor ? `with ${session.instructor} · ` : ""}
          {mine ? "Booked" : full ? "Full" : session.capacity === 1 ? "Available" : `${left} ${left === 1 ? "spot" : "spots"} left`}
        </p>
        {showPrice && (
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <PriceTag quote={q} pill />
            <PromoNote quote={q} />
            {orCredit && (
              <span className="inline-flex items-center gap-1 text-xs text-moss">
                <Ticket size={12} /> or 1 credit
              </span>
            )}
          </div>
        )}
      </div>
      {mine ? (
        <Check size={18} className="text-moss" />
      ) : (
        !full && <span className="rounded-full bg-sage px-3.5 py-1.5 text-sm font-semibold text-ink">Book</span>
      )}
    </button>
  );
}

function HourGroups({
  sessions,
  onOpen,
  onBook,
  expandFirst,
}: {
  sessions: Session[];
  onOpen: (s: Session) => void;
  onBook: (s: Session) => void;
  expandFirst: boolean;
}) {
  const { spotsLeft, myBookingFor, quote } = useStore();
  const byHour = new Map<string, Session[]>();
  for (const s of sessions) byHour.set(s.time.slice(0, 2), [...(byHour.get(s.time.slice(0, 2)) ?? []), s]);
  // Today's soonest hour with an open time starts expanded, so the next times are one tap away.
  const [openHour, setOpenHour] = useState<string | null>(() =>
    expandFirst ? ([...byHour.entries()].find(([, list]) => list.some((s) => spotsLeft(s) > 0))?.[0] ?? null) : null,
  );
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
              className={clsx("flex w-full items-center gap-3 py-2.5 text-left", free === 0 && "opacity-50")}
            >
              <div className="flex-1">
                <p className="text-base">{timeLabel(`${hour}:00`).replace(":00", "")}</p>
                <p className="text-sm text-muted">
                  {free} {free === 1 ? "time" : "times"} open · every 5 min
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <PriceTag quote={quote(list[0].serviceId, list[0].location, list[0].date)} pill />
                  <PromoNote quote={quote(list[0].serviceId, list[0].location, list[0].date)} />
                </div>
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
                      onClick={() => (mine ? onOpen(s) : onBook(s))}
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
  // A credit is used by default when one can cover this; the confirm sheet lets you switch it off.
  const credit = canUseCredit(session.serviceId) && member.credits > 0 && q.price > 0;
  const total = credit ? 0 : q.price;
  const terms = cancelTerms(tier, { ...session, price: total, usedCredit: credit, perk: !credit && q.kind === "perk" });
  const [confirming, setConfirming] = useState(false);
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

  const close = (
    <button onClick={onClose} aria-label="Close" className="rounded-full bg-sand/70 p-2 backdrop-blur">
      <X size={20} />
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 !mt-0 overflow-y-auto bg-sand text-shell" role="dialog" aria-modal="true" aria-label={session.title}>
      <div className="mx-auto max-w-md pb-40">
        <div className="flex justify-end px-3 pb-2 pt-3">{close}</div>

        <div className="space-y-4 px-4">
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
            <p className="mt-1.5 leading-snug text-shell">{session.serviceId === "class" ? classDescription(session.title) : service.description}</p>
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
              {credit && (
                <p className="mt-2 flex items-center gap-1.5 text-moss">
                  <Ticket size={15} /> 1 of your {member.credits} credits covers this, so you pay $0.
                </p>
              )}
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
              <Link href={calendarHref(booking.date)} className="block w-full rounded-full bg-sage px-5 py-3 text-center text-sm font-medium text-ink">
                {SHOW_CALENDAR_TAB ? "See it in my Calendar" : "See it on my calendar"}
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

      {confirming && (
        <ConfirmBooking
          session={session}
          onClose={() => setConfirming(false)}
          onBooked={(b) => {
            setJustBooked(b);
            setConfirming(false);
          }}
        />
      )}
    </div>
  );
}

// The one confirm step every booking goes through, from a class page's Reserve or straight from a
// Book button in the list: what, when, where, the price (with the credit switch when a credit can
// cover it), and the cancellation line.
function ConfirmBooking({ session, onClose, onBooked }: { session: Session; onClose: () => void; onBooked: (b: Booking) => void }) {
  const { member, book, quote } = useStore();
  const tier = TIERS[member.tier];
  const location = LOCATIONS[session.location];
  const q = quote(session.serviceId, session.location, session.date);
  const creditAvailable = canUseCredit(session.serviceId) && member.credits > 0 && q.price > 0;
  const [useCredit, setUseCredit] = useState(creditAvailable);
  const credit = useCredit && creditAvailable;
  const total = credit ? 0 : q.price;
  const terms = cancelTerms(tier, { ...session, price: total, usedCredit: credit, perk: !credit && q.kind === "perk" });
  const [error, setError] = useState<string | null>(null);

  return (
    <Sheet open onClose={onClose} title="Confirm your booking">
      <div className="space-y-3 text-sm">
        <div className="rounded-2xl border border-line p-4">
          <p className="text-lg leading-tight">{session.title}</p>
          <p className="mt-1 text-muted">
            {dayLabel(session.date, "long")} · {timeRange(session.time, session.durationMin)}
          </p>
          <p className="text-muted">
            {location.name}
            {session.instructor ? ` · ${session.serviceId === "class" ? "w/" : "with"} ${session.instructor}` : ""}
          </p>
          {/* A plain price already shows as "You pay today"; tags like Included or First visit add something. */}
          {q.kind !== "member" && q.kind !== "regular" && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <PriceTag quote={q} />
              <PromoNote quote={q} />
            </div>
          )}
          {creditAvailable && (
            <label className="mt-3 flex cursor-pointer items-center gap-3 rounded-xl bg-moss-soft p-3 text-moss">
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
        </div>
        <p className={clsx("rounded-2xl bg-sand p-3 font-medium", terms.late ? "text-clay" : "text-shell")}>{policyLine(terms, credit)}</p>
        {error && <p className="rounded-2xl bg-sand p-3 text-clay">{error}</p>}
        <div className="space-y-2">
          <Button
            variant="primary"
            onClick={() => {
              const r = book(session, credit);
              if (r.ok) onBooked(r.booking);
              else setError(r.error);
            }}
          >
            {total > 0 ? `Confirm and pay ${money(total)}` : "Confirm booking"}
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Go back
          </Button>
        </div>
      </div>
    </Sheet>
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
function Avatar({ name, size, ring = false }: { name: string; size: "md" | "lg" | "xl"; ring?: boolean }) {
  return (
    <span
      aria-hidden
      className={clsx(
        "flex shrink-0 items-center justify-center rounded-full border border-line bg-card font-serif text-shell",
        size === "xl" ? "h-16 w-16 text-2xl" : size === "lg" ? "h-12 w-12 text-xl" : "h-10 w-10 text-lg",
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
