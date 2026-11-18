"use client";

import { useEffect, useState, type InputHTMLAttributes } from "react";
import clsx from "clsx";
import type zxcvbn from "zxcvbn";
import { ArrowLeft, ChevronRight, Eye, EyeOff } from "lucide-react";
import { LOCATIONS, TIERS } from "@/lib/data";
import { dayLabel, timeLabel } from "@/lib/format";
import { inviteHeadline } from "@/lib/invite";
import { SERVICE_IMAGE } from "@/lib/images";
import { FRIEND_DEMO_ID, WELLNESS_DEMO_ID, useStore } from "@/lib/store";
import { SHOW_SIGNUP_FORM } from "@/lib/flags";
import { findReferrer } from "@/lib/referral";
import { EMAIL_MAX, NAME_MAX, cleanEmail, cleanInstagram, cleanName, emailError, instagramError, nameError, phoneError, phoneNumber } from "@/lib/validate";
import { checkPassword, PASSWORD_MIN_LENGTH, PASSWORD_MIN_SCORE, STRENGTH_LABELS, type PasswordCheck } from "@/lib/password";
import { Button } from "./Sheet";

// What someone sees right after downloading the app: a welcome screen, then "Create account".
// It's a demo: the create-account form is read-only and Create account goes straight into the app
// (SHOW_SIGNUP_FORM in lib/flags.ts makes the form work), and "I already have an account" opens the
// sample accounts instead of a real sign-in.
type Screen = "start" | "create" | "signin";

export function SignUp() {
  // An invite or the deck's QR code (/?signup=1) lands here too: the first screen of a fresh download.
  const [screen, setScreen] = useState<Screen>("start");
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-sand">
      {screen === "start" && <Start onCreate={() => setScreen("create")} onSignIn={() => setScreen("signin")} />}
      {screen === "create" && <CreateAccount demo={!SHOW_SIGNUP_FORM} onBack={() => setScreen("start")} />}
      {screen === "signin" && <SampleAccounts onBack={() => setScreen("start")} />}
    </div>
  );
}

function Start({ onCreate, onSignIn }: { onCreate: () => void; onSignIn: () => void }) {
  const { inviteWaiting: invite } = useStore();
  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col">
      <div className="relative h-[50vh] min-h-[300px] shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={SERVICE_IMAGE.event} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/60 via-ink/10 to-sand" aria-hidden />
        <p className="absolute inset-x-0 top-12 text-center font-wordmark text-4xl tracking-[0.45em] text-shell">ARTHA</p>
        <p className="absolute inset-x-0 top-[6.5rem] text-center text-[11px] uppercase tracking-[0.35em] text-shell">A Wellness Sanctuary</p>
      </div>
      <div className="relative -mt-6 flex flex-1 flex-col px-6 pb-10 text-center">
        {/* Opened from a join-me invite: what it's for and what it costs, before anything else. */}
        {invite && (
          <div className="mb-4 rounded-2xl border border-line bg-card px-4 py-3 text-left">
            <p className="font-heading text-xl leading-tight">{inviteHeadline(invite)}</p>
            <p className="mt-1 text-sm text-muted">
              From {invite.fromName} · {dayLabel(invite.date)} {timeLabel(invite.time)} · {LOCATIONS[invite.location].short}
            </p>
            <p className="mt-1 text-sm">Create a free account, or sign in, to accept it.</p>
          </div>
        )}
        <h1 className="font-heading text-4xl leading-tight">Move. Sweat. Freeze.</h1>
        <p className="mt-2 text-muted">Book classes, therapies and treatments at ARTHA West LA and Studio City.</p>
        <div className="mt-8 space-y-2">
          <Button onClick={onCreate}>Create account</Button>
          <Button variant="secondary" onClick={onSignIn}>
            I already have an account
          </Button>
        </div>
      </div>
    </div>
  );
}

