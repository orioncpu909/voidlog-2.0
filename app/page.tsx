"use client";

import Link from "next/link";
import { BadgeCheck, Ticket } from "lucide-react";
import { TIERS } from "@/lib/data";
import { useStore } from "@/lib/store";
import { EventsSection } from "@/components/EventsSection";
import { CreditsInfoButton } from "@/components/CreditsInfo";
import { HomeAlerts } from "@/components/HomeAlerts";
import { NextUpCard } from "@/components/NextUpCard";
import { RateLastClass } from "@/components/RateClass";
import { StreakCard } from "@/components/StreakCard";

// Home leads with what's next: how many bookings are coming up and the next one, with Check in.
// Then the rating question, account alerts and specials (slim rows, only when they apply), the
// streak (members only) and events. The full list, month view and history are on the Bookings tab;
// booking lives in the Book tab.
export default function HomePage() {
  const { member } = useStore();
  const tier = TIERS[member.tier];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex shrink-0 items-end justify-between gap-3">
        <h1 className="min-w-0 truncate font-heading text-4xl leading-none text-muted">
          <span className="block font-sans text-sm">{greeting},</span>
          {member.name.split(" ")[0]}
        </h1>
        <div className="flex flex-col items-end gap-1">
          <Link
            href="/membership"
            className="-mr-3 flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold active:opacity-60"
          >
            <BadgeCheck size={16} />
            {tier.isMember && tier.id !== "trial" ? `${tier.name} Member` : tier.name}
          </Link>
          {member.credits > 0 && (
            <CreditsInfoButton className="-mr-3 px-3 py-0.5 text-xs hover:no-underline active:opacity-60">
              <Ticket size={12} /> {member.credits} credits
            </CreditsInfoButton>
          )}
        </div>
      </div>
      <NextUpCard />
      <RateLastClass />
      <HomeAlerts />
      <StreakCard picked={null} />
      <EventsSection />
    </div>
  );
}
