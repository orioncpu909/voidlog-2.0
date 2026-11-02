// Community: friendly, opt-in challenges for members, preset for every month. Three run all month
// (most classes, most therapies, best cold plunge) and a short themed sprint runs each week.
// Treatments never count. Members can join a challenge's waitlist before it starts, and whoever
// finishes first gets CHALLENGE_PRIZE_CREDITS treatment credit. If first place ends in a tie, the
// tied people race: the first to finish one more visit that counts wins it (runTieBreak).
// Nothing extreme: a plunge scores at most 3:00, so everyone who reaches 3:00 shares first place
// and nobody gains by staying in longer. Members choose whether to show on the boards.
// CONFIRM: the challenge list, any real prizes, and how real members' names show. The other people
// on the boards are made-up demo members (not from any real records), whose numbers come from a
// seeded generator so they're the same on every reload.
import { SERVICES } from "./data";
import { SHOW_PLUNGE_CHALLENGE } from "./flags";
import { dateKey, sessionStart } from "./schedule";
import { completedVisits } from "./stats";
import type { Booking, Member, PlungeLog } from "./store";

export const CHALLENGE_PRIZE_CREDITS = 1; // for each challenge won (CONFIRM)
export const TIE_BREAK_DAYS = 7; // how long after a challenge a tie for first stays open (CONFIRM)
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
  visit: string; // what breaks a tie, after "another": "early class"
  book: string; // where to book one
}

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
export const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

const STILLNESS = /Sound Bath|Yin|Restorative|Breath/;
const HOT_COLD = new Set(["ir-sauna", "cryo", "contrast"]);

