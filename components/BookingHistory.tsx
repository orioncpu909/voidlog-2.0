"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { ChevronRight, History, X } from "lucide-react";
import { Category, LOCATIONS, SERVICES } from "@/lib/data";
import { sessionStart } from "@/lib/schedule";
import { Booking, useStore } from "@/lib/store";
import { timeLabel } from "@/lib/format";
import { PAST_LABEL, PastVisitSheet, bookingStart } from "./BookingDetails";

const TYPE: Record<Category, string> = { class: "Class", therapy: "Therapy", treatment: "Treatment", event: "Event" };
const FILTERS: { id: Category | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "class", label: "Classes" },
  { id: "therapy", label: "Therapies" },
  { id: "treatment", label: "Treatments" },
  { id: "event", label: "Events" },
];

// Account, top right: every previous booking (visits, cancellations, late cancels), newest first and
// grouped by month. Each row: the date, what it was, its type, the teacher or therapist, the time and
// the studio. Tap one for the full details and Book again.
export function HistoryButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} className="flex items-center gap-1.5 rounded-full border border-line bg-card px-3 py-1.5 text-sm font-medium hover:bg-line">
        <History size={16} /> History
      </button>
      {open && <HistoryPage onClose={() => setOpen(false)} />}
    </>
  );
}

function HistoryPage({ onClose }: { onClose: () => void }) {
  const { bookings } = useStore();
  const [filter, setFilter] = useState<Category | "all">("all");
  const [viewing, setViewing] = useState<Booking | null>(null);
  const now = Date.now();
  const past = bookings.filter((b) => b.status !== "booked" || bookingStart(b) <= now).sort((a, b) => bookingStart(b) - bookingStart(a));
  const shown = past.filter((b) => filter === "all" || SERVICES[b.serviceId].category === filter);
  const filters = FILTERS.filter((f) => f.id === "all" || past.some((b) => SERVICES[b.serviceId].category === f.id));

  const months: [string, Booking[]][] = [];
  for (const b of shown) {
    const label = sessionStart(b.date, "12:00").toLocaleDateString("en-US", { month: "long", year: "numeric" });
    const last = months[months.length - 1];
    if (last && last[0] === label) last[1].push(b);
    else months.push([label, [b]]);
  }

  useEffect(() => {
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = before;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-sand text-shell" role="dialog" aria-modal="true" aria-label="History">
      <div className="mx-auto max-w-md pb-10">
        <div className="sticky top-0 z-10 border-b border-line bg-sand/95 px-4 pb-2 pt-3 backdrop-blur">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-3xl">History</h2>
            <button onClick={onClose} aria-label="Close" className="rounded-full p-2 hover:bg-line">
              <X size={20} />
            </button>
          </div>
          <p className="text-xs text-muted">
            {past.length} past booking{past.length === 1 ? "" : "s"}
          </p>
          <div className="no-scrollbar -mx-4 mt-2 flex gap-2 overflow-x-auto px-4">
            {filters.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={clsx("shrink-0 rounded-full px-3.5 py-1.5 text-sm", filter === f.id ? "bg-shell text-sand" : "border border-line bg-card")}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {shown.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted">No past bookings yet.</p>
        ) : (
          months.map(([label, list]) => (
            <section key={label} className="px-4 pt-4">
              <h3 className="mb-1 text-xs font-medium uppercase tracking-wider text-muted">{label}</h3>
              <div className="divide-y divide-line rounded-2xl border border-line bg-card">
                {list.map((b) => (
                  <HistoryRow key={b.id} booking={b} onOpen={() => setViewing(b)} />
                ))}
              </div>
            </section>
          ))
        )}
      </div>
      <PastVisitSheet booking={viewing} onClose={() => setViewing(null)} />
    </div>
  );
}

function HistoryRow({ booking: b, onOpen }: { booking: Booking; onOpen: () => void }) {
  const d = sessionStart(b.date, "12:00");
  const category = SERVICES[b.serviceId].category;
  const role = category === "class" || category === "event" ? "w/" : "with";
  return (
    <button onClick={onOpen} className="flex w-full items-center gap-3 px-3 py-2.5 text-left">
      <span className="w-10 shrink-0 text-center leading-tight">
        <span className="block text-[10px] uppercase text-muted">{d.toLocaleDateString("en-US", { weekday: "short" })}</span>
        <span className="stat-num block text-lg">{d.getDate()}</span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline gap-2">
          <span className="truncate text-sm font-medium">{b.title}</span>
          {b.status !== "booked" && <span className="shrink-0 text-[11px] text-clay">{PAST_LABEL[b.status]}</span>}
        </span>
        <span className="block truncate text-xs text-muted">
          {TYPE[category]}
          {b.instructor ? ` · ${role} ${b.instructor}` : ""}
        </span>
        <span className="block truncate text-xs text-muted">
          {timeLabel(b.time)} · {b.durationMin} min · {LOCATIONS[b.location].short}
        </span>
      </span>
      <ChevronRight size={16} className="shrink-0 text-muted" />
    </button>
  );
}
