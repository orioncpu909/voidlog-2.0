"use client";

// Demo store: accounts, bookings and account charges, saved in localStorage.
// No real payments; charges are a ledger of what the card on file would be billed.

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { LocationId, PERK_LABEL, Quote, SERVICES, ServiceId, TIERS, TierId, bookableAt, priceFor } from "./data";
import { Session, dateKey, eventSessions, sessionStart, slotsFor } from "./schedule";
import { EVENTS, eventAt, eventTicketPrice, eventVisibleTo } from "./events";
import { CancelTerms, canUseCredit, cancelTerms } from "./policy";
import { TRIAL_BECOMES, firstMonthCharge, trialEndsAt } from "./trial";
import { checkInDue } from "./checkin";
import type { CardOnFile } from "./card";
import { endOfMonth, inRefundWindow, joinCharge, usesTreatmentCredit } from "./membership";
import { money, shortDate, timeLabel, timeRange } from "./format";
import { REFERRAL_CREDITS, ReferralResult, findReferrer } from "./referral";
import {
  CHALLENGE_PRIZE_CREDITS, Challenge, ChallengeResult, PLUNGE_MAX_SECONDS, PLUNGE_MIN_SECONDS, challengeName, displayName, endedChallenges, firstPlace, isEntered, runTieBreak, scoreFor, tieBreakEnds,
} from "./community";
import { SHOW_COMMUNITY } from "./flags";
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
  photo?: string; // profile picture, as a small image saved on this device
  rsvps?: string[]; // event ids
  trialUsed?: boolean; // set the moment a trial starts; an account never gets a second one
  trialEndsAt?: string; // ISO time, only while on a trial
  trialCancel?: TrialCancelChoice; // set when a trial is cancelled; the trial still runs to its end date
  trialBecomes?: TierId; // membership the trial turns into; Classic when not chosen
  notice?: string; // one-time message shown on Home (e.g. trial ended)
  dismissedPromos?: string[]; // specials whose Home banner this account closed
  firstVisitUsed?: boolean; // the first-visit price has been used
  memberSince?: string; // ISO start of the current paid membership
  lastRenewal?: string; // "YYYY-MM" of the latest month paid; missing means the month they joined
  welcomeCreditsGiven?: boolean; // welcome credits are once per account, even after leaving and rejoining
  membershipEndsAt?: string; // set when a paid membership is cancelled after the refund window
  referredBy?: string; // id of the account whose referral code was used at sign-up
  referralResult?: ReferralResult; // set once this account's first monthly payment went through
  communityJoined?: boolean; // shows on the Community leaderboards (members only, opt-in)
  communityJoinedAt?: string; // ISO time it was last turned on; only challenges ending after it can be won that way
  challengeWaitlist?: string[]; // challenge ids signed up for before they started (enters you in that one)
  card?: CardOnFile; // what's billed: never the full number or security code
  challengeWins?: string[]; // challenge ids won and already paid out as credits
  challengeResults?: Record<string, ChallengeResult>; // ended challenges by id, saved so they can't change
}

// A cold plunge time a member clocked after a completed Contrast (sauna + plunge) session.
export interface PlungeLog {
  id: string;
  memberId: string;
  bookingId: string;
  date: string; // the session's date
  seconds: number;
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
  checkedInAt?: string; // set when the front desk scans the account's QR code
}

export interface Charge {
  id: string;
  memberId: string;
  at: string;
  label: string;
  amount: number;
  kind?: "membership"; // a monthly membership payment (what a referral credit waits for)
}

interface State {
  version: 2;
  activeMemberId: string;
  goodbye?: string; // first name of the active account if it was just deleted
  members: Member[];
  bookings: Booking[];
  charges: Charge[];
  plunges?: PlungeLog[]; // missing in data saved before Community existed
  accounts?: AccountDetails[]; // details used to sign up, kept when the demo restarts as a new download
}

export interface AccountDetails {
  email: string;
  phone: string;
  instagram?: string;
}

const KEY = "artha-demo-v2";

const uid = () => Math.random().toString(36).slice(2, 10);

const daysAgo = (n: number) => new Date(Date.now() - n * 864e5).toISOString();

// The brand-new download: no account yet, so the app opens on the create-account screens.
const NEW_DOWNLOAD: Member = { id: "m-new", name: "Karan", tier: "wellness", home: "weho", credits: 0, onboarded: false, signedUp: false };

