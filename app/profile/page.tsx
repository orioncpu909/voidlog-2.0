"use client";

import { useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import {
  ArrowLeft, Bath, Check, ChevronDown, ChevronRight, ChevronUp, Copy, Dumbbell, Flame, HandHeart, Lock, MapPin, Medal, Moon,
  Music, Repeat, Share2, Snowflake, Sparkles, Sun, Sunrise, ThermometerSun, Ticket, Timer, Trophy, UserRound, Waves, Wind, Zap,
} from "lucide-react";
import { LOCATIONS, PERK_LABEL, ServiceId, TIERS } from "@/lib/data";
import { dateKey, sessionStart } from "@/lib/schedule";
import { useStore } from "@/lib/store";
import { completedVisits, computeStats } from "@/lib/stats";
import { AchievementId, PERIODS, Period, computeAchievements, computeHighlights, visitLevel } from "@/lib/profile";
import { timeLabel } from "@/lib/format";
import { REFERRAL_CREDITS, referralLink } from "@/lib/referral";

type Icon = typeof Flame;

const SERVICE_ICON: Record<ServiceId, Icon> = {
  class: Dumbbell,
  cryo: Snowflake,
  "ir-sauna": Flame,
  "red-light": Sun,
  contrast: ThermometerSun,
  float: Waves,
  hbot: Wind,
  massage: HandHeart,
  "em-sculpt": Zap,
  "cryo-facial": Sparkles,
  "thermal-shock": ThermometerSun,
  endermologie: HandHeart,
  event: Ticket,
};

const ACHIEVEMENT_ICON: Record<AchievementId, Icon> = {
  cold: Snowflake,
  heat: Flame,
  contrast: ThermometerSun,
  float: Waves,
  glow: Sun,
  oxygen: Wind,
  bodywork: HandHeart,
  early: Sunrise,
  night: Moon,
  heated: Bath,
  sound: Music,
  double: Repeat,
  week: Trophy,
  explorer: MapPin,
};

const monthYear = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", year: "numeric" });

// Profile, opened from the avatar at the top of every tab. Everyone sees who they are, their visit
// streak and an activity summary. Members (Trial, Restore, Classic, Gold) also get their level,
// credits or perks, achievements and data highlights; Wellness accounts see what a membership adds.
export default function ProfilePage() {
  const { member, bookings } = useStore();
  const tier = TIERS[member.tier];
  const s = computeStats(bookings);
  const done = completedVisits(bookings);
  const first = done.reduce<string | undefined>((min, b) => (!min || b.date < min ? b.date : min), undefined);
  const location = LOCATIONS[member.home];

  const since = [
    member.tier === "trial" && member.trialEndsAt
      ? `Trial ends ${new Date(member.trialEndsAt).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}`
      : member.memberSince && `${tier.name} member since ${monthYear(member.memberSince)}`,
    first && `Visiting since ${monthYear(sessionStart(first, "12:00").toISOString())}`,
  ].filter(Boolean);

  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-center justify-between">
        <Link href="/" aria-label="Back to Home" className="-ml-2 rounded-full p-2 hover:bg-card">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xs font-semibold uppercase tracking-[0.25em]">Profile</h1>
        <span className="rounded-md border border-line bg-card px-2 py-0.5 text-[11px] font-semibold uppercase tracking-widest text-moss">
          {tier.isMember && tier.id !== "trial" ? tier.name : tier.id === "trial" ? "Trial" : "Wellness"}
        </span>
      </div>

      <section>
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-shell font-serif text-3xl text-sage">
          {member.name.slice(0, 1).toUpperCase()}
        </span>
        <h2 className="mt-3 font-serif text-3xl leading-tight">{member.name}</h2>
        <p className="text-sm text-muted">
          {member.instagram ? `@${member.instagram} · ` : ""}
          {location.short} studio
        </p>
        {since.length > 0 && <p className="mt-2 rounded-xl border border-line bg-card px-3 py-2 text-xs text-muted">{since.join(" · ")}</p>}
      </section>

      {tier.isMember ? <MemberTiles visits={s.visits} /> : <BasicTiles visits={s.visits} minutes={s.minutes} />}

      <Link href="/stats?from=profile" className="flex items-center justify-between rounded-2xl border border-line bg-card px-4 py-3 hover:border-muted">
        <span className="text-xs font-semibold uppercase tracking-widest">Day streak</span>
        <span className="flex items-center gap-1.5">
          <Flame size={18} className="text-sage-light" />
          <span className="stat-num">
            {s.currentStreak} day{s.currentStreak === 1 ? "" : "s"}
          </span>
          <span className="text-xs text-muted">· best {s.longestStreak}</span>
          <ChevronRight size={16} className="text-muted" />
        </span>
      </Link>

      {s.visits === 0 ? (
        <div className="rounded-3xl border border-dashed border-line p-6 text-center text-sm text-muted">
          <p>Your activity shows up here after your first visit.</p>
          <Link href="/book" className="mt-3 inline-block rounded-full bg-sage px-5 py-2 text-ink">
            Book a visit
          </Link>
        </div>
      ) : (
        <>
          {tier.isMember && <Achievements />}
          {tier.isMember && <DataHighlights />}
          <ActivitySummary />
          {!tier.isMember && <MembersSee />}
        </>
      )}

      <ReferralCard />
    </div>
  );
}

