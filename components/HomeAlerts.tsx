"use client";

import { useState } from "react";
import Link from "next/link";
import { BadgePercent, ChevronRight, Hourglass, Info, Sparkles, X } from "lucide-react";
import { PriceGroup, SERVICES, TIERS, currentPromos, priceFor } from "@/lib/data";
import { SHOW_COMMUNITY } from "@/lib/flags";
import { dateKey } from "@/lib/schedule";
import { useStore } from "@/lib/store";
import { TRIAL_BECOMES, daysLeft } from "@/lib/trial";
import { money, shortDate } from "@/lib/format";
import { PROMO_LABELS, promoHref } from "./PromoBanner";
import { TrialCancelSheet } from "./TrialCard";

// Slim one-line versions of the account alerts, so Home fits on one screen. The full cards
// (trial choices, membership details) live on the Account tab.

function Row({
  icon: Icon,
  tone,
  children,
  action,
}: {
  icon: typeof Info;
  tone: "dark" | "sage" | "soft";
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  const tones = {
    dark: "bg-card text-shell",
    sage: "bg-sage text-ink",
    soft: "bg-card text-shell",
  };
  return (
    <div className={`flex items-center gap-2.5 rounded-2xl px-3 py-2 text-xs ${tones[tone]}`}>
      <Icon size={15} className="shrink-0" />
      <div className="min-w-0 flex-1 leading-snug">{children}</div>
      {action}
    </div>
  );
}

// Closing the first-visit banner is remembered with the closed specials.
const FIRST_VISIT_BANNER = "first-visit";

export function HomeAlerts() {
  const { member, firstVisitEligible, dismissNotice, dismissPromos, keepTrial, keepMembership } = useStore();
  const [cancelling, setCancelling] = useState(false);
  const tier = TIERS[member.tier];
  const today = dateKey(new Date());
  const dismissed = new Set(member.dismissedPromos ?? []);
  const promos = tier.isMember ? [] : currentPromos(today).filter((p) => !dismissed.has(p.id));
  const specials = promos.flatMap((p) =>
    (Object.keys(p.prices) as PriceGroup[]).map((group) => ({
      group,
      ends: p.ends,
    })),
  );
  const note = member.notice?.split("\n\n").pop();
  // First-visit specials, for anyone who isn't a member: each service's first visit is at a special
  // rate, so the banner stays until every service has had its first visit.
  const firstVisitServices = Object.values(SERVICES).filter((sv) => sv.group !== "event");
  const firstVisitsLeft = firstVisitServices.filter((sv) => !(member.firstVisitsUsed ?? []).includes(sv.id)).length;
  const showFirstVisit = !tier.isMember && firstVisitEligible && firstVisitsLeft > 0 && !dismissed.has(FIRST_VISIT_BANNER);

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
            <Link href="/community" className="line-clamp-2">
              {note}
            </Link>
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
              <span className="font-medium">Trial · {daysLeft(new Date(member.trialEndsAt))} days left</span> · then{" "}
              {TIERS[member.trialBecomes ?? TRIAL_BECOMES].name} {money(TIERS[member.trialBecomes ?? TRIAL_BECOMES].monthly!)}/mo ·{" "}
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

      {/* First-visit prices and the running specials share one row, so they cost Home a single
          line. The whole row opens Book (or the special's service when it's the only thing in it);
          X only hides the row: the prices still apply when booking. */}
      {(showFirstVisit || specials.length > 0) && (
        <div className="flex rounded-2xl bg-sage text-xs leading-snug text-ink">
          <Link
            href={!showFirstVisit && specials.length === 1 ? promoHref(specials[0].group) : "/book"}
            className="flex min-h-[44px] min-w-0 flex-1 items-center gap-2.5 rounded-l-2xl py-2.5 pl-3 pr-1 active:bg-sage-light"
          >
            {showFirstVisit ? <BadgePercent size={16} className="shrink-0" /> : <Sparkles size={15} className="shrink-0" />}
            <span className="min-w-0 flex-1">
              {showFirstVisit && (
                <>
                  <span className="font-semibold">First visits</span> at a special rate
                </>
              )}
              {specials.map(({ group, ends }, i) => {
                const q = priceFor(member.tier, PROMO_LABELS[group].sample, member.home, today);
                return (
                  <span key={group}>
                    {showFirstVisit || i > 0 ? " · " : ""}
                    <span className="font-semibold">{PROMO_LABELS[group].label}</span> {money(q.price)}{" "}
                    {q.regular > q.price && <span className="line-through">{money(q.regular)}</span>} until {shortDate(ends)}
                  </span>
                );
              })}
            </span>
            <span className="flex shrink-0 items-center font-medium">
              Book <ChevronRight size={14} />
            </span>
          </Link>
          <button
            onClick={() => dismissPromos([...(showFirstVisit ? [FIRST_VISIT_BANNER] : []), ...promos.map((p) => p.id)])}
            aria-label="Hide this row (the prices still apply when you book)"
            className="shrink-0 rounded-r-2xl px-3 active:bg-sage-light"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <TrialCancelSheet open={cancelling} onClose={() => setCancelling(false)} />
    </div>
  );
}
