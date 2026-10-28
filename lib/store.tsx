"use client";

// Demo store: accounts, bookings and account charges, saved in localStorage.
// No real payments; charges are a ledger of what the card on file would be billed.

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { EVENT_TICKET_PRICE, LocationId, PERK_LABEL, Quote, ServiceId, TIERS, TierId, bookableAt, priceFor } from "./data";
import { Session, dateKey, eventSessions, sessionStart, slotsFor } from "./schedule";
import { EVENTS } from "./events";
import { CancelTerms, canUseCredit, cancelTerms } from "./policy";
import { TRIAL_BECOMES, firstMonthCharge, trialEndsAt } from "./trial";
import { endOfMonth, inRefundWindow } from "./membership";
import { money } from "./format";
import { TulipLogo } from "@/components/TulipLogo";

export interface Member {
  id: string;
  name: string;
  tier: TierId;
  home: LocationId;
  credits: number;
  onboarded: boolean;
  signedUp?: boolean; // false = just downloaded the app, sees the create-account screens first
  email?: string;
  phone?: string;
  instagram?: string; // handle without the @, optional at sign-up
  rsvps?: string[]; // event ids
  trialUsed?: boolean; // set the moment a trial starts; an account never gets a second one
  trialEndsAt?: string; // ISO time, only while on a trial
  trialCancel?: TrialCancelChoice; // set when a trial is cancelled; the trial still runs to its end date
  trialBecomes?: TierId; // membership the trial turns into; Classic when not chosen
  notice?: string; // one-time message shown on Home (e.g. trial ended)
  dismissedPromos?: string[]; // specials whose Home banner this account closed
  firstVisitUsed?: boolean; // the first-visit price has been used
  memberSince?: string; // ISO start of the current paid membership
  membershipEndsAt?: string; // set when a paid membership is cancelled after the refund window
}

// What happens to a cancelled trial account when its paid-for days run out.
export type TrialCancelChoice = "downgrade" | "delete";

export type BookingStatus = "booked" | "cancelled" | "late-cancelled";

export interface Booking {
  id: string;
  memberId: string;
  sessionId: string;
  serviceId: ServiceId;
  location: LocationId;
  date: string;
  time: string;
  durationMin: number;
  title: string;
  instructor?: string;
  price: number;
  usedCredit: boolean;
  firstVisit?: boolean; // booked at the first-appointment discount
  perk?: boolean; // free as a monthly membership perk (Restore)
  status: BookingStatus;
  createdAt: string;
}

export interface Charge {
  id: string;
  memberId: string;
  at: string;
  label: string;
  amount: number;
}

interface State {
  version: 2;
  activeMemberId: string;
  goodbye?: string; // first name of the active account if it was just deleted
  members: Member[];
  bookings: Booking[];
  charges: Charge[];
}

const KEY = "artha-demo-v2";

const uid = () => Math.random().toString(36).slice(2, 10);

const daysAgo = (n: number) => new Date(Date.now() - n * 864e5).toISOString();

// The brand-new download: no account yet, so the app opens on the create-account screens.
const NEW_DOWNLOAD: Member = { id: "m-new", name: "Karan", tier: "wellness", home: "weho", credits: 0, onboarded: false, signedUp: false };

function seedMembers(): Member[] {
  return [
    { ...NEW_DOWNLOAD },
    { id: "m-wellness", name: "Karan", tier: "wellness", home: "weho", credits: 0, onboarded: true, trialUsed: true, firstVisitUsed: true },
    { id: "m-classic", name: "Karan", tier: "classic", home: "weho", credits: 4, onboarded: true, firstVisitUsed: true, memberSince: daysAgo(20) },
    // Joined 2 days ago, so still inside the 5-day refund window.
    { id: "m-gold", name: "Karan", tier: "gold", home: "weho", credits: 5, onboarded: true, firstVisitUsed: true, memberSince: daysAgo(2) },
    { id: "m-restore", name: "Karan", tier: "restore", home: "scity", credits: 4, onboarded: true, firstVisitUsed: true, memberSince: daysAgo(40) },
    {
      id: "m-trial",
      name: "Karan",
      tier: "trial",
      home: "weho",
      credits: 0,
      onboarded: true,
      trialUsed: true,
      firstVisitUsed: true,
      trialEndsAt: new Date(Date.now() + 3 * 864e5).toISOString(),
    },
  ];
}

