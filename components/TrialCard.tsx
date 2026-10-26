"use client";

import { useState } from "react";
import clsx from "clsx";
import { Hourglass, X } from "lucide-react";
import { TIERS } from "@/lib/data";
import { TrialCancelChoice, useStore } from "@/lib/store";
import { TRIAL_BECOMES, TRIAL_CHOICES, daysLeft } from "@/lib/trial";
import { momentLabel, money } from "@/lib/format";
import { Button, Sheet } from "./Sheet";

const CHOICES: { id: TrialCancelChoice; title: string; text: string }[] = [
  { id: "downgrade", title: "Switch to a free Wellness Account", text: "Keep booking at non-member prices." },
  { id: "delete", title: "Delete my account", text: "Your account and any later bookings are removed." },
];

// Shown while an account is on its 7-day trial: how long is left, what happens next,
// and a Cancel button that's always one tap away.
export function TrialCard() {
  const { member, cancelTrial, keepTrial, setTrialBecomes } = useStore();
  const [confirming, setConfirming] = useState(false);
  const [choice, setChoice] = useState<TrialCancelChoice>("downgrade");
  if (member.tier !== "trial" || !member.trialEndsAt) return null;

  const ends = new Date(member.trialEndsAt);
  const left = daysLeft(ends);
  const next = TIERS[member.trialBecomes ?? TRIAL_BECOMES];
  const cancelled = member.trialCancel;
  const leftLabel = left === 0 ? "Ends today" : `${left} day${left === 1 ? "" : "s"} left`;

  if (cancelled) {
    return (
      <section className="rounded-3xl border border-line bg-shell p-5">
        <p className="text-xs uppercase tracking-widest text-muted">Trial cancelled · {leftLabel}</p>
        <p className="mt-1 text-sm">
          You won&apos;t be charged for a membership. Keep enjoying your trial until {momentLabel(ends)}. After that, your account{" "}
          {cancelled === "delete" ? "will be deleted." : "becomes a free Wellness Account."}
        </p>
        <button onClick={keepTrial} className="mt-3 text-sm text-moss underline-offset-2 hover:underline">
          Changed your mind? Keep my trial
        </button>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-moss/30 bg-moss-soft p-5">
      <div className="flex items-start gap-3">
        <Hourglass size={20} className="mt-1 shrink-0 text-moss" />
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-widest text-moss">7-day trial</p>
          <p className="font-serif text-2xl leading-tight">{leftLabel}</p>
          <p className="mt-1 text-sm text-ink/80">
            Ends {momentLabel(ends)}. Then {next.name} starts automatically at {money(next.monthly!)}/month. Your {money(TIERS.trial.joinFee)} trial fee counts toward the first month.
          </p>
        </div>
      </div>
      <div className="mt-4">
        <p className="text-xs uppercase tracking-widest text-moss">After your trial</p>
        <div className="mt-2 grid grid-cols-3 gap-2" role="radiogroup" aria-label="Membership after your trial">
          {TRIAL_CHOICES.map((id) => {
            const t = TIERS[id];
            const on = next.id === id;
            return (
              <button
                key={id}
                role="radio"
                aria-checked={on}
                onClick={() => setTrialBecomes(id)}
                className={clsx("rounded-2xl border px-2 py-2.5 text-center", on ? "border-moss bg-moss text-shell" : "border-moss/20 bg-shell")}
              >
                <span className="block font-serif text-lg leading-none">{t.name}</span>
                <span className="mt-1 block text-[11px] opacity-80">{money(t.monthly!)}/mo</span>
                {id === TRIAL_BECOMES && <span className="block text-[10px] opacity-70">default</span>}
              </button>
            );
          })}
        </div>
      </div>
      <button
        onClick={() => setConfirming(true)}
        className="mt-4 w-full rounded-full border border-clay/40 bg-shell py-2.5 text-sm font-medium text-clay hover:bg-clay-soft"
      >
        Cancel trial
      </button>

      <Sheet open={confirming} onClose={() => setConfirming(false)} title="Cancel your trial?">
        <div className="space-y-4 text-sm">
          <p>
            You won&apos;t be charged for a membership, and you can keep using your trial until {momentLabel(ends)}.
          </p>
          <div className="space-y-2" role="radiogroup" aria-label="When your trial ends">
            <p className="text-xs uppercase tracking-widest text-muted">When your trial ends</p>
            {CHOICES.map((c) => (
              <button
                key={c.id}
                role="radio"
                aria-checked={choice === c.id}
                onClick={() => setChoice(c.id)}
                className={clsx("flex w-full items-start gap-3 rounded-2xl border p-3 text-left", choice === c.id ? "border-moss ring-1 ring-moss" : "border-line")}
              >
                <span className={clsx("mt-0.5 h-4 w-4 shrink-0 rounded-full border-2", choice === c.id ? "border-moss bg-moss" : "border-line")} />
                <span>
                  <span className="block font-medium">{c.title}</span>
                  <span className="text-xs text-muted">{c.text}</span>
                </span>
              </button>
            ))}
          </div>
          <div className="space-y-2">
            <Button
              variant="danger"
              onClick={() => {
                cancelTrial(choice);
                setConfirming(false);
              }}
            >
              Cancel trial
            </Button>
            <Button variant="secondary" onClick={() => setConfirming(false)}>
              Keep my trial
            </Button>
          </div>
        </div>
      </Sheet>
    </section>
  );
}

export function NoticeBanner() {
  const { member, dismissNotice } = useStore();
  if (!member.notice) return null;
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-ink p-4 text-sm text-shell">
      <p className="flex-1">{member.notice}</p>
      <button onClick={dismissNotice} aria-label="Dismiss" className="shrink-0 opacity-70 hover:opacity-100">
        <X size={16} />
      </button>
    </div>
  );
}
