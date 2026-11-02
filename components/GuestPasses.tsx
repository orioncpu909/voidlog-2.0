"use client";

import { useState, type InputHTMLAttributes } from "react";
import Link from "next/link";
import { ChevronRight, Gift, Mail } from "lucide-react";
import { LOCATIONS } from "@/lib/data";
import { useStore } from "@/lib/store";
import { GUEST_PASSES_PER_MONTH, GUEST_PASS_INCLUDES, GuestPass, guestPassEmail, passesLeft, passesToShow } from "@/lib/guest";
import { EMAIL_MAX, NAME_MAX, cleanEmail, cleanName, emailError, nameError } from "@/lib/validate";
import { shortDate } from "@/lib/format";
import { dateKey } from "@/lib/schedule";
import { Button, Sheet, useTapGuard } from "@/components/Sheet";

// The guest passes tile on Account, beside the card on file. Paying members only.
export function GuestPassesTile() {
  const { member, guestPasses } = useStore();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} className="flex min-h-[112px] w-full flex-col rounded-2xl border border-line bg-card p-3.5 text-left transition-colors active:bg-sand">
        <span className="flex w-full items-center justify-between">
          <Gift size={20} />
          <ChevronRight size={16} />
        </span>
        <span className="mt-2 block text-xs text-muted">Guest passes</span>
        <span className="block text-sm font-medium">{passesLeft(member.id, guestPasses)} left</span>
        <span className="block text-xs text-muted">Send to a friend</span>
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Guest passes">
        {open && <GuestPassesSheet />}
      </Sheet>
    </>
  );
}