function makeBooking(member: Member, session: Session, price: number, usedCredit: boolean): Booking {
  return {
    id: uid(),
    memberId: member.id,
    sessionId: session.id,
    serviceId: session.serviceId,
    location: session.location,
    date: session.date,
    time: session.time,
    durationMin: session.durationMin,
    title: session.title,
    instructor: session.instructor,
    price,
    usedCredit,
    status: "booked",
    createdAt: new Date().toISOString(),
  };
}

// Demo visit history. Each account gets an activity profile so streaks and stats look like a
// real member's: the Gold and Classic accounts are advanced regulars, the others intermediate.
interface Activity {
  weeks: number; // how far back the history goes
  perWeek: number; // average visit days per week before the current streak
  streak: number; // consecutive visit days ending yesterday
  recovery: number; // chance a visit day also includes a therapy
  mix: [ServiceId, number][]; // therapies and how often each is picked
  treatmentsPerMonth: number;
  treatmentsWithCredit?: boolean;
  events?: boolean; // went to past ticketed events at their location
}

const ACTIVITY: Record<string, Activity> = {
  "m-gold": {
    weeks: 12, perWeek: 4, streak: 14, recovery: 0.8, treatmentsPerMonth: 1, treatmentsWithCredit: true, events: true,
    mix: [["cryo", 3], ["ir-sauna", 3], ["red-light", 2], ["float", 2], ["contrast", 2], ["hbot", 1]],
  },
  "m-classic": {
    weeks: 10, perWeek: 4, streak: 9, recovery: 0.5, treatmentsPerMonth: 1, events: true,
    mix: [["cryo", 4], ["ir-sauna", 2], ["contrast", 1], ["float", 1], ["red-light", 1]],
  },
  "m-restore": {
    weeks: 8, perWeek: 2, streak: 3, recovery: 0.4, treatmentsPerMonth: 1,
    mix: [["ir-sauna", 2], ["cryo", 2], ["contrast", 1]],
  },
  "m-wellness": {
    weeks: 6, perWeek: 2.5, streak: 4, recovery: 0.35, treatmentsPerMonth: 0.5,
    mix: [["cryo", 3], ["ir-sauna", 2], ["contrast", 1]],
  },
  "m-trial": {
    weeks: 5, perWeek: 2, streak: 3, recovery: 0.3, treatmentsPerMonth: 0,
    mix: [["cryo", 2], ["ir-sauna", 1]],
  },
};

// Small seeded random generator so the demo history is the same on every reset.
function seeded(seed: string): () => number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

