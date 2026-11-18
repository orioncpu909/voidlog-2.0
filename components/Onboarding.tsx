"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { Bell, CalendarClock, Check, Dumbbell, Flame, Home, MapPin, QrCode, Snowflake, Sparkles, Tag, Ticket, UserRound } from "lucide-react";
import { LOCATIONS, LocationId, PriceGroup, TIERS, currentPromos, priceFor } from "@/lib/data";
import { dateKey } from "@/lib/schedule";
import { useStore } from "@/lib/store";
import { money, shortDate } from "@/lib/format";
import { PriceList } from "./PriceList";
import { PROMO_LABELS } from "./PromoBanner";
import { TRIAL_BECOMES } from "@/lib/trial";
import { Button } from "./Sheet";

// First-run walkthrough, right after creating an account: welcome, a tour of the app (what each tab
// does), where you go, what you'll pay, and last, whether to turn on push notifications, the way
// any app asks: a short screen on why, then the phone's own Allow / Don't Allow prompt.
export function Onboarding() {
  const { member, canStartTrial, setLocation, finishOnboarding, setPushNotifications } = useStore();
  const [asking, setAsking] = useState(false); // the phone's notification prompt is showing
  const router = useRouter();
  const tier = TIERS[member.tier];
  const steps = tier.lockedToHome ? ["welcome", "tour", "pricing", "notifications"] : ["welcome", "tour", "location", "pricing", "notifications"];
  const [i, setI] = useState(0);
  const step = steps[i];
  const today = dateKey(new Date());
  const promos = currentPromos(today);

  const finish = () => {
    finishOnboarding();
    router.push("/book");
  };
  const choosePush = (on: boolean) => {
    setPushNotifications(on);
    setAsking(false);
    finish();
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

        {step === "tour" && <AppTour />}

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

            {!tier.isMember && (!member.firstVisitUsed || canStartTrial) && (
              <div className="rounded-2xl border border-line bg-card p-4 text-sm">
                <p className="font-medium">Your welcome offers</p>
                <ul className="mt-1.5 space-y-1.5 text-muted">
                  {!member.firstVisitUsed && <li>Your first visit of each service is discounted. You&apos;ll see the first-visit price when you book.</li>}
                  {canStartTrial && (
                    <li>
                      {TIERS.trial.name} · {money(TIERS.trial.joinFee)}: {TIERS.trial.summary.charAt(0).toLowerCase() + TIERS.trial.summary.slice(1).replace(/\.$/, "")}, then {money(TIERS[TRIAL_BECOMES].monthly!)}/month unless you cancel. Start it any time from your Account.
                    </li>
                  )}
                </ul>
              </div>
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

        {step === "notifications" && <NotificationsAsk />}

        <div className="mt-6 space-y-2">
          {step === "notifications" ? (
            <>
              <Button onClick={() => setAsking(true)}>Turn on notifications</Button>
              <Button variant="secondary" onClick={() => choosePush(false)}>
                Not now
              </Button>
            </>
          ) : (
            <Button onClick={() => setI(i + 1)}>Continue</Button>
          )}
          {i > 0 && step !== "notifications" && (
            <Button variant="secondary" onClick={() => setI(i - 1)}>
              Back
            </Button>
          )}
        </div>
      </div>
      {asking && <PhoneNotificationPrompt onChoose={choosePush} />}
    </div>
  );
}

// Why turn notifications on: what they're for, before the phone asks.
function NotificationsAsk() {
  const reasons = [
    { icon: CalendarClock, title: "Booking reminders", text: "A heads-up before each class or appointment." },
    { icon: Bell, title: "Free-cancellation deadline", text: "A nudge before it passes, so plans can change for free." },
    { icon: Tag, title: "Specials and events", text: "New specials and community events at your studio." },
  ];
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-heading text-4xl leading-tight">Stay in the loop</h1>
        <p className="mt-2 text-sm text-muted">Turn on notifications and ARTHA will let you know about:</p>
      </div>
      <ul className="space-y-2">
        {reasons.map(({ icon: Icon, title, text }) => (
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
      <p className="text-center text-xs text-muted">You can change this anytime in your phone&apos;s Settings.</p>
    </div>
  );
}

// Stands in for the phone's own permission prompt in this demo (a real app gets it from iOS or
// Android). Allow or Don't Allow saves the choice and opens the app.
function PhoneNotificationPrompt({ onChoose }: { onChoose: (on: boolean) => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/50 px-10" role="alertdialog" aria-modal="true" aria-labelledby="push-title" aria-describedby="push-text">
      <div className="w-full max-w-[270px] overflow-hidden rounded-2xl bg-[#f2f2f2] text-center text-[#111] shadow-xl">
        <div className="px-4 pb-4 pt-5">
          <p id="push-title" className="text-[17px] font-semibold leading-snug">&ldquo;ARTHA&rdquo; Would Like to Send You Notifications</p>
          <p id="push-text" className="mt-1.5 text-[13px] leading-snug">Notifications may include alerts, sounds and icon badges. These can be changed in Settings.</p>
        </div>
        <div className="grid grid-cols-2 border-t border-black/15 text-[17px]">
          <button onClick={() => onChoose(false)} className="min-h-[44px] border-r border-black/15 py-2.5 text-[#007aff] active:bg-black/5">
            Don&apos;t Allow
          </button>
          <button onClick={() => onChoose(true)} className="min-h-[44px] py-2.5 font-semibold text-[#007aff] active:bg-black/5">
            Allow
          </button>
        </div>
      </div>
    </div>
  );
}

// The intro to the app: just the four places a new member needs, in the same icons as the app.
// Kept short on purpose so a new account isn't overwhelmed; everything else is found along the way.
function AppTour() {
  const parts = [
    { icon: Home, title: "Home", text: "Your next booking, specials and events. Every booking is in the Bookings tab." },
    { icon: Sparkles, title: "Book", text: "Where you book all your appointments and see every appointment time." },
    { icon: QrCode, title: "Check in", text: "Tap the code at the top of any screen and have it scanned at the front desk." },
    { icon: UserRound, title: "Account", text: "Where you find all your account information." },
  ];
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-heading text-4xl leading-tight">Here&apos;s your app</h1>
        <p className="mt-2 text-sm text-muted">Four places to know.</p>
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
