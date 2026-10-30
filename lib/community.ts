// Community: friendly, opt-in challenges for members, preset for every month. Three run all month
// (most classes, most therapies, best cold plunge) and a short themed sprint runs each week.
// Treatments never count. Members can join a challenge's waitlist before it starts, and whoever
// finishes first (ties included) gets CHALLENGE_PRIZE_CREDITS treatment credit. Nothing extreme: a plunge scores at most 3:00, so everyone who reaches
// 3:00 shares first place and nobody gains by staying in longer. No prizes, and members choose
// whether to show on the boards.
// CONFIRM: the challenge list, any real prizes, and how real members' names show. The other people
// on the boards are made-up demo members (not from any real records), whose numbers come from a
// seeded generator so they're the same on every reload.
import { SERVICES } from "./data";
import { SHOW_PLUNGE_CHALLENGE } from "./flags";
import { dateKey, sessionStart } from "./schedule";
import { completedVisits } from "./stats";
import type { Booking, Member, PlungeLog } from "./store";

export const CHALLENGE_PRIZE_CREDITS = 1; // for each challenge won (CONFIRM)
// How far ahead "Coming up" looks, so next month's challenges can be waitlisted near month end.
const COMING_UP_DAYS = 7;

export const PLUNGE_MIN_SECONDS = 10;
export const PLUNGE_MAX_SECONDS = 300; // 5:00, the longest time that can be logged
export const PLUNGE_SCORE_CAP = 180; // 3:00, the most a plunge scores (CONFIRM with ARTHA's staff)
// How long a session stays loggable after it, even into the next month (late-night plunges).
const PLUNGE_GRACE_DAYS = 2;

export type ChallengeMetric = "classes" | "therapies" | "plunge" | "early" | "stillness" | "hotcold" | "weekend";

export interface Challenge {
  id: string; // unique per month and window, e.g. "2026-10-classes"
  metric: ChallengeMetric;
  title: string;
  blurb: string;
  starts: string; // YYYY-MM-DD, first day counted
  ends: string; // YYYY-MM-DD, last day counted
  kind: "month" | "week";
}

interface MetricInfo {
  title: string;
  blurb: string;
  unit: (n: number) => string; // how a score reads, e.g. "12 classes", "2:45"
  range: [number, number]; // what demo members reach over the whole window
}

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
export const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

const STILLNESS = /Sound Bath|Yin|Restorative|Breath/;
const HOT_COLD = new Set(["ir-sauna", "cryo", "contrast"]);

export const METRICS: Record<ChallengeMetric, MetricInfo> = {
  classes: { title: "Class Count", blurb: "Most classes this month, at either studio.", unit: (n) => plural(n, "class", "classes"), range: [4, 28] },
  therapies: {
    title: "Recovery Ritual",
    blurb: "Most therapies this month: cryo, sauna, red light, contrast, float and HBOT. Treatments don't count.",
    unit: (n) => plural(n, "therapy", "therapies"),
    range: [2, 22],
  },
  plunge: {
    title: "Cold Plunge Clock",
    blurb: "Your best cold plunge this month, logged after a Contrast session. Times count up to 3:00, so everyone who gets there shares first place.",
    unit: clock,
    range: [50, 210],
  },
  early: { title: "Early Riser Week", blurb: "Most classes that start before 8 AM this week.", unit: (n) => plural(n, "early class", "early classes"), range: [0, 4] },
  stillness: { title: "Stillness Week", blurb: "Most sound bath, yin, restorative and breathwork classes this week.", unit: (n) => plural(n, "class", "classes"), range: [0, 4] },
  hotcold: { title: "Hot & Cold Week", blurb: "Most sauna, cryo and contrast sessions this week.", unit: (n) => plural(n, "session"), range: [1, 7] },
  weekend: { title: "Weekend Warrior Week", blurb: "Most classes and therapies on Saturday and Sunday.", unit: (n) => plural(n, "visit"), range: [1, 5] },
};

// Each month's weekly sprints, in order: days 1–7, 8–14, 15–21 and 22 to the end of the month.
const WEEKLY: ChallengeMetric[] = ["early", "stillness", "hotcold", "weekend"];
const MONTHLY: ChallengeMetric[] = SHOW_PLUNGE_CHALLENGE ? ["classes", "therapies", "plunge"] : ["classes", "therapies"];