function pastBookings(member: Member): Booking[] {
  const a = ACTIVITY[member.id];
  if (!a) return [];
  const rand = seeded(member.id);
  const out: Booking[] = [];
  const dayKey = (back: number) => {
    const d = new Date();
    d.setDate(d.getDate() - back);
    return dateKey(d);
  };
  // Monthly perks (Restore) cover the first matching visit each month.
  const perksUsed = new Map<string, number>();
  const add = (serviceId: ServiceId, back: number, pick: (slots: Session[]) => Session | undefined, usedCredit = false) => {
    const session = pick(slotsFor(member.home, serviceId, dayKey(back)));
    if (!session) return;
    const perkKey = `${serviceId}|${session.date.slice(0, 7)}`;
    const perk = !usedCredit && (TIERS[member.tier].monthlyPerks?.[serviceId] ?? 0) > (perksUsed.get(perkKey) ?? 0);
    if (perk) perksUsed.set(perkKey, (perksUsed.get(perkKey) ?? 0) + 1);
    const price = usedCredit || perk ? 0 : priceFor(member.tier, serviceId, member.home, session.date).price;
    out.push({ ...makeBooking(member, session, price, usedCredit), perk, createdAt: sessionStart(session.date, "00:00").toISOString() });
  };
  const morning = (slots: Session[]) => slots[Math.floor(rand() * Math.max(1, Math.ceil(slots.length / 2)))];
  const afternoon = (slots: Session[]) => slots[Math.floor(slots.length / 2 + rand() * Math.floor(slots.length / 2))];
  const pickTherapy = () => {
    const total = a.mix.reduce((sum, [, w]) => sum + w, 0);
    let r = rand() * total;
    for (const [id, w] of a.mix) if ((r -= w) < 0) return id;
    return a.mix[0][0];
  };

  // Visit days: the current streak, then a skipped day, then a typical week-by-week pattern.
  const days: number[] = [];
  for (let back = 1; back <= a.streak; back++) days.push(back);
  for (let back = a.streak + 2; back <= a.weeks * 7; back++) if (rand() < a.perWeek / 7) days.push(back);

  // Every visit day gets at least one visit: usually a class, sometimes a therapy too, or instead.
  for (const back of days) {
    const before = out.length;
    if (rand() < 0.85) add("class", back, morning);
    if (rand() < a.recovery) add(pickTherapy(), back, afternoon);
    if (out.length === before) add("class", back, morning);
  }

  const treatments = Math.round((a.weeks / 4.3) * a.treatmentsPerMonth);
  for (let i = 0; i < treatments; i++) {
    const back = Math.round(((i + 0.5) * a.weeks * 7) / treatments);
    add("massage", back, (slots) => slots[Math.floor(rand() * slots.length)], a.treatmentsWithCredit);
  }

  if (a.events) {
    const today = dateKey(new Date());
    for (const e of EVENTS) {
      if (!e.ticket || e.host !== member.home || e.date >= today) continue;
      const session = eventSessions(member.home, e.date).find((x) => x.time === e.time);
      if (session) out.push(makeBooking(member, session, EVENT_TICKET_PRICE, false));
    }
  }
  return out;
}

function seedState(): State {
  const members = seedMembers();
  const ava = members.find((m) => m.id === "m-classic")!;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const bookings: Booking[] = members.flatMap(pastBookings);
  const cls = slotsFor("weho", "class", dateKey(tomorrow)).find((s) => s.bookedByOthers < s.capacity);
  if (cls) bookings.push(makeBooking(ava, cls, 0, false));
  const charges: Charge[] = [{ id: uid(), memberId: "m-gold", at: daysAgo(2), label: "Gold membership · first month", amount: TIERS.gold.monthly! }];
  return { version: 2, activeMemberId: "m-new", members, bookings, charges };
}

