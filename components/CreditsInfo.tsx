"use client";

import { useState, type ReactNode } from "react";
import clsx from "clsx";
import { Info } from "lucide-react";
import { LOCATIONS, LocationId, SERVICES, TIERS } from "@/lib/data";
import { canUseCredit } from "@/lib/policy";
import { useStore } from "@/lib/store";
import { money } from "@/lib/format";
import { Sheet } from "./Sheet";

// "What do credits cover?": opens a short explainer. A treatment credit covers one session of
// anything members pay $125 for (every treatment, plus HBOT), listed per studio from the same rule
// the booking flow uses (canUseCredit).
export function CreditsInfoButton({ children, className }: { children?: ReactNode; className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={clsx("inline-flex items-center gap-1 text-moss underline-offset-2 hover:underline", className)}>
        {children ?? (
          <>
            <Info size={14} /> What credits cover
          </>
        )}
      </button>
      <CreditsInfoSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
}

function CreditsInfoSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { member } = useStore();
  const tier = TIERS[member.tier];
  // Treatments first, then HBOT.
  const covered = (loc: LocationId) =>
    Object.values(SERVICES)
      .filter((s) => canUseCredit(s.id) && s.locations.includes(loc))
      .sort((a, b) => Number(a.category !== "treatment") - Number(b.category !== "treatment"));
  const memberPrice = TIERS.classic.prices.treatment;

  return (
    <Sheet open={open} onClose={onClose} title="Treatment credits">
      <div className="space-y-4 text-sm">
        <p>
          One credit covers one session of anything members pay <span className="font-medium">{money(memberPrice)}</span> for: every treatment, plus
          Hyperbaric Oxygen.
        </p>

        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line">
          {(Object.keys(LOCATIONS) as LocationId[]).map((loc) => (
            <div key={loc} className="bg-card px-3 py-2.5">
              <p className="text-xs uppercase tracking-widest text-muted">{LOCATIONS[loc].short}</p>
              <ul className="mt-1 space-y-0.5">
                {covered(loc).map((s) => (
                  <li key={s.id}>{s.name}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <ul className="space-y-2 text-muted">
          <li>
            <span className="text-shell">Getting credits:</span> {tier.isMember ? `${tier.welcomeCredits} when you join` : "members get welcome credits when they join"}
            {tier.isMember && tier.monthlyCredits > 0 ? `, plus ${tier.monthlyCredits} every month with ${tier.name}` : ""}.
            {tier.monthlyPerks ? ` ${tier.name}'s monthly massage is a separate perk.` : ""}
          </li>
          <li>
            <span className="text-shell">Using one:</span> book a covered service and the credit is applied for you, so you pay $0. Untick it to pay the
            member price instead.
          </li>
          <li>
            <span className="text-shell">Cancelling:</span> cancel in time and the credit comes back. A late cancel or no-show uses it up.
          </li>
          <li>
            <span className="text-shell">Not covered:</span> classes and therapies. They&apos;re included with your membership or at your member price.
          </li>
        </ul>

        {tier.isMember ? (
          <p className="rounded-2xl bg-moss-soft p-3 text-moss">
            You have <span className="font-medium">{member.credits}</span> credit{member.credits === 1 ? "" : "s"}.
          </p>
        ) : (
          <p className="rounded-2xl bg-sand p-3 text-muted">Credits come with a membership. With a Wellness Account you pay per visit.</p>
        )}
      </div>
    </Sheet>
  );
}
