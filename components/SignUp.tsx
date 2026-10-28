"use client";

import { useState, type InputHTMLAttributes } from "react";
import clsx from "clsx";
import { ArrowLeft, ChevronRight, Eye, EyeOff } from "lucide-react";
import { TIERS } from "@/lib/data";
import { SERVICE_IMAGE } from "@/lib/images";
import { useStore } from "@/lib/store";
import { Button } from "./Sheet";

// What someone sees right after downloading the app: a welcome screen, then "Create account".
// It's a demo: details stay on this device, the password is never stored, and "I already have an
// account" opens the sample accounts instead of a real sign-in.
type Screen = "start" | "create" | "signin";

export function SignUp() {
  const [screen, setScreen] = useState<Screen>("start");
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-sand">
      {screen === "start" && <Start onCreate={() => setScreen("create")} onSignIn={() => setScreen("signin")} />}
      {screen === "create" && <CreateAccount onBack={() => setScreen("start")} />}
      {screen === "signin" && <SampleAccounts onBack={() => setScreen("start")} />}
    </div>
  );
}

function Start({ onCreate, onSignIn }: { onCreate: () => void; onSignIn: () => void }) {
  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col">
      <div className="relative h-[50vh] min-h-[300px] shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={SERVICE_IMAGE.event} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/60 via-ink/10 to-sand" aria-hidden />
        <p className="absolute inset-x-0 top-12 text-center font-serif text-4xl tracking-[0.45em] text-sand">ARTHA</p>
        <p className="absolute inset-x-0 top-[6.5rem] text-center text-[11px] uppercase tracking-[0.35em] text-sand">A Wellness Sanctuary</p>
      </div>
      <div className="relative -mt-6 flex flex-1 flex-col px-6 pb-10 text-center">
        <h1 className="font-serif text-4xl leading-tight">Move. Sweat. Freeze.</h1>
        <p className="mt-2 text-muted">Book classes, therapies and treatments at ARTHA West LA and Studio City.</p>
        <div className="mt-8 space-y-2">
          <Button onClick={onCreate}>Create account</Button>
          <Button variant="secondary" onClick={onSignIn}>
            I already have an account
          </Button>
        </div>
        <p className="mt-auto pt-8 text-xs text-muted">Demo app: nothing you enter leaves this device.</p>
      </div>
    </div>
  );
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const INSTAGRAM = /^[A-Za-z0-9._]{1,30}$/; // a handle, without the @

