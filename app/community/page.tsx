"use client";

import { useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { Check, ChevronRight, Gift, Lock, Minus, Plus, Snowflake, Timer, Users } from "lucide-react";
import { TIERS } from "@/lib/data";
import { useStore } from "@/lib/store";
import { completedVisits } from "@/lib/stats";
import {
  BoardRow, CHALLENGE_PRIZE_CREDITS, Challenge, METRICS, PLUNGE_MAX_SECONDS, PLUNGE_MIN_SECONDS, PLUNGE_SCORE_CAP, challengeCalendar, challengeName, clock, daysLeft,
  displayName, isEntered, leaderboard, loggableSessions, scoreFor, waitlistCount,
} from "@/lib/community";
import { SHOW_FINISHED_SPRINTS, SHOW_PLUNGE_CHALLENGE } from "@/lib/flags";
import { dayLabel, shortDate } from "@/lib/format";
import { Button, Sheet } from "@/components/Sheet";

// A board is drawn as blocks: one person, or a bracket around everyone tied for 1st, 2nd or 3rd
// (each still on their own row). Ties further down are separate rows sharing a number.
interface BoardBlock {
  rank: number;
  rows: BoardRow[];
}

// The first `limit` people as blocks, cutting a tie bracket short if it runs past the limit.
function boardBlocks(rows: BoardRow[], limit: number): BoardBlock[] {
  const blocks: BoardBlock[] = [];
  for (const r of rows.slice(0, limit)) {
    const last = blocks[blocks.length - 1];
    if (last && r.rank <= 3 && last.rank === r.rank) last.rows.push(r);
    else blocks.push({ rank: r.rank, rows: [r] });
  }
  return blocks;
}

const ordinal = (n: number) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] ?? "th"}`;
const CARD_TOP = 5; // people on a challenge card
const SHEET_TOP = 10; // people in a challenge's details

// Community: friendly challenges and their leaderboards. A row of chips at the top jumps to any
// challenge; what's coming up comes first (with a waitlist to sign up early), then this week's
// sprint and the month's challenges. Members choose whether to show on the boards; Wellness
// Accounts can look but not join. Rules and demo data: lib/community.ts.
export default function CommunityPage() {
  const { member } = useStore();
  const tier = TIERS[member.tier];
  const cal = challengeCalendar();
  const monthly = cal.active.filter((c) => c.kind === "month");
  const weekly = cal.active.filter((c) => c.kind === "week");

  return (
    <div className="space-y-5 pb-4">
      <div className="space-y-2.5">
        <div>
          <h1 className="font-serif text-3xl">Community</h1>
          <p className="text-sm text-muted">
            Friendly challenges each month. No pressure, and first place wins {CHALLENGE_PRIZE_CREDITS} treatment credit.
          </p>
        </div>
        {tier.isMember ? <BoardSwitch /> : <MembersOnly />}
      </div>

      <JumpBar upcoming={cal.upcoming} running={[...weekly, ...monthly]} />

      {/* Every running challenge in one place, compact: tap one for its details and top 10. */}
      <section className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted">Active challenges</h2>
        {[...weekly, ...monthly].map((c) => (
          <ChallengeCard key={c.id} challenge={c} />
        ))}
      </section>

      {SHOW_FINISHED_SPRINTS && cal.ended.length > 0 && <Finished title="Earlier this month" challenges={cal.ended} />}
      {cal.lastMonth.length > 0 && <Finished title="Last month's results" challenges={cal.lastMonth} />}

      <p className="px-2 text-center text-xs text-muted">
        Classes and therapies count once you&apos;ve been to them. Treatments don&apos;t count. Ties for first each win the credit.
      </p>
    </div>
  );
}

// Every challenge as a chip, coming-up ones first. A coming-up chip opens its details and waitlist
// (it gets no card on the page until it starts); a running one scrolls to its card.
function JumpBar({ upcoming, running }: { upcoming: Challenge[]; running: Challenge[] }) {
  const { member } = useStore();
  const [open, setOpen] = useState<Challenge | null>(null);
  const go = (c: Challenge) => document.getElementById(`challenge-${c.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  const upcomingNote = (c: Challenge) =>
    member.challengeWaitlist?.includes(c.id) ? "✓ On the waitlist" : `Starts ${shortDate(c.starts)}`;
  return (
    <>
      <nav aria-label="Challenges" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        {upcoming.map((c) => (
          <button
            key={c.id}
            onClick={() => setOpen(c)}
            className="shrink-0 rounded-2xl border border-sage bg-sage/20 px-3 py-2 text-left active:bg-sage/40"
          >
            <span className="block whitespace-nowrap text-[10px] font-semibold uppercase tracking-widest text-sage-deep">Coming up</span>
            <span className="block whitespace-nowrap text-sm font-medium">{challengeName(c)}</span>
            <span className="block whitespace-nowrap text-[11px] text-muted">{upcomingNote(c)}</span>
          </button>
        ))}
        {running.map((c) => (
          <button key={c.id} onClick={() => go(c)} className="shrink-0 rounded-2xl border border-line bg-card px-3 py-2 text-left active:bg-line">
            <span className="block whitespace-nowrap text-[10px] font-semibold uppercase tracking-widest text-muted">{c.kind === "week" ? "This week" : "This month"}</span>
            <span className="block whitespace-nowrap text-sm font-medium">{c.title}</span>
            <span className="block whitespace-nowrap text-[11px] text-muted">{leftLabel(daysLeft(c))}</span>
          </button>
        ))}
      </nav>
      <Sheet open={!!open} onClose={() => setOpen(null)} title={open ? challengeName(open) : ""}>
        {open && <UpcomingDetails challenge={open} />}
      </Sheet>
    </>
  );
}