function GuestPassesSheet() {
  const { member, guestPasses, sendGuestPass } = useStore();
  const studio = LOCATIONS[member.home];
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState<GuestPass | null>(null);
  const now = new Date();
  const left = passesLeft(member.id, guestPasses, now);
  const resets = shortDate(dateKey(new Date(now.getFullYear(), now.getMonth() + 1, 1)));
  const mine = passesToShow(member.id, guestPasses, now);

  if (sent) return <PassReady pass={sent} onDone={() => setSent(null)} />;

  const edit = (set: (value: string) => void, value: string) => {
    set(value);
    setError("");
  };

  const send = () => {
    const problem = nameError(first, "first", "your friend's") || nameError(last, "last", "your friend's") || (emailError(email) && "Enter your friend's email, like name@example.com.");
    if (problem) return setError(problem);
    const r = sendGuestPass(`${cleanName(first)} ${cleanName(last)}`, cleanEmail(email));
    if (!r.ok) return setError(r.error);
    setFirst("");
    setLast("");
    setEmail("");
    setError("");
    setSent(r.pass);
  };

  return (
    <div className="space-y-4 text-sm">
      <div className="space-y-2">
        <p>Send a friend a day at ARTHA, all complimentary:</p>
        <ul className="flex flex-wrap gap-2">
          {GUEST_PASS_INCLUDES.map((item) => (
            <li key={item} className="rounded-full bg-moss-soft px-3 py-1 text-moss">
              {item}
            </li>
          ))}
        </ul>
        <p className="text-muted">Passes work at {studio.name} only. Each guest can only claim one pass, once.</p>
      </div>

      <p className="rounded-xl bg-sand px-3 py-2 font-medium">
        {left} of {GUEST_PASSES_PER_MONTH} left this month · {left === GUEST_PASSES_PER_MONTH ? "New" : "More"} passes on {resets}
      </p>

      {left > 0 ? (
        <form
          noValidate
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <div className="grid grid-cols-2 gap-3">
            <Field label="First name" value={first} onChange={(v) => edit(setFirst, v)} autoComplete="off" maxLength={NAME_MAX + 10} />
            <Field label="Last name" value={last} onChange={(v) => edit(setLast, v)} autoComplete="off" maxLength={NAME_MAX + 10} />
          </div>
          <Field label="Email address" value={email} onChange={(v) => edit(setEmail, v)} type="email" inputMode="email" autoComplete="off" autoCapitalize="none" maxLength={EMAIL_MAX} />
          {error && <p role="alert" className="rounded-xl bg-sand px-3 py-2 text-clay">{error}</p>}
          <Button>Send guest pass</Button>
        </form>
      ) : (
        <p className="text-muted">You&apos;ve sent all {GUEST_PASSES_PER_MONTH} this month.</p>
      )}

      {mine.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">Your passes</p>
          <ul className="mt-1 divide-y divide-line">
            {mine.map((p) => (
              <SentPass key={p.id} pass={p} onResend={() => setSent(p)} onChange={() => setError("")} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Field({ label, onChange, ...input }: { label: string; onChange: (value: string) => void } & Omit<InputHTMLAttributes<HTMLInputElement>, "onChange">) {
  return (
    <label className="block">
      <span className="font-medium">{label}</span>
      <input {...input} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded-xl border border-line bg-card px-3.5 py-3 text-base outline-none focus:border-shell" />
    </label>
  );
}

function SentPass({ pass, onResend, onChange }: { pass: GuestPass; onResend: () => void; onChange: () => void }) {
  const [cancelling, setCancelling] = useState(false);
  const day = (iso: string) => shortDate(dateKey(new Date(iso)));
  return (
    <li className="py-2.5">
      <p className="flex items-baseline justify-between gap-3">
        <span className="min-w-0 truncate font-medium">{pass.name}</span>
        <span className="shrink-0 text-xs text-muted">{pass.claimedAt ? `Claimed ${day(pass.claimedAt)}` : `Sent ${day(pass.sentAt)}`}</span>
      </p>
      <p className="truncate text-xs text-muted">{pass.email}</p>
      {!pass.claimedAt &&
        (cancelling ? (
          <CancelPass pass={pass} onChange={onChange} onKeep={() => setCancelling(false)} />
        ) : (
          <p className="mt-1 flex items-center gap-2">
            <button onClick={onResend} className="min-h-[44px] rounded-full border border-line px-4 text-xs font-medium active:bg-line">
              See email
            </button>
            <button onClick={() => setCancelling(true)} className="min-h-[44px] rounded-full border border-line px-4 text-xs font-medium active:bg-line">
              Cancel
            </button>
          </p>
        ))}
    </li>
  );
}

function CancelPass({ pass, onChange, onKeep }: { pass: GuestPass; onChange: () => void; onKeep: () => void }) {
  const { cancelGuestPass } = useStore();
  const ready = useTapGuard();
  return (
    <div className="mt-1 space-y-2">
      <p>Cancel {pass.name.split(" ")[0]}&apos;s pass? You&apos;ll get it back if it was sent this month, and their link will stop working.</p>
      <div className="flex gap-2">
        <button disabled={!ready} onClick={onKeep} className="min-h-[44px] flex-1 rounded-full border border-line font-medium active:bg-line">
          Keep it
        </button>
        <button
          disabled={!ready}
          onClick={() => {
            cancelGuestPass(pass.id);
            onChange();
          }}
          className="min-h-[44px] flex-1 rounded-full bg-sage font-medium text-ink active:bg-sage-light"
        >
          Yes, cancel
        </button>
      </div>
    </div>
  );
}

// There's no server to send email yet, so this shows what the friend gets, and its button opens the
// page the link in the email will open.
function PassReady({ pass, onDone }: { pass: GuestPass; onDone: () => void }) {
  const ready = useTapGuard(); // this replaces the form under the finger
  const email = guestPassEmail(pass);
  return (
    <div className="relative space-y-3 text-sm">
      {!ready && <div className="absolute inset-0 z-10" aria-hidden />}
      <p>
        <span className="font-medium">{pass.name.split(" ")[0]}&apos;s pass is ready.</span> It goes to {pass.email}. Demo: the email isn&apos;t really sent until the app has a server.
      </p>
      <div className="rounded-2xl border border-line bg-sand p-4">
        <p className="flex items-center gap-1.5 text-xs text-muted">
          <Mail size={14} /> {email.subject}
        </p>
        <p className="mt-2">{email.body}</p>
        <Link href={`/guest?pass=${pass.code}`} className="mt-3 flex min-h-[44px] w-full items-center justify-center rounded-full bg-sage font-medium text-ink active:bg-sage-light">
          Book my services
        </Link>
      </div>
      <Button variant="secondary" onClick={onDone}>
        Done
      </Button>
    </div>
  );
}