const day = (y: number, m: number, d: number) => dateKey(new Date(y, m, d));

// m may run past December (e.g. "next month" in December); the date rolls into the next year.
export function challengesForMonth(year: number, month: number): Challenge[] {
  const first = new Date(year, month, 1);
  const y = first.getFullYear();
  const m = first.getMonth();
  const last = new Date(y, m + 1, 0).getDate();
  const ym = `${y}-${String(m + 1).padStart(2, "0")}`;
  const make = (metric: ChallengeMetric, starts: string, ends: string, kind: Challenge["kind"]): Challenge => ({
    id: `${ym}-${metric}`,
    metric,
    title: METRICS[metric].title,
    blurb: METRICS[metric].blurb,
    starts,
    ends,
    kind,
  });
  return [
    ...MONTHLY.map((metric) => make(metric, day(y, m, 1), day(y, m, last), "month")),
    ...WEEKLY.map((metric, i) => make(metric, day(y, m, 1 + i * 7), day(y, m, i === 3 ? last : 7 + i * 7), "week")),
  ];
}

// This month's challenges sorted into running, finished and (this month or next) coming up.
export function challengeCalendar(now = new Date()) {
  const today = dateKey(now);
  const all = challengesForMonth(now.getFullYear(), now.getMonth());
  const next = challengesForMonth(now.getFullYear(), now.getMonth() + 1);
  const prev = challengesForMonth(now.getFullYear(), now.getMonth() - 1);
  return {
    active: all.filter((c) => c.starts <= today && today <= c.ends),
    ended: all.filter((c) => c.ends < today),
    upcoming: [...all, ...next].filter((c) => c.starts > today && c.starts <= dateKey(new Date(now.getTime() + COMING_UP_DAYS * 864e5))),
    nextMonthStarts: next[0].starts,
    // For the first week of a month, last month's challenges that ended on its last day (the three
    // monthly ones and the final sprint), so their final results don't vanish at midnight.
    lastMonth: now.getDate() <= 7 ? prev.filter((c) => c.ends === prev[0].ends) : [],
  };
}

// Contrast sessions a plunge time can still be logged for: done, not yet logged, and in this
// challenge's window or the last couple of days (a late Contrast on the 31st can be logged on the 1st).
export function loggableSessions(c: Challenge, memberId: string, bookings: Booking[], plunges: PlungeLog[], now = new Date()): Booking[] {
  const grace = dateKey(new Date(now.getTime() - PLUNGE_GRACE_DAYS * 864e5));
  return completedVisits(bookings, now)
    .filter((b) => b.memberId === memberId && b.serviceId === "contrast" && ((b.date >= c.starts && b.date <= c.ends) || b.date >= grace))
    .filter((b) => !plunges.some((p) => p.bookingId === b.id))
    .sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time));
}

export function daysLeft(c: Challenge, now = new Date()): number {
  return Math.round((sessionStart(c.ends, "12:00").getTime() - sessionStart(dateKey(now), "12:00").getTime()) / 864e5);
}

// A member's score: counts completed classes and therapies in the window (treatments never count),
// or for the plunge, their best logged time.
export function scoreFor(c: Challenge, memberId: string, bookings: Booking[], plunges: PlungeLog[], now = new Date()): number {
  if (c.metric === "plunge") {
    return Math.max(0, ...plunges.filter((p) => p.memberId === memberId && p.date >= c.starts && p.date <= c.ends).map((p) => Math.min(p.seconds, PLUNGE_SCORE_CAP)));
  }
  const visits = completedVisits(bookings, now).filter((b) => b.memberId === memberId && b.date >= c.starts && b.date <= c.ends);
  const isClass = (b: Booking) => b.serviceId === "class";
  const isTherapy = (b: Booking) => SERVICES[b.serviceId].category === "therapy";
  const count = (f: (b: Booking) => boolean) => visits.filter(f).length;
  switch (c.metric) {
    case "classes":
      return count(isClass);
    case "therapies":
      return count(isTherapy);
    case "early":
      return count((b) => isClass(b) && b.time < "08:00");
    case "stillness":
      return count((b) => isClass(b) && STILLNESS.test(b.title));
    case "hotcold":
      return count((b) => HOT_COLD.has(b.serviceId));
    case "weekend":
      return count((b) => (isClass(b) || isTherapy(b)) && [0, 6].includes(sessionStart(b.date, "12:00").getDay()));
  }
}