const leftLabel = (n: number) => (n === 0 ? "Last day" : `${n} day${n === 1 ? "" : "s"} left`);

// Members: the leaderboards switch, right under the intro: the toggle, then what it does.
// Off by default for new members. The whole row is the tap target.
function BoardSwitch() {
  const { member, joinCommunity } = useStore();
  const joined = !!member.communityJoined;
  return (
    <button onClick={() => joinCommunity(!joined)} role="switch" aria-checked={joined} aria-label="Show me on the leaderboards" className="-mx-1 flex w-[calc(100%+0.5rem)] items-center gap-3 rounded-xl px-1 py-1 text-left active:bg-line">
      <span className={clsx("relative h-7 w-12 shrink-0 rounded-full transition-colors", joined ? "bg-moss" : "bg-line")}>
        <span className={clsx("absolute top-1 h-5 w-5 rounded-full bg-card shadow transition-all", joined ? "left-6" : "left-1")} />
      </span>
      <span className="min-w-0 flex-1 text-sm leading-snug">
        <span className="font-medium">Show me on the leaderboards</span>
        <span className="block text-xs text-muted">
          {joined ? `On: you appear as “${displayName(member)}” in every challenge.` : "Off: nobody sees you, except in challenges you join from a waitlist."}
        </span>
      </span>
    </button>
  );
}

function MembersOnly() {
  return (
    <Link href="/membership" className="-mx-1 flex items-center gap-2 rounded-xl px-1 py-1 text-sm active:bg-line">
      <Lock size={16} className="shrink-0 text-moss" />
      <span className="min-w-0 flex-1">
        <span className="font-medium">Challenges are for members.</span> <span className="text-muted">Look around, or become a member to join in.</span>
      </span>
      <ChevronRight size={16} className="shrink-0 text-muted" />
    </Link>
  );
}

// A challenge's board as you see it.
// - rows: the public board (you're on it only if you're in the challenge).
// - myRank: where you'd be, even with your name hidden.
// - taking: how many people are taking part, counting members who keep their name hidden.
function useBoard(c: Challenge) {
  const { member, bookings, plunges } = useStore();
  const isMember = TIERS[member.tier].isMember;
  const score = scoreFor(c, member.id, bookings, plunges);
  const joined = isEntered(c, member, isMember);
  const counted = isMember && score > 0;
  const full = leaderboard(c, counted ? { name: displayName(member), score } : null);
  const rows = joined ? full : leaderboard(c, null);
  return { score, joined, rows, myRank: full.find((r) => r.you)?.rank, taking: rows.length + (counted && !joined ? 1 : 0) };
}

// Where you stand, in one line.
function Standing({ c, compact = false }: { c: Challenge; compact?: boolean }) {
  const { member } = useStore();
  const { score, joined, myRank, taking } = useBoard(c);
  const unit = METRICS[c.metric].unit;
  const people = `${taking} taking part`;
  if (joined && myRank) return <>You&apos;re <span className="font-semibold">#{myRank}</span> of {taking} with {unit(score)}</>;
  if (myRank) return <>{people} · you&apos;d be <span className="font-semibold">#{myRank}</span> with {unit(score)}{compact ? "" : ". Your name is hidden; turn on the leaderboards to show it."}</>;
  if (!TIERS[member.tier].isMember) return <>{people}{score > 0 ? ` · you have ${unit(score)}` : ""}</>;
  return <>{people} · nothing from you yet{compact ? "" : ". It counts the moment you've been to one."}</>;
}