function CreateAccount({ onBack }: { onBack: () => void }) {
  const { signUp } = useStore();
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", instagram: "", password: "", confirm: "" });
  const [agreed, setAgreed] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [tried, setTried] = useState(false); // show errors only after the first "Create account" tap

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const phoneDigits = form.phone.replace(/\D/g, "");
  const handle = form.instagram.trim().replace(/^@/, "");
  const errors = {
    firstName: form.firstName.trim() ? "" : "Enter your first name.",
    lastName: form.lastName.trim() ? "" : "Enter your last name.",
    email: EMAIL.test(form.email.trim()) ? "" : "Enter an email like name@example.com.",
    phone: phoneDigits.length >= 10 ? "" : "Enter your 10-digit mobile number.",
    instagram: !handle || INSTAGRAM.test(handle) ? "" : "Use letters, numbers, periods and underscores (up to 30).",
    password: form.password.length >= 8 ? "" : "Use at least 8 characters.",
    confirm: !form.confirm ? "Type your password again." : form.confirm === form.password ? "" : "Passwords don't match.",
    agreed: agreed ? "" : "Please agree to continue.",
  };
  const valid = Object.values(errors).every((e) => !e);
  const show = (key: keyof typeof errors) => (tried ? errors[key] : "");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (!valid) return;
    signUp({ firstName: form.firstName.trim(), lastName: form.lastName.trim(), email: form.email.trim(), phone: form.phone.trim(), instagram: handle || undefined });
  };

  return (
    <div className="mx-auto max-w-md px-5 pb-10 pt-4">
      <button onClick={onBack} aria-label="Back" className="-ml-2 rounded-full p-2 hover:bg-line">
        <ArrowLeft size={20} />
      </button>
      <h1 className="mt-2 font-serif text-4xl leading-tight">Create your account</h1>
      <p className="mt-1 text-muted">Free to join. You only pay when you book. All fields are required except Instagram.</p>

      <form onSubmit={submit} noValidate className="mt-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="First name" autoComplete="given-name" value={form.firstName} onChange={set("firstName")} error={show("firstName")} />
          <Field label="Last name" autoComplete="family-name" value={form.lastName} onChange={set("lastName")} error={show("lastName")} />
        </div>
        <Field label="Email" type="email" inputMode="email" autoComplete="email" value={form.email} onChange={set("email")} error={show("email")} />
        <Field
          label="Mobile phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={form.phone}
          onChange={set("phone")}
          error={show("phone")}
          hint="For booking reminders."
        />
        <Field
          label="Instagram (optional)"
          optional
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="@yourhandle"
          value={form.instagram}
          onChange={set("instagram")}
          error={show("instagram")}
          hint="So we can tag you and you can follow ARTHA."
        />
        <div>
          <Field
            label="Password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            value={form.password}
            onChange={set("password")}
            error={show("password")}
            hint={tried ? undefined : "At least 8 characters."}
          />
          <div className="mt-4">
            <Field
              label="Confirm password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={form.confirm}
              onChange={set("confirm")}
              error={show("confirm")}
            />
          </div>
          <button type="button" onClick={() => setShowPassword((v) => !v)} className="mt-1.5 flex items-center gap-1.5 text-xs text-moss">
            {showPassword ? <EyeOff size={14} /> : <Eye size={14} />} {showPassword ? "Hide password" : "Show password"}
          </button>
        </div>

        <label className="flex cursor-pointer items-start gap-3 text-sm">
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-moss" />
          <span>I agree to ARTHA&apos;s terms and cancellation policy.</span>
        </label>
        {show("agreed") && <p className="-mt-2 text-xs text-clay">{errors.agreed}</p>}

        <Button className="mt-2">Create account</Button>
        <p className="text-center text-xs text-muted">Demo app: nothing you enter leaves this device, and your password isn&apos;t saved.</p>
      </form>
    </div>
  );
}

function Field({ label, error, hint, optional = false, ...input }: { label: string; error?: string; hint?: string; optional?: boolean } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <input
        {...input}
        required={!optional}
        aria-invalid={!!error}
        className={clsx(
          "mt-1 w-full rounded-xl border bg-card px-3.5 py-3 text-base outline-none transition focus:border-shell",
          error ? "border-clay" : "border-line",
        )}
      />
      {error ? <span className="mt-1 block text-xs text-clay">{error}</span> : hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

// There's no real sign-in in the demo, so "I already have an account" lets you pick a sample one.
function SampleAccounts({ onBack }: { onBack: () => void }) {
  const { members, switchMember } = useStore();
  return (
    <div className="mx-auto max-w-md px-5 pb-10 pt-4">
      <button onClick={onBack} aria-label="Back" className="-ml-2 rounded-full p-2 hover:bg-line">
        <ArrowLeft size={20} />
      </button>
      <h1 className="mt-2 font-serif text-4xl leading-tight">Welcome back</h1>
      <p className="mt-1 text-muted">This demo has no real sign-in. Pick a sample account to explore.</p>
      <div className="mt-6 divide-y divide-line rounded-2xl border border-line bg-card">
        {members
          .filter((m) => m.signedUp !== false)
          .map((m) => (
            <button key={m.id} onClick={() => switchMember(m.id)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-sand">
              <div className="min-w-0 flex-1">
                <p className="font-medium">
                  {m.name.split(" ")[0]} · {TIERS[m.tier].name}
                </p>
                <p className="truncate text-xs text-muted">{TIERS[m.tier].summary}</p>
              </div>
              <ChevronRight size={18} className="shrink-0 text-muted" />
            </button>
          ))}
      </div>
    </div>
  );
}