// The sample accounts' made-up card. Sign-up doesn't ask for one, so a new account starts without.
const SAMPLE_CARD: CardOnFile = { brand: "Visa", last4: "4242", expMonth: 12, expYear: 2029 };
const withSampleCard = (m: Member): Member => (m.card || m.id === NEW_DOWNLOAD.id ? m : { ...m, card: SAMPLE_CARD });

function seedMembers(): Member[] {
  const members: Member[] = [
    { ...NEW_DOWNLOAD },
    { id: "m-wellness", name: "Karan", tier: "wellness", home: "weho", credits: 0, onboarded: true, trialUsed: true, firstVisitUsed: true },
    { id: "m-classic", name: "Karan", tier: "classic", home: "weho", credits: 4, onboarded: true, firstVisitUsed: true, memberSince: daysAgo(20), communityJoined: true, communityJoinedAt: daysAgo(40) },
    // Joined 2 days ago, so still inside the 5-day refund window.
    { id: "m-gold", name: "Karan", tier: "gold", home: "weho", credits: 5, onboarded: true, firstVisitUsed: true, memberSince: daysAgo(2), communityJoined: true, communityJoinedAt: daysAgo(2) },
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
      trialEndsAt: trialEndsAt(new Date(Date.now() - 4 * 864e5)).toISOString(),
    },
  ];
  return members.map(withSampleCard);
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
  doubles: number; // chance a visit day has a second class (morning and evening)
  mix: [ServiceId, number][]; // therapies and how often each is picked
  treatmentsPerMonth: number;
  treatmentsWithCredit?: boolean;
  events?: boolean; // went to past ticketed events at their location
  plunges?: boolean; // Community demo: Contrast 2 and 6 days ago, so this month has a logged plunge and one to log
}