function Tile({ icon: Icon, title, value, detail }: { icon: Icon; title: string; value: string; detail: string }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-line bg-card px-3 py-3 text-center">
      <Icon size={26} className="text-moss" strokeWidth={1.6} />
      <p className="stat-num mt-1.5 text-2xl leading-none">{value}</p>
      <p className="mt-1 text-[11px] font-semibold uppercase tracking-widest">{title}</p>
      <p className="text-xs text-muted">{detail}</p>
    </div>
  );
}

function BasicTiles({ visits, minutes }: { visits: number; minutes: number }) {
  return (
    <section className="grid grid-cols-2 gap-2">
      <Tile icon={Medal} title="Visits" value={String(visits)} detail="all time" />
      <Tile icon={Timer} title="Hours" value={String(Math.round(minutes / 60))} detail="at ARTHA" />
    </section>
  );
}

// Members: their visit level, and what's left on the membership (credits, perks or trial days).
function MemberTiles({ visits }: { visits: number }) {
  const { member, perksLeft } = useStore();
  const tier = TIERS[member.tier];
  const { level, next } = visitLevel(visits);
  const today = dateKey(new Date());

  let right: { icon: Icon; title: string; value: string; detail: string };
  if (tier.monthlyPerks) {
    const perks = Object.keys(tier.monthlyPerks) as ServiceId[];
    const left = perks.filter((id) => perksLeft(id, today) > 0);
    right = {
      icon: Sparkles,
      title: "Perks left",
      value: `${left.length} of ${perks.length}`,
      detail: left.length ? left.map((id) => PERK_LABEL[id]).join(", ") : "Back on the 1st",
    };
  } else if (tier.id === "trial" && member.trialEndsAt) {
    const days = Math.max(0, Math.ceil((new Date(member.trialEndsAt).getTime() - Date.now()) / 864e5));
    right = { icon: Timer, title: "Trial", value: `${days} day${days === 1 ? "" : "s"}`, detail: "left to try it all" };
  } else {
    right = {
      icon: Ticket,
      title: "Credits",
      value: String(member.credits),
      detail: tier.monthlyCredits ? `+${tier.monthlyCredits} every month` : "for treatments & HBOT",
    };
  }

  return (
    <section className="grid grid-cols-2 gap-2">
      <Tile icon={Medal} title={`Level ${level}`} value={String(visits)} detail={next ? `visits · next level at ${next}` : "visits"} />
      <Tile {...right} />
    </section>
  );
}

