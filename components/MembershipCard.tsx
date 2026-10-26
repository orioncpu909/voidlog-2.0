"use client";

import { useState } from "react";
import { CalendarCheck } from "lucide-react";
import { TIERS } from "@/lib/data";
import { useStore } from "@/lib/store";
import { REFUND_WINDOW_DAYS, refundWindowEnds } from "@/lib/membership";
import { momentLabel, money, shortDate } from "@/lib/format";
import { dateKey } from "@/lib/schedule";
import { Button, Sheet } from "./Sheet";

// Paid membership status and the Cancel button. On Home it only appears once a cancellation is
// scheduled, so members always see when their access ends.
export function MembershipCard({ statusOnly = false }: { statusOnly?: boolean }) {
  const { member, refundWindowOpen, cancelMembership, keepMembership } = useStore();
  const [confirming, setConfirming] = useState(false);
  const tier = TIERS[member.tier];
  if (!tier.isMember || tier.id === "trial") return null;

  if (member.membershipEndsAt) {
    const ends = new Date(member.membershipEndsAt);
    return (
      <section className="rounded-3xl border border-line bg-shell p-5">
        <p className="text-xs uppercase tracking-widest text-muted">Membership cancelled</p>
        <p className="mt-1 font-serif text-2xl leading-tight">Active until {shortDate(dateKey(ends))}</p>
        <p className="mt-1 text-sm text-ink/80">
          You won&apos;t be charged again. You keep full {tier.name} access, prices and your calendar until then. After that you&apos;ll be on a free Wellness Account.
        </p>
        <button onClick={keepMembership} className="mt-3 text-sm text-moss underline-offset-2 hover:underline">
          Changed your mind? Keep my membership
        </button>
      </section>
    );
  }
  if (statusOnly) return null;

  const now = new Date();
  const renews = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  return (
    <section className="rounded-3xl border border-line bg-shell p-5">
      <div className="flex items-start gap-3">
        <CalendarCheck size={20} className="mt-1 shrink-0 text-moss" />
        <div className="text-sm">
          <p className="font-medium">
            {tier.name} · {money(tier.monthly!)}/month
          </p>
          <p className="text-muted">
            {member.memberSince && `Member since ${shortDate(dateKey(new Date(member.memberSince)))} · `}Renews {shortDate(dateKey(renews))}
          </p>
          {refundWindowOpen && member.memberSince && (
            <p className="mt-2 text-sage-deep">
              You&apos;re in your first {REFUND_WINDOW_DAYS} days. Cancel before {momentLabel(refundWindowEnds(member.memberSince))} for a full refund.
            </p>
          )}
        </div>
      </div>
      <button
        onClick={() => setConfirming(true)}
        className="mt-4 w-full rounded-full border border-clay/40 bg-shell py-2.5 text-sm font-medium text-clay hover:bg-clay-soft"
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
              You won&apos;t be charged again. It&apos;s past your first {REFUND_WINDOW_DAYS} days, so this month isn&apos;t refunded, but you{" "}
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
    </section>
  );
}