const ACTIVITY: Record<string, Activity> = {
  "m-gold": {
    weeks: 12, perWeek: 4, streak: 14, recovery: 0.8, doubles: 0.5, treatmentsPerMonth: 1, treatmentsWithCredit: true, events: true, plunges: true,
    mix: [["cryo", 3], ["ir-sauna", 3], ["red-light", 2], ["float", 2], ["contrast", 2], ["hbot", 1]],
  },
  "m-classic": {
    weeks: 10, perWeek: 4, streak: 9, recovery: 0.5, doubles: 0.45, treatmentsPerMonth: 1, events: true, plunges: true,
    mix: [["cryo", 4], ["ir-sauna", 2], ["contrast", 1], ["float", 1], ["red-light", 1]],
  },
  "m-restore": {
    weeks: 8, perWeek: 2, streak: 3, recovery: 0.4, doubles: 0.35, treatmentsPerMonth: 1,
    mix: [["ir-sauna", 2], ["cryo", 2], ["contrast", 1]],
  },
  "m-wellness": {
    weeks: 6, perWeek: 2.5, streak: 4, recovery: 0.35, doubles: 0.35, treatmentsPerMonth: 0.5,
    mix: [["cryo", 3], ["ir-sauna", 2], ["contrast", 1]],
  },
  "m-trial": {
    weeks: 5, perWeek: 2, streak: 3, recovery: 0.3, doubles: 0.3, treatmentsPerMonth: 0,
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
  const evening = (slots: Session[]) => slots[slots.length - 1 - Math.floor(rand() * Math.min(2, slots.length))];
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

  // Every visit day gets at least one visit: usually a class, often a second one in the evening,
  // sometimes a therapy too (or instead). The last two days always have two classes, so the Home
  // calendar shows a multi-class day right away.
  for (const back of days) {
    const before = out.length;
    if (rand() < 0.85) add("class", back, morning);
    if (back <= 2 || rand() < a.doubles) add("class", back, evening);
    if (rand() < a.recovery) add(pickTherapy(), back, afternoon);
    if (out.length === before) add("class", back, morning);
  }

  if (a.plunges) for (const back of [6, 2]) if (!out.some((b) => b.serviceId === "contrast" && b.date === dayKey(back))) add("contrast", back, afternoon);

  const treatments = Math.round((a.weeks / 4.3) * a.treatmentsPerMonth);
  for (let i = 0; i < treatments; i++) {
    const back = Math.round(((i + 0.5) * a.weeks * 7) / treatments);
    add("massage", back, (slots) => slots[Math.floor(rand() * slots.length)], a.treatmentsWithCredit);
  }

  if (a.events) {
    const today = dateKey(new Date());
    for (const e of EVENTS) {
      if (!e.ticket || e.host !== member.home || e.date >= today || !eventVisibleTo(e, TIERS[member.tier].isMember)) continue;
      const session = eventSessions(member.home, e.date).find((x) => x.time === e.time);
      if (session) out.push(makeBooking(member, session, eventTicketPrice(e, TIERS[member.tier].isMember), false));
    }
  }
  return out;
}

// Demo bookings coming up, so the Home calendar has days with several visits: tomorrow a morning
// and an evening class, and in three days a class plus a therapy at home.
function upcomingBookings(member: Member, taken: Map<string, number>): Booking[] {
  if (!ACTIVITY[member.id]) return [];
  const day = (ahead: number) => {
    const d = new Date();
    d.setDate(d.getDate() + ahead);
    return dateKey(d);
  };
  const open = (serviceId: ServiceId, ahead: number) => slotsFor(member.home, serviceId, day(ahead)).filter((s) => s.bookedByOthers + (taken.get(s.id) ?? 0) < s.capacity);
  const picks: Session[] = [];
  const tomorrow = open("class", 1);
  if (tomorrow.length) picks.push(tomorrow[0], tomorrow[tomorrow.length - 1]);
  const later = open("class", 3);
  if (later.length) picks.push(later[Math.floor(later.length / 3)]);
  const therapy = open(ACTIVITY[member.id].mix[0][0], 3).filter((s) => s.time >= "15:00")[0];
  if (therapy) picks.push(therapy);
  return [...new Set(picks)].map((s) => {
    taken.set(s.id, (taken.get(s.id) ?? 0) + 1); // the demo accounts share these sessions
    return { ...makeBooking(member, s, priceFor(member.tier, s.serviceId, member.home, s.date).price, false), createdAt: daysAgo(1) };
  });
}

function seedState(): State {
  const month = dateKey(new Date()).slice(0, 7);
  const members = seedMembers().map((m) => (TIERS[m.tier].monthly ? { ...m, lastRenewal: month, welcomeCreditsGiven: true } : m));
  const taken = new Map<string, number>();
  const bookings: Booking[] = [...members.flatMap(pastBookings), ...members.flatMap((m) => upcomingBookings(m, taken))];
  const charges: Charge[] = [{ id: uid(), memberId: "m-gold", at: daysAgo(2), label: "Gold membership · first month", amount: TIERS.gold.monthly!, kind: "membership" }];
  return { version: 2, activeMemberId: "m-new", members, bookings, charges, plunges: seedPlunges(members, bookings) };
}

// Demo plunge times: members on the Community boards have clocked every past Contrast session
// except the most recent, between 1:00 and 3:00; that last one is left for you to log.
function seedPlunges(members: Member[], bookings: Booking[]): PlungeLog[] {
  const now = new Date();
  return members
    .filter((m) => m.communityJoined)
    .flatMap((m) => {
      const rand = seeded(`plunge-${m.id}`);
      const done = bookings
        .filter((b) => b.memberId === m.id && b.serviceId === "contrast" && b.status === "booked" && sessionStart(b.date, b.time) <= now)
        .sort((a, b) => a.date.localeCompare(b.date));
      return done.slice(0, -1).map((b) => ({ id: uid(), memberId: m.id, bookingId: b.id, date: b.date, seconds: 60 + Math.round((rand() * 120) / 5) * 5 }));
    });
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
          ...LEAVE_COMMUNITY,
          tier: "wellness",
          credits: 0,
          welcomeCreditsGiven: true,
          memberSince: undefined,
          membershipEndsAt: undefined,
          notice: "Your membership has ended and you're now on a free Wellness Account. Your calendar and bookings are still here.",
        };
      }
      if (!ended(m)) return m;
      if (m.trialCancel === "downgrade") {
        return {
          ...m,
          ...LEAVE_COMMUNITY,
          tier: "wellness",
          credits: 0,
          trialEndsAt: undefined,
          trialCancel: undefined,
          notice: "Your trial has ended. You weren't charged for a membership, and you're now on a free Wellness Account.",
        };
      }
      const starts = new Date(new Date(m.trialEndsAt!).getTime() + 1); // the membership begins as the trial's last day ends
      const month = starts.toLocaleDateString("en-US", { month: "long" });
      const becomes = m.trialBecomes ?? TRIAL_BECOMES;
      const next = TIERS[becomes];
      charges.push({
        id: uid(),
        memberId: m.id,
        at: now.toISOString(),
        label: `${next.name} membership · ${next.neverProrated ? "first month" : `rest of ${month}`} ($${TIERS.trial.joinFee} trial fee applied)`,
        amount: firstMonthCharge(starts, becomes),
        kind: "membership",
      });
      return {
        ...m,
        tier: becomes,
        trialEndsAt: undefined,
        trialBecomes: undefined,
        memberSince: starts.toISOString(),
        credits: (m.welcomeCreditsGiven ? 0 : next.welcomeCredits) + next.monthlyCredits + m.credits, // a trial only has credits it won in Community
        welcomeCreditsGiven: true,
        notice: `Your 7-day trial ended, so you're now a ${next.name} member ($${next.monthly}/month). Your $${TIERS.trial.joinFee} trial fee went toward your first month.`,
      };
    });

  // A deleted account's upcoming bookings are released, and anything paid for them goes back.
  const released = (b: Booking) => deletedIds.has(b.memberId) && b.status === "booked" && sessionStart(b.date, b.time) > now;
  for (const b of s.bookings) {
    if (released(b) && b.price > 0) charges.push({ id: uid(), memberId: b.memberId, at: now.toISOString(), label: `Refund: ${b.title} · ${b.date} ${b.time}`, amount: -b.price });
  }
  const bookings = s.bookings.map((b) => (released(b) ? { ...b, status: "cancelled" as const } : b));
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

