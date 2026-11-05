"use client";

import { useState } from "react";
import { TIERS } from "@/lib/data";
import { TrialCancelChoice, useStore } from "@/lib/store";
import { REFUND_WINDOW_DAYS, endOfMonth } from "@/lib/membership";
import { shortDate } from "@/lib/format";
import { dateKey } from "@/lib/schedule";
import { Button, Sheet } from "./Sheet";

// Shown once a cancellation is scheduled, so members always see when their access ends. Refund
// terms stay out of the way until someone cancels: they're in the member agreement.
export function MembershipCard() {
  const { member, keepMembership, keepAccount } = useStore();
  const tier = TIERS[member.tier];
  if (!tier.isMember || tier.id === "trial" || !member.membershipEndsAt) return null;

  const ends = new Date(member.membershipEndsAt);
  const deleting = member.membershipCancel === "delete";
  return (
    <section className="rounded-3xl border border-line bg-card p-4">
      <p className="text-xs uppercase tracking-widest text-muted">Membership cancelled</p>
      <p className="mt-1 font-heading text-2xl leading-tight">Active until {shortDate(dateKey(ends))}</p>
      <p className="mt-1 text-sm text-shell">
        You won&apos;t be charged again. You keep full {tier.name} access, prices and your calendar until then.{" "}
        {deleting ? "After that your account is deleted." : "After that you'll be on a free Wellness Account."}
      </p>
      <div className="-mb-2 mt-1">
        {deleting && (
          <button onClick={keepAccount} className="block w-full py-2.5 text-left text-sm text-moss active:opacity-60">
            Keep a free Wellness Account instead
          </button>
        )}
        <button onClick={keepMembership} className="block w-full py-2.5 text-left text-sm text-moss active:opacity-60">
          Changed your mind? Keep my membership
        </button>
      </div>
    </section>
  );
}

// At the bottom of the Account tab, once there's a paid membership to cancel. Cancelling offers a
// free Wellness Account first; deleting the account takes a second confirm.
export function CancelMembership() {
  const { member, refundWindowOpen, refundLostToUse, cancelMembership } = useStore();
  const [step, setStep] = useState<"offer" | "delete" | null>(null);
  const tier = TIERS[member.tier];
  if (!tier.isMember || tier.id === "trial" || member.membershipEndsAt) return null;

  const monthEnd = shortDate(dateKey(endOfMonth(new Date())));
  const close = () => setStep(null);
  const finish = (choice: TrialCancelChoice) => {
    cancelMembership(choice);
    close();
  };

  return (
    <>
      <button
        onClick={() => setStep("offer")}
        className="w-full rounded-full py-2 text-sm font-medium bg-sage text-ink active:bg-sage-light"
      >
        Cancel membership
      </button>

      <Sheet open={step === "offer"} onClose={close} title="Cancel your membership?">
        <div className="space-y-4 text-sm">
          {refundWindowOpen ? (
            <p>
              You&apos;re within your first {REFUND_WINDOW_DAYS} days, so you&apos;ll get a <span className="font-medium">full refund</span> and your {tier.name} membership ends now.
            </p>
          ) : (
            <p>
              You won&apos;t be charged again. {refundLostToUse ? "You've already used your membership" : `It's past your first ${REFUND_WINDOW_DAYS} days`}, so this month isn&apos;t refunded, but you{" "}
              <span className="font-medium">keep full {tier.name} access until {monthEnd}</span>.
            </p>
          )}
          <div className="rounded-2xl border border-moss/30 bg-moss-soft p-4">
            <p className="text-xs uppercase tracking-widest text-moss">Before you go</p>
            <p className="mt-1 font-heading text-xl leading-tight">Keep a free Wellness Account</p>
            <p className="mt-1 text-shell">
              No monthly fee. Pay as you go at West LA and Studio City, get every new special, and keep your calendar, bookings and stats.
            </p>
            <Button className="mt-3" onClick={() => finish("downgrade")}>
              {refundWindowOpen ? "Refund and switch to Wellness" : "Switch to Wellness Account"}
            </Button>
          </div>
          <div className="space-y-2">
            <Button variant="secondary" onClick={() => setStep("delete")}>
              No thanks, delete my account
            </Button>
            <button onClick={close} className="w-full py-3 text-sm font-medium text-moss active:opacity-60">
              Keep my membership
            </button>
          </div>
        </div>
      </Sheet>

      <Sheet open={step === "delete"} onClose={close} title="Delete your account?">
        <div className="space-y-4 text-sm">
          <p>
            {refundWindowOpen
              ? "Your membership is refunded and your account is deleted now."
              : `You keep ${tier.name} until ${monthEnd}. Then your account is deleted. You can change your mind until then.`}
          </p>
          <p className="text-muted">
            {refundWindowOpen ? "Upcoming bookings" : "Bookings after that"} are cancelled and anything you paid for them is refunded. Your history, stats and unused credits go with the account. This can&apos;t be undone.
          </p>
          <div className="space-y-2">
            <Button variant="danger" onClick={() => finish("delete")}>
              Delete my account
            </Button>
            <Button variant="secondary" onClick={() => setStep("offer")}>
              Back
            </Button>
          </div>
        </div>
      </Sheet>
    </>
  );
}