// The create-account form, sized to fit one phone screen with Create account in reach, no scrolling.
// In the demo (SHOW_SIGNUP_FORM off) the fields are read-only and Create account goes straight to the
// New user account and the app intro, so nobody types real details into a demo.
function CreateAccount({ onBack, demo = false }: { onBack: () => void; demo?: boolean }) {
  const { signUp, accountTaken, members, member, switchMember, inviteWaiting } = useStore();
  // A referral link opens the app with ?ref=CODE, which fills in the code.
  const [form, setForm] = useState(() => ({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    instagram: "",
    referral: demo || typeof window === "undefined" ? "" : (new URLSearchParams(window.location.search).get("ref") ?? ""),
    password: "",
  }));
  const [agreed, setAgreed] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [tried, setTried] = useState(false); // show errors only after the first "Create account" tap
  const [scorer, setScorer] = useState<typeof zxcvbn>();

  // Loaded on this screen only, so the rest of the app doesn't carry its password list.
  useEffect(() => {
    if (!demo) import("zxcvbn").then((m) => setScorer(() => m.default));
  }, [demo]);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const handle = cleanInstagram(form.instagram);
  const taken = accountTaken({ email: cleanEmail(form.email), phone: phoneNumber(form.phone), instagram: handle });
  const referrer = form.referral.trim() ? findReferrer(form.referral, members.filter((m) => m.id !== member.id)) : undefined;
  const passwordCheck = scorer ? checkPassword(form.password, scorer, [form.firstName, form.lastName, form.email, handle, "artha"]) : undefined;
  const errors = {
    firstName: nameError(form.firstName, "first"),
    lastName: nameError(form.lastName, "last"),
    email: emailError(form.email) || (taken === "email" ? "That email already has an account." : ""),
    phone: phoneError(form.phone) || (taken === "phone" ? "That number already has an account." : ""),
    instagram: instagramError(handle) || (taken === "instagram" ? "That Instagram already has an account." : ""),
    referral: !form.referral.trim() || referrer ? "" : "We don't recognize that code.",
    password: passwordCheck ? (passwordCheck.problems[0] ?? "") : "Checking your password. Try again in a moment.",
    agreed: agreed ? "" : "Please agree to continue.",
  };
  const valid = Object.values(errors).every((e) => !e);
  const show = (key: keyof typeof errors) => (tried ? errors[key] : "");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    // Opened from a join-me invite: the friend gets their own new account, not the sender's.
    if (demo) return switchMember(inviteWaiting ? FRIEND_DEMO_ID : WELLNESS_DEMO_ID);
    setTried(true);
    if (!valid) return;
    signUp({
      firstName: cleanName(form.firstName),
      lastName: cleanName(form.lastName),
      email: cleanEmail(form.email),
      phone: phoneNumber(form.phone),
      instagram: handle || undefined,
      referralCode: referrer ? form.referral : undefined,
    });
  };

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3">
      <button onClick={onBack} aria-label="Back" className="-ml-2 self-start rounded-full p-2 hover:bg-line">
        <ArrowLeft size={20} />
      </button>
      <h1 className="mt-1 font-heading text-3xl leading-tight">Create your account</h1>
      <p className="mt-0.5 text-sm text-muted">Free to join. You only pay when you book.</p>

      <form onSubmit={submit} noValidate className="mt-3 flex flex-1 flex-col gap-2.5">
        <div className="grid grid-cols-2 gap-3">
          <Field label="First name" readOnly={demo} autoComplete="given-name" maxLength={NAME_MAX} value={form.firstName} onChange={set("firstName")} error={show("firstName")} />
          <Field label="Last name" readOnly={demo} autoComplete="family-name" maxLength={NAME_MAX} value={form.lastName} onChange={set("lastName")} error={show("lastName")} />
        </div>
        <Field label="Email" readOnly={demo} type="email" inputMode="email" autoComplete="email" maxLength={EMAIL_MAX} value={form.email} onChange={set("email")} error={show("email")} />
        <Field label="Mobile phone" readOnly={demo} type="tel" inputMode="tel" autoComplete="tel" placeholder="For booking reminders" value={form.phone} onChange={set("phone")} error={show("phone")} />
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Instagram"
            optional
            readOnly={demo}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="Optional"
            value={form.instagram}
            onChange={set("instagram")}
            error={show("instagram")}
          />
          <Field
            label="Referral code"
            optional
            readOnly={demo}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            placeholder="Optional"
            value={form.referral}
            onChange={set("referral")}
            error={show("referral")}
            hint={referrer ? `✓ From ${referrer.name.split(" ")[0]}` : undefined}
          />
        </div>
        <div>
          <Field
            label="Password"
            readOnly={demo}
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            value={form.password}
            onChange={set("password")}
            error={show("password")}
            hint={`${PASSWORD_MIN_LENGTH}+ characters: upper and lower case, a number and a symbol.`}
            trailing={
              <button type="button" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-muted">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            }
          />
          {form.password && passwordCheck && <StrengthMeter check={passwordCheck} />}
        </div>

        <label className="flex cursor-pointer items-start gap-3 text-sm">
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-moss" />
          <span>I agree to ARTHA&apos;s terms and cancellation policy.</span>
        </label>
        {show("agreed") && <p className="-mt-2 text-xs text-clay">{errors.agreed}</p>}

        <Button className="mt-auto">Create account</Button>
      </form>
    </div>
  );
}

