"use client";

import Link from "next/link";
import { ArrowRight, Ticket } from "lucide-react";
import { LOCATIONS, TIERS } from "@/lib/data";
import { sessionStart } from "@/lib/schedule";
import { useStore } from "@/lib/store";
import { dayLabel, money, timeRange } from "@/lib/format";
import { CategoryTiles } from "@/components/CategoryTiles";
import { EventsSection } from "@/components/EventsSection";
import { LocationBar } from "@/components/LocationBar";
import { PromoBanner } from "@/components/PromoBanner";
import { NoticeBanner, TrialCard } from "@/components/TrialCard";
import { MembershipCard } from "@/components/MembershipCard";
import { StreakCard } from "@/components/StreakCard";

export default function HomePage() {
  const { member, bookings, spentThisMonth } = useStore();
  const tier = TIERS[member.tier];
  const location = LOCATIONS[member.home];
  const now = Date.now();

  const upcoming = bookings
    .filter((b) => b.status === "booked" && sessionStart(b.date, b.time).getTime() > now)
    .sort((a, b) => sessionStart(a.date, a.time).getTime() - sessionStart(b.date, b.time).getTime());
  const next = upcoming[0];
  const classic = TIERS.classic;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <div>
          <p className="text-sm text-muted">{greeting},</p>
          <h1 className="font-serif text-4xl">{member.name.split(" ")[0]}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full bg-moss-soft px-2.5 py-0.5 text-moss">{tier.name}</span>
            {member.credits > 0 && (
              <span className="flex items-center gap-1 text-clay">
                <Ticket size={12} /> {member.credits} treatment credits
              </span>
            )}
          </div>
        </div>
        <NoticeBanner />
        <TrialCard />
        <MembershipCard statusOnly />
        <PromoBanner />
        <StreakCard />
      </section>

      <EventsSection />

      <section className="space-y-3">
        <h2 className="font-serif text-2xl">Book at {location.short}</h2>
        <LocationBar showHint />
        <CategoryTiles />
      </section>

      {next && (
        <section className="rounded-3xl border border-line bg-shell p-5">
          <p className="text-xs uppercase tracking-widest text-muted">Next booking</p>
          <p className="mt-2 font-serif text-2xl leading-tight">{next.title}</p>
          <p className="text-sm text-muted">
            {dayLabel(next.date, "long")} · {timeRange(next.time, next.durationMin)} · {LOCATIONS[next.location].short}
          </p>
          <Link href="/calendar" className="mt-3 inline-flex items-center gap-1 text-sm text-moss underline-offset-4 hover:underline">
            {upcoming.length > 1 ? `See all ${upcoming.length} bookings` : "Manage booking"} <ArrowRight size={14} />
          </Link>
        </section>
      )}

      {!tier.isMember && spentThisMonth > 0 && (
        <Link href="/membership" className="block rounded-3xl border border-line bg-shell p-5">
          <p className="text-sm text-muted">You&apos;ve spent {money(spentThisMonth)} this month.</p>
          <p className="mt-1 font-serif text-xl leading-tight">Classic is {money(classic.monthly!)}/month with every class and cryo included.</p>
          <p className="mt-2 text-sm text-moss">Compare memberships →</p>
        </Link>
      )}

      <p className="text-center text-xs text-muted">
        {location.address} ·{" "}
        <a href={`tel:${location.phone.replace(/\./g, "")}`} className="underline-offset-2 hover:underline">
          {location.phone}
        </a>
      </p>
    </div>
  );
}