// Referral credits: once a referred account has a successful monthly membership payment, the
// account that referred it gets REFERRAL_CREDITS treatment credits (if it's a paying member then)
// and a note on Home. Each referred account settles once. Returns the same object when nothing is due.
function applyReferralCredits(s: State): State {
  const paid = (m: Member) => s.charges.some((c) => c.memberId === m.id && c.kind === "membership" && c.amount > 0);
  const due = s.members.filter((m) => m.referredBy && !m.referralResult && paid(m));
  if (due.length === 0) return s;
  const earns = (m: Member) => TIERS[m.tier].isMember && m.tier !== "trial";
  const members = s.members.map((m): Member => {
    const friend = due.find((d) => d.id === m.id);
    const referrer = friend && s.members.find((r) => r.id === friend.referredBy);
    if (friend) return { ...m, referralResult: referrer && earns(referrer) ? "credited" : "not-member" };
    const friends = due.filter((d) => d.referredBy === m.id);
    if (friends.length === 0 || !earns(m)) return m;
    const earned = friends.length * REFERRAL_CREDITS;
    const names = friends.map((f) => f.name.split(" ")[0]).join(" and ");
    return {
      ...m,
      credits: m.credits + earned,
      notice: addNotice(m.notice, `${names} became ${friends.length === 1 ? "a member" : "members"} with your referral link, so you've earned ${earned} treatment credit${earned === 1 ? "" : "s"}.`),
    };
  });
  return { ...s, members };
}

// Leaving a membership takes you off the Community boards and waitlists.
const LEAVE_COMMUNITY: Partial<Member> = { communityJoined: false, challengeWaitlist: [] };

// Adds a note to Home without losing one that hasn't been read yet.
const addNotice = (current: string | undefined, text: string) => (current ? `${current}\n\n${text}` : text);

// How an ended challenge stands for an account: its own board, the demo members plus them. Saved
// once it's first seen. A win paid before results were saved keeps standing.
function challengeResultOf(c: Challenge, m: Member, s: State, now: Date): ChallengeResult | null {
  const saved = m.challengeResults?.[c.id];
  if (saved?.closed) return saved;
  const me = { id: m.id, name: displayName(m), score: scoreFor(c, m.id, s.bookings, s.plunges ?? [], now) };
  if (!saved && m.challengeWins?.includes(c.id)) return { score: me.score, tied: [me], winner: me, closed: true };
  const result = saved ?? firstPlace(c, isEntered(c, m, TIERS[m.tier].isMember) ? [me] : [], now);
  return result && runTieBreak(c, result, s.bookings, TIERS[m.tier].isMember, now);
}

