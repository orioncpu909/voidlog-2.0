"use client";

import { LOCATIONS, TIERS } from "@/lib/data";
import { nextBill } from "@/lib/billing";
import { cardShortLabel } from "@/lib/card";
import { GUEST_PASSES_PER_MONTH } from "@/lib/guest";
import { useStore } from "@/lib/store";
import { PriceList } from "@/components/PriceList";
import { Sheet } from "@/components/Sheet";

// What's on the account: opened from the plan badge on Profile.
export function PlanSheet({ onClose }: { onClose: () => void }) {
  const { member } = useStore();
  const tier = TIERS[member.tier];
  const bill = nextBill(member);
  const extras = [
    tier.monthly && `${GUEST_PASSES_PER_MONTH} guest passes a month`,
    tier.lockedToHome && `Classes at both locations · therapies and treatments at ${LOCATIONS[member.home].short}`,
  ].filter(Boolean);
  return (
    <Sheet open onClose={onClose} title={tier.name}>
      <div className="space-y-4 text-sm">
        <div className="rounded-2xl bg-sand p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">Next billed</p>
          <p className="stat-num mt-1 text-2xl">{bill.headline}</p>
          <p className="mt-1">{bill.detail}</p>
          {tier.monthly && !member.membershipEndsAt && member.card && <p className="mt-1 text-muted">Charged to your {cardShortLabel(member.card)}</p>}
        </div>
        <div className="space-y-2">
          <h3 className="text-lg leading-tight">What&apos;s included</h3>
          <p>{tier.summary}</p>
          {extras.length > 0 && (
            <ul className="list-disc space-y-1 pl-4">
              {extras.map((e) => (
                <li key={String(e)}>{e}</li>
              ))}
            </ul>
          )}
          <PriceList tier={member.tier} location={member.home} />
        </div>
      </div>
    </Sheet>
  );
}
