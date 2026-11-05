"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Hourglass, Info, Sparkles, X } from "lucide-react";
import { PriceGroup, TIERS, currentPromos, priceFor } from "@/lib/data";
import { SHOW_COMMUNITY } from "@/lib/flags";
import { dateKey } from "@/lib/schedule";
import { useStore } from "@/lib/store";
import { TRIAL_BECOMES, daysLeft } from "@/lib/trial";
import { money, shortDate } from "@/lib/format";
import { PROMO_LABELS, promoHref } from "./PromoBanner";
import { TrialCancelSheet } from "./TrialCard";

// Slim one-line versions of the account alerts, so Home fits on one screen. The full cards
// (trial choices, membership details) live on the Account tab.

function Row({ icon: Icon, tone, children, action }: { icon: typeof Info; tone: "dark" | "sage" | "soft"; children: React.ReactNode; action?: React.ReactNode }) {
  const tones = { dark: "bg-card text-shell", sage: "bg-sage text-ink", soft: "bg-card text-shell" };
  return (
    <div className={`flex items-center gap-2.5 rounded-2xl px-3 py-2 text-xs ${tones[tone]}`}>
      <Icon size={15} className="shrink-0" />
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
  const specials = promos.flatMap((p) => (Object.keys(p.prices) as PriceGroup[]).map((group) => ({ group, ends: p.ends })));
  const note = member.notice?.split("\n\n").pop();

  return (
    <div className="shrink-0 space-y-2 empty:hidden">
      {member.notice && (
        <Row
          icon={Info}
          tone="dark"
          action={
            <button onClick={dismissNotice} aria-label="Dismiss" className="shrink-0">
              <X size={14} />
            </button>
          }
        >
          {/* Several notes can stack up (a prize, a referral, a billing change): Home shows the
              newest and links to Account for the rest, so it still fits one screen. */}
          {SHOW_COMMUNITY && note?.startsWith("Tied for 1st") ? (
            <Link href="/community" className="line-clamp-2">{note}</Link>
          ) : (
            <span className="line-clamp-2">{note}</span>
          )}
          {member.notice.includes("\n\n") && (
            <Link href="/membership" className="mt-0.5 block text-[11px] underline underline-offset-2">
              +{member.notice.split("\n\n").length - 1} more on Account
            </Link>
          )}
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
              <button onClick={() => setCancelling(true)} className="shrink-0 rounded-full px-2.5 py-1 font-medium bg-sage text-ink active:bg-sage-light">
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

      {/* One row per special, each opening that service on Book. */}
      {specials.length > 0 && (
        <div className="flex rounded-2xl bg-promo text-xs text-ink">
          <div className="min-w-0 flex-1 divide-y divide-ink/15">
            {specials.map(({ group, ends }) => {
              const q = priceFor(member.tier, PROMO_LABELS[group].sample, member.home, today);
              return (
                <Link
                  key={group}
                  href={promoHref(group)}
                  className="flex items-center gap-2.5 py-3 pl-3 pr-1 leading-snug first:rounded-tl-2xl last:rounded-bl-2xl active:bg-ink/10"
                >
                  <Sparkles size={15} className="shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="font-medium">Special:</span> {PROMO_LABELS[group].label} {money(q.price)}{" "}
                    {q.regular > q.price && <span className="line-through">{money(q.regular)}</span>} until {shortDate(ends)}
                  </span>
                  <span className="flex shrink-0 items-center font-medium">
                    Book <ChevronRight size={14} />
                  </span>
                </Link>
              );
            })}
          </div>
          <button onClick={() => dismissPromos(promos.map((p) => p.id))} aria-label="Hide specials" className="shrink-0 rounded-r-2xl px-3 active:bg-ink/10">
            <X size={14} />
          </button>
        </div>
      )}

      <TrialCancelSheet open={cancelling} onClose={() => setCancelling(false)} />
    </div>
  );
}