// Running challenge, compact: name, days left, where you stand and the top 5. Tap for details.
function ChallengeCard({ challenge: c }: { challenge: Challenge }) {
  const [open, setOpen] = useState(false);
  const { rows } = useBoard(c);
  const unit = METRICS[c.metric].unit;
  return (
    <>
      <article
        id={`challenge-${c.id}`}
        role="button"
        tabIndex={0}
        onClick={() => setOpen(true)}
        onKeyDown={(e) => e.key === "Enter" && setOpen(true)}
        aria-label={`${c.title}: details and top ${SHEET_TOP}`}
        className="scroll-mt-16 cursor-pointer rounded-3xl border border-line bg-card p-4 transition-colors active:bg-sand"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted">{c.kind === "week" ? "This week" : "This month"}</p>
            <h3 className="font-serif text-xl leading-tight">{c.title}</h3>
          </div>
          <span className="shrink-0 rounded-full bg-moss-soft px-2.5 py-0.5 text-xs text-moss">{leftLabel(daysLeft(c))}</span>
        </div>
        <p className="mt-2 rounded-xl bg-sand px-3 py-2 text-sm">
          <Standing c={c} compact />
        </p>
        <Board rows={rows} limit={CARD_TOP} unit={unit} />
        <p className="mt-1 flex items-center justify-end gap-0.5 text-sm font-medium text-moss">
          Details & top {SHEET_TOP} <ChevronRight size={16} />
        </p>
      </article>
      <ChallengeSheet challenge={c} open={open} onClose={() => setOpen(false)} />
    </>
  );
}

// A challenge's details: what it is, the prize, where you stand, and the top 10.
function ChallengeSheet({ challenge: c, open, onClose }: { challenge: Challenge; open: boolean; onClose: () => void }) {
  const { member, toggleWaitlist } = useStore();
  const [logging, setLogging] = useState(false);
  const { rows } = useBoard(c);
  const unit = METRICS[c.metric].unit;
  const viaWaitlist = !member.communityJoined && !!member.challengeWaitlist?.includes(c.id);
  return (
    <>
      <Sheet open={open} onClose={onClose} title={c.title}>
        <div className="space-y-3">
          <p className="inline-block rounded-full bg-moss-soft px-2.5 py-0.5 text-xs text-moss">
            {shortDate(c.starts)} – {shortDate(c.ends)} · {leftLabel(daysLeft(c))}
          </p>
          <p className="text-sm">{c.blurb}</p>
          <Prize />
          <p className="rounded-xl bg-sand px-3 py-2 text-sm">
            <Standing c={c} />
          </p>
          {viaWaitlist && (
            <p className="flex items-center gap-2 text-xs text-muted">
              <span className="flex-1">You joined this one from its waitlist, so you show on its board.</span>
              <button onClick={() => toggleWaitlist(c.id)} className="shrink-0 rounded-full border border-line px-3 py-1.5 font-medium text-shell active:bg-line">
                Leave
              </button>
            </p>
          )}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted">Top {SHEET_TOP}</p>
            <Board rows={rows} limit={SHEET_TOP} unit={unit} />
          </div>
          {SHOW_PLUNGE_CHALLENGE && c.metric === "plunge" && TIERS[member.tier].isMember && (
            <Button onClick={() => setLogging(true)}>
              <span className="inline-flex items-center gap-1.5">
                <Timer size={16} /> Log a plunge
              </span>
            </Button>
          )}
          <p className="text-xs text-muted">Classes and therapies count once you&apos;ve been to them. Treatments don&apos;t count. Ties for first each win the credit.</p>
        </div>
      </Sheet>
      {SHOW_PLUNGE_CHALLENGE && c.metric === "plunge" && <PlungeSheet challenge={c} open={logging} onClose={() => setLogging(false)} />}
    </>
  );
}

// The top of a board, plus your own row (after a gap) if you're further down.
function Board({ rows, limit, unit }: { rows: BoardRow[]; limit: number; unit: (n: number) => string }) {
  if (rows.length === 0) return <p className="py-3 text-center text-sm text-muted">No one on the board yet. Be the first.</p>;
  const blocks = boardBlocks(rows, limit);
  const mineIndex = rows.findIndex((r) => r.you);
  return (
    <ol className="mt-2 space-y-1">
      {blocks.map((b) => (
        <Block key={b.rows.map((r) => r.name).join("|")} block={b} unit={unit} />
      ))}
      {mineIndex >= limit && (
        <>
          <li className="py-0.5 text-center text-xs text-muted" aria-hidden>
            ⋯
          </li>
          <Block block={{ rank: rows[mineIndex].rank, rows: [rows[mineIndex]] }} unit={unit} />
        </>
      )}
    </ol>
  );
}

