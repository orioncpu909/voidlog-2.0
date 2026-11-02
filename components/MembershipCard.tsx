"use client";

import { useState } from "react";
import { TIERS } from "@/lib/data";
import { useStore } from "@/lib/store";
import { REFUND_WINDOW_DAYS } from "@/lib/membership";
import { shortDate } from "@/lib/format";
import { dateKey } from "@/lib/schedule";
import { Button, Sheet } from "./Sheet";

// Shown once a cancellation is scheduled, so members always see when their access ends. Refund
// terms stay out of the way until someone cancels: they're in the member agreement.
export function MembershipCard() {
  const { member, keepMembership } = useStore();
  const tier = TIERS[member.tier];
  if (!tier.isMember || tier.id === "trial" || !member.membershipEndsAt) return null;

  const ends = new Date(member.membershipEndsAt);
  return (
    <section className="rounded-3xl border border-line bg-card p-4">
      <p className="text-xs uppercase tracking-widest text-muted">Membership cancelled</p>
      <p className="mt-1 font-heading text-2xl leading-tight">Active until {shortDate(dateKey(ends))}</p>
      <p className="mt-1 text-sm text-shell">
        You won&apos;t be charged again. You keep full {tier.name} access, prices and your calendar until then. After that you&apos;ll be on a free Wellness Account.
      </p>
      <button onClick={keepMembership} className="mt-3 text-sm text-moss underline-offset-2 hover:underline">
        Changed your mind? Keep my membership
      </button>
    </section>
  );
}

// At the bottom of the Account tab, once there's a paid membership to cancel.
export function CancelMembership() {
  const { member, refundWindowOpen, refundLostToUse, cancelMembership } = useStore();
  const [confirming, setConfirming] = useState(false);
  const tier = TIERS[member.tier];
  if (!tier.isMember || tier.id === "trial" || member.membershipEndsAt) return null;

  const now = new Date();
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  return (
    <>
      <button
        onClick={() => setConfirming(true)}
        className="w-full rounded-full py-2 text-sm font-medium bg-sage text-ink active:bg-sage-light"
      >
        Cancel membership
      </button>

      <Sheet open={confirming} onClose={() => setConfirming(false)} title="Cancel your membership?">
        <div className="space-y-4 text-sm">
          {refundWindowOpen ? (
            <p>
              You&apos;re within your first {REFUND_WINDOW_DAYS} days, so you&apos;ll get a <span className="font-medium">full refund</span> and your membership ends now. You&apos;ll move to a free Wellness Account, and your calendar and bookings stay.
            </p>
          ) : (
            <p>
              You won&apos;t be charged again. {refundLostToUse ? "You've already used your membership" : `It's past your first ${REFUND_WINDOW_DAYS} days`}, so this month isn&apos;t refunded, but you{" "}
              <span className="font-medium">keep full access until {shortDate(dateKey(monthEnd))}</span>. Your calendar and bookings stay active.
            </p>
          )}
          <div className="space-y-2">
            <Button
              variant="danger"
              onClick={() => {
                cancelMembership();
                setConfirming(false);
              }}
            >
              {refundWindowOpen ? "Cancel and refund" : "Cancel membership"}
            </Button>
            <Button variant="secondary" onClick={() => setConfirming(false)}>
              Keep my membership
            </Button>
          </div>
        </div>
      </Sheet>
    </>
  );
}
