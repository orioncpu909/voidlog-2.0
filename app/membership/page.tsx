"use client";

import { useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { ChevronRight, RotateCcw, Ticket } from "lucide-react";
import { LOCATIONS, MEMBERSHIP_ORDER, PERK_LABEL, ServiceId, TIERS, TierId } from "@/lib/data";
import { dateKey } from "@/lib/schedule";
import { FRIEND_DEMO_ID, WELLNESS_DEMO_ID, useStore } from "@/lib/store";
import { money } from "@/lib/format";
import { joinCharge, monthLeft } from "@/lib/membership";
import { TRIAL_BECOMES, firstMonthCharge, trialEndsAt } from "@/lib/trial";
import { PriceList } from "@/components/PriceList";
import { NoticeBanner, TrialCard } from "@/components/TrialCard";
import { CancelMembership, MembershipCard } from "@/components/MembershipCard";
import { StatsOverview } from "@/components/StatsOverview";
import { SwitchToWellness } from "@/components/SwitchToWellness";
import { EmailStudioButton } from "@/components/EmailStudio";
import { Disclosure } from "@/components/Disclosure";
import { CreditsInfoButton } from "@/components/CreditsInfo";
import { CardOnFileRow, PayWithCard, usePayWhenCardSaved } from "@/components/CardOnFileRow";
import { GuestPassesTile } from "@/components/GuestPasses";
import { InviteFriendTile } from "@/components/InviteFriend";
import { DeleteAccountButton } from "@/components/DeleteAccount";
import { HistoryButton } from "@/components/BookingHistory";
import { Button, Sheet } from "@/components/Sheet";

export default function AccountPage() {
  const { member, members, spentThisMonth, switchMember, changeTier, canStartTrial, endTrialNow, endMembershipNow, restartAsNewDownload, setCardDeclines, reset } = useStore();
  const [joining, setJoining] = useState<TierId | null>(null);
  const payPlan = () => {
    if (!joining) return;
    changeTier(joining);
    setJoining(null);
  };
  const payPlanAfterSave = usePayWhenCardSaved(payPlan);
  const tier = TIERS[member.tier];
  const location = LOCATIONS[member.home];
  // The trial only shows for accounts that have never had one.
  const options = MEMBERSHIP_ORDER.filter((id) => id !== member.tier && (id !== "trial" || canStartTrial));
  const plans = (
    <div className="space-y-2">
      {options.map((id) => {
        const t = TIERS[id];
        return (
          <button key={id} onClick={() => setJoining(id)} className="flex w-full items-center justify-between gap-3 rounded-2xl border border-line bg-card px-4 py-2.5 text-left transition-colors active:bg-sand">
            <div className="min-w-0">
              <p className="font-heading text-lg leading-tight">{t.name}</p>
              <p className="line-clamp-2 text-xs text-muted">{t.summary}</p>
            </div>
            {/* The trial renews into a membership, so its row says so next to the price. */}
            <p className="shrink-0 text-right text-sm">
              {t.monthly ? (
                `${money(t.monthly)}/mo`
              ) : (
                <>
                  {money(t.joinFee)}
                  <span className="block text-[11px] text-muted">then {money(TIERS[TRIAL_BECOMES].monthly!)}/mo</span>
                </>
              )}
            </p>
          </button>
        );
      })}
      <SwitchToWellness />
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-3xl">Account</h1>
        <HistoryButton />
      </div>

      <section className="rounded-3xl border border-line bg-card p-4">
        <div className="flex items-center gap-2">
          <p className="min-w-0 flex-1 truncate text-xs text-muted">
            <span className="uppercase tracking-widest">{member.name}</span>
            {member.email && ` · ${member.email}`}
          </p>
          <Link href="/profile" className="flex shrink-0 items-center text-xs text-moss">
            Profile <ChevronRight size={14} />
          </Link>
        </div>
        <div className="mt-1 flex items-baseline justify-between gap-3">
          <p className="font-heading text-3xl leading-tight">{tier.name}</p>
          <p className="shrink-0 text-sm text-muted">
            {tier.monthly ? `${money(tier.monthly)}/mo · billed the 1st` : tier.joinFee ? `${money(tier.joinFee)} for 7 days` : "Free · pay per visit"}
          </p>
        </div>
        <p className="mt-1 text-xs text-muted">
          {tier.lockedToHome ? `Classes at both locations · therapies and treatments at ${location.short}` : "Book anything at West LA or Studio City"}
          {member.instagram && (
            <>
              {" · "}
              <a href={`https://instagram.com/${member.instagram}`} target="_blank" rel="noreferrer" className="text-moss underline-offset-2 hover:underline">
                @{member.instagram}
              </a>
            </>
          )}
        </p>
        {tier.isMember && (
          <div className="mt-2 flex flex-wrap items-center gap-x-1.5 text-sm">
            <Ticket size={15} /> {member.credits} treatment credits
            {tier.monthlyCredits > 0 && <span className="text-muted">· +{tier.monthlyCredits}/month</span>}
            <CreditsInfoButton className="ml-auto text-xs" />
          </div>
        )}
        {tier.monthlyPerks && <MonthlyPerks />}
      </section>

      <NoticeBanner />
      <TrialCard />
      <MembershipCard />
      <StatsOverview />

      {tier.monthly ? (
        <div className="grid grid-cols-2 gap-3">
          <CardOnFileRow compact />
          <GuestPassesTile />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <CardOnFileRow compact />
          <InviteFriendTile />
        </div>
      )}

      <section className="space-y-2">
        <h2 className="font-heading text-xl">{tier.name}</h2>
        <PriceList tier={member.tier} location={member.home} />
      </section>

      {tier.isMember ? (
        <Disclosure title="Explore other Memberships">{plans}</Disclosure>
      ) : (
        <section className="space-y-2">
          <h2 className="font-heading text-xl">Become a member</h2>
          {spentThisMonth > 0 && <p className="text-sm text-muted">You&apos;ve spent {money(spentThisMonth)} on visits this month.</p>}
          {member.trialUsed && <p className="text-xs text-muted">This account has already used its free 7-day trial.</p>}
          {plans}
        </section>
      )}

      <Disclosure title="Contact us">
        <div className="divide-y divide-line">
          {Object.values(LOCATIONS).map((l) => (
            <div key={l.id} className="py-2.5 first:pt-0">
              <p className="font-medium">{l.name}</p>
              <p className="text-xs text-muted">{l.address}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs">
                <a href={`tel:${l.phone.replace(/\./g, "")}`} className="text-moss underline-offset-2 hover:underline">
                  {l.phone}
                </a>
                <EmailStudioButton location={l.id} />
              </div>
            </div>
          ))}
        </div>
        <p className="pt-2 text-xs text-muted">
          Membership questions:{" "}
          <a href="mailto:membership@artha.la" className="text-moss underline-offset-2 hover:underline">
            membership@artha.la
          </a>
        </p>
        <div className="mt-3 border-t border-line pt-3">
          <h3 className="mb-1.5 text-lg leading-tight">Cancellation policy</h3>
          <ul className="space-y-1.5 text-muted">
            <li>
              <span className="text-shell">Classes and therapies:</span> free to cancel until 3 hours before.
            </li>
            <li>
              <span className="text-shell">Treatments and contrast:</span> free to cancel until 12 hours before.
            </li>
            <li>
              <span className="text-shell">Late cancel or no-show:</span>{" "}
              {tier.id === "trial" ? "no charge during your trial." : "you're charged what the service costs right now. A credit-paid booking uses up the credit."}
            </li>
            <li>Please arrive 5 minutes early. No phone calls, inside voices.</li>
          </ul>
        </div>
        <DeleteAccountButton />
      </Disclosure>

      <Disclosure title="Demo">
        <p className="text-xs uppercase tracking-widest text-muted">View as</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {members.filter((m) => m.signedUp !== false).map((m) => (
            <button
              key={m.id}
              onClick={() => switchMember(m.id)}
              className={clsx("rounded-full border px-3 py-1 text-xs", m.id === member.id ? "border-sage bg-sage text-ink" : "border-line bg-card")}
            >
              {m.id === WELLNESS_DEMO_ID ? "New user" : m.id === FRIEND_DEMO_ID ? `${m.name.split(" ")[0]} · Invited friend` : `${m.name.split(" ")[0]} · ${TIERS[m.tier].name}`}
            </button>
          ))}
        </div>
        {member.tier === "trial" && (
          <button onClick={endTrialNow} className="mt-2 block text-xs text-moss underline-offset-2 hover:underline">
            Jump to the end of this trial (demo)
          </button>
        )}
        {member.membershipEndsAt && (
          <button onClick={endMembershipNow} className="mt-2 block text-xs text-moss underline-offset-2 hover:underline">
            Jump to the end of this month (demo)
          </button>
        )}
        {member.card && (
          <button onClick={() => setCardDeclines(!member.card?.declining)} className="mt-2 block text-xs text-moss underline-offset-2 hover:underline">
            {member.card.declining ? "Stop this card declining (demo)" : "Make this card decline (demo)"}
          </button>
        )}
        <Link href="/admin" className="mt-2 block text-xs text-moss underline-offset-2 hover:underline">
          Open the staff admin (class ratings)
        </Link>
        <button onClick={restartAsNewDownload} className="mt-2 block text-xs text-moss underline-offset-2 hover:underline">
          Open the app as a new download (sign-up)
        </button>
        <button onClick={reset} className="mt-2 flex items-center gap-1 text-xs text-muted hover:text-shell">
          <RotateCcw size={12} /> Reset demo data
        </button>
      </Disclosure>

      <CancelMembership />

      <Sheet open={!!joining} onClose={() => setJoining(null)} title={joining ? `${tier.isMember ? "Switch" : "Upgrade"} to ${TIERS[joining].name}` : ""}>
        {joining && (
          <div className="space-y-4 text-sm">
            <p>{TIERS[joining].summary}</p>
            <ChargeSummary tier={joining} />
            <p className="text-muted">
              {TIERS[joining].monthly
                ? `${money(TIERS[joining].monthly!)}/month, month-to-month, valid at ${location.name}.`
                : `Classes at both studios. Therapies and treatments during the trial are at ${location.name}, your home studio${!tier.lockedToHome ? " (change it on Profile before you start)" : ""}. One trial per account.`}
            </p>
            <div>
              <p className="mb-2 text-xs uppercase tracking-widest text-muted">{joining === "trial" ? "During the 7 days you pay" : "You'd pay"}</p>
              <PriceList tier={joining} location={member.home} />
            </div>
            <PayWithCard amount={joinCharge(member.tier, joining).amount} onSaved={payPlanAfterSave} />
            <div className="space-y-2">
              {(joinCharge(member.tier, joining).amount <= 0 || member.card) && (
                <Button onClick={payPlan}>
                  {joinCharge(member.tier, joining).amount > 0 ? `Confirm and pay ${money(joinCharge(member.tier, joining).amount)}` : "Confirm"}
                </Button>
              )}
              <Button variant="secondary" onClick={() => setJoining(null)}>
                Not now
              </Button>
            </div>
          </div>
        )}
      </Sheet>
    </div>
  );
}

// A trial started now, step by step: when it ends, when the membership starts and what it costs
// that first part-month (prorated, minus the $29 already paid), then the monthly price.
function trialRenewal() {
  const ends = trialEndsAt(new Date());
  const starts = new Date(ends.getTime() + 1);
  const { remaining, daysInMonth } = monthLeft(starts);
  const becomes = TIERS[TRIAL_BECOMES];
  const prorated = Math.round((becomes.neverProrated ? 1 : remaining / daysInMonth) * becomes.monthly! * 100) / 100;
  const day = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const firstOfNext = new Date(starts.getFullYear(), starts.getMonth() + 1, 1);
  return { ends: day(ends), starts: day(starts), first: firstMonthCharge(starts), prorated, monthStart: day(firstOfNext) };
}

// What the card is charged when changing plans, before they confirm.
function ChargeSummary({ tier: tierId }: { tier: TierId }) {
  const { member } = useStore();
  const due = joinCharge(member.tier, tierId);
  const nextMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return (
    <div className="rounded-2xl border border-line p-4">
      <div className="flex items-baseline justify-between gap-3">
        <span>You pay today</span>
        <span className="stat-num text-2xl">{money(due.amount)}</span>
      </div>
      {due.days && (
        <p className="mt-1 text-muted">
          Prorated: {due.days.remaining} of {due.days.daysInMonth} days left this month.
        </p>
      )}
      {TIERS[tierId].neverProrated && !TIERS[member.tier].isMember && <p className="mt-1 text-muted">{TIERS[tierId].name} is always the full monthly price.</p>}
      {due.monthly && (
        <p className="mt-1 text-muted">
          Then {money(due.monthly)}/month, billed the 1st, starting {nextMonth}.
        </p>
      )}
      {/* The trial's renewal, in the same box as the price, not only in the small print below. */}
      {/* The trial as a short timeline, each line one date and one amount, so the renewal and the
          first part-month charge are explained once, in one place. */}
      {tierId === "trial" &&
        (() => {
          const r = trialRenewal();
          const becomes = TIERS[TRIAL_BECOMES];
          return (
            <ol className="mt-2 space-y-1.5 border-t border-line pt-2">
              <li>
                <span className="font-medium">Today:</span> {money(TIERS.trial.joinFee)} for 7 days, through {r.ends}.
              </li>
              <li>
                <span className="font-medium">{r.starts}:</span> it becomes {becomes.name}.{" "}
                {r.first > 0
                  ? `You pay ${money(r.first)}: ${money(r.prorated)} for the rest of that month, minus the ${money(TIERS.trial.joinFee)} you already paid.`
                  : `Nothing more that month: your ${money(TIERS.trial.joinFee)} covers it.`}
              </li>
              <li>
                <span className="font-medium">From {r.monthStart}:</span> {money(becomes.monthly!)}/month.
              </li>
              <li className="text-muted">Cancel, or pick Restore or Gold instead, any time before {r.ends} from Account.</li>
            </ol>
          );
        })()}
    </div>
  );
}

// Restore: which of this month's free perks are left. Once one is used, that service is 25% off.
function MonthlyPerks() {
  const { member, perksLeft } = useStore();
  const tier = TIERS[member.tier];
  const today = dateKey(new Date());
  const perks = Object.keys(tier.monthlyPerks ?? {}) as ServiceId[];
  return (
    <div className="mt-3 border-t border-line pt-2.5">
      <p className="text-xs uppercase tracking-widest text-muted">This month&apos;s perks</p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {perks.map((id) => {
          const left = perksLeft(id, today) > 0;
          return (
            <span
              key={id}
              className={clsx("rounded-full px-2.5 py-1 text-xs", left ? "bg-sage text-ink" : "border border-line text-muted line-through")}
            >
              {PERK_LABEL[id]} · {left ? `${tier.monthlyPerks?.[id]} credit` : "used"}
            </span>
          );
        })}
      </div>
      {tier.memberDiscountPct && (
        <p className="mt-2 text-xs text-muted">
          Then {tier.memberDiscountPct}% off until next month (extra massages {money(tier.prices.treatment)}).
        </p>
      )}
    </div>
  );
}