// Challenge prizes: an account in an ended challenge has its result saved, and it changes only as
// the tie breaker plays out (runTieBreak has the rules). A win gets CHALLENGE_PRIZE_CREDITS
// treatment credit and a note on Home; a tied member also hears when the tie breaker starts and how
// it ended. Returns the same object when nothing is due.
function applyChallengePrizes(s: State, now = new Date()): State {
  if (!SHOW_COMMUNITY) return s;
  const ended = endedChallenges(now);
  let changed = false;
  const members = s.members.map((m): Member => {
    const results = { ...m.challengeResults };
    const won: string[] = [];
    let notice = m.notice;
    let moved = false;
    for (const c of ended) {
      const saved = results[c.id];
      if (saved?.closed || (!saved && !isEntered(c, m, TIERS[m.tier].isMember))) continue;
      const result = challengeResultOf(c, m, s, now);
      if (!result || result === saved) continue;
      results[c.id] = result;
      moved = true;
      const name = challengeName(c);
      const tied = result.tied.length > 1;
      if (result.winner?.id === m.id) {
        if (m.challengeWins?.includes(c.id)) continue;
        won.push(c.id);
        notice = addNotice(notice, `You won ${tied ? `the tie breaker for ${name}` : name}! ${CHALLENGE_PRIZE_CREDITS} treatment credit was added to your account.`);
      } else if (tied && result.tied.some((t) => t.id === m.id)) {
        const text = !result.closed
          ? `Tied for 1st in ${name}! Scan in and finish one more by ${shortDate(tieBreakEnds(c))} to win the credit.`
          : result.winner
            ? `${result.winner.name} finished first in the tie breaker for ${name}, so they won the credit.`
            : `Nobody finished the tie breaker for ${name} in time, so no one won the credit.`;
        notice = addNotice(notice, text);
      }
    }
    if (!moved) return m;
    changed = true;
    return {
      ...m,
      credits: m.credits + won.length * CHALLENGE_PRIZE_CREDITS,
      challengeWins: [...(m.challengeWins ?? []), ...won],
      challengeResults: results,
      notice,
    };
  });
  return changed ? { ...s, members } : s;
}

// Monthly renewal on the 1st: each paid membership is charged the full month and gets its monthly
// credits. Nothing more is charged once a membership is cancelled. Data saved before renewals
// existed catches up one month at most. Returns the same object when nothing is due.
function applyRenewals(s: State, now = new Date()): State {
  const thisMonth = dateKey(now).slice(0, 7);
  const lastMonth = dateKey(new Date(now.getFullYear(), now.getMonth() - 1, 1)).slice(0, 7);
  const paidThrough = (m: Member) => m.lastRenewal ?? [dateKey(new Date(m.memberSince!)).slice(0, 7), lastMonth].sort()[1];
  const due = (m: Member) => !!TIERS[m.tier].monthly && !!m.memberSince && !m.membershipEndsAt && paidThrough(m) < thisMonth;
  if (!s.members.some(due)) return s;

  const charges = [...s.charges];
  const members = s.members.map((m): Member => {
    if (!due(m)) return m;
    const tier = TIERS[m.tier];
    let months = 0;
    for (let d = new Date(`${paidThrough(m)}-15T12:00:00`); ; months++) {
      d = new Date(d.getFullYear(), d.getMonth() + 1, 15, 12);
      if (dateKey(d).slice(0, 7) > thisMonth) break;
      const name = d.toLocaleDateString("en-US", { month: "long" });
      charges.push({ id: uid(), memberId: m.id, at: new Date(d.getFullYear(), d.getMonth(), 1, 9).toISOString(), label: `${tier.name} membership · ${name}`, amount: tier.monthly!, kind: "membership" });
    }
    const earned = months * tier.monthlyCredits;
    return {
      ...m,
      lastRenewal: thisMonth,
      credits: m.credits + earned,
      ...(earned > 0 && { notice: addNotice(m.notice, `Your ${tier.name} membership renewed, and ${earned} treatment credit${earned === 1 ? " was" : "s were"} added to your account.`) }),
    };
  });
  return { ...s, members, charges };
}