// Plain rank numbers. A tie for 1st, 2nd or 3rd sits in a bracket labeled "Tied for 1st", with
// each person on their own row inside it.
function Block({ block, unit }: { block: BoardBlock; unit: (n: number) => string }) {
  if (block.rows.length === 1) return <Person row={block.rows[0]} unit={unit} />;
  return (
    <li className="rounded-xl border border-sage/60 bg-sage/10 px-2 pb-1 pt-1.5">
      <p className="px-2 text-[10px] font-semibold uppercase tracking-widest text-sage-deep">Tied for {ordinal(block.rank)}</p>
      <ol>
        {block.rows.map((r) => (
          <Person key={r.name + r.you} row={r} unit={unit} />
        ))}
      </ol>
    </li>
  );
}

function Person({ row, unit }: { row: BoardRow; unit: (n: number) => string }) {
  return (
    <li className={clsx("flex items-center gap-3 rounded-lg px-2 py-1.5", row.you && "bg-sage/25")}>
      <span className="stat-num w-6 shrink-0 text-center text-sm font-semibold">{row.rank}</span>
      <span className={clsx("min-w-0 flex-1 truncate text-sm", row.you && "font-semibold")}>
        {row.name}
        {row.you && <span className="font-normal text-muted"> (you)</span>}
      </span>
      <span className="stat-num shrink-0 text-sm">{unit(row.score)}</span>
    </li>
  );
}