// Made-up demo members on the boards.
const DEMO_MEMBERS = [
  "Maya R.", "Jordan T.", "Priya S.", "Diego M.", "Sofia L.", "Noah K.", "Ava C.",
  "Liam B.", "Zoe H.", "Marcus W.", "Elena V.", "Kai N.", "Chloe D.", "Ethan P.",
];

function seeded(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

export interface BoardRow {
  rank: number; // ties share a rank (1, 2, 2, 4)
  name: string;
  score: number;
  you: boolean;
}

// Demo members' scores grow as the window goes on, so a board early in the month is small.
function demoScores(c: Challenge, now: Date): { name: string; score: number }[] {
  const start = sessionStart(c.starts, "00:00").getTime();
  const end = sessionStart(c.ends, "23:59").getTime();
  const progress = Math.min(1, Math.max(0, (now.getTime() - start) / (end - start)));
  const [lo, hi] = METRICS[c.metric].range;
  return DEMO_MEMBERS.flatMap((name) => {
    const rand = seeded(`${c.id}|${name}`);
    if (rand() < 0.2) return []; // not everyone takes part in every challenge
    const full = lo + rand() * (hi - lo);
    // Plunge: people join the board as the month goes on (a best time doesn't grow from zero),
    // in steps of 5 seconds and never above the 3:00 cap.
    if (c.metric === "plunge" && rand() > progress * 1.4) return [];
    const score =
      c.metric === "plunge"
        ? Math.min(PLUNGE_SCORE_CAP, Math.round((full * (0.75 + 0.25 * progress)) / 5) * 5)
        : Math.round(full * progress);
    return score > 0 ? [{ name, score }] : [];
  });
}

export function displayName(m: Pick<Member, "name">): string {
  const [first, ...rest] = m.name.trim().split(/\s+/);
  const last = rest.pop();
  return last ? `${first} ${last[0].toUpperCase()}.` : first;
}

// The board: demo members plus you (if you've joined and have a score), best first.
export function leaderboard(c: Challenge, you: { name: string; score: number } | null, now = new Date()): BoardRow[] {
  const rows = [...demoScores(c, now).map((r) => ({ ...r, you: false })), ...(you && you.score > 0 ? [{ ...you, you: true }] : [])];
  rows.sort((a, b) => b.score - a.score || Number(b.you) - Number(a.you) || a.name.localeCompare(b.name));
  let rank = 0;
  return rows.map((r, i) => {
    if (i === 0 || r.score !== rows[i - 1].score) rank = i + 1;
    return { ...r, rank };
  });
}

// Whether a member is in a challenge: the one rule for the boards, the results and the prize.
// - Members only, and only for challenges that ended after their membership started (so time on
//   a Wellness Account never counts).
// - In by the leaderboards switch if it was on by the challenge's last day, or by its waitlist.
export function isEntered(
  c: Challenge,
  m: Pick<Member, "communityJoined" | "communityJoinedAt" | "challengeWaitlist" | "memberSince">,
  isMember: boolean,
): boolean {
  if (!isMember) return false;
  if (m.memberSince && dateKey(new Date(m.memberSince)) > c.ends) return false;
  const bySwitch = !!m.communityJoined && (!m.communityJoinedAt || dateKey(new Date(m.communityJoinedAt)) <= c.ends);
  return bySwitch || !!m.challengeWaitlist?.includes(c.id);
}

// Finished challenges a member could have won: last month's and this month's that have ended.
export function endedChallenges(now = new Date()): Challenge[] {
  const today = dateKey(now);
  return [...challengesForMonth(now.getFullYear(), now.getMonth() - 1), ...challengesForMonth(now.getFullYear(), now.getMonth())].filter((c) => c.ends < today);
}

// Demo signups on a waitlist, so it doesn't look empty: the same number on every reload.
export function waitlistCount(c: Challenge): number {
  return 6 + Math.floor(seeded(`waitlist|${c.id}`)() * 18);
}

// A challenge's name with its month when that matters: "October's Class Count" for a month-long
// one (two months' can be on screen together), the plain title for a weekly sprint.
export function challengeName(c: Challenge): string {
  if (c.kind === "week") return c.title;
  return `${sessionStart(c.starts, "12:00").toLocaleDateString("en-US", { month: "long" })}'s ${c.title}`;
}