// Everything that happens on its own: ended trials and memberships, renewals, then referral credits
// and challenge prizes. Prizes also go first, so a challenge's result is saved before anything
// changes who was in it.
function settle(s: State): State {
  return applyChallengePrizes(applyReferralCredits(applyRenewals(applyScheduledChanges(applyChallengePrizes(s)))));
}

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as State;
      if (parsed.version === 2) return settle({ ...parsed, members: parsed.members.map(withSampleCard) });
    }
  } catch {
    // Storage unavailable or corrupt; start fresh.
  }
  return settle(seedState());
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
  bookingConflict: (session: Pick<Session, "id" | "serviceId" | "date" | "time" | "durationMin"> & { instructor?: string }) => string | null;
  checkIn: () => Booking | undefined; // what the front desk's scan does: checks in the appointment that's due
  creditUsableOn: (date: string) => boolean; // credits end with the membership, so not for dates after it
  accountTaken: (details: { email: string; phone: string; instagram?: string }) => "email" | "phone" | "instagram" | null;
  quote: (serviceId: ServiceId, location: LocationId, date: string) => Quote;
  perksLeft: (serviceId: ServiceId, date: string) => number; // monthly perks (Restore) still free that month
  firstVisitEligible: boolean;
  refundWindowOpen: boolean;
  refundLostToCredit: boolean; // inside the first 5 days, but a treatment credit has been used
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
  plunges: PlungeLog[]; // every account's clocked plunge times
  challengeResult: (c: Challenge) => ChallengeResult | null; // how an ended challenge stands
  joinCommunity: (joined: boolean) => void;
  setPhoto: (photo?: string) => void;
  setCard: (card: CardOnFile) => void;
  toggleWaitlist: (challengeId: string) => void; // sign up for (or leave) a challenge before it starts
  logPlunge: (bookingId: string, seconds: number) => { ok: true } | { ok: false; error: string };
  dismissPromos: (ids: string[]) => void;
  setLocation: (loc: LocationId) => void;
  toggleRsvp: (eventId: string) => void;
  finishOnboarding: () => void;
  signUp: (details: { firstName: string; lastName: string; email: string; phone?: string; instagram?: string; referralCode?: string }) => void;
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
    const id = setInterval(() => setState((s) => (s ? settle(s) : s)), 60_000);
    return () => clearInterval(id);
  }, []);

  // A booking made in another tab shouldn't be overwritten by this one's older copy.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setState(load());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // The session being booked right now, so a second tap in the same instant can't book it twice.
  const bookingNow = useRef(new Set<string>());
  useEffect(() => {
    bookingNow.current.clear();
    if (!state) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      // Ignore; the demo still works for this session.
    }
  }, [state]);

  // Every change also settles referral credits, so a friend's first payment credits the referrer at once.
  const update = useCallback((fn: (s: State) => State) => setState((s) => (s ? applyChallengePrizes(applyReferralCredits(fn(s))) : s)), []);

  const store = useMemo<Store | null>(() => {
    if (!state) return null;
    const member = state.members.find((m) => m.id === state.activeMemberId) ?? state.members[0];
    const tier = TIERS[member.tier];
    const active = state.bookings.filter((b) => b.status === "booked");
    // Restore and Gold: using a treatment credit since joining ends the 5-day refund.
    const creditSpent =
      (member.tier === "restore" || member.tier === "gold") &&
      state.bookings.some((b) => b.memberId === member.id && b.status !== "cancelled" && !!member.memberSince && b.createdAt >= member.memberSince && usesTreatmentCredit(b));
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

    // Why this account can't take this time, if it can't: one of each therapy a day, and no overlaps.
    const bookingConflict: Store["bookingConflict"] = (session) => {
      const mine: Pick<Booking, "serviceId" | "title" | "date" | "time" | "durationMin">[] = active.filter((b) => b.memberId === member.id && b.sessionId !== session.id);
      for (const e of EVENTS) if (member.rsvps?.includes(e.id) && session.id !== `rsvp|${e.id}`) mine.push({ serviceId: "event", title: e.title, date: e.date, time: e.time, durationMin: e.durationMin });
      const repeat = SERVICES[session.serviceId].category === "therapy" && mine.find((b) => b.serviceId === session.serviceId && b.date === session.date);
      if (repeat) return `You already have ${repeat.title} at ${timeLabel(repeat.time)} that day. Each therapy can be booked once a day.`;
      const start = sessionStart(session.date, session.time).getTime();
      const end = start + session.durationMin * 60000;
      const clash = mine.find((b) => {
        const bStart = sessionStart(b.date, b.time).getTime();
        return bStart < end && start < bStart + b.durationMin * 60000;
      });
      if (clash) return `This overlaps with your ${clash.title} booking, ${timeRange(clash.time, clash.durationMin)}. Please pick a time that doesn't overlap.`;
      // One therapist can't be with two clients at once, whichever service or studio they booked.
      const busy =
        SERVICES[session.serviceId].category === "treatment" &&
        !!session.instructor &&
        active.some((b) => {
          if (b.memberId === member.id || b.sessionId === session.id || b.instructor !== session.instructor || SERVICES[b.serviceId].category !== "treatment") return false;
          const bStart = sessionStart(b.date, b.time).getTime();
          return bStart < end && start < bStart + b.durationMin * 60000;
        });
      if (busy) return `${session.instructor} is with another client then. Please pick a different time.`;
      return null;
    };

    const checkIn: Store["checkIn"] = () => {
      const due = checkInDue(state.bookings.filter((b) => b.memberId === member.id));
      if (due) update((s) => ({ ...s, bookings: s.bookings.map((b) => (b.id === due.id ? { ...b, checkedInAt: new Date().toISOString() } : b)) }));
      return due;
    };

    const creditUsableOn: Store["creditUsableOn"] = (date) => member.credits > 0 && TIERS[tierOn(date)].isMember;

    const accountTaken: Store["accountTaken"] = ({ email, phone, instagram }) => {
      const used = [...(state.accounts ?? []), ...state.members.filter((m) => m.id !== member.id && m.email).map((m) => ({ email: m.email!, phone: m.phone ?? "", instagram: m.instagram }))];
      if (used.some((a) => a.email === email)) return "email";
      if (used.some((a) => a.phone === phone)) return "phone";
      if (instagram && used.some((a) => a.instagram?.toLowerCase() === instagram.toLowerCase())) return "instagram";
      return null;
    };

    const book: Store["book"] = (session, useCredit) => {
      const start = sessionStart(session.date, session.time);
      if (start.getTime() <= Date.now()) return { ok: false, error: "This time has already started. Please pick a later time." };
      if (!bookableAt(tier, session.serviceId, session.location, member.home)) {
        return { ok: false, error: "With a membership, therapies and treatments are at your home location. Classes work at both." };
      }
      const event = session.serviceId === "event" ? eventAt(session.location, session.date, session.time) : undefined;
      if (event && !eventVisibleTo(event, tier.isMember)) return { ok: false, error: "This event is for members only." };
      if (myBookingFor(session.id)) return { ok: false, error: "You're already booked for this time." };
      if (spotsLeft(session) <= 0) return { ok: false, error: "This time just filled up. Please pick another." };
      if (bookingNow.current.has(session.id)) return { ok: false, error: "You're already booked for this time." };

      const conflict = bookingConflict(session);
      if (conflict) return { ok: false, error: conflict };

      const credit = useCredit && creditUsableOn(session.date) && canUseCredit(session.serviceId);
      const q = quote(session.serviceId, session.location, session.date);
      const firstVisit = !credit && q.kind === "firstVisit";
      const perk = !credit && q.kind === "perk";
      const price = credit ? 0 : event ? eventTicketPrice(event, tier.isMember) : q.price;
      const booking = { ...makeBooking(member, session, price, credit), firstVisit, perk };
      bookingNow.current.add(session.id);

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
      const restore = { ...(t.creditBack && tier.isMember && { credits: member.credits + 1 }), ...(b.firstVisit && !t.late && { firstVisitUsed: false }) };
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
      bookingConflict,
      checkIn,
      creditUsableOn,
      accountTaken,
      quote,
      perksLeft,
      firstVisitEligible,
      refundWindowOpen: inRefundWindow(member.memberSince) && !creditSpent,
      refundLostToCredit: inRefundWindow(member.memberSince) && creditSpent,
      cancelMembership: () =>
        update((s) => {
          if (!tier.isMember || tier.id === "trial") return s;
          if (inRefundWindow(member.memberSince) && !creditSpent) {
            const fee = [...s.charges].reverse().find((c) => c.memberId === member.id && c.label.includes("membership") && c.amount > 0);
            const refund = fee?.amount ?? 0;
            return {
              ...s,
              members: patchMember(s, {
                ...LEAVE_COMMUNITY,
                tier: "wellness",
                credits: 0,
                welcomeCreditsGiven: true,
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
          const due = joinCharge(member.tier, tierId);
          return {
            ...s,
            members: patchMember(s, {
              tier: tierId,
              trialEndsAt: undefined,
              membershipEndsAt: undefined,
              memberSince: tier.isMember && tier.id !== "trial" ? member.memberSince : new Date().toISOString(),
              lastRenewal: dateKey(new Date()).slice(0, 7),
              // Keep what you have when switching plans, plus any monthly credit the new plan adds; a
              // trial's only credits are Community prizes. Welcome credits are once per account.
              credits:
                tier.isMember && tier.id !== "trial"
                  ? member.credits + Math.max(0, next.monthlyCredits - tier.monthlyCredits)
                  : (member.welcomeCreditsGiven ? 0 : next.welcomeCredits) + next.monthlyCredits + (tier.id === "trial" ? member.credits : 0),
              welcomeCreditsGiven: true,
              ...(!tier.isMember && {
                notice: addNotice(
                  member.notice,
                  `You're now a ${next.name} member. ${money(due.amount)} was charged today${due.days ? " for the rest of this month" : ""}, then ${money(next.monthly ?? 0)}/month from the 1st.`,
                ),
              }),
            }),
            charges: due.amount > 0 ? [...s.charges, { ...charge(due.label, due.amount), ...(next.monthly && { kind: "membership" as const }) }] : s.charges,
          };
        }),
      canStartTrial: !tier.isMember && !member.trialUsed,
      cancelTrial: (choice) => update((s) => (member.tier !== "trial" ? s : { ...s, members: patchMember(s, { trialCancel: choice }) })),
      keepTrial: () => update((s) => ({ ...s, members: patchMember(s, { trialCancel: undefined }) })),
      setTrialBecomes: (tierId) => update((s) => ({ ...s, members: patchMember(s, { trialBecomes: tierId }) })),
      endTrialNow: () =>
        update((s) => (member.tier !== "trial" ? s : applyScheduledChanges({ ...s, members: patchMember(s, { trialEndsAt: new Date(Date.now() - 1000).toISOString() }) }))),
      dismissNotice: () => update((s) => ({ ...s, members: patchMember(s, { notice: undefined }) })),
      plunges: state.plunges ?? [],
      challengeResult: (c) => challengeResultOf(c, member, state, new Date()),
      // Only members can be on the boards; leaving keeps their history but hides them.
      setPhoto: (photo) => update((s) => ({ ...s, members: patchMember(s, { photo }) })),
      setCard: (card) => update((s) => ({ ...s, members: patchMember(s, { card }) })),
      joinCommunity: (joined) =>
        update((s) =>
          joined && !tier.isMember
            ? s
            : { ...s, members: patchMember(s, { communityJoined: joined, ...(joined && { communityJoinedAt: new Date().toISOString() }) }) },
        ),
      toggleWaitlist: (challengeId) =>
        update((s) => {
          if (!tier.isMember) return s;
          const list = member.challengeWaitlist ?? [];
          return { ...s, members: patchMember(s, { challengeWaitlist: list.includes(challengeId) ? list.filter((id) => id !== challengeId) : [...list, challengeId] }) };
        }),
      logPlunge: (bookingId, seconds) => {
        const b = state.bookings.find((x) => x.id === bookingId);
        if (!b || b.memberId !== member.id || b.serviceId !== "contrast" || b.status !== "booked" || sessionStart(b.date, b.time) > new Date()) {
          return { ok: false, error: "You can log a plunge after a Contrast session you've been to." };
        }
        if ((state.plunges ?? []).some((p) => p.bookingId === bookingId)) return { ok: false, error: "You've already logged this plunge." };
        if (!Number.isFinite(seconds) || seconds < PLUNGE_MIN_SECONDS || seconds > PLUNGE_MAX_SECONDS) {
          return { ok: false, error: "Plunge times count from 0:10 to 5:00." };
        }
        const log: PlungeLog = { id: uid(), memberId: member.id, bookingId, date: b.date, seconds: Math.round(seconds) };
        update((s) => ({ ...s, plunges: [...(s.plunges ?? []), log] }));
        return { ok: true };
      },
      dismissPromos: (ids) => update((s) => ({ ...s, members: patchMember(s, { dismissedPromos: [...new Set([...(member.dismissedPromos ?? []), ...ids])] }) })),
      setLocation: (loc) => update((s) => ({ ...s, members: patchMember(s, { home: loc }) })),
      toggleRsvp: (eventId) =>
        update((s) => {
          const rsvps = member.rsvps ?? [];
          return { ...s, members: patchMember(s, { rsvps: rsvps.includes(eventId) ? rsvps.filter((id) => id !== eventId) : [...rsvps, eventId] }) };
        }),
      finishOnboarding: () => update((s) => ({ ...s, members: patchMember(s, { onboarded: true }) })),
      // Demo sign-up: keeps the name, email and phone on this device. The password is never stored.
      signUp: ({ firstName, lastName, email, phone, instagram, referralCode }) =>
        update((s) => {
          const referrer = referralCode ? findReferrer(referralCode, s.members.filter((m) => m.id !== member.id)) : undefined;
          return {
            ...s,
            members: patchMember(s, { name: `${firstName} ${lastName}`.trim(), email, phone: phone || undefined, instagram, signedUp: true, referredBy: referrer?.id }),
            accounts: [...(s.accounts ?? []), { email, phone: phone ?? "", instagram }],
          };
        }),
      restartAsNewDownload: () =>
        update((s) => ({
          ...s,
          activeMemberId: NEW_DOWNLOAD.id,
          // Rebuilt rather than reset, since a deleted account's slot is gone.
          members: [{ ...NEW_DOWNLOAD }, ...s.members.filter((m) => m.id !== NEW_DOWNLOAD.id)],
          bookings: s.bookings.filter((b) => b.memberId !== NEW_DOWNLOAD.id),
          charges: s.charges.filter((c) => c.memberId !== NEW_DOWNLOAD.id),
          plunges: (s.plunges ?? []).filter((p) => p.memberId !== NEW_DOWNLOAD.id),
        })),
      refresh: () => setState(load()),
      reset: () => setState(settle(seedState())),
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