// Clocking a plunge: pick a Contrast session you've been to this month that has no time yet, then
// set the time with big +/- buttons (5-second steps) or a quick pick.
function PlungeSheet({ challenge: c, open, onClose }: { challenge: Challenge; open: boolean; onClose: () => void }) {
  const { member, bookings, plunges, logPlunge } = useStore();
  const contrast = completedVisits(bookings).filter((b) => b.memberId === member.id && b.serviceId === "contrast" && b.date >= c.starts && b.date <= c.ends);
  const sessions = loggableSessions(c, member.id, bookings, plunges);
  const [picked, setPicked] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(90);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<number | null>(null);
  const bookingId = picked && sessions.some((s) => s.id === picked) ? picked : sessions[0]?.id;
  const step = (d: number) => setSeconds((s) => Math.min(PLUNGE_MAX_SECONDS, Math.max(PLUNGE_MIN_SECONDS, s + d)));
  const close = () => {
    setError(null);
    setSaved(null);
    onClose();
  };

  return (
    <Sheet open={open} onClose={close} title="Log a cold plunge">
      {saved !== null ? (
        <div className="space-y-4 text-center">
          <Snowflake size={32} className="mx-auto text-moss" />
          <p className="font-serif text-2xl">{clock(saved)} logged</p>
          <p className="text-sm text-muted">Nice work. Warm up slowly.</p>
          <Button onClick={close}>Done</Button>
        </div>
      ) : sessions.length === 0 ? (
        <div className="space-y-4 text-sm">
          <p>
            {contrast.length
              ? "You've logged a time for every Contrast session you've been to this month."
              : "Plunge times come from Contrast (sauna + plunge) sessions. You haven't been to one this month yet."}
          </p>
          <p className="text-muted">Book a Contrast session, then log your plunge here afterwards.</p>
          <Link href="/book?category=therapy&service=contrast" onClick={close} className="block rounded-full bg-sage py-3 text-center text-sm font-semibold text-ink">
            Book Contrast
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-muted">Which session</p>
            <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
              {sessions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setPicked(s.id)}
                  className={clsx("shrink-0 rounded-xl border px-3 py-2 text-left text-sm", s.id === bookingId ? "border-shell bg-sage/25" : "border-line bg-card")}
                >
                  <span className="block font-medium">{dayLabel(s.date)}</span>
                  <span className="block text-xs text-muted">{shortDate(s.date)} · Contrast</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-muted">Time in the plunge</p>
            <div className="flex items-center justify-between gap-3">
              <button onClick={() => step(-5)} aria-label="5 seconds less" className="flex h-14 w-14 items-center justify-center rounded-full border border-line bg-card active:bg-line">
                <Minus size={22} />
              </button>
              <span className="stat-num text-5xl" aria-live="polite">
                {clock(seconds)}
              </span>
              <button onClick={() => step(5)} aria-label="5 seconds more" className="flex h-14 w-14 items-center justify-center rounded-full border border-line bg-card active:bg-line">
                <Plus size={22} />
              </button>
            </div>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {[30, 60, 120, 180].map((s) => (
                <button
                  key={s}
                  onClick={() => setSeconds(s)}
                  className={clsx("rounded-xl border py-2 text-sm", seconds === s ? "border-shell bg-sage/25 font-medium" : "border-line bg-card")}
                >
                  {clock(s)}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted">
              The board counts up to {clock(PLUNGE_SCORE_CAP)}, so there&apos;s nothing to gain by staying in longer. Get out whenever you&apos;re ready.
            </p>
          </div>

          {error && <p className="rounded-2xl bg-clay-soft px-4 py-3 text-sm text-clay">{error}</p>}
          <Button
            onClick={() => {
              if (!bookingId) return;
              const r = logPlunge(bookingId, seconds);
              if (r.ok) setSaved(seconds);
              else setError(r.error);
            }}
          >
            Log {clock(seconds)}
          </Button>
        </div>
      )}
    </Sheet>
  );
}

// Earlier this month: each finished sprint's winner and where you ended up.
function Finished({ title, challenges }: { title: string; challenges: Challenge[] }) {
  return (
    <section className="space-y-2">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-muted">{title}</h2>
      <div className="divide-y divide-line rounded-3xl border border-line bg-card">
        {challenges.map((c) => (
          <FinishedRow key={c.id} challenge={c} />
        ))}
      </div>
    </section>
  );
}

function FinishedRow({ challenge: c }: { challenge: Challenge }) {
  const { rows } = useBoard(c);
  const unit = METRICS[c.metric].unit;
  const winners = rows.filter((r) => r.rank === 1);
  const mine = rows.find((r) => r.you);
  return (
    <div className="px-4 py-3">
      <p className="flex items-baseline justify-between gap-2">
        <span className="font-medium">{challengeName(c)}</span>
        <span className="shrink-0 text-xs text-muted">
          {shortDate(c.starts)} – {shortDate(c.ends)}
        </span>
      </p>
      <p className="text-sm text-muted">
        {winners.length ? `1st: ${winners.map((w) => (w.you ? "You" : w.name)).join(", ")} · ${unit(winners[0].score)}` : "No entries"}
        {mine && mine.rank > 1 ? ` · you were #${mine.rank}` : ""}
      </p>
    </div>
  );
}

function Prize() {
  return (
    <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-moss">
      <Gift size={14} /> First place wins {CHALLENGE_PRIZE_CREDITS} treatment credit
    </p>
  );
}

// What a coming-up challenge is, opened from its chip, with its waitlist. Signing up enters you in
// that challenge (ranked on its board) even if the leaderboards switch is off; with the switch on
// you're already in every challenge, so it just says so.
function UpcomingDetails({ challenge: c }: { challenge: Challenge }) {
  const { member, toggleWaitlist } = useStore();
  const isMember = TIERS[member.tier].isMember;
  const on = !!member.challengeWaitlist?.includes(c.id);
  const count = waitlistCount(c) + (on ? 1 : 0);
  return (
    <div className="space-y-3">
      <p className="inline-block rounded-full bg-sage px-2.5 py-0.5 text-xs font-medium text-ink">
        {shortDate(c.starts)} – {shortDate(c.ends)}
      </p>
      <p className="text-sm">{c.blurb}</p>
      <Prize />
      <p className="text-xs text-muted">Classes and therapies count once you&apos;ve been to them. Ties for first each win the credit.</p>
      <p className="flex items-center gap-1.5 text-xs text-muted">
        <Users size={14} /> {count} on the waitlist
      </p>
      {isMember && member.communityJoined ? (
        <p className="flex items-center justify-center gap-1.5 rounded-full bg-moss-soft py-3 text-sm font-medium text-moss">
          <Check size={16} /> You&apos;re in: your leaderboards switch is on
        </p>
      ) : !isMember ? (
        <Link href="/membership" className="flex items-center justify-center gap-1.5 rounded-full border border-dashed border-line py-3 text-sm text-muted active:bg-line">
          <Lock size={14} /> Members can join
        </Link>
      ) : on ? (
        <div className="flex items-center gap-2">
          <p className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-moss-soft py-3 text-sm font-medium text-moss">
            <Check size={16} /> You&apos;re on the waitlist
          </p>
          <button onClick={() => toggleWaitlist(c.id)} className="shrink-0 rounded-full px-4 py-3 text-sm text-muted active:bg-line">
            Leave
          </button>
        </div>
      ) : (
        <Button onClick={() => toggleWaitlist(c.id)}>Join the waitlist</Button>
      )}
    </div>
  );
}