function Achievements() {
  const { member, bookings } = useStore();
  const list = computeAchievements(bookings, member.home);
  const earned = list.filter((a) => a.count > 0).length;
  return (
    <section>
      <h2 className="font-serif text-2xl">
        Achievements <span className="text-muted">({earned})</span>
      </h2>
      <div className="no-scrollbar -mx-4 mt-1 flex gap-3 overflow-x-auto px-4 pb-1 pt-1">
        {list.map((a) => {
          const Icon = ACHIEVEMENT_ICON[a.id];
          const got = a.count > 0;
          return (
            <div key={a.id} className={clsx("w-[84px] shrink-0 text-center", !got && "opacity-45")}>
              <span
                className={clsx(
                  "mx-auto flex h-16 w-16 items-center justify-center rounded-full",
                  got ? "bg-shell text-sage ring-2 ring-sage ring-offset-2 ring-offset-sand" : "border border-dashed border-muted text-muted",
                )}
              >
                {got ? <Icon size={26} strokeWidth={1.6} /> : <Lock size={20} />}
              </span>
              <p className="stat-num mt-1.5 text-xl leading-none">{a.count}</p>
              <p className="mt-0.5 text-xs font-medium leading-tight">{a.name}</p>
              <p className="text-[10px] leading-tight text-muted">{a.detail}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function PeriodToggle({ value, onChange }: { value: Period; onChange: (p: Period) => void }) {
  return (
    <div className="grid grid-cols-3 rounded-xl bg-sand p-1" role="tablist">
      {PERIODS.map((p) => (
        <button
          key={p.id}
          role="tab"
          aria-selected={value === p.id}
          onClick={() => onChange(p.id)}
          className={clsx("rounded-lg py-1.5 text-xs font-semibold uppercase tracking-widest", value === p.id ? "bg-card text-shell shadow-sm" : "text-muted")}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

function Ring({ value, label, text }: { value: number; label: string; text: string }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <div className="flex flex-col items-center">
      <div className="relative h-20 w-20">
      <svg viewBox="0 0 80 80" className="h-20 w-20 -rotate-90" aria-hidden>
        <circle cx="40" cy="40" r={r} fill="none" strokeWidth="6" className="stroke-line" />
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          className="stroke-moss"
          strokeDasharray={`${Math.max(0.001, Math.min(1, value)) * c} ${c}`}
        />
      </svg>
      <p className="stat-num absolute inset-0 flex items-center justify-center text-lg">{text}</p>
      </div>
      <p className="mt-1.5 text-center text-xs font-medium leading-tight">{label}</p>
    </div>
  );
}

// Members: how consistent the period was, best runs, and personal records.
function DataHighlights() {
  const { member, bookings } = useStore();
  const [period, setPeriod] = useState<Period>("all");
  const h = computeHighlights(bookings, period);
  const pct = (x: number) => `${Math.round(x * 100)}%`;
  const plural = (n: number, one: string) => `${n} ${one}${n === 1 ? "" : "s"}`;

  const records: { icon: Icon; label: string; sub?: string; value: string }[] = [
    h.earliest && { icon: Sunrise, label: "Earliest visit", value: timeLabel(h.earliest.time) },
    h.latest && { icon: Moon, label: "Latest visit", value: timeLabel(h.latest.time) },
    h.favoriteClass && { icon: Sparkles, label: "Favorite class", sub: h.favoriteClass.title.replace(/ \((All Levels|Int|Beg)\)$/, ""), value: `${h.favoriteClass.count}×` },
    h.favoriteInstructor && { icon: UserRound, label: "Most booked with", sub: h.favoriteInstructor.name, value: `${h.favoriteInstructor.count}×` },
    member.tier !== "trial" && h.creditsUsed > 0 && { icon: Ticket, label: "Credits used", value: String(h.creditsUsed) },
    h.perksUsed > 0 && { icon: Sparkles, label: "Perks used", value: String(h.perksUsed) },
  ].filter((r): r is { icon: Icon; label: string; sub?: string; value: string } => !!r);

  return (
    <section>
      <h2 className="font-serif text-2xl">Data highlights</h2>
      <div className="mt-2 rounded-3xl border border-line bg-card p-4">
        <PeriodToggle value={period} onChange={setPeriod} />
        {h.visits === 0 ? (
          <p className="py-6 text-center text-sm text-muted">No visits in this period.</p>
        ) : (
          <>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <Ring value={h.consistency} text={pct(h.consistency)} label="Days you came in" />
              <Ring value={h.bestWeek / 7} text={`${h.bestWeek}/7`} label="Best week" />
              <Ring value={h.recovery} text={pct(h.recovery)} label="Days with recovery" />
            </div>
            <p className="mt-4 border-t border-line pt-3 text-[11px] font-semibold uppercase tracking-widest text-muted">Streaks</p>
            <div className="mt-2 grid grid-cols-3 gap-2 text-center">
              {[
                { icon: Flame, value: plural(h.longestStreak, "day"), label: "Longest streak" },
                { icon: Repeat, value: plural(h.mostInDay, "visit"), label: "Most in a day" },
                { icon: Trophy, value: plural(h.doubleDays, "day"), label: "2+ visit days" },
              ].map(({ icon: Icon, value, label }) => (
                <div key={label}>
                  <Icon size={20} className="mx-auto text-moss" strokeWidth={1.6} />
                  <p className="stat-num mt-1 text-base leading-tight">{value}</p>
                  <p className="text-[11px] text-muted">{label}</p>
                </div>
              ))}
            </div>
            <ul className="mt-3 divide-y divide-line border-t border-line">
              {records.map(({ icon: Icon, label, sub, value }) => (
                <li key={label} className="flex items-center gap-3 py-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-moss-soft text-moss">
                    <Icon size={16} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm">{label}</span>
                    {sub && <span className="block truncate text-xs text-muted">{sub}</span>}
                  </span>
                  <span className="stat-num shrink-0 text-base">{value}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </section>
  );
}

const ACTIVITY_PREVIEW = 5;

// Everyone: visits by service for the period, most-visited first, with time spent.
function ActivitySummary() {
  const { bookings } = useStore();
  const [period, setPeriod] = useState<Period>("all");
  const [all, setAll] = useState(false);
  const h = computeHighlights(bookings, period);
  const max = Math.max(1, ...h.activity.map((a) => a.count));
  const rows = all ? h.activity : h.activity.slice(0, ACTIVITY_PREVIEW);

  return (
    <section>
      <h2 className="font-serif text-2xl">Activity summary</h2>
      <div className="mt-2 rounded-3xl border border-line bg-card p-4">
        <PeriodToggle value={period} onChange={setPeriod} />
        <p className="stat-num mt-4 text-3xl leading-none">{h.visits}×</p>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">Total visits</p>
        {h.visits === 0 ? (
          <p className="py-4 text-center text-sm text-muted">No visits in this period.</p>
        ) : (
          <>
            <div className="mt-3 flex justify-between text-[11px] font-semibold uppercase tracking-widest text-muted">
              <span>Service · time</span>
              <span>Total</span>
            </div>
            <ul className="divide-y divide-line">
              {rows.map((a) => {
                const Icon = SERVICE_ICON[a.serviceId];
                const time = a.minutes >= 60 ? `${Math.round((a.minutes / 60) * 10) / 10} hr` : `${a.minutes} min`;
                return (
                  <li key={a.serviceId} className="py-2.5">
                    <div className="flex items-center gap-2">
                      <Icon size={16} className="shrink-0 text-moss" />
                      <span className="truncate text-xs font-semibold uppercase tracking-wider">{a.label}</span>
                      <span className="shrink-0 text-xs text-muted">{time}</span>
                      <span className="stat-num ml-auto shrink-0 text-base text-moss">{a.count}×</span>
                    </div>
                    <div className="mt-1.5 h-2 rounded-full bg-sand">
                      <div className="h-2 rounded-full bg-moss" style={{ width: `${Math.max(2, (a.count / max) * 100)}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
            {h.activity.length > ACTIVITY_PREVIEW && (
              <button onClick={() => setAll(!all)} className="mt-2 flex w-full items-center justify-center gap-1 rounded-xl bg-sand py-2 text-xs font-semibold uppercase tracking-widest">
                {all ? (
                  <>
                    <ChevronUp size={14} /> Show less
                  </>
                ) : (
                  <>
                    <ChevronDown size={14} /> Show all {h.activity.length}
                  </>
                )}
              </button>
            )}
          </>
        )}
      </div>
    </section>
  );
}

// Wellness accounts: what a membership adds to this page.
function MembersSee() {
  return (
    <Link href="/membership" className="flex items-center gap-3 rounded-3xl border border-dashed border-line bg-card px-4 py-3 hover:border-muted">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-moss-soft text-moss">
        <Lock size={18} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">Members see more</span>
        <span className="block text-xs text-muted">Levels, achievements and data highlights.</span>
      </span>
      <ChevronRight size={18} className="shrink-0 text-muted" />
    </Link>
  );
}

// Everyone: a personal referral link to send friends (share sheet or copy), the reward, and how
// each friend who used it is doing. The rules live in lib/referral.ts.
function ReferralCard() {
  const { member, members } = useStore();
  const [copied, setCopied] = useState(false);
  const link = referralLink(member);
  const tier = TIERS[member.tier];
  const earns = tier.isMember && tier.id !== "trial";
  const friends = members.filter((m) => m.referredBy === member.id);
  const credited = friends.filter((f) => f.referralResult === "credited").length;
  const copy = async () => {
    let ok = false;
    try {
      await navigator.clipboard.writeText(link);
      ok = true;
    } catch {
      // Older phone browsers: copy through a hidden text field instead.
      const field = document.createElement("textarea");
      field.value = link;
      field.setAttribute("readonly", "");
      field.style.cssText = "position:fixed;opacity:0";
      document.body.appendChild(field);
      field.select();
      ok = document.execCommand("copy");
      field.remove();
    }
    if (!ok) return; // Still blocked: the link is on screen to copy by hand.
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: "ARTHA", text: "Join me at ARTHA. Sign up with my link:", url: link });
      else await copy();
    } catch {
      // Closing the share sheet isn't an error worth showing.
    }
  };
  return (
    <section className="rounded-3xl border border-line bg-card p-4">
      <p className="font-serif text-xl">Refer a friend</p>
      <p className="mt-0.5 text-sm text-muted">
        {earns
          ? `Get ${REFERRAL_CREDITS} treatment credit for every friend who signs up with your link and becomes a member. It's added automatically once their first monthly payment goes through.`
          : "Send your link to friends. Members get a treatment credit for every friend who joins with it."}
      </p>
      <button
        onClick={copy}
        aria-label="Copy your referral link"
        className="mt-3 flex w-full items-center gap-2 rounded-2xl border border-line bg-sand px-3 py-2.5 text-left active:bg-line"
      >
        <span className="min-w-0 flex-1 truncate text-sm">{link.replace("https://", "")}</span>
        <span className="flex shrink-0 items-center gap-1 text-sm font-medium text-moss">
          {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? "Copied" : "Copy"}
        </span>
      </button>
      <button onClick={share} className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-sage py-3 text-sm font-semibold text-ink active:opacity-80">
        <Share2 size={16} /> Share my link
      </button>
      {friends.length > 0 && (
        <div className="mt-3 border-t border-line pt-2.5">
          <p className="flex justify-between text-xs">
            <span className="font-semibold uppercase tracking-widest text-muted">Your referrals</span>
            <span className="text-moss">
              {credited} credit{credited === 1 ? "" : "s"} earned
            </span>
          </p>
          <ul className="mt-1.5 space-y-1 text-sm">
            {friends.map((f) => (
              <li key={f.id} className="flex items-center justify-between gap-2">
                <span className="truncate">{f.name}</span>
                <span className={clsx("shrink-0 text-xs", f.referralResult === "credited" ? "text-moss" : "text-muted")}>
                  {f.referralResult === "credited"
                    ? `Member · +${REFERRAL_CREDITS} credit`
                    : f.referralResult === "not-member"
                      ? "Member · joined before you were a member"
                      : TIERS[f.tier].id === "trial"
                        ? "On a trial · credit after first month"
                        : "Signed up · not a member yet"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
