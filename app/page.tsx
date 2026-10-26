"use client";

import { Ticket } from "lucide-react";
import { TIERS } from "@/lib/data";
import { useStore } from "@/lib/store";
import { EventsSection } from "@/components/EventsSection";
import { HomeAlerts } from "@/components/HomeAlerts";
import { HomeCalendar } from "@/components/HomeCalendar";
import { StreakCard } from "@/components/StreakCard";

// Home fits on one phone screen: your streak, this month's calendar, and events. Account
// alerts (trial, cancelled membership, notices, specials) show as slim rows only when they apply.
// Booking lives in the Book tab.
export default function HomePage() {
  const { member } = useStore();
  const tier = TIERS[member.tier];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    // Exactly one screen tall: the header (53px), top padding (12px) and tab-bar space (80px)
    // take 145px. The calendar stretches or shrinks to fill whatever room is left.
    <div className="flex h-[calc(100dvh-145px)] min-h-[560px] flex-col gap-2.5">
      <div className="flex shrink-0 items-end justify-between gap-3">
        <h1 className="font-serif text-3xl leading-none">
          <span className="block font-sans text-xs text-muted">{greeting},</span>
          {member.name.split(" ")[0]}
        </h1>
        <div className="flex flex-col items-end gap-1 text-[11px]">
          <span className="rounded-full bg-moss-soft px-2.5 py-0.5 text-moss">{tier.name}</span>
          {member.credits > 0 && (
            <span className="flex items-center gap-1 text-clay">
              <Ticket size={11} /> {member.credits} credits
            </span>
          )}
        </div>
      </div>
      <HomeAlerts />
      <StreakCard />
      <HomeCalendar />
      <EventsSection />
    </div>
  );
}
