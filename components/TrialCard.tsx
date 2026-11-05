"use client";

import { useState } from "react";
import clsx from "clsx";
import { Hourglass, X } from "lucide-react";
import { TIERS, TierId } from "@/lib/data";
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
  const { member, keepTrial, setTrialBecomes } = useStore();
  const [confirming, setConfirming] = useState(false);
  const [picking, setPicking] = useState<TierId | null>(null); // another plan tapped, not confirmed yet
  const [switched, setSwitched] = useState<TierId | null>(null); // just confirmed, for the "Done" note
  if (member.tier !== "trial" || !member.trialEndsAt) return null;

  const ends = new Date(member.trialEndsAt);
  const left = daysLeft(ends);
  const next = TIERS[member.trialBecomes ?? TRIAL_BECOMES];
  const cancelled = member.trialCancel;
  const leftLabel = left === 0 ? "Ends today" : `${left} day${left === 1 ? "" : "s"} left`;

  if (cancelled) {
    return (
      <section className="rounded-3xl border border-line bg-card p-5">
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
          <p className="font-heading text-2xl leading-tight">{leftLabel}</p>
          <p className="mt-1 text-sm text-shell">
            Ends {momentLabel(ends)}. Then {next.name} starts automatically at {money(next.monthly!)}/month. Your {money(TIERS.trial.joinFee)} trial fee counts toward the first month.
          </p>
        </div>
      </div>
      {/* Picking another plan only preselects it; the switch happens when they confirm. They can
          pick again and confirm again any time before the trial ends. */}
      <div className="mt-4">
        <p className="text-xs uppercase tracking-widest text-moss">After your trial</p>
        <div className="mt-2 grid grid-cols-3 gap-2" role="radiogroup" aria-label="Membership after your trial">
          {TRIAL_CHOICES.map((id) => {
            const t = TIERS[id];
            const current = next.id === id;
            const preselected = picking === id;
            return (
              <button
                key={id}
                role="radio"
                aria-checked={preselected || (current && !picking)}
                onClick={() => {
                  setPicking(current ? null : id);
                  setSwitched(null);
                }}
                className={clsx(
                  "min-h-[64px] rounded-2xl border px-2 py-2.5 text-center transition active:scale-[0.98]",
                  current ? "border-sage bg-sage text-ink" : preselected ? "border-2 border-dashed border-sage bg-card" : "border-line bg-card",
                )}
              >
                <span className="block font-heading text-lg leading-none">{t.name}</span>
                <span className="mt-1 block text-[11px]">{money(t.monthly!)}/mo</span>
                <span className="block text-[10px] font-medium">{current ? "After trial" : preselected ? "Picked" : id === TRIAL_BECOMES ? "default" : " "}</span>
              </button>
            );
          })}
        </div>
        {picking && (
          <div className="mt-3 rounded-2xl border border-line bg-card p-3 text-sm">
            <p>
              You picked <span className="font-medium">{TIERS[picking].name}</span> ({money(TIERS[picking].monthly!)}/month). You&apos;ll be switched to {TIERS[picking].name}{" "}
              instead of {next.name} when your trial ends {momentLabel(ends)}.
            </p>
            <Button
              className="mt-2.5"
              onClick={() => {
                setTrialBecomes(picking);
                setSwitched(picking);
                setPicking(null);
              }}
            >
              Switch to {TIERS[picking].name} after my trial
            </Button>
            <button onClick={() => setPicking(null)} className="mt-1 min-h-[44px] w-full text-sm font-medium text-moss active:opacity-60">
              Keep {next.name}
            </button>
          </div>
        )}
        {!picking && switched && (
          <p className="mt-3 rounded-2xl bg-card p-3 text-sm" role="status">
            Done. You&apos;ll be switched to <span className="font-medium">{TIERS[switched].name}</span> after your trial. You can still pick another plan until {momentLabel(ends)}.
          </p>
        )}
      </div>
      <button
        onClick={() => setConfirming(true)}
        className="mt-4 w-full rounded-full py-2.5 text-sm font-medium bg-sage text-ink active:bg-sage-light"
      >
        Cancel trial
      </button>

      <TrialCancelSheet open={confirming} onClose={() => setConfirming(false)} />
    </section>
  );
}

// The cancel-trial confirmation, also opened from the slim trial row on Home.
export function TrialCancelSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { member, cancelTrial } = useStore();
  const [choice, setChoice] = useState<TrialCancelChoice>("downgrade");
  if (!member.trialEndsAt) return null;
  const ends = new Date(member.trialEndsAt);
  const setConfirming = (v: boolean) => !v && onClose();
  return (
      <Sheet open={open} onClose={onClose} title="Cancel your trial?">
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
  );
}

export function NoticeBanner() {
  const { member, dismissNotice } = useStore();
  if (!member.notice) return null;
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-card p-4 text-sm text-shell">
      <p className="flex-1 whitespace-pre-line">{member.notice}</p>
      <button onClick={dismissNotice} aria-label="Dismiss" className="shrink-0">
        <X size={16} />
      </button>
    </div>
  );
}
