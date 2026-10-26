"use client";

import { useState } from "react";
import Link from "next/link";
import { Hourglass, Info, Sparkles, X } from "lucide-react";
import { PriceGroup, TIERS, currentPromos, priceFor } from "@/lib/data";
import { dateKey } from "@/lib/schedule";
import { useStore } from "@/lib/store";
import { TRIAL_BECOMES, daysLeft } from "@/lib/trial";
import { money, shortDate } from "@/lib/format";
import { PROMO_LABELS } from "./PromoBanner";
import { TrialCancelSheet } from "./TrialCard";

// Slim one-line versions of the account alerts, so Home fits on one screen. The full cards
// (trial choices, membership details) live on the Account tab.

function Row({ icon: Icon, tone, children, action }: { icon: typeof Info; tone: "dark" | "sage" | "soft"; children: React.ReactNode; action?: React.ReactNode }) {
  const tones = { dark: "bg-ink text-shell", sage: "bg-sage text-ink", soft: "bg-moss-soft text-ink" };
  return (
    <div className={`flex items-center gap-2.5 rounded-2xl px-3 py-2 text-xs ${tones[tone]}`}>
      <Icon size={15} className="shrink-0 opacity-80" />
      <div className="min-w-0 flex-1 leading-snug">{children}</div>
      {action}
    </div>
  );
}

export function HomeAlerts() {
  const { member, dismissNotice, dismissPromos, keepTrial, keepMembership } = useStore();
  const [cancelling, setCancelling] = useState(false);
  const tier = TIERS[member.tier];
  const today = dateKey(new Date());
  const dismissed = new Set(member.dismissedPromos ?? []);
  const promos = tier.isMember ? [] : currentPromos(today).filter((p) => !dismissed.has(p.id));

  return (
    <div className="shrink-0 space-y-2 empty:hidden">
      {member.notice && (
        <Row
          icon={Info}
          tone="dark"
          action={
            <button onClick={dismissNotice} aria-label="Dismiss" className="shrink-0 opacity-70">
              <X size={14} />
            </button>
          }
        >
          <span className="line-clamp-2">{member.notice}</span>
        </Row>
      )}

      {member.tier === "trial" && member.trialEndsAt && (
        <Row
          icon={Hourglass}
          tone="soft"
          action={
            member.trialCancel ? (
              <button onClick={keepTrial} className="shrink-0 font-medium text-moss">
                Keep trial
              </button>
            ) : (
              <button onClick={() => setCancelling(true)} className="shrink-0 rounded-full border border-clay/40 bg-shell px-2.5 py-1 font-medium text-clay">
                Cancel
              </button>
            )
          }
        >
          {member.trialCancel ? (
            <>Trial cancelled · enjoy it until {shortDate(dateKey(new Date(member.trialEndsAt)))}</>
          ) : (
            <>
              <span className="font-medium">Trial · {daysLeft(new Date(member.trialEndsAt))} days left</span> · then {TIERS[member.trialBecomes ?? TRIAL_BECOMES].name}{" "}
              {money(TIERS[member.trialBecomes ?? TRIAL_BECOMES].monthly!)}/mo ·{" "}
              <Link href="/membership" className="underline underline-offset-2">
                change
              </Link>
            </>
          )}
        </Row>
      )}

      {member.membershipEndsAt && (
        <Row
          icon={Info}
          tone="soft"
          action={
            <button onClick={keepMembership} className="shrink-0 font-medium text-moss">
              Keep
            </button>
          }
        >
          Membership cancelled · full access until {shortDate(dateKey(new Date(member.membershipEndsAt)))}
        </Row>
      )}

      {promos.length > 0 && (
        <Row
          icon={Sparkles}
          tone="sage"
          action={
            <button onClick={() => dismissPromos(promos.map((p) => p.id))} aria-label="Hide specials" className="shrink-0 opacity-80">
              <X size={14} />
            </button>
          }
        >
          <Link href="/book" className="line-clamp-2 block">
            <span className="font-medium">Specials:</span>{" "}
            {promos
              .flatMap((p) =>
                (Object.keys(p.prices) as PriceGroup[]).map((g) => {
                  const q = priceFor(member.tier, PROMO_LABELS[g].sample, member.home, today);
                  return `${PROMO_LABELS[g].label} ${money(q.price)} until ${shortDate(p.ends)}`;
                }),
              )
              .join(" · ")}
          </Link>
        </Row>
      )}

      <TrialCancelSheet open={cancelling} onClose={() => setCancelling(false)} />
    </div>
  );
}
