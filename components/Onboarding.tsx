"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { CalendarDays, Check, Dumbbell, Flame, Home, MapPin, QrCode, Snowflake, Sparkles, Star, Ticket, UserRound } from "lucide-react";
import { LOCATIONS, LocationId, PriceGroup, TIERS, currentPromos, priceFor } from "@/lib/data";
import { dateKey } from "@/lib/schedule";
import { useStore } from "@/lib/store";
import { money, shortDate } from "@/lib/format";
import { PriceList } from "./PriceList";
import { PROMO_LABELS } from "./PromoBanner";
import { Button } from "./Sheet";

// First-run walkthrough, right after creating an account: welcome, a tour of the app (what each tab
// does), where you go, and what you'll pay.
export function Onboarding() {
  const { member, setLocation, finishOnboarding } = useStore();
  const router = useRouter();
  const tier = TIERS[member.tier];
  const steps = tier.lockedToHome ? ["welcome", "tour", "pricing"] : ["welcome", "tour", "location", "pricing"];
  const [i, setI] = useState(0);
  const step = steps[i];
  const today = dateKey(new Date());
  const promos = currentPromos(today);

  const finish = () => {
    finishOnboarding();
    router.push("/book");
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-sand">
      <div className="mx-auto max-w-md px-5 pb-10 pt-6">
        <div className="mb-5 flex items-center justify-between">
          <span className="font-wordmark text-xl tracking-[0.35em]">ARTHA</span>
          <div className="flex gap-1.5" aria-label={`Step ${i + 1} of ${steps.length}`}>
            {steps.map((s, n) => (
              <span key={s} className={clsx("h-1.5 w-6 rounded-full", n <= i ? "bg-moss" : "bg-line")} />
            ))}
          </div>
        </div>

        {step === "welcome" && (
          <div className="space-y-4">
            <div className="rounded-3xl border border-line bg-card p-5">
              <h1 className="break-words font-heading text-4xl leading-tight">Welcome, {member.name.split(" ")[0]}</h1>
              <p className="mt-2 text-sm text-muted">Your wellness sanctuary in West LA and Studio City.</p>
              <p className="mt-3 border-t border-line pt-3 text-xs italic text-muted">
                Artha is Sanskrit for &ldquo;the true meaning of life.&rdquo;
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: Dumbbell, title: "Move", text: "Yoga, Pilates, HIIT, Sound Bath" },
                { icon: Flame, title: "Sweat", text: "Infrared sauna, red light" },
                { icon: Snowflake, title: "Freeze", text: "Cryo, cold plunge" },
              ].map(({ icon: Icon, title, text }) => (
                <div key={title} className="rounded-2xl border border-line bg-card p-3">
                  <Icon size={18} className="text-moss" />
                  <p className="mt-1.5 font-heading text-lg leading-none">{title}</p>
                  <p className="mt-1 text-[11px] leading-snug text-muted">{text}</p>
                </div>
              ))}
            </div>
            <p className="text-center text-xs text-muted">Try the ritual: a class, then heat, then cold.</p>

            <div className="rounded-2xl border border-line bg-card p-4">
              <p className="text-xs uppercase tracking-widest text-muted">Booking takes three taps</p>
              <ol className="mt-3 space-y-2.5 text-sm">
                {[
                  ["Pick what you want", "a class, a therapy or a treatment"],
                  ["See your price", "every option shows exactly what you'll pay"],
                  ["Confirm", "with the free-cancellation time shown up front"],
                ].map(([title, text], n) => (
                  <li key={title} className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sage text-xs text-ink">{n + 1}</span>
                    <p>
                      <span className="font-medium">{title}</span> <span className="text-muted">· {text}</span>
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}

        {step === "tour" && <AppTour monthly={!!tier.monthly} />}

        {step === "location" && (
          <div>
            <h1 className="font-heading text-4xl leading-tight">Pick your home location</h1>
            <p className="mt-3 text-muted">This is where the app opens by default. You can switch to the other location anytime, and your Wellness Account works at both.</p>
            <div className="mt-6 space-y-3">
              {(Object.keys(LOCATIONS) as LocationId[]).map((id) => (
                <button
                  key={id}
                  onClick={() => setLocation(id)}
                  className={clsx(
                    "flex w-full items-center gap-4 rounded-2xl border bg-card p-4 text-left",
                    member.home === id ? "border-moss ring-1 ring-moss" : "border-line",
                  )}
                >
                  <MapPin className={member.home === id ? "text-moss" : "text-muted"} />
                  <div className="flex-1">
                    <p className="font-heading text-xl">{LOCATIONS[id].short}</p>
                    <p className="text-xs text-muted">{LOCATIONS[id].address}</p>
                  </div>
                  {member.home === id && <Check className="text-moss" size={20} />}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === "pricing" && (
          <div className="space-y-5">
            <div>
              <h1 className="font-heading text-4xl leading-tight">{tier.isMember ? `Your ${tier.name} membership` : "Your free Wellness Account"}</h1>
              <p className="mt-3 text-muted">
                {tier.isMember
                  ? `Classes at both locations. Therapies and treatments at ${LOCATIONS[member.home].short}, your home location. Here's what's included and what you pay.`
                  : "No monthly fee."}
              </p>
            </div>

            {promos.length > 0 && !tier.isMember && (
              <div className="rounded-2xl bg-promo p-4 text-sm text-ink">
                <p className="font-medium">Specials right now, at both locations</p>
                <ul className="mt-1 space-y-0.5">
                  {promos.flatMap((p) =>
                    (Object.keys(p.prices) as PriceGroup[]).map((g) => {
                      const q = priceFor(member.tier, PROMO_LABELS[g].sample, member.home, today);
                      return (
                        <li key={g}>
                          {PROMO_LABELS[g].label} {money(q.price)} <span className="line-through">{money(q.regular)}</span> · until {shortDate(p.ends)}
                        </li>
                      );
                    }),
                  )}
                </ul>
              </div>
            )}

            {tier.isMember && member.credits > 0 && (
              <p className="flex items-center gap-2 rounded-2xl bg-moss-soft p-4 text-sm text-moss">
                <Ticket size={18} /> You have {member.credits} treatment credits. Each one covers a treatment or HBOT session.
              </p>
            )}

            <div>
              <p className="mb-2 text-xs uppercase tracking-widest text-muted">Your prices</p>
              <PriceList tier={member.tier} location={member.home} />
            </div>

            <p className="text-sm text-muted">
              Cancel for free up to 3 hours before a class or therapy, and 12 hours before a treatment or contrast. We&apos;ll show you the exact time when you book.
            </p>
          </div>
        )}

        <div className="mt-6 space-y-2">
          {i < steps.length - 1 ? <Button onClick={() => setI(i + 1)}>Continue</Button> : <Button onClick={finish}>Start booking</Button>}
          {i > 0 && (
            <Button variant="secondary" onClick={() => setI(i - 1)}>
              Back
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// The intro to the app: the tabs along the bottom and what each part does, in the same icons.
function AppTour({ monthly }: { monthly: boolean }) {
  const parts = [
    {
      icon: Home,
      title: "Home",
      text: "Your streak, upcoming events and your calendar. Every booking lives here: tap one to see it, cancel it or add it to your phone's calendar.",
    },
    {
      icon: Sparkles,
      title: "Book",
      text: "Classes, therapies and treatments at both studios. Every time shows your price, and booking takes two taps.",
    },
    {
      icon: UserRound,
      title: "Account",
      text: monthly
        ? "Your membership and what's included, your card, guest passes for friends, your stats and how to reach us."
        : "Your account and prices, your card, your stats, memberships and how to reach us.",
    },
    { icon: QrCode, title: "Check in", text: "Tap the code at the top of any screen and show it at the front desk." },
    { icon: Star, title: "Rate your class", text: "After a class, Home asks how it went. Reviews are anonymous." },
    { icon: CalendarDays, title: "Free cancellation", text: "Up to 3 hours before a class or therapy, 12 before a treatment. The exact time shows before you book." },
  ];
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-heading text-4xl leading-tight">Here&apos;s your app</h1>
        <p className="mt-2 text-sm text-muted">Three tabs along the bottom. This is what each part does.</p>
      </div>

      {/* A small copy of the tab bar, so the icons below are easy to find later. */}
      <div className="grid grid-cols-3 rounded-2xl border border-line bg-card p-1.5" aria-hidden>
        {parts.slice(0, 3).map(({ icon: Icon, title }, n) => (
          <span key={title} className={clsx("flex flex-col items-center gap-0.5 rounded-xl py-1.5 text-[11px]", n === 0 && "bg-sand")}>
            <Icon size={18} />
            {title}
          </span>
        ))}
      </div>

      <ul className="space-y-2">
        {parts.map(({ icon: Icon, title, text }) => (
          <li key={title} className="flex items-start gap-3 rounded-2xl border border-line bg-card p-3.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sand text-shell">
              <Icon size={18} />
            </span>
            <span className="min-w-0">
              <span className="block font-heading text-lg leading-tight">{title}</span>
              <span className="block text-sm leading-snug text-muted">{text}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