// Runs on open and once a minute:
// - Trials whose 7 days are up become Classic (with the prorated first month charged), or, if the
//   member cancelled, switch to a free Wellness Account or delete the account as they chose.
// - Cancelled memberships whose paid-for month is over become a free Wellness Account.
// Returns the same object when nothing changed, so it is cheap to run often.
function applyScheduledChanges(s: State, now = new Date()): State {
  const ended = (m: Member) => m.tier === "trial" && !!m.trialEndsAt && new Date(m.trialEndsAt) <= now;
  const membershipEnded = (m: Member) => !!m.membershipEndsAt && new Date(m.membershipEndsAt) <= now;
  if (!s.members.some((m) => ended(m) || membershipEnded(m))) return s;

  const deleted = s.members.filter((m) => ended(m) && m.trialCancel === "delete");
  const deletedIds = new Set(deleted.map((m) => m.id));
  const charges = [...s.charges];

  const members = s.members
    .filter((m) => !deletedIds.has(m.id))
    .map((m): Member => {
      if (membershipEnded(m)) {
        return {
          ...m,
          tier: "wellness",
          credits: 0,
          memberSince: undefined,
          membershipEndsAt: undefined,
          notice: "Your membership has ended and you're now on a free Wellness Account. Your calendar and bookings are still here.",
        };
      }
      if (!ended(m)) return m;
      if (m.trialCancel === "downgrade") {
        return {
          ...m,
          tier: "wellness",
          trialEndsAt: undefined,
          trialCancel: undefined,
          notice: "Your trial has ended. You weren't charged for a membership, and you're now on a free Wellness Account.",
        };
      }
      const ends = new Date(m.trialEndsAt!);
      const month = ends.toLocaleDateString("en-US", { month: "long" });
      const becomes = m.trialBecomes ?? TRIAL_BECOMES;
      const next = TIERS[becomes];
      charges.push({
        id: uid(),
        memberId: m.id,
        at: now.toISOString(),
        label: `${next.name} membership · rest of ${month} ($${TIERS.trial.joinFee} trial fee applied)`,
        amount: firstMonthCharge(ends, becomes),
      });
      return {
        ...m,
        tier: becomes,
        trialEndsAt: undefined,
        trialBecomes: undefined,
        memberSince: ends.toISOString(),
        credits: next.welcomeCredits + next.monthlyCredits,
        notice: `Your 7-day trial ended, so you're now a ${next.name} member ($${next.monthly}/month). Your $${TIERS.trial.joinFee} trial fee went toward your first month.`,
      };
    });

  // A deleted account's upcoming bookings are released.
  const bookings = s.bookings.map((b) =>
    deletedIds.has(b.memberId) && b.status === "booked" && sessionStart(b.date, b.time) > now ? { ...b, status: "cancelled" as const } : b,
  );
  const activeDeleted = deleted.find((m) => m.id === s.activeMemberId);
  return {
    ...s,
    members,
    charges,
    bookings,
    goodbye: activeDeleted ? activeDeleted.name.split(" ")[0] : s.goodbye,
    activeMemberId: activeDeleted ? members[0].id : s.activeMemberId,
  };
}

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as State;
      if (parsed.version === 2) return applyScheduledChanges(parsed);
    }
  } catch {
    // Storage unavailable or corrupt; start fresh.
  }
  return seedState();
}

export type BookResult = { ok: true; booking: Booking } | { ok: false; error: string };