function StrengthMeter({ check }: { check: PasswordCheck }) {
  const bars = check.ok ? check.score : Math.min(check.score, PASSWORD_MIN_SCORE - 1);
  return (
    <div className="mt-2" role="status" aria-live="polite">
      <div className="flex gap-1" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={clsx("h-1.5 flex-1 rounded-full", i >= Math.max(bars, 1) ? "bg-line" : check.ok ? "bg-moss" : "bg-clay")} />
        ))}
      </div>
      <p className={clsx("mt-1 text-xs", check.ok ? "text-moss" : "text-clay")}>
        {check.ok ? `${STRENGTH_LABELS[check.score]} password` : `${STRENGTH_LABELS[bars]}. ${check.problems[0]}`}
      </p>
    </div>
  );
}

function Field({
  label,
  error,
  hint,
  optional = false,
  trailing,
  ...input
}: { label: string; error?: string; hint?: string; optional?: boolean; trailing?: React.ReactNode } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="text-xs font-medium">{label}</span>
      <span className="relative mt-1 block">
        <input
          {...input}
          required={!optional}
          aria-invalid={!!error}
          className={clsx(
            "w-full rounded-xl border bg-card px-3.5 py-2.5 text-base outline-none transition focus:border-shell",
            trailing && "pr-12",
            error ? "border-clay" : "border-line",
          )}
        />
        {trailing}
      </span>
      {error ? <span className="mt-1 block text-xs text-clay">{error}</span> : hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

// There's no real sign-in in the demo, so "I already have an account" lets you pick a sample one.
function SampleAccounts({ onBack }: { onBack: () => void }) {
  const { members, switchMember, inviteWaiting } = useStore();
  return (
    <div className="mx-auto max-w-md px-5 pb-10 pt-4">
      <button onClick={onBack} aria-label="Back" className="-ml-2 rounded-full p-2 hover:bg-line">
        <ArrowLeft size={20} />
      </button>
      <h1 className="mt-2 font-heading text-4xl leading-tight">Welcome back</h1>
      <p className="mt-1 text-muted">This demo has no real sign-in. Pick a sample account to explore.</p>
      <div className="mt-6 divide-y divide-line rounded-2xl border border-line bg-card">
        {members
          .filter((m) => m.signedUp !== false && m.id !== inviteWaiting?.fromId)
          .map((m) => (
            <button key={m.id} onClick={() => switchMember(m.id)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-sand">
              <div className="min-w-0 flex-1">
                <p className="font-medium">
                  {m.id === WELLNESS_DEMO_ID ? "New user · Wellness Account" : m.id === FRIEND_DEMO_ID ? `${m.name.split(" ")[0]} · invited friend` : `${m.name.split(" ")[0]} · ${TIERS[m.tier].name}`}
                </p>
                <p className="truncate text-xs text-muted">{m.id === WELLNESS_DEMO_ID ? "Brand new: the app intro, first-visit prices, the trial offer" : m.id === FRIEND_DEMO_ID ? "A Wellness Account for trying join-me invites" : TIERS[m.tier].summary}</p>
              </div>
              <ChevronRight size={18} className="shrink-0 text-muted" />
            </button>
          ))}
      </div>
    </div>
  );
}
