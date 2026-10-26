"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { Check, Dumbbell, Flame, MapPin, Snowflake, Ticket } from "lucide-react";
import { LOCATIONS, LocationId, PriceGroup, TIERS, currentPromos, priceFor } from "@/lib/data";
import { dateKey } from "@/lib/schedule";
import { useStore } from "@/lib/store";
import { money, shortDate } from "@/lib/format";
import { PriceList } from "./PriceList";
import { PROMO_LABELS } from "./PromoBanner";
import { Button } from "./Sheet";

// First-run walkthrough: where you go, what kind of account you have, and what you'll pay.
export function Onboarding() {
  const { member, setLocation, finishOnboarding } = useStore();
  const router = useRouter();
  const tier = TIERS[member.tier];
  const steps = tier.lockedToHome ? ["welcome", "pricing"] : ["welcome", "location", "pricing"];
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
          <span className="font-serif text-xl tracking-[0.35em]">ARTHA</span>
          <div className="flex gap-1.5" aria-label={`Step ${i + 1} of ${steps.length}`}>
            {steps.map((s, n) => (
              <span key={s} className={clsx("h-1.5 w-6 rounded-full", n <= i ? "bg-moss" : "bg-line")} />
            ))}
          </div>
        </div>

        {step === "welcome" && (
          <div className="space-y-4">
            <div className="rounded-3xl bg-moss p-5 text-shell">
              <h1 className="font-serif text-4xl leading-tight">Welcome, {member.name.split(" ")[0]}</h1>
              <p className="mt-2 text-sm opacity-85">Your wellness sanctuary in West LA and Studio City.</p>
              <p className="mt-3 border-t border-shell/20 pt-3 text-xs italic opacity-75">
                Artha is Sanskrit for &ldquo;the true meaning of life.&rdquo;
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: Dumbbell, title: "Move", text: "Yoga, Pilates, HIIT, Sound Bath" },
                { icon: Flame, title: "Sweat", text: "Infrared sauna, red light" },
                { icon: Snowflake, title: "Freeze", text: "Cryo, cold plunge" },
              ].map(({ icon: Icon, title, text }) => (
                <div key={title} className="rounded-2xl border border-line bg-shell p-3">
                  <Icon size={18} className="text-moss" />
                  <p className="mt-1.5 font-serif text-lg leading-none">{title}</p>
                  <p className="mt-1 text-[11px] leading-snug text-muted">{text}</p>
                </div>
              ))}
            </div>
            <p className="text-center text-xs text-muted">Try the ritual: a class, then heat, then cold.</p>

            <div className="rounded-2xl border border-line bg-shell p-4">
              <p className="text-xs uppercase tracking-widest text-muted">Booking takes three taps</p>
              <ol className="mt-3 space-y-2.5 text-sm">
                {[
                  ["Pick what you want", "a class, a therapy or a treatment"],
                  ["See your price", "every option shows exactly what you'll pay"],
                  ["Confirm", "with the free-cancellation time shown up front"],
                ].map(([title, text], n) => (
                  <li key={title} className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-moss text-xs text-shell">{n + 1}</span>
                    <p>
                      <span className="font-medium">{title}</span> <span className="text-muted">· {text}</span>
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}

        {step === "location" && (
          <div>
            <h1 className="font-serif text-4xl leading-tight">Pick your home location</h1>
            <p className="mt-3 text-muted">This is where the app opens by default. You can switch to the other location anytime, and your Wellness Account works at both.</p>
            <div className="mt-6 space-y-3">
              {(Object.keys(LOCATIONS) as LocationId[]).map((id) => (
                <button
                  key={id}
                  onClick={() => setLocation(id)}
                  className={clsx(
                    "flex w-full items-center gap-4 rounded-2xl border bg-shell p-4 text-left",
                    member.home === id ? "border-moss ring-1 ring-moss" : "border-line",
                  )}
                >
                  <MapPin className={member.home === id ? "text-moss" : "text-muted"} />
                  <div className="flex-1">
                    <p className="font-serif text-xl">{LOCATIONS[id].short}</p>
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
              <h1 className="font-serif text-4xl leading-tight">{tier.isMember ? `Your ${tier.name} membership` : "Your free Wellness Account"}</h1>
              <p className="mt-3 text-muted">
                {tier.isMember
                  ? `Valid at ${LOCATIONS[member.home].short}. Here's what's included and what you pay.`
                  : "No monthly fee."}
              </p>
            </div>

            {!member.firstVisitUsed && (
              <p className="rounded-2xl bg-sage p-4 text-sm font-medium text-shell">Welcome offer: your first appointment is 50% off, for any class, therapy or treatment.</p>
            )}

            {promos.length > 0 && !tier.isMember && (
              <div className="rounded-2xl bg-sage p-4 text-sm text-shell">
                <p className="font-medium">Specials right now, at both locations</p>
                <ul className="mt-1 space-y-0.5 opacity-90">
                  {promos.flatMap((p) =>
                    (Object.keys(p.prices) as PriceGroup[]).map((g) => {
                      const q = priceFor(member.tier, PROMO_LABELS[g].sample, member.home, today);
                      return (
                        <li key={g}>
                          {PROMO_LABELS[g].label} {money(q.price)} <span className="line-through opacity-70">{money(q.regular)}</span> · until {shortDate(p.ends)}
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
