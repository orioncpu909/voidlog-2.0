"use client";

import { useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { RotateCcw, Ticket } from "lucide-react";
import { LOCATIONS, MEMBERSHIP_ORDER, PERK_LABEL, ServiceId, TIERS, TierId } from "@/lib/data";
import { dateKey } from "@/lib/schedule";
import { useStore } from "@/lib/store";
import { money } from "@/lib/format";
import { PriceList } from "@/components/PriceList";
import { NoticeBanner, TrialCard } from "@/components/TrialCard";
import { MembershipCard } from "@/components/MembershipCard";
import { StatsOverview } from "@/components/StatsOverview";
import { SwitchToWellness } from "@/components/SwitchToWellness";
import { EmailStudioButton } from "@/components/EmailStudio";
import { Button, Sheet } from "@/components/Sheet";

export default function AccountPage() {
  const { member, members, spentThisMonth, switchMember, changeTier, canStartTrial, endTrialNow, endMembershipNow, restartAsNewDownload, reset } = useStore();
  const [joining, setJoining] = useState<TierId | null>(null);
  const tier = TIERS[member.tier];
  const location = LOCATIONS[member.home];
  // The trial only shows for accounts that have never had one.
  const options = MEMBERSHIP_ORDER.filter((id) => id !== member.tier && (id !== "trial" || canStartTrial));

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl">Account</h1>

      <section className="rounded-3xl border border-line bg-card p-5">
        <p className="text-xs uppercase tracking-widest text-muted">{member.name}</p>
        {member.email && <p className="text-xs text-muted">{member.email}</p>}
        {member.instagram && (
          <a href={`https://instagram.com/${member.instagram}`} target="_blank" rel="noreferrer" className="text-xs text-moss underline-offset-2 hover:underline">
            @{member.instagram}
          </a>
        )}
        <p className="mt-1 font-serif text-3xl">{tier.name}</p>
        <p className="text-sm text-muted">
          {tier.monthly ? `${money(tier.monthly)}/month · billed on the 1st` : tier.joinFee ? `${money(tier.joinFee)} for 7 days` : "Free · pay per visit"}
        </p>
        <p className="mt-3 text-sm text-muted">{tier.lockedToHome ? `Classes at both locations · therapies and treatments at ${location.short}` : "Book anything at West LA or Studio City"}</p>
        {tier.isMember && (
          <p className="mt-3 flex items-center gap-2 text-sm">
            <Ticket size={16} /> {member.credits} treatment credits
            {tier.monthlyCredits > 0 && <span className="text-muted">· +{tier.monthlyCredits} every month</span>}
          </p>
        )}
        {tier.monthlyPerks && <MonthlyPerks />}
      </section>

      <NoticeBanner />
      <TrialCard />
      <MembershipCard />

      <StatsOverview />

      <section className="space-y-2">
        <h2 className="font-serif text-2xl">
          What&apos;s included with your {tier.isMember && tier.id !== "trial" ? `${tier.name} membership` : tier.name}
        </h2>
        <PriceList tier={member.tier} location={member.home} />
        <p className="text-xs text-muted">This is exactly what you pay. You&apos;ll see the same price before you confirm any booking.</p>
      </section>

      <section className="space-y-2">
        <h2 className="font-serif text-2xl">{tier.isMember ? "Change membership" : "Become a member"}</h2>
        {!tier.isMember && spentThisMonth > 0 && <p className="text-sm text-muted">You&apos;ve spent {money(spentThisMonth)} on visits this month.</p>}
        {!tier.isMember && member.trialUsed && <p className="text-xs text-muted">This account has already used its free 7-day trial.</p>}
        <div className="space-y-2">
          {options.map((id) => {
            const t = TIERS[id];
            return (
              <button key={id} onClick={() => setJoining(id)} className="flex w-full items-center justify-between gap-3 rounded-2xl border border-line bg-card px-4 py-3 text-left hover:border-muted">
                <div>
                  <p className="font-serif text-xl">{t.name}</p>
                  <p className="text-xs text-muted">{t.summary}</p>
                </div>
                <p className="shrink-0 text-sm">{t.monthly ? `${money(t.monthly)}/mo` : money(t.joinFee)}</p>
              </button>
            );
          })}
          <SwitchToWellness />
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="font-serif text-2xl">Cancellation policy</h2>
        <ul className="space-y-2 rounded-2xl border border-line bg-card p-4 text-sm text-muted">
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
      </section>

      <section className="space-y-2">
        <h2 className="font-serif text-2xl">Contact us</h2>
        <div className="divide-y divide-line rounded-2xl border border-line bg-card text-sm">
          {Object.values(LOCATIONS).map((l) => (
            <div key={l.id} className="px-4 py-3">
              <p className="font-medium">{l.name}</p>
              <p className="text-xs text-muted">{l.address}</p>
              <p className="mt-1 flex gap-3 text-xs">
                <a href={`tel:${l.phone.replace(/\./g, "")}`} className="text-moss underline-offset-2 hover:underline">
                  {l.phone}
                </a>
                <a href={`mailto:${l.email}`} className="text-moss underline-offset-2 hover:underline">
                  {l.email}
                </a>
              </p>
              <EmailStudioButton location={l.id} className="mt-2.5" />
            </div>
          ))}
        </div>
        <p className="text-xs text-muted">
          Membership questions:{" "}
          <a href="mailto:membership@artha.la" className="text-moss underline-offset-2 hover:underline">
            membership@artha.la
          </a>
        </p>
      </section>

      <section className="space-y-2 rounded-2xl border border-dashed border-line p-4">
        <p className="text-xs uppercase tracking-widest text-muted">Demo · view as</p>
        <div className="flex flex-wrap gap-2">
          {members.map((m) => (
            <button
              key={m.id}
              onClick={() => switchMember(m.id)}
              className={clsx("rounded-full border px-3 py-1 text-xs", m.id === member.id ? "border-sage bg-sage text-ink" : "border-line bg-card")}
            >
              {m.signedUp === false ? "New download" : m.onboarded ? `${m.name.split(" ")[0]} · ${TIERS[m.tier].name}` : "New user (first visit)"}
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
        <button onClick={restartAsNewDownload} className="mt-2 block text-xs text-moss underline-offset-2 hover:underline">
          Open the app as a new download (sign-up)
        </button>
        <button onClick={reset} className="mt-2 flex items-center gap-1 text-xs text-muted hover:text-shell">
          <RotateCcw size={12} /> Reset demo data
        </button>
      </section>

      <Sheet open={!!joining} onClose={() => setJoining(null)} title={joining ? `Switch to ${TIERS[joining].name}` : ""}>
        {joining && (
          <div className="space-y-4 text-sm">
            <p>{TIERS[joining].summary}</p>
            <p className="text-muted">
              {TIERS[joining].monthly
                ? `${money(TIERS[joining].monthly!)}/month, month-to-month, valid at ${location.name}.`
                : `${money(TIERS[joining].joinFee)} for 7 days at ${location.name}. After 7 days it becomes a Classic membership (${money(TIERS.classic.monthly!)}/month) automatically, unless you pick Restore or Gold instead or cancel. You can do either anytime from Home or Account. One trial per account.`}
            </p>
            <div>
              <p className="mb-2 text-xs uppercase tracking-widest text-muted">You&apos;d pay</p>
              <PriceList tier={joining} location={member.home} />
            </div>
            <Button
              onClick={() => {
                changeTier(joining);
                setJoining(null);
              }}
            >
              Confirm
            </Button>
          </div>
        )}
      </Sheet>
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
    <div className="mt-4 border-t border-line pt-3">
      <p className="text-xs uppercase tracking-widest text-muted">This month&apos;s perks</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {perks.map((id) => {
          const left = perksLeft(id, today) > 0;
          return (
            <span
              key={id}
              className={clsx("rounded-full px-2.5 py-1 text-xs", left ? "bg-sage text-ink" : "border border-line text-muted line-through")}
            >
              {PERK_LABEL[id]} {left ? "· free" : "· used"}
            </span>
          );
        })}
      </div>
      {tier.memberDiscountPct && (
        <p className="mt-2 text-xs text-muted">
          After a perk is used, that service is {tier.memberDiscountPct}% off until next month (extra massages are {money(tier.prices.treatment)}).
        </p>
      )}
    </div>
  );
}