export const METRICS: Record<ChallengeMetric, MetricInfo> = {
  classes: { title: "Class Count", blurb: "Most classes this month, at either studio.", unit: (n) => plural(n, "class", "classes"), range: [4, 28], visit: "class", book: "/book?category=class" },
  therapies: {
    title: "Recovery Ritual",
    blurb: "Most therapies this month: cryo, sauna, red light, contrast, float and HBOT. Treatments don't count.",
    unit: (n) => plural(n, "therapy", "therapies"),
    range: [2, 22],
    visit: "therapy",
    book: "/book?category=therapy",
  },
  plunge: {
    title: "Cold Plunge Clock",
    blurb: "Your best cold plunge this month, logged after a Contrast session. Times count up to 3:00, so everyone who gets there shares first place.",
    unit: clock,
    range: [50, 210],
    visit: "Contrast session",
    book: "/book?category=therapy&service=contrast",
  },
  early: { title: "Early Riser Week", blurb: "Most classes that start before 8 AM this week.", unit: (n) => plural(n, "early class", "early classes"), range: [0, 4], visit: "early class", book: "/book?category=class" },
  stillness: { title: "Stillness Week", blurb: "Most sound bath, yin, restorative and breathwork classes this week.", unit: (n) => plural(n, "class", "classes"), range: [0, 4], visit: "sound bath, yin, restorative or breathwork class", book: "/book?category=class" },
  hotcold: { title: "Hot & Cold Week", blurb: "Most sauna, cryo and contrast sessions this week.", unit: (n) => plural(n, "session"), range: [1, 7], visit: "sauna, cryo or contrast session", book: "/book?category=therapy" },
  weekend: { title: "Weekend Warrior Week", blurb: "Most classes and therapies on Saturday and Sunday.", unit: (n) => plural(n, "visit"), range: [1, 5], visit: "weekend class or therapy", book: "/book" },
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

export function daysLeft(c: Pick<Challenge, "ends">, now = new Date()): number {
  return Math.round((sessionStart(c.ends, "12:00").getTime() - sessionStart(dateKey(now), "12:00").getTime()) / 864e5);
}

// Whether a visit counts toward a challenge. Treatments never do.
function counts(c: Challenge, b: Booking): boolean {
  const isClass = b.serviceId === "class";
  const isTherapy = SERVICES[b.serviceId].category === "therapy";
  switch (c.metric) {
    case "classes":
      return isClass;
    case "therapies":
      return isTherapy;
    case "plunge":
      return b.serviceId === "contrast";
    case "early":
      return isClass && b.time < "08:00";
    case "stillness":
      return isClass && STILLNESS.test(b.title);
    case "hotcold":
      return HOT_COLD.has(b.serviceId);
    case "weekend":
      return (isClass || isTherapy) && [0, 6].includes(sessionStart(b.date, "12:00").getDay());
  }
}

// A member's score: counts completed classes and therapies in the window, or for the plunge, their
// best logged time.
export function scoreFor(c: Challenge, memberId: string, bookings: Booking[], plunges: PlungeLog[], now = new Date()): number {
  if (c.metric === "plunge") {
    return Math.max(0, ...plunges.filter((p) => p.memberId === memberId && p.date >= c.starts && p.date <= c.ends).map((p) => Math.min(p.seconds, PLUNGE_SCORE_CAP)));
  }
  return completedVisits(bookings, now).filter((b) => b.memberId === memberId && b.date >= c.starts && b.date <= c.ends && counts(c, b)).length;
}

// ARTHA's real size across both studios, so the demo feels like the real thing.
export const MEMBER_COUNT = 1000;
export const WELLNESS_COUNT = 3000;
export const WEEKLY_SIGNUPS = 35;
const BOARD_MEMBERS = 340; // about a third of members opt in (CONFIRM)
const TAKE_PART_SHARE = 0.45; // of those, how many are in any one challenge
const SCORE_CACHE_MS = 600000; // boards are only recalculated every 10 minutes

// Made-up demo members on the boards, built from these names (not from any real records).
const FIRST_NAMES = [
  "Maya", "Jordan", "Priya", "Diego", "Sofia", "Noah", "Ava", "Liam", "Zoe", "Marcus", "Elena", "Kai", "Chloe", "Ethan", "Nina",
  "Mateo", "Isla", "Owen", "Leah", "Andre", "Tara", "Felix", "Rosa", "Theo", "Amara", "Julian", "Sana", "Hugo", "Mila", "Ravi",
  "Clara", "Dante", "Naomi", "Oscar", "Lena", "Caleb", "Ines", "Micah", "Tessa", "Jonah", "Alma", "Reid", "Yara", "Simon", "Dana",
  "Paolo", "Greta", "Omar", "Celia", "Tomas", "Nora", "Elias", "Bianca", "Luca", "Hana", "Silas", "Vera", "Arjun", "June", "Rafael",
];
const DEMO_MEMBERS = Array.from({ length: BOARD_MEMBERS }, (_, i) => `${FIRST_NAMES[i % FIRST_NAMES.length]} ${"ABCDEFGHIJKLMNOPRSTVWY"[(i * 7) % 22]}.`);

// New Wellness Accounts this week: around the weekly average, the same all week.
export function signupsThisWeek(now = new Date()): number {
  const week = Math.floor(now.getTime() / (7 * 864e5));
  return WEEKLY_SIGNUPS - 6 + Math.floor(seeded(`signups|${week}`)() * 13);
}

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

// Demo members' scores grow as the window goes on, so a board early in the month is small. Most
// people cluster low and a few go hard, like a real gym.
const scoreCache = new Map<string, { name: string; score: number }[]>();
function demoScores(c: Challenge, now: Date): { name: string; score: number }[] {
  const key = `${c.id}|${Math.floor(now.getTime() / SCORE_CACHE_MS)}`;
  const cached = scoreCache.get(key);
  if (cached) return cached;
  const start = sessionStart(c.starts, "00:00").getTime();
  const end = sessionStart(c.ends, "23:59").getTime();
  const progress = Math.min(1, Math.max(0, (now.getTime() - start) / (end - start)));
  const [lo, hi] = METRICS[c.metric].range;
  const scores = DEMO_MEMBERS.flatMap((name) => {
    const rand = seeded(`${c.id}|${name}`);
    if (rand() > TAKE_PART_SHARE) return [];
    const full = lo + rand() ** 2.5 * (hi - lo);
    // Plunge: people join the board as the month goes on (a best time doesn't grow from zero),
    // in steps of 5 seconds and never above the 3:00 cap.
    if (c.metric === "plunge" && rand() > progress * 1.4) return [];
    const score =
      c.metric === "plunge"
        ? Math.min(PLUNGE_SCORE_CAP, Math.round((full * (0.75 + 0.25 * progress)) / 5) * 5)
        : Math.round(full * progress);
    return score > 0 ? [{ name, score }] : [];
  });
  scoreCache.set(key, scores);
  return scores;
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

// All time: every visit on an account since its first booking, across every service and every
// plan it has been on. It never resets. A demo member's numbers grow steadily from a made-up first
// visit, so they're the same on every reload and only ever go up.
export interface AllTimeStats {
  visits: number;
  hours: number;
  firstVisit: string | null; // YYYY-MM-DD
  classes: number;
  therapies: number;
  treatments: number;
  events: number;
  services: { name: string; count: number }[]; // most visited first
}

const AVERAGE_VISIT_MIN = 50; // for a demo member's hours

export function allTimeStats(bookings: Booking[], now = new Date()): AllTimeStats {
  const visits = completedVisits(bookings, now);
  const count = (category: string) => visits.filter((b) => SERVICES[b.serviceId].category === category).length;
  const byService = new Map<string, number>();
  for (const b of visits) {
    const name = b.serviceId === "class" ? "Classes" : b.serviceId === "event" ? "Events" : SERVICES[b.serviceId].name;
    byService.set(name, (byService.get(name) ?? 0) + 1);
  }
  return {
    visits: visits.length,
    hours: Math.round(visits.reduce((sum, b) => sum + b.durationMin, 0) / 6) / 10,
    firstVisit: visits.map((b) => b.date).sort()[0] ?? null,
    classes: count("class"),
    therapies: count("therapy"),
    treatments: count("treatment"),
    events: count("event"),
    services: [...byService].map(([name, n]) => ({ name, count: n })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
  };
}

export function demoAllTimeStats(name: string, now = new Date()): AllTimeStats {
  const rand = seeded(`all-time|${name}`);
  const first = new Date(2024, 0, 1 + Math.floor(rand() * 900));
  const perDay = 0.04 + rand() ** 2.2 * 0.7;
  const visits = Math.max(1, Math.floor(perDay * Math.max(1, (now.getTime() - first.getTime()) / 864e5)));
  const treatments = Math.floor(visits * (0.03 + rand() * 0.07));
  const classes = Math.floor((visits - treatments) * (0.45 + rand() * 0.3));
  const therapies = visits - treatments - classes;
  const split = (category: string, total: number) => {
    const ids = Object.values(SERVICES).filter((s) => s.category === category);
    const weights = ids.map(() => rand() ** 2 + 0.05);
    const sum = weights.reduce((a, b) => a + b, 0);
    const counts = weights.map((w) => Math.floor((total * w) / sum));
    counts[0] += total - counts.reduce((a, b) => a + b, 0); // what rounding left over
    return ids.map((s, i) => ({ name: s.name, count: counts[i] }));
  };
  return {
    visits,
    hours: Math.round((visits * AVERAGE_VISIT_MIN) / 6) / 10,
    firstVisit: dateKey(first),
    classes,
    therapies,
    treatments,
    events: 0,
    services: [{ name: "Classes", count: classes }, ...split("therapy", therapies), ...split("treatment", treatments)]
      .filter((s) => s.count > 0)
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
  };
}

// Ranked the same way as a challenge board: ties share a number.
let allTimeCache: { key: number; rows: { name: string; score: number; you: boolean }[] } | undefined;
export function allTimeBoard(you: { name: string; score: number } | null, now = new Date()): BoardRow[] {
  const key = Math.floor(now.getTime() / SCORE_CACHE_MS);
  if (allTimeCache?.key !== key) allTimeCache = { key, rows: DEMO_MEMBERS.map((name) => ({ name, score: demoAllTimeStats(name, now).visits, you: false })) };
  const rows = [...allTimeCache.rows, ...(you && you.score > 0 ? [{ ...you, you: true }] : [])];
  rows.sort((a, b) => b.score - a.score || Number(b.you) - Number(a.you) || a.name.localeCompare(b.name));
  let rank = 0;
  return rows.map((r, i) => {
    if (i === 0 || r.score !== rows[i - 1].score) rank = i + 1;
    return { ...r, rank };
  });
}

// The tie breaker. When a challenge ends with first place tied, the first of the tied people to
// finish one more visit that counts wins the credit, alone. Nobody else can win it, a visit must
// start after the challenge ended, and the front desk's check-in is what proves it happened. It
// closes after TIE_BREAK_DAYS; if none of them finished one by then, nobody wins.
// The result is saved once, when the challenge ends (Member.challengeResults), so who's tied never
// changes afterwards: hiding or a trial converting doesn't drop anyone.
export interface ChallengeResult {
  score: number; // the top score
  tied: { name: string; id?: string }[]; // everyone on it; only one means there was no tie
  winner?: { name: string; id?: string };
  closed: boolean; // final: there's a winner, or the tie breaker ran out
}

export const tieBreakEnds = (c: Challenge) => dateKey(new Date(sessionStart(c.ends, "12:00").getTime() + TIE_BREAK_DAYS * 864e5));

// First place when a challenge ends. No score above zero means no result.
export function firstPlace(c: Challenge, you: { id: string; name: string; score: number }[], now = new Date()): ChallengeResult | null {
  const board: { name: string; score: number; id?: string }[] = [...demoScores(c, now), ...you];
  const score = Math.max(0, ...board.map((r) => r.score));
  if (score === 0) return null;
  const tied = board.filter((r) => r.score === score).map(({ name, id }) => ({ name, id }));
  return tied.length === 1 ? { score, tied, winner: tied[0], closed: true } : { score, tied, closed: false };
}

// When a real member finished their tie-breaking visit, if they have.
function tieBreakFinish(c: Challenge, id: string, bookings: Booking[], now: Date): number | undefined {
  const finishes = bookings
    .filter((b) => b.memberId === id && b.status === "booked" && !!b.checkedInAt && b.date > c.ends && b.date <= tieBreakEnds(c) && counts(c, b))
    .map((b) => sessionStart(b.date, b.time).getTime() + b.durationMin * 60000)
    .filter((t) => t <= now.getTime());
  return finishes.length ? Math.min(...finishes) : undefined;
}

// A demo member's next visit after the challenge: 18 hours to about 6 days later, the same on every
// reload. They're always in time, so a tie with a demo member is always decided.
function demoTieBreakFinish(c: Challenge, name: string): number {
  return sessionStart(c.ends, "23:59").getTime() + (18 + seeded(`tie|${c.id}|${name}`)() * 132) * 36e5;
}

// The result so far, the same object if nothing changed. canWin: an account can only take the
// credit while it's still a member.
export function runTieBreak(c: Challenge, result: ChallengeResult, bookings: Booking[], canWin: boolean, now = new Date()): ChallengeResult {
  if (result.closed) return result;
  const finishes = result.tied.flatMap((r) => {
    if (r.id && !canWin) return [];
    const at = r.id ? tieBreakFinish(c, r.id, bookings, now) : demoTieBreakFinish(c, r.name);
    return at !== undefined && at <= now.getTime() ? [{ ...r, at }] : [];
  });
  finishes.sort((a, b) => a.at - b.at || Number(!!b.id) - Number(!!a.id) || a.name.localeCompare(b.name));
  if (finishes[0]) return { ...result, winner: { name: finishes[0].name, id: finishes[0].id }, closed: true };
  return dateKey(now) > tieBreakEnds(c) ? { ...result, closed: true } : result;
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
  return 40 + Math.floor(seeded(`waitlist|${c.id}`)() * 110);
}

// A challenge's name with its month when that matters: "October's Class Count" for a month-long
// one (two months' can be on screen together), the plain title for a weekly sprint.
export function challengeName(c: Challenge): string {
  if (c.kind === "week") return c.title;
  return `${sessionStart(c.starts, "12:00").toLocaleDateString("en-US", { month: "long" })}'s ${c.title}`;
}
