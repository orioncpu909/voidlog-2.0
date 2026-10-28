"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { TIERS } from "@/lib/data";
import { useStore } from "@/lib/store";
import { REFUND_WINDOW_DAYS, endOfMonth } from "@/lib/membership";
import { money, shortDate } from "@/lib/format";
import { dateKey } from "@/lib/schedule";
import { PriceList } from "./PriceList";
import { Button, Sheet } from "./Sheet";

// Any member (Restore, Classic, Gold or a trial) can move to a free Wellness Account on their own
// and pay as they go. It follows the same rules as cancelling: within the first 5 days a paid
// membership ends now with a refund; after that it runs to the end of the month; a trial runs to
// its end date and doesn't turn into a membership.
export function SwitchToWellness() {
  const { member, charges, refundWindowOpen, cancelMembership, cancelTrial } = useStore();
  const [open, setOpen] = useState(false);
  const tier = TIERS[member.tier];
  if (!tier.isMember) return null;

  const isTrial = tier.id === "trial";
  const switchDate = isTrial
    ? member.trialEndsAt && dateKey(new Date(member.trialEndsAt))
    : member.membershipEndsAt
      ? dateKey(new Date(member.membershipEndsAt))
      : refundWindowOpen
        ? undefined
        : dateKey(endOfMonth(new Date()));
  const scheduled = isTrial ? member.trialCancel === "downgrade" : !!member.membershipEndsAt;
  const deleting = isTrial && member.trialCancel === "delete";
  const loses = [member.credits > 0 && "treatment credits", tier.monthlyPerks && "monthly perks"].filter(Boolean).join(" and ");
  const refund = [...charges].reverse().find((c) => c.label.includes("membership") && c.amount > 0)?.amount ?? 0;

  const confirm = () => {
    if (isTrial) cancelTrial("downgrade");
    else cancelMembership();
    setOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        disabled={scheduled || deleting}
        className="flex w-full items-center justify-between gap-3 rounded-2xl border border-dashed border-muted bg-card px-4 py-3 text-left hover:border-shell disabled:cursor-default disabled:hover:border-muted"
      >
        <div>
          <p className="font-serif text-xl">Wellness Account</p>
          <p className="text-xs text-muted">
            {deleting
              ? "Your trial is cancelled and the account is set to be deleted."
              : scheduled
                ? `You're switching to pay as you go on ${shortDate(switchDate!)}.`
                : "No monthly fee. Pay as you go at both locations, and stay up to date on future promotions."}
          </p>
        </div>
        {scheduled || deleting ? (
          <span className="shrink-0 rounded-full bg-moss-soft px-2.5 py-0.5 text-xs text-moss">Scheduled</span>
        ) : (
          <span className="flex shrink-0 items-center gap-1 text-sm">
            Free <ChevronRight size={16} className="text-muted" />
          </span>
        )}
      </button>

      <Sheet open={open} onClose={() => setOpen(false)} title="Switch to pay as you go">
        <div className="space-y-4 text-sm">
          <p>
            {isTrial
              ? `Your trial won't turn into a membership and you won't be charged. You keep your trial prices until ${shortDate(switchDate!)}, then you're on a free Wellness Account.`
              : refundWindowOpen
                ? `You're within your first ${REFUND_WINDOW_DAYS} days, so your ${tier.name} membership ends now${refund ? ` and your ${money(refund)} is refunded` : ""}. You'll be on a free Wellness Account right away.`
                : `You won't be charged again. You keep ${tier.name} until ${shortDate(switchDate!)}, then you're on a free Wellness Account.`}
          </p>
          <p className="text-muted">
            No monthly fee: pay for each visit at regular prices or specials, at West LA and Studio City. You&apos;ll also stay up to date on future
            promotions, since Wellness Accounts get every new special. Your calendar, bookings and stats stay.
            {loses && ` Unused ${loses} end with the membership.`}
          </p>
          <div>
            <p className="mb-2 text-xs uppercase tracking-widest text-muted">You&apos;d pay</p>
            <PriceList tier="wellness" location={member.home} />
          </div>
          <div className="space-y-2">
            <Button onClick={confirm}>Switch to Wellness Account</Button>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Keep {tier.name}
            </Button>
          </div>
        </div>
      </Sheet>
    </>
  );
}
