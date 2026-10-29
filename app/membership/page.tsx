"use client";

import { useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { ChevronRight, RotateCcw, Ticket } from "lucide-react";
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
import { Disclosure } from "@/components/Disclosure";
import { CreditsInfoButton } from "@/components/CreditsInfo";
import { HistoryButton } from "@/components/BookingHistory";
import { Button, Sheet } from "@/components/Sheet";

export default function AccountPage() {
  const { member, members, spentThisMonth, switchMember, changeTier, canStartTrial, endTrialNow, endMembershipNow, restartAsNewDownload, reset } = useStore();
  const [joining, setJoining] = useState<TierId | null>(null);
  const tier = TIERS[member.tier];
  const location = LOCATIONS[member.home];
  // The trial only shows for accounts that have never had one.
  const options = MEMBERSHIP_ORDER.filter((id) => id !== member.tier && (id !== "trial" || canStartTrial));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl">Account</h1>
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
          <p className="font-serif text-3xl leading-tight">{tier.name}</p>
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

      <section className="space-y-2">
        <h2 className="font-serif text-xl">
          {tier.isMember ? <>What&apos;s included with your {tier.id === "trial" ? tier.name : `${tier.name} membership`}</> : tier.name}
        </h2>
        <PriceList tier={member.tier} location={member.home} />
        <p className="text-xs text-muted">Exactly what you pay; you&apos;ll see it again before you confirm.</p>
      </section>

      <section className="space-y-2">
        <h2 className="font-serif text-xl">{tier.isMember ? "Change membership" : "Become a member"}</h2>
        {!tier.isMember && spentThisMonth > 0 && <p className="text-sm text-muted">You&apos;ve spent {money(spentThisMonth)} on visits this month.</p>}
        {!tier.isMember && member.trialUsed && <p className="text-xs text-muted">This account has already used its free 7-day trial.</p>}
        <div className="space-y-2">
          {options.map((id) => {
            const t = TIERS[id];
            return (
              <button key={id} onClick={() => setJoining(id)} className="flex w-full items-center justify-between gap-3 rounded-2xl border border-line bg-card px-4 py-2.5 text-left hover:border-muted">
                <div className="min-w-0">
                  <p className="font-serif text-lg leading-tight">{t.name}</p>
                  <p className="line-clamp-2 text-xs text-muted">{t.summary}</p>
                </div>
                <p className="shrink-0 text-sm">{t.monthly ? `${money(t.monthly)}/mo` : money(t.joinFee)}</p>
              </button>
            );
          })}
          <SwitchToWellness />
        </div>
      </section>

      <Disclosure title="Cancellation policy">
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
      </Disclosure>

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
      </Disclosure>

      <Disclosure title="Demo">
        <p className="text-xs uppercase tracking-widest text-muted">View as</p>
        <div className="mt-2 flex flex-wrap gap-2">
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
      </Disclosure>

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
              {PERK_LABEL[id]} {left ? "· free" : "· used"}
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