interface Store {
  member: Member;
  members: Member[];
  bookings: Booking[];
  charges: Charge[];
  spentThisMonth: number;
  spotsLeft: (session: Session) => number;
  myBookingFor: (sessionId: string) => Booking | undefined;
  book: (session: Session, useCredit: boolean) => BookResult;
  quote: (serviceId: ServiceId, location: LocationId, date: string) => Quote;
  perksLeft: (serviceId: ServiceId, date: string) => number; // monthly perks (Restore) still free that month
  firstVisitEligible: boolean;
  refundWindowOpen: boolean;
  cancelMembership: () => void;
  keepMembership: () => void;
  endMembershipNow: () => void; // demo only: jump to the end of the paid-for month
  termsForBooking: (booking: Booking) => CancelTerms;
  cancel: (bookingId: string) => void;
  switchMember: (id: string) => void;
  changeTier: (tier: TierId) => void;
  canStartTrial: boolean;
  cancelTrial: (choice: TrialCancelChoice) => void;
  keepTrial: () => void;
  setTrialBecomes: (tier: TierId) => void;
  endTrialNow: () => void; // demo only: jump to the end of the trial
  dismissNotice: () => void;
  dismissPromos: (ids: string[]) => void;
  setLocation: (loc: LocationId) => void;
  toggleRsvp: (eventId: string) => void;
  finishOnboarding: () => void;
  signUp: (details: { firstName: string; lastName: string; email: string; phone?: string; instagram?: string }) => void;
  restartAsNewDownload: () => void; // demo: wipe the new-user account and open the app as a fresh download
  refresh: () => void; // pull-to-refresh: reload saved data and apply anything due (ended trials, months)
  reset: () => void;
}

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State | null>(null);

  useEffect(() => {
    setState(load());
  }, []);

  // Check once a minute for trials that just ended while the app is open.
  useEffect(() => {
    const id = setInterval(() => setState((s) => (s ? applyScheduledChanges(s) : s)), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!state) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      // Ignore; the demo still works for this session.
    }
  }, [state]);

  const update = useCallback((fn: (s: State) => State) => setState((s) => (s ? fn(s) : s)), []);

  const store = useMemo<Store | null>(() => {
    if (!state) return null;
    const member = state.members.find((m) => m.id === state.activeMemberId) ?? state.members[0];
    const tier = TIERS[member.tier];
    const active = state.bookings.filter((b) => b.status === "booked");
    const patchMember = (s: State, patch: Partial<Member>) => s.members.map((m) => (m.id === member.id ? { ...m, ...patch } : m));
    const charge = (label: string, amount: number): Charge => ({ id: uid(), memberId: member.id, at: new Date().toISOString(), label, amount });

    const spotsLeft = (session: Session) => {
      const ours = active.filter((b) => b.sessionId === session.id).length;
      return Math.max(0, session.capacity - session.bookedByOthers - ours);
    };

    const myBookingFor = (sessionId: string) => active.find((b) => b.sessionId === sessionId && b.memberId === member.id);

    // Prices follow the account type on the day of the booking: after a cancelled membership or a
    // trial ends, later dates are priced at what the account will be by then.
    const tierOn = (date: string): TierId => {
      const day = sessionStart(date, "00:00");
      if (member.membershipEndsAt && day > new Date(member.membershipEndsAt)) return "wellness";
      if (member.tier === "trial" && member.trialEndsAt && day > new Date(member.trialEndsAt)) return member.trialCancel ? "wellness" : (member.trialBecomes ?? TRIAL_BECOMES);
      return member.tier;
    };
    const firstVisitEligible = !member.firstVisitUsed;
    // Monthly perks left for this service in the calendar month of `date`. A free cancel gives the
    // perk back (cancelled bookings don't count); a late cancel uses it up.
    const perksLeft = (serviceId: ServiceId, date: string) => {
      const allowance = TIERS[tierOn(date)].monthlyPerks?.[serviceId] ?? 0;
      if (!allowance) return 0;
      const used = state.bookings.filter(
        (b) => b.memberId === member.id && b.perk && b.serviceId === serviceId && b.status !== "cancelled" && b.date.slice(0, 7) === date.slice(0, 7),
      ).length;
      return allowance - used;
    };
    const quote: Store["quote"] = (serviceId, location, date) => {
      if (perksLeft(serviceId, date) > 0) {
        const regular = priceFor(tierOn(date), serviceId, location, date).regular;
        const name = PERK_LABEL[serviceId] ?? serviceId;
        return { price: 0, regular, kind: "perk", label: `This month's included ${name}`, tag: `${TIERS[tierOn(date)].name} monthly perk`, creditEligible: false };
      }
      return priceFor(tierOn(date), serviceId, location, date, firstVisitEligible);
    };

    const book: Store["book"] = (session, useCredit) => {
      const start = sessionStart(session.date, session.time);
      if (start.getTime() <= Date.now()) return { ok: false, error: "This time has already started. Please pick a later time." };
      if (!bookableAt(tier, session.serviceId, session.location, member.home)) {
        return { ok: false, error: "With a membership, therapies and treatments are at your home location. Classes work at both." };
      }
      if (myBookingFor(session.id)) return { ok: false, error: "You're already booked for this time." };
      if (spotsLeft(session) <= 0) return { ok: false, error: "This time just filled up. Please pick another." };

      const end = start.getTime() + session.durationMin * 60000;
      const clash = active.find((b) => {
        if (b.memberId !== member.id) return false;
        const bStart = sessionStart(b.date, b.time).getTime();
        return bStart < end && start.getTime() < bStart + b.durationMin * 60000;
      });
      if (clash) return { ok: false, error: `This overlaps with your ${clash.title} booking at the same time.` };

      const credit = useCredit && member.credits > 0 && canUseCredit(session.serviceId);
      const q = quote(session.serviceId, session.location, session.date);
      const firstVisit = !credit && q.kind === "firstVisit";
      const perk = !credit && q.kind === "perk";
      const price = credit ? 0 : q.price;
      const booking = { ...makeBooking(member, session, price, credit), firstVisit, perk };

      update((s) => ({
        ...s,
        members: credit || firstVisit ? patchMember(s, { ...(credit && { credits: member.credits - 1 }), ...(firstVisit && { firstVisitUsed: true }) }) : s.members,
        bookings: [...s.bookings, booking],
        charges: price > 0 ? [...s.charges, charge(`${session.title} · ${session.date} ${session.time}${firstVisit ? " (first visit price)" : ""}`, price)] : s.charges,
      }));
      return { ok: true, booking };
    };

    const termsForBooking = (b: Booking) => cancelTerms(tier, b);

    const cancel = (bookingId: string) => {
      const b = state.bookings.find((x) => x.id === bookingId);
      if (!b || b.status !== "booked") return;
      const t = termsForBooking(b);
      const label = `${b.title} · ${b.date} ${b.time}`;
      const extra: Charge[] = [];
      if (t.refund > 0) extra.push(charge(`Refund: ${label}`, -t.refund));
      if (t.fee > 0) extra.push(charge(`Late-cancel fee: ${label}`, t.fee));
      // A free cancellation gives back the credit, and the first-visit discount if it was used here.
      const restore = { ...(t.creditBack && { credits: member.credits + 1 }), ...(b.firstVisit && !t.late && { firstVisitUsed: false }) };
      update((s) => ({
        ...s,
        members: Object.keys(restore).length ? patchMember(s, restore) : s.members,
        bookings: s.bookings.map((x) => (x.id === bookingId ? { ...x, status: t.late ? "late-cancelled" : "cancelled" } : x)),
        charges: [...s.charges, ...extra],
      }));
    };

    const month = dateKey(new Date()).slice(0, 7);
    const mine = state.charges.filter((c) => c.memberId === member.id);
    const spentThisMonth = mine.filter((c) => c.at.slice(0, 7) === month && !c.label.includes("membership")).reduce((sum, c) => sum + c.amount, 0);

    return {
      member,
      members: state.members,
      bookings: state.bookings.filter((b) => b.memberId === member.id),
      charges: mine,
      spentThisMonth,
      spotsLeft,
      myBookingFor,
      book,
      quote,
      perksLeft,
      firstVisitEligible,
      refundWindowOpen: inRefundWindow(member.memberSince),
      cancelMembership: () =>
        update((s) => {
          if (!tier.isMember || tier.id === "trial") return s;
          if (inRefundWindow(member.memberSince)) {
            const fee = [...s.charges].reverse().find((c) => c.memberId === member.id && c.label.includes("membership") && c.amount > 0);
            const refund = fee?.amount ?? 0;
            return {
              ...s,
              members: patchMember(s, {
                tier: "wellness",
                credits: 0,
                memberSince: undefined,
                membershipEndsAt: undefined,
                notice: `Your ${tier.name} membership is cancelled${refund ? ` and ${money(refund)} is being refunded` : ""}, since you cancelled within your first 5 days. You're on a free Wellness Account, and your calendar and bookings are still here.`,
              }),
              charges: refund ? [...s.charges, charge(`Refund: ${tier.name} membership (cancelled within 5 days)`, -refund)] : s.charges,
            };
          }
          return { ...s, members: patchMember(s, { membershipEndsAt: endOfMonth(new Date()).toISOString() }) };
        }),
      keepMembership: () => update((s) => ({ ...s, members: patchMember(s, { membershipEndsAt: undefined }) })),
      endMembershipNow: () =>
        update((s) =>
          member.membershipEndsAt ? applyScheduledChanges({ ...s, members: patchMember(s, { membershipEndsAt: new Date(Date.now() - 1000).toISOString() }) }) : s,
        ),
      termsForBooking,
      cancel,
      switchMember: (id) => update((s) => ({ ...s, activeMemberId: id })),
      changeTier: (tierId) =>
        update((s) => {
          const next = TIERS[tierId];
          if (tierId === "trial") {
            // One trial per account, and only for accounts that aren't members.
            if (member.trialUsed || tier.isMember) return s;
            return {
              ...s,
              members: patchMember(s, { tier: "trial", trialUsed: true, trialEndsAt: trialEndsAt(new Date()).toISOString(), credits: 0 }),
              charges: [...s.charges, charge(`${next.name} membership fee`, next.joinFee)],
            };
          }
          const fee = next.monthly ?? next.joinFee;
          const label = next.monthly ? `${next.name} membership · first month` : `${next.name} fee`;
          return {
            ...s,
            members: patchMember(s, {
              tier: tierId,
              trialEndsAt: undefined,
              membershipEndsAt: undefined,
              memberSince: tier.isMember && tier.id !== "trial" ? member.memberSince : new Date().toISOString(),
              credits: tier.isMember && tier.id !== "trial" ? member.credits : next.welcomeCredits + next.monthlyCredits,
            }),
            charges: fee > 0 ? [...s.charges, charge(label, fee)] : s.charges,
          };
        }),
      canStartTrial: !tier.isMember && !member.trialUsed,
      cancelTrial: (choice) => update((s) => (member.tier !== "trial" ? s : { ...s, members: patchMember(s, { trialCancel: choice }) })),
      keepTrial: () => update((s) => ({ ...s, members: patchMember(s, { trialCancel: undefined }) })),
      setTrialBecomes: (tierId) => update((s) => ({ ...s, members: patchMember(s, { trialBecomes: tierId }) })),
      endTrialNow: () =>
        update((s) => (member.tier !== "trial" ? s : applyScheduledChanges({ ...s, members: patchMember(s, { trialEndsAt: new Date(Date.now() - 1000).toISOString() }) }))),
      dismissNotice: () => update((s) => ({ ...s, members: patchMember(s, { notice: undefined }) })),
      dismissPromos: (ids) => update((s) => ({ ...s, members: patchMember(s, { dismissedPromos: [...new Set([...(member.dismissedPromos ?? []), ...ids])] }) })),
      setLocation: (loc) => update((s) => ({ ...s, members: patchMember(s, { home: loc }) })),
      toggleRsvp: (eventId) =>
        update((s) => {
          const rsvps = member.rsvps ?? [];
          return { ...s, members: patchMember(s, { rsvps: rsvps.includes(eventId) ? rsvps.filter((id) => id !== eventId) : [...rsvps, eventId] }) };
        }),
      finishOnboarding: () => update((s) => ({ ...s, members: patchMember(s, { onboarded: true }) })),
      // Demo sign-up: keeps the name, email and phone on this device. The password is never stored.
      signUp: ({ firstName, lastName, email, phone, instagram }) =>
        update((s) => ({ ...s, members: patchMember(s, { name: `${firstName} ${lastName}`.trim(), email, phone: phone || undefined, instagram, signedUp: true }) })),
      restartAsNewDownload: () =>
        update((s) => ({
          ...s,
          activeMemberId: NEW_DOWNLOAD.id,
          members: s.members.map((m) => (m.id === NEW_DOWNLOAD.id ? { ...NEW_DOWNLOAD } : m)),
          bookings: s.bookings.filter((b) => b.memberId !== NEW_DOWNLOAD.id),
          charges: s.charges.filter((c) => c.memberId !== NEW_DOWNLOAD.id),
        })),
      refresh: () => setState(load()),
      reset: () => setState(seedState()),
    };
  }, [state, update]);

  if (!store) {
    return (
      <div className="flex min-h-screen items-center justify-center" role="status" aria-label="Loading">
        <TulipLogo size={84} loading />
      </div>
    );
  }
  if (state?.goodbye) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
        <span className="font-serif text-xl tracking-[0.35em]">ARTHA</span>
        <h1 className="font-serif text-4xl">Goodbye, {state.goodbye}</h1>
        <p className="text-sm text-muted">Your trial has ended and your account has been deleted, as you asked. You weren&apos;t charged for a membership.</p>
        <button onClick={() => update((s) => ({ ...s, goodbye: undefined }))} className="mt-4 rounded-full bg-sage px-6 py-3 text-sm font-medium text-ink">
          Back to the demo
        </button>
      </div>
    );
  }
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const s = useContext(StoreContext);
  if (!s) throw new Error("useStore must be used inside StoreProvider");
  return s;
}
